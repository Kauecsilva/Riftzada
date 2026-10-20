import type { Metadata } from "next";
import Link from "next/link";
import { FileUp, Library, Plus, Search } from "lucide-react";
import { CollectionAddForm } from "@/components/collection/CollectionAddForm";
import { CollectionList } from "@/components/collection/CollectionList";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { collectionValue, referencePrice } from "@/lib/domain/pricing";
import { formatPrice } from "@/lib/format";
import { getCollection } from "@/server/queries/collection";
import { getCollectionPrices } from "@/server/queries/prices";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Minha coleção" };

export default async function CollectionPage({ searchParams }: PageProps<"/colecao">) {
  const [session, params] = await Promise.all([requireSession(), searchParams]);
  const [items, refs] = await Promise.all([getCollection(session.userId), getCollectionPrices(session.userId)]);
  const search = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const term = search.toLowerCase();
  const shown = term ? items.filter((i) => i.card.name.toLowerCase().includes(term) || i.card.setName?.toLowerCase().includes(term)) : items;
  const copies = items.reduce((sum, i) => sum + i.quantity, 0);
  const listed = items.filter((i) => i.listing).length;
  const prices = Object.fromEntries(items.map((i) => [i.id, referencePrice(refs[i.card.id], i.variant)]));
  const value = collectionValue(items.map((i) => ({ cardId: i.card.id, variant: i.variant, quantity: i.quantity })), refs);
  const addSection = (
    <section aria-labelledby="adicionar" className="mb-8 scroll-mt-32">
      <SectionHeader id="adicionar" title="Adicionar carta" />
      <CollectionAddForm />
      <p className="mt-2 text-xs text-faint">Só você vê a sua coleção. A galera só vê o que você anunciar.</p>
    </section>
  );
  const cardsSection = (
    <section aria-labelledby="cartas" className="mb-8">
      <SectionHeader id="cartas" title="Cartas" />
      {items.length > 0 && (
        <div className="card mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-4">
          <p>
            <span className="block text-xs font-semibold text-muted">Valor da coleção</span>
            <span className="font-display text-2xl font-bold tabular-nums">{formatPrice(value.totalCents)}</span>
          </p>
          <p className="max-w-[40ch] text-xs text-faint">
            Preço da Liga vezes as cópias (TCGplayer em reais quando a Liga não tem).
            {value.unpricedCopies > 0 && ` ${value.unpricedCopies} ${value.unpricedCopies === 1 ? "cópia ficou" : "cópias ficaram"} de fora por falta de preço.`}
          </p>
        </div>
      )}
      {items.length > 6 && (
        <form role="search" action="/colecao" className="relative mb-4">
          <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint" aria-hidden />
          <label htmlFor="q" className="sr-only">Buscar na coleção</label>
          <input id="q" name="q" type="search" defaultValue={search} placeholder="Buscar na coleção…" className="input pl-11" />
        </form>
      )}
      {shown.length ? (
        <CollectionList items={shown} prices={prices} />
      ) : search ? (
        <EmptyState icon={Search} title="Nada com esse nome." text="Confere a grafia ou adiciona outra carta." />
      ) : (
        <EmptyState icon={Library} title="Coleção vazia por enquanto." text="Busca a primeira carta acima ou importa a coleção de outro site." action={{ href: "/colecao/importar", label: "Importar CSV" }} />
      )}
    </section>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Minha coleção"
        subtitle={items.length ? `${copies} ${copies === 1 ? "carta" : "cartas"} · ${items.length} diferentes · ${listed} anunciadas` : "Registra o que você tem. Sobrou? Anuncia direto daqui."}
        back={`/jogador/${session.profile.username}`}
        action={<div className="flex gap-2"><Link href="#adicionar" className={buttonClass("primary", "md")}><Plus size={18} aria-hidden /> Adicionar</Link><Link href="/colecao/importar" className={buttonClass("secondary", "md")} aria-label="Importar CSV"><FileUp size={18} aria-hidden /><span className="hidden md:inline">Importar CSV</span></Link></div>}
      />
      {items.length ? <>{cardsSection}{addSection}</> : <>{addSection}{cardsSection}</>}
    </div>
  );
}
