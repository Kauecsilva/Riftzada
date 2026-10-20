import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { countdown, eventWhen } from "@/lib/format";
import type { EventSummary } from "@/types/domain";
import { RsvpButton } from "./RsvpButton";

/** Agenda compacta da Home, com aparência de ingresso de torneio. */
export function NextEventCard({ event }: { event: EventSummary }) {
  const full = Boolean(event.maxPlayers && event.goingCount >= event.maxPlayers);
  const soon = countdown(event.startsAt);

  return (
    <article className="card relative overflow-hidden border-l-[3px] border-l-rift p-4 md:p-5">
      <div className="absolute -top-12 -right-12 size-36 rounded-full border border-gold-line/30" aria-hidden />
      <div className="relative flex flex-wrap items-center gap-2">
        {soon && <Badge tone="rift">{soon}</Badge>}
        {event.format && <Badge>{event.format}</Badge>}
      </div>
      <Link href={`/arena/eventos/${event.id}`} className="group relative mt-3 flex items-start gap-2 rounded-sm focus-visible:outline-rift">
        <h3 className="min-w-0 flex-1 font-ceremony text-[26px] leading-[1.08] font-semibold tracking-[-0.025em] text-ink group-hover:text-rift">{event.name}</h3>
        <ArrowUpRight size={17} className="mt-1 shrink-0 text-rift transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
      </Link>
      <div className="relative mt-4 space-y-2 text-sm text-muted [&_svg]:shrink-0 [&_svg]:text-rift">
        <p className="flex items-start gap-2"><CalendarDays size={16} aria-hidden />{eventWhen(event.startsAt)}</p>
        <p className="flex items-start gap-2"><MapPin size={16} aria-hidden />{event.location}</p>
        <p className="flex items-start gap-2"><Users size={16} aria-hidden />{event.maxPlayers ? `${event.goingCount}/${event.maxPlayers} jogadores` : `${event.goingCount} confirmados`}</p>
      </div>
      {event.status === "scheduled" && <div className="relative mt-4 border-t border-line/75 pt-4"><RsvpButton eventId={event.id} going={event.isGoing} count={event.goingCount} full={full} /></div>}
    </article>
  );
}
