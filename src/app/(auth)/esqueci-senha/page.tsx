import type { Metadata } from "next";
import { ResetRequestForm } from "@/components/auth/ResetForms";

export const metadata: Metadata = { title: "Esqueci a senha" };

export default function ForgotPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Esqueceu a senha?</h1>
      <ResetRequestForm />
    </div>
  );
}
