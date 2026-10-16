import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Trash2, Trophy } from "lucide-react";
import { CopyListButton, ShareButton } from "@/components/decks/CopyListButton";
import { AuthorLine } from "@/components/feed/AuthorLine";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { FlashToast } from "@/components/ui/Toast";
import { countCards, formatDecklist, sectionTitle } from "@/lib/domain/decklist";
import { ordinal } from "@/lib/format";
import { deleteDeck } from "@/server/actions/content";
import { getDeck } from "@/server/queries/decks";
import { requireSession } from "@/server/session";
import type { DeckSection } from "@/types/domain";

export async function generateMetadata({ params }: PageProps<"/decks/[id]">): Promise<Metadata> {
  const deck = await getDeck((await params).id);
  return { title: deck?.name ?? "Deck" };
}

const SECTIONS: DeckSection[] = ["main", "runes", "battlefields", "side"];

export default async function DeckPage({ params, searchParams }: PageProps<"/decks/[id]">) {
  const [{ id }, query, session] = await Promise.all([params, searchParams, requireSession()]);
  const deck = await getDeck(id);
  if (!deck) notFound();
  const mine = deck.author.id === session.userId;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {query.salvo && <FlashToast text="Deck publicado!" />}
      <PageHeader title={deck.name} subtitle={deck.legend?.name ?? undefined} back="/decks" />

      <div className="flex flex-wrap gap-2">
        {deck.visibility !== "public" && <Badge><Lock size={12} aria-hidden /> {deck.visibility === "private" ? "Só você vê" : "Só com o link"}</Badge>}
        {(deck.record || deck.placement) && (
          <Badge tone="gold">
            <Trophy size={12} aria-hidden />
            {[deck.record, deck.placement ? `${ordinal(deck.placement)} lugar` : null].filter(Boolean).join(" · ")}
            {deck.event ? ` no ${deck.event.name}` : ""}
          </Badge>
        )}
        <Badge tone="energy">{countCards(deck.cards)} cartas no main</Badge>
      </div>

      <div className="card p-4"><AuthorLine author={deck.author} at={deck.createdAt}>publicou</AuthorLine></div>

      {deck.description && <p className="leading-relaxed whitespace-pre-line">{deck.description}</p>}

      <div className="flex gap-2">
        <CopyListButton text={formatDecklist(deck.legend?.name ?? null, deck.cards)} />
        <ShareButton title={deck.name} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => {
          const cards = deck.cards.filter((c) => c.section === section);
          if (!cards.length) return null;
          return (
            <section key={section} className="card p-4" aria-labelledby={`sec-${section}`}>
              <h2 id={`sec-${section}`} className="mb-3 flex justify-between font-display font-bold">
                {sectionTitle(section)} <span className="text-muted">{countCards(deck.cards, section)}</span>
              </h2>
              <ul className="space-y-1.5">
                {cards.map((c) => (
                  <li key={c.name} className="flex gap-3 text-[15px]">
                    <span className="w-6 text-right font-display font-bold text-energy tabular-nums">{c.quantity}</span>
                    <span>{c.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {deck.event && <Link href={`/arena/eventos/${deck.event.id}`} className="block text-sm font-semibold text-rift-strong hover:underline">Ver o resultado do {deck.event.name}</Link>}

      {mine && (
        <ActionButton action={deleteDeck.bind(null, deck.id)} confirm="Apagar este deck?" variant="danger" size="md">
          <Trash2 size={16} aria-hidden /> Apagar deck
        </ActionButton>
      )}
    </div>
  );
}
