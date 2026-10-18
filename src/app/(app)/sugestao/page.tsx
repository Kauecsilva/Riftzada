import type { Metadata } from "next";
import { SuggestionForm } from "@/components/suggestion/SuggestionForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Sugerir melhoria" };

export default async function SuggestionPage() {
  await requireSession();
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Sugerir melhoria" subtitle="Ideia ou ajuste no app? Conta pra gente." back="/" />
      <SuggestionForm />
    </div>
  );
}
