import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Repeat, Store, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Photo } from "@/components/ui/Photo";
import { countdown, eventWhen } from "@/lib/format";
import { EVENT_STATUS } from "@/lib/domain/labels";
import { weeklyLabel } from "@/lib/domain/schedule";
import type { EventSummary } from "@/types/domain";
import { RsvpButton } from "./RsvpButton";

// Capas decorativas variadas quando a organização não enviou foto do evento.
const FALLBACK_ART = [
  "/art/rift-map.webp",
  "/art/cards/RAD-139.webp",
  "/art/cards/RAD-149.webp",
  "/art/cards/RAD-151.webp",
] as const;

export function EventMeta({ event }: { event: EventSummary }) {
  return (
    <ul className="space-y-2 text-sm leading-snug text-muted [&_svg]:shrink-0 [&_svg]:text-rift">
      <li className="flex items-start gap-2"><CalendarDays size={16} aria-hidden /> <span>{eventWhen(event.startsAt)}</span></li>
      {event.seriesId && <li className="flex items-start gap-2"><Repeat size={16} aria-hidden /> {weeklyLabel(event.startsAt)}</li>}
      {event.store && <li className="flex items-start gap-2"><Store size={16} aria-hidden /> {event.store.name}</li>}
      <li className="flex items-start gap-2"><MapPin size={16} aria-hidden /> {event.location}</li>
      <li className="flex items-start gap-2">
        <Users size={16} aria-hidden />
        {event.status === "finished"
          ? `${event.playerCount ?? event.goingCount} jogadores`
          : event.maxPlayers ? `${event.goingCount}/${event.maxPlayers} jogadores` : `${event.goingCount} confirmados`}
      </li>
    </ul>
  );
}

/** Convite para um torneio com imagem própria ou panorama da Rift. */
export function EventCard({ event, highlight }: { event: EventSummary; highlight?: boolean }) {
  const soon = countdown(event.startsAt);
  const full = Boolean(event.maxPlayers && event.goingCount >= event.maxPlayers);
  const fallbackIndex = [...event.id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % FALLBACK_ART.length;
  const image = event.imageUrl ?? FALLBACK_ART[fallbackIndex];
  return (
    <article className="card group overflow-hidden transition-transform hover:-translate-y-0.5">
      <Link href={`/arena/eventos/${event.id}`} className="block">
        <div className="relative overflow-hidden bg-[#1b1a2c]">
          <Photo
            src={image}
            alt=""
            ratio={highlight ? "16/7" : "16/9"}
            className={`transition-transform duration-500 group-hover:scale-[1.02] ${highlight ? "md:aspect-[3/1]!" : ""} ${image.startsWith("/art/cards/") ? "[&_img]:object-top" : ""}`}
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#161725]/75 via-transparent to-[#161725]/10" aria-hidden />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 [&>span]:border-[#efe0b6]/50 [&>span]:bg-[#1d1b30]/80 [&>span]:text-[#fff4df] [&>span]:backdrop-blur-sm">
            {soon && <Badge tone="energy">{soon}</Badge>}
            {event.status === "live" && <Badge tone="sell">{EVENT_STATUS.live}</Badge>}
            {event.format && <Badge>{event.format}</Badge>}
          </div>
          <ArrowUpRight size={19} className="absolute right-3 bottom-3 text-white/90 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </div>
        <div className="space-y-3 px-4 pt-4 pb-3 md:px-5">
          <h3 className="font-ceremony text-[26px] leading-tight font-semibold tracking-[-0.03em] text-ink group-hover:text-rift">{event.name}</h3>
          <EventMeta event={event} />
        </div>
      </Link>
      {event.status === "scheduled" && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line/65 px-4 py-3 md:px-5">
          <RsvpButton eventId={event.id} going={event.isGoing} count={event.goingCount} full={full} />
          {event.signupUrl && (
            <a href={event.signupUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-rift-strong hover:underline">
              Inscrição externa
            </a>
          )}
        </div>
      )}
    </article>
  );
}
