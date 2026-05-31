import { MODEL, deepseek } from "@/lib/deepseek";
import { prisma } from "@/lib/prisma";
import { getContextForSubmission } from "@/lib/rag";

const SYSTEM_MESSAGE = `You are a professional IELTS Writing examiner and coach. You provide detailed, accurate, and constructive feedback based on official IELTS marking criteria.

You MUST respond ONLY with a valid JSON object (no markdown fences, no extra text). The JSON must match this exact schema:

{
  "overall_comment": "string (2-3 sentences overall assessment)",
  "tr_score": number (0-9, Task Response),
  "cc_score": number (0-9, Coherence & Cohesion),
  "lr_score": number (0-9, Lexical Resource),
  "gra_score": number (0-9, Grammatical Range & Accuracy),
  "estimated_band": number (overall band, 0-9),
  "sentence_feedback": [
    {
      "original": "exact sentence from essay",
      "issue": "specific problem description",
      "suggestion": "improved version",
      "type": "grammar|vocabulary|coherence|task_response"
    }
  ],
  "rewrite_examples": [
    {
      "original": "original phrase",
      "rewritten": "improved version",
      "explanation": "why this is better"
    }
  ],
  "next_actions": [
    { "action": "specific actionable advice", "priority": "high|medium|low" }
  ]
}

Rules:
- sentence_feedback: provide 4-8 items, each MUST quote the exact original sentence
- rewrite_examples: provide 3-5 items
- next_actions: provide EXACTLY 3 items
- All scores must be multiples of 0.5
- Base your assessment ONLY on the provided essay and knowledge context
- Do NOT fabricate scores or invent content not present in the essay`;

export function buildPrompt(input: {
  questionText: string;
  taskType: string;
  essayText: string;
  knowledgeContext: string;
  essayContext: string;
}) {
  const userMessage = `## IELTS Question
${input.questionText}

## Task Type
${input.taskType}

## Student Essay
${input.essayText}

## Relevant IELTS Knowledge Points
${input.knowledgeContext}

${input.essayContext}

Please evaluate the essay above and respond with the JSON report.`;

  return [
    { role: "system" as const, content: SYSTEM_MESSAGE },
    { role: "user" as const, content: userMessage },
  ];
}

export async function saveReport(
  submissionId: string,
  rawText: string,
  retrievedTopics: string[],
  generationMs: number
) {
  const data = JSON.parse(rawText);
  return prisma.feedbackReport.create({
    data: {
      submissionId,
      overallComment: data.overall_comment,
      trScore: data.tr_score,
      ccScore: data.cc_score,
      lrScore: data.lr_score,
      graScore: data.gra_score,
      estimatedBand: data.estimated_band,
      sentenceFeedback: data.sentence_feedback,
      rewriteExamples: data.rewrite_examples,
      nextActions: data.next_actions,
      modelUsed: MODEL,
      retrievedTopics,
      generationMs,
    },
  });
}

export async function getSubmissionForUser(submissionId: string, userId: string) {
  return prisma.essaySubmission.findFirst({
    where: { id: submissionId, userId },
    include: {
      promptQuestion: true,
      reports: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function generateReportText(submissionId: string, userId: string) {
  const submission = await getSubmissionForUser(submissionId, userId);
  if (!submission) throw new Error("SUBMISSION_NOT_FOUND");

  const start = Date.now();
  const context = await getContextForSubmission(
    submission.questionId,
    submission.promptQuestion?.themeCn ?? null
  );

  const completion = await deepseek.chat.completions.create({
    model: MODEL,
    stream: false,
    messages: buildPrompt({
      questionText: submission.questionText,
      taskType: submission.taskType,
      essayText: submission.essayText,
      knowledgeContext: context.knowledgeContext,
      essayContext: context.essayContext,
    }),
    max_tokens: 3000,
  });

  const rawText = completion.choices[0]?.message?.content ?? "";
  if (!rawText) throw new Error("EMPTY_MODEL_RESPONSE");

  const report = await saveReport(
    submissionId,
    rawText,
    context.retrievedTopics,
    Date.now() - start
  );
  return { report, rawText };
}
