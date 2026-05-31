import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateReportText } from "@/lib/report";

export async function POST(
  _: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { report } = await generateReportText(params.id, userId);
    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("regenerate_failed", error);
    return NextResponse.json({ error: "批改失败，请重试" }, { status: 500 });
  }
}
