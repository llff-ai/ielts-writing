import { redirect } from "next/navigation";
import ResultView from "@/components/result-view";
import { auth } from "@/lib/auth";

export default async function ResultPage({
  params,
}: {
  params: { submissionId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  return <ResultView submissionId={params.submissionId} />;
}
