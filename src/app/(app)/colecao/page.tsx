import type { Metadata } from "next";
import Link from "next/link";
import { FileUp, Library, Search } from "lucide-react";
import { CollectionAddForm } from "@/components/collection/CollectionAddForm";
import { CollectionItemCard } from "@/components/collection/CollectionItemCard";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getCollection } from "@/server/queries/collection";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Minha coleção" };

export default async function CollectionPage({ searchParams }: PageProps<"/colecao">) {
  const [session, params] = await Promise.all([requireSession(), searchParams]);
  const items = await getCollection(session.userId);
  const search = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const term = search.toLowerCase();
  const shown = term ? items.filter((i) => i.card.name.toLowerCase().includes(term) || i.card.setName?.toLowerCase().includes(term)) : items;
  const copies = items.reduce((sum, i) => sum + i.quantity, 0);
  const listed = items.filter((i) => i.listing).length;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Minha coleção"
        subtitle={items.length ? `${copies} ${copies === 1 ? "carta" : "cartas"} · ${items.length} diferentes · ${listed} anunciadas` : "Registra o que você tem. Sobrou? Anuncia direto daqui."}
        back={`/jogador/${session.profile.username}`}
        action={<Link href="/colecao/importar" className={buttonClass("secondary", "md")} aria-label="Importar CSV"><FileUp size={18} aria-hidden /><span className="hidden md:inline">Importar CSV</span></Link>}
      />

      <section aria-labelledby="adicionar" className="mb-8">
        <SectionHeader id="adicionar" title="Adicionar carta" />
        <CollectionAddForm />
        <p className="mt-2 text-xs text-faint">Só você vê a sua coleção. A galera só vê o que você anunciar.</p>
      </section>

      <section aria-labelledby="cartas">
        <SectionHeader id="cartas" title="Cartas" />
        {items.length > 6 && (
          <form role="search" action="/colecao" className="relative mb-4">
            <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint" aria-hidden />
            <label htmlFor="q" className="sr-only">Buscar na coleção</label>
            <input id="q" name="q" type="search" defaultValue={search} placeholder="Buscar na coleção…" className="input pl-11" />
          </form>
        )}
        {shown.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {shown.map((item) => <li key={`${item.id}-${item.quantity}`}><CollectionItemCard item={item} /></li>)}
          </ul>
        ) : search ? (
          <EmptyState icon={Search} title="Nada com esse nome." text="Confere a grafia ou adiciona a carta acima." />
        ) : (
          <EmptyState icon={Library} title="Coleção vazia por enquanto." text="Busca a primeira carta ali em cima ou importa a coleção de outro site." action={{ href: "/colecao/importar", label: "Importar CSV" }} />
        )}
      </section>
    </div>
  );
}
