import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResultForm } from "@/components/admin/ResultForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getEvent, getLegends } from "@/server/queries/arena";
import { getMembers } from "@/server/queries/admin";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Registrar resultado" };

export default async function ResultPage({ params }: PageProps<"/admin/eventos/[id]/resultado">) {
  const [{ id }, session] = await Promise.all([params, requireAdmin()]);
  const [event, members, legends] = await Promise.all([getEvent(id), getMembers(), getLegends()]);
  if (!event) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Quem levou essa?" subtitle={event.name} back={`/admin/eventos/${id}`} />
      <ResultForm event={event} members={members} legends={legends} userId={session.userId} />
    </div>
  );
}
