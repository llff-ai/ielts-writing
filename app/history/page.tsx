import { redirect } from "next/navigation";
import HistoryList from "@/components/history-list";
import { auth } from "@/lib/auth";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  return <HistoryList />;
}
