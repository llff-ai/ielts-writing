import { prisma } from "@/lib/prisma";

const TOPIC_MAP: Record<string, string> = {
  教育类: "Education",
  政府类: "Government and Society",
  环境类: "Environment",
  犯罪类: "Crime",
  全球化: "Global issues",
  科技类: "Television, Internet, Phones",
  媒体类: "Television, Internet, Phones",
  社会类: "Global issues",
};

function sanitizeModelEssayText(text: string): string {
  const raw = text.trim();
  const markerRegex = /\(\s*\d+\s*words?\s*,\s*band\s*\d+(?:\.\d+)?\s*\)/i;
  const marker = raw.match(markerRegex);

  if (!marker || marker.index === undefined) {
    return raw;
  }

  const end = marker.index + marker[0].length;
  return raw.slice(0, end).trim();
}

async function queryModelEssays(questionId: string | null, themeCn: string | null) {
  let essays = questionId
    ? await prisma.modelEssay.findMany({
        where: { questionId },
        take: 1,
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          titleCn: true,
          question: true,
          essayText: true,
          bandScore: true,
          questionId: true,
        },
      })
    : [];

  if (essays.length === 0 && themeCn) {
    essays = await prisma.modelEssay.findMany({
      where: { promptQuestion: { themeCn } },
      take: 1,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        titleCn: true,
        question: true,
        essayText: true,
        bandScore: true,
        questionId: true,
      },
    });
  }

  return essays.map((essay) => ({
    ...essay,
    essayText: sanitizeModelEssayText(essay.essayText),
  }));
}

export async function getContextForSubmission(
  questionId: string | null,
  themeCn: string | null
): Promise<{
  knowledgeContext: string;
  essayContext: string;
  retrievedTopics: string[];
}> {
  const themeEn = TOPIC_MAP[themeCn ?? ""] ?? null;

  const chunks = themeEn
    ? await prisma.knowledgeChunk.findMany({
        where: { topic: themeEn },
        orderBy: { pointCount: "desc" },
        take: 8,
      })
    : [];

  const essays = await queryModelEssays(questionId, themeCn);

  const knowledgeContext = chunks.map((c) => c.fullText).join("\n\n---\n\n");
  const essayContext = essays
    .map((e) => `## Band 9 Reference Essay\n${e.question}\n\n${e.essayText}`)
    .join("\n\n");

  return {
    knowledgeContext,
    essayContext,
    retrievedTopics: chunks.map((c) => c.id),
  };
}

export async function getRagSourcesForSubmission(
  questionId: string | null,
  themeCn: string | null
): Promise<{
  knowledgeChunks: Array<{
    id: string;
    topic: string;
    subtopic: string;
    stance: string;
    fullText: string;
    pointCount: number;
  }>;
  modelEssays: Array<{
    id: string;
    titleCn: string;
    question: string;
    essayText: string;
    bandScore: number;
    questionId: string | null;
  }>;
}> {
  const themeEn = TOPIC_MAP[themeCn ?? ""] ?? null;

  const chunks = themeEn
    ? await prisma.knowledgeChunk.findMany({
        where: { topic: themeEn },
        orderBy: { pointCount: "desc" },
        take: 8,
        select: {
          id: true,
          topic: true,
          subtopic: true,
          stance: true,
          fullText: true,
          pointCount: true,
        },
      })
    : [];

  const essays = await queryModelEssays(questionId, themeCn);

  return {
    knowledgeChunks: chunks,
    modelEssays: essays,
  };
}
