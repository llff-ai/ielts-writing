import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MODEL, deepseek } from "@/lib/deepseek";
import { buildPrompt, getSubmissionForUser, saveReport } from "@/lib/report";
import { getContextForSubmission } from "@/lib/rag";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { submissionId } = await req.json();
    const submission = await getSubmissionForUser(String(submissionId), userId);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const context = await getContextForSubmission(
      submission.questionId,
      submission.promptQuestion?.themeCn ?? null
    );

    const stream = await deepseek.chat.completions.create({
      model: MODEL,
      stream: true,
      messages: buildPrompt({
        questionText: submission.questionText,
        taskType: submission.taskType,
        essayText: submission.essayText,
        knowledgeContext: context.knowledgeContext,
        essayContext: context.essayContext,
      }),
      max_tokens: 3000,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullText = "";
        const start = Date.now();
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            fullText += text;
            controller.enqueue(encoder.encode(text));
          }
          await saveReport(
            submission.id,
            fullText,
            context.retrievedTopics,
            Date.now() - start
          );
          controller.close();
        } catch (error) {
          console.error("stream_report_failed", error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("report_stream_failed", error);
    return NextResponse.json({ error: "批改失败，请重试" }, { status: 500 });
  }
}
