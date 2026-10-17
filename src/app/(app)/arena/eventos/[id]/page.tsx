import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Pencil, Trophy } from "lucide-react";
import { EventMeta } from "@/components/arena/EventCard";
import { Podium } from "@/components/arena/Podium";
import { RsvpButton } from "@/components/arena/RsvpButton";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Photo } from "@/components/ui/Photo";
import { FlashToast } from "@/components/ui/Toast";
import { EVENT_STATUS } from "@/lib/domain/labels";
import { countdown } from "@/lib/format";
import { getEvent } from "@/server/queries/arena";
import { canManageStore } from "@/server/queries/stores";
import { requireSession } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/arena/eventos/[id]">): Promise<Metadata> {
  const event = await getEvent((await params).id);
  return { title: event?.name ?? "Evento" };
}

export default async function EventPage({ params, searchParams }: PageProps<"/arena/eventos/[id]">) {
  const [{ id }, query, session] = await Promise.all([params, searchParams, requireSession()]);
  const event = await getEvent(id);
  if (!event) notFound();

  const finished = event.status === "finished";
  const full = Boolean(event.maxPlayers && event.goingCount >= event.maxPlayers);
  const isAdmin = session.role === "admin";
  const editHref = event.store && (await canManageStore(event.store.id))
    ? `/loja/${event.store.id}/eventos/${event.id}`
    : isAdmin ? `/admin/eventos/${event.id}` : null;
  const people = event.participants.filter((p) => (finished ? p.played : true));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {query.resultado && <FlashToast text="Resultado publicado! Ranking e Hall já atualizaram." />}
      <PageHeader
        title={event.name}
        back={finished ? "/arena/resultados" : "/arena"}
        action={editHref ? (
          <Link href={editHref} className={buttonClass("secondary", "sm")}><Pencil size={15} aria-hidden /> Editar</Link>
        ) : undefined}
      />

      <div className="card overflow-hidden">
        <Photo src={finished && event.resultsImageUrl ? event.resultsImageUrl : event.imageUrl} alt={finished ? `Pódio do ${event.name}` : ""} ratio="16/9" priority />
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone={finished ? "gold" : event.status === "cancelled" ? "danger" : "energy"}>{EVENT_STATUS[event.status]}</Badge>
            {!finished && countdown(event.startsAt) && <Badge tone="rift">{countdown(event.startsAt)}</Badge>}
            {event.format && <Badge>{event.format}</Badge>}
          </div>
          <EventMeta event={event} />
          {event.description && <p className="leading-relaxed whitespace-pre-line">{event.description}</p>}
          {event.status === "scheduled" && (
            <div className="flex flex-wrap items-center gap-3">
              <RsvpButton eventId={event.id} going={event.isGoing} count={event.goingCount} full={full} size="lg" />
              {event.signupUrl && (
                <a href={event.signupUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "lg")}>
                  Inscrição <ExternalLink size={16} aria-hidden />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {finished && (
        <section aria-labelledby="resultado" className="space-y-3">
          <h2 id="resultado" className="font-display text-xl font-bold">Quem levou essa?</h2>
          {event.results.length ? (
            <>
              <Podium results={event.results} />
              {event.resultsNotes && <p className="card p-4 text-muted">{event.resultsNotes}</p>}
            </>
          ) : (
            <p className="card p-4 text-muted">O resultado ainda não foi registrado.</p>
          )}
          {isAdmin && (
            <Link href={`/admin/eventos/${event.id}/resultado`} className={buttonClass("gold", "md")}><Trophy size={17} aria-hidden /> Editar resultado</Link>
          )}
        </section>
      )}

      <section aria-labelledby="quem-vai" className="space-y-3">
        <h2 id="quem-vai" className="font-display text-xl font-bold">
          {finished ? "Quem jogou" : "Quem vai"} <span className="text-muted">({finished ? event.playerCount ?? people.length : event.goingCount})</span>
        </h2>
        {people.length ? (
          <ul className="flex flex-wrap gap-2">
            {people.map((p) => (
              <li key={p.id}>
                <Link href={`/jogador/${p.username}`} className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-3.5 pl-1 text-sm font-medium hover:bg-surface-2">
                  <Avatar name={p.displayName} src={p.avatarUrl} size={28} /> {p.displayName}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{finished ? "Presenças não registradas." : "Ninguém confirmou ainda. Puxa a fila!"}</p>
        )}
      </section>
    </div>
  );
}
