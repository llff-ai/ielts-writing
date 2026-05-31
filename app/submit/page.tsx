import { redirect } from "next/navigation";
import SubmitForm from "@/components/submit-form";
import { auth } from "@/lib/auth";

export default async function SubmitPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  return <SubmitForm />;
}
