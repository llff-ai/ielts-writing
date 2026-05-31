import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const taskType = String(body.taskType ?? "Task2");
    const questionText = String(body.questionText ?? "").trim();
    const essayText = String(body.essayText ?? "").trim();
    const questionId = body.questionId ? String(body.questionId) : null;

    if (!questionText || !essayText) {
      return NextResponse.json({ error: "题目和作文不能为空" }, { status: 400 });
    }

    const submission = await prisma.essaySubmission.create({
      data: {
        userId,
        taskType,
        questionText,
        essayText,
        questionId,
      },
      select: { id: true },
    });

    return NextResponse.json({ submissionId: submission.id }, { status: 201 });
  } catch (error) {
    console.error("create_submission_failed", error);
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await prisma.essaySubmission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      reports: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      promptQuestion: { select: { themeCn: true } },
    },
  });

  return NextResponse.json(list);
}
