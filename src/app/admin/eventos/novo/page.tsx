import type { Metadata } from "next";
import { EventForm } from "@/components/admin/EventForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAllEvents } from "@/server/queries/admin";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Novo evento" };

/** Sugere o próximo número do Weekly a partir do último cadastrado. */
function nextWeeklyName(names: string[]): string | undefined {
  const numbers = names.map((n) => n.match(/weekly #(\d+)/i)?.[1]).filter(Boolean).map(Number);
  return numbers.length ? `Riftbound Weekly #${Math.max(...numbers) + 1}` : undefined;
}

export default async function NewEventPage() {
  const [session, events] = await Promise.all([requireAdmin(), getAllEvents()]);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Novo evento" back="/admin/eventos" />
      <EventForm userId={session.userId} suggestedName={nextWeeklyName(events.map((e) => e.name))} />
    </div>
  );
}
