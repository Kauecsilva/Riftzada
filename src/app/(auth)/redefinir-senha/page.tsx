import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/auth/ResetForms";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Nova senha" };

export default async function ResetPage() {
  await requireSession();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Cria uma senha nova</h1>
      <NewPasswordForm />
    </div>
  );
}
