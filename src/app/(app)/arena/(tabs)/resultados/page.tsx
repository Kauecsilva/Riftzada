import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { FinishedEventCard } from "@/components/arena/FinishedEventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getFinishedEvents } from "@/server/queries/arena";

export const metadata: Metadata = { title: "Resultados" };

export default async function ResultsPage() {
  const events = await getFinishedEvents(30);
  if (!events.length) {
    return <EmptyState icon={Trophy} title="Nenhum resultado ainda." text="O primeiro campeão da Riftzada ainda vai sair." />;
  }
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold">Quem levou essa?</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {events.map((event) => <FinishedEventCard key={event.id} event={event} />)}
      </div>
    </div>
  );
}
