import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const questions = await prisma.promptQuestion.findMany({
    orderBy: [{ themeCn: "asc" }, { id: "asc" }],
    select: {
      id: true,
      themeCn: true,
      themeEn: true,
      questionText: true,
      questionType: true,
      keywords: true,
    },
  });

  const grouped = questions.reduce<Record<string, typeof questions>>((acc, q) => {
    if (!acc[q.themeCn]) acc[q.themeCn] = [];
    acc[q.themeCn].push(q);
    return acc;
  }, {});

  return NextResponse.json(grouped);
}
