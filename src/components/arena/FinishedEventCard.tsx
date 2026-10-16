import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { shortDate } from "@/lib/format";
import type { FinishedEvent } from "@/types/domain";
import { Podium } from "./Podium";

/** "Quem levou essa?": evento finalizado com o top 4. */
export function FinishedEventCard({ event }: { event: FinishedEvent }) {
  return (
    <article className="card p-4">
      <Link href={`/arena/eventos/${event.id}`} className="mb-3 flex items-start justify-between gap-3 hover:opacity-90">
        <div>
          <h3 className="font-display text-lg leading-tight font-bold">{event.name}</h3>
          <p className="text-sm text-muted">
            {shortDate(event.startsAt)}
            {event.playerCount ? ` · ${event.playerCount} jogadores` : ""}
          </p>
        </div>
        <ChevronRight size={20} className="mt-1 shrink-0 text-faint" aria-hidden />
      </Link>
      {event.podium.length ? <Podium results={event.podium} compact /> : <p className="text-sm text-muted">Resultado ainda não registrado.</p>}
    </article>
  );
}
