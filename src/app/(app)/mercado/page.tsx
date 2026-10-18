import type { Metadata } from "next";
import Link from "next/link";
import { Library, Plus, Search, Store } from "lucide-react";
import { ListingCard } from "@/components/market/ListingCard";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { FlashToast } from "@/components/ui/Toast";
import { ART } from "@/lib/art";
import { cn } from "@/lib/cn";
import { LISTING_KIND } from "@/lib/domain/labels";
import { getListings } from "@/server/queries/market";
import type { ListingKind } from "@/types/domain";

export const metadata: Metadata = { title: "Mercado" };

const KINDS = Object.keys(LISTING_KIND) as ListingKind[];

export default async function MarketPage({ searchParams }: PageProps<"/mercado">) {
  const params = await searchParams;
  const kind = KINDS.find((k) => k === params.tipo);
  const search = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const listings = await getListings({ kind, search: search || undefined });

  const chip = (value: ListingKind | undefined, label: string) => {
    const query = new URLSearchParams({ ...(value ? { tipo: value } : {}), ...(search ? { q: search } : {}) });
    const active = kind === value;
    return (
      <Link
        key={label}
        href={`/mercado${query.size ? `?${query}` : ""}`}
        aria-current={active ? "page" : undefined}
        className={cn("inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-semibold transition-colors",
          active ? "border-rift bg-rift text-on-rift" : "border-line bg-surface text-muted hover:text-ink")}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="mx-auto max-w-5xl">
      {params.apagado && <FlashToast text="Anúncio apagado." />}
      <PageHeader
        title="Mercado"
        subtitle="Vende, troca e procura. O Riftzada só conecta, o resto é com vocês."
        art={ART.bazaar}
        action={
          <div className="flex gap-2">
            <Link href="/colecao" className={buttonClass("secondary", "md")} aria-label="Minha coleção"><Library size={18} aria-hidden /><span className="hidden md:inline">Minha coleção</span></Link>
            <Link href="/mercado/novo" className={buttonClass("primary", "md", "hidden md:inline-flex")}><Plus size={18} aria-hidden /> Anunciar</Link>
          </div>
        }
      />

      <form role="search" action="/mercado" className="relative mb-4">
        {kind && <input type="hidden" name="tipo" value={kind} />}
        <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint" aria-hidden />
        <label htmlFor="q" className="sr-only">Buscar carta</label>
        <input id="q" name="q" type="search" defaultValue={search} placeholder="Buscar carta…" className="input pl-11" />
      </form>

      <nav aria-label="Filtrar anúncios" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
        {chip(undefined, "Tudo")}
        {KINDS.map((k) => chip(k, LISTING_KIND[k].label))}
      </nav>

      {listings.length ? (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => <li key={l.id}><ListingCard listing={l} /></li>)}
        </ul>
      ) : search || kind ? (
        <EmptyState icon={Search} title="Nada por aqui." text="Ninguém anunciou isso ainda. Que tal anunciar que você procura?" action={{ href: "/mercado/novo", label: "Anunciar procura" }} />
      ) : (
        <EmptyState icon={Store} title="Ninguém anunciou cartas ainda." text="Seja o primeiro da Riftzada." action={{ href: "/mercado/novo", label: "Anunciar carta" }} />
      )}
    </div>
  );
}
