import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRagSourcesForSubmission } from "@/lib/rag";

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submission = await prisma.essaySubmission.findFirst({
    where: { id: params.id, userId },
    include: {
      promptQuestion: true,
      reports: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ragSources = await getRagSourcesForSubmission(
    submission.questionId,
    submission.promptQuestion?.themeCn ?? null
  );

  return NextResponse.json({
    ...submission,
    ragSources,
  });
}
