import type { Metadata } from "next";
import Link from "next/link";
import { ChefHat, Plus } from "lucide-react";
import { DeckCard } from "@/components/decks/DeckCard";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getDecks } from "@/server/queries/decks";

export const metadata: Metadata = { title: "Decks" };

export default async function DecksPage() {
  const decks = await getDecks();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Decks da galera"
        subtitle="O que a Riftzada está jogando."
        action={<Link href="/decks/novo" className={buttonClass("primary", "md")}><Plus size={18} aria-hidden /> <span className="hidden sm:inline">Publicar</span></Link>}
      />
      {decks.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {decks.map((d) => <li key={d.id}><DeckCard deck={d} /></li>)}
        </ul>
      ) : (
        <EmptyState icon={ChefHat} title="Ninguém publicou deck ainda." text="Mostra pra galera o que você está cozinhando." action={{ href: "/decks/novo", label: "Publicar deck" }} />
      )}
    </div>
  );
}
