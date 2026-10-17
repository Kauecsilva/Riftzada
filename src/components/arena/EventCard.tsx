import Link from "next/link";
import { CalendarDays, MapPin, Repeat, Store, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Photo } from "@/components/ui/Photo";
import { countdown, eventWhen } from "@/lib/format";
import { EVENT_STATUS } from "@/lib/domain/labels";
import { weeklyLabel } from "@/lib/domain/schedule";
import type { EventSummary } from "@/types/domain";
import { RsvpButton } from "./RsvpButton";

export function EventMeta({ event }: { event: EventSummary }) {
  return (
    <ul className="space-y-1.5 text-sm text-muted">
      <li className="flex items-center gap-2"><CalendarDays size={16} aria-hidden /> <span>{eventWhen(event.startsAt)}</span></li>
      {event.seriesId && <li className="flex items-center gap-2"><Repeat size={16} aria-hidden /> {weeklyLabel(event.startsAt)}</li>}
      {event.store && <li className="flex items-center gap-2"><Store size={16} aria-hidden /> {event.store.name}</li>}
      <li className="flex items-center gap-2"><MapPin size={16} aria-hidden /> {event.location}</li>
      <li className="flex items-center gap-2">
        <Users size={16} aria-hidden />
        {event.status === "finished"
          ? `${event.playerCount ?? event.goingCount} jogadores`
          : event.maxPlayers ? `${event.goingCount}/${event.maxPlayers} jogadores` : `${event.goingCount} confirmados`}
      </li>
    </ul>
  );
}

/** Cartão de evento futuro, com "Vou jogar". */
export function EventCard({ event, highlight }: { event: EventSummary; highlight?: boolean }) {
  const soon = countdown(event.startsAt);
  const full = Boolean(event.maxPlayers && event.goingCount >= event.maxPlayers);
  return (
    <article className="card overflow-hidden transition-transform hover:-translate-y-0.5">
      <Link href={`/arena/eventos/${event.id}`} className="block">
        <div className="relative">
          <Photo src={event.imageUrl} alt="" ratio={highlight ? "16/9" : "21/9"} />
          <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/30 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            {soon && <Badge tone="energy">{soon}</Badge>}
            {event.status === "live" && <Badge tone="sell">{EVENT_STATUS.live}</Badge>}
            {event.format && <Badge>{event.format}</Badge>}
          </div>
        </div>
        <div className="space-y-3 px-4 pt-1 pb-2">
          <h3 className="font-display text-xl leading-tight font-bold">{event.name}</h3>
          <EventMeta event={event} />
        </div>
      </Link>
      {event.status === "scheduled" && (
        <div className="flex items-center gap-2 px-4 pt-2 pb-4">
          <RsvpButton eventId={event.id} going={event.isGoing} count={event.goingCount} full={full} />
          {event.signupUrl && (
            <a href={event.signupUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-rift-strong hover:underline">
              Inscrição externa
            </a>
          )}
        </div>
      )}
    </article>
  );
}
