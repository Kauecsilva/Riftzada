import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignUpPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Chega mais na Riftzada</h1>
      <SignUpForm />
    </div>
  );
}
