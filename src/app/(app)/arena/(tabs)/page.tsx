import type { Metadata } from "next";
import { CalendarX2 } from "lucide-react";
import { EventCard } from "@/components/arena/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getUpcomingEvents } from "@/server/queries/arena";

export const metadata: Metadata = { title: "Arena" };

export default async function ArenaPage() {
  const events = await getUpcomingEvents();
  if (!events.length) {
    return <EmptyState icon={CalendarX2} title="Nenhum torneio marcado." text="A Rift está tranquila demais…" />;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {events.map((event, i) => (
        <div key={event.id} className={i === 0 ? "md:col-span-2" : undefined}>
          <EventCard event={event} highlight={i === 0} />
        </div>
      ))}
    </div>
  );
}
