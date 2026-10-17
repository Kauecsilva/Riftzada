import Link from "next/link";
import { Layers, Trophy } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ordinal } from "@/lib/format";
import type { DeckSummary } from "@/types/domain";

function result(deck: DeckSummary): string | null {
  const parts = [deck.record, deck.placement ? `${ordinal(deck.placement)} lugar` : null, deck.event?.name ? `no ${deck.event.name}` : null].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/** Resumo do deck dentro de um post. */
export function DeckMiniCard({ deck }: { deck: DeckSummary }) {
  const line = result(deck);
  return (
    <div className="rounded-2xl border border-energy/25 bg-linear-to-br from-energy/10 to-surface-2 p-4">
      <p className="text-xs font-bold tracking-[0.14em] text-energy uppercase">{deck.legend?.name.split(",")[0] ?? "Deck"}</p>
      <p className="mt-1 font-display text-2xl leading-tight font-extrabold">{deck.name}</p>
      <p className="text-sm text-muted">por {deck.author.displayName}</p>
      {line && <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold"><Trophy size={15} className="text-gold" aria-hidden /> {line}</p>}
    </div>
  );
}

/** Cartão de deck nas listas. */
export function DeckCard({ deck }: { deck: DeckSummary }) {
  const line = result(deck);
  return (
    <Link href={`/decks/${deck.id}`} className="card block p-4 transition-transform hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-energy/15 text-energy"><Layers size={22} aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold">{deck.name}</p>
          <p className="truncate text-sm text-muted">{deck.legend?.name ?? "Sem lenda"}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm text-muted">
        <Avatar name={deck.author.displayName} src={deck.author.avatarUrl} size={22} />
        <span className="truncate">{deck.author.displayName}</span>
        {line && <span className="ml-auto truncate font-semibold text-ink">{deck.record ?? line}</span>}
      </div>
    </Link>
  );
}
