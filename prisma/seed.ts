import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

type ChunkSource = {
  id: string;
  topic: string;
  subtopic: string;
  stance: string;
  points: string[];
  full_text: string;
  point_count: number;
};

type QuestionSource = {
  id: string;
  theme_cn: string;
  theme_en: string;
  question_text: string;
  question_type: string;
  keywords: string[];
};

type EssaySource = {
  title_cn: string;
  question: string;
  essay_text: string;
  word_count: number;
  linked_question_id: string | null;
};

async function readJson<T>(fileName: string): Promise<T> {
  const file = path.join(process.cwd(), "data", fileName);
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw) as T;
}

async function main() {
  const chunksJson = await readJson<{ chunks: ChunkSource[] }>(
    "knowledge_chunks.json"
  );
  const questionsJson = await readJson<{ questions: QuestionSource[] }>(
    "questions.json"
  );
  const essaysJson = await readJson<{ essays: EssaySource[] }>("essays.json");

  await prisma.feedbackReport.deleteMany();
  await prisma.essaySubmission.deleteMany();

  await prisma.knowledgeChunk.deleteMany();
  await prisma.knowledgeChunk.createMany({
    data: chunksJson.chunks.map((chunk) => ({
      id: chunk.id,
      topic: chunk.topic,
      subtopic: chunk.subtopic,
      stance: chunk.stance,
      points: chunk.points,
      fullText: chunk.full_text,
      pointCount: chunk.point_count,
    })),
  });

  await prisma.modelEssay.deleteMany();
  await prisma.promptQuestion.deleteMany();

  await prisma.promptQuestion.createMany({
    data: questionsJson.questions.map((question) => ({
      id: question.id,
      themeCn: question.theme_cn,
      themeEn: question.theme_en,
      questionText: question.question_text,
      questionType: question.question_type,
      keywords: question.keywords,
    })),
  });

  for (const essay of essaysJson.essays) {
    await prisma.modelEssay.create({
      data: {
        titleCn: essay.title_cn,
        question: essay.question,
        essayText: essay.essay_text,
        wordCount: essay.word_count,
        questionId: essay.linked_question_id,
      },
    });
  }

  const [questionCount, essayCount, chunkCount] = await Promise.all([
    prisma.promptQuestion.count(),
    prisma.modelEssay.count(),
    prisma.knowledgeChunk.count(),
  ]);

  console.log(`PromptQuestion=${questionCount}`);
  console.log(`ModelEssay=${essayCount}`);
  console.log(`KnowledgeChunk=${chunkCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
