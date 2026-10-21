import type { Metadata } from "next";
import Link from "next/link";
import { Library, MessagesSquare, Plus, Search, Store } from "lucide-react";
import { ListingCard } from "@/components/market/ListingCard";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { FlashToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { LISTING_KIND } from "@/lib/domain/labels";
import { getUnreadCount } from "@/server/queries/chat";
import { getListings } from "@/server/queries/market";
import { getSession } from "@/server/session";
import type { ListingKind } from "@/types/domain";

export const metadata: Metadata = { title: "Mercado" };

const KINDS = Object.keys(LISTING_KIND) as ListingKind[];

export default async function MarketPage({ searchParams }: PageProps<"/mercado">) {
  const params = await searchParams;
  const kind = KINDS.find((k) => k === params.tipo);
  const search = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  // Visitante vê a vitrine; anunciar e as conversas levam para /entrar (proxy)
  const session = await getSession();
  const [listings, unread] = await Promise.all([getListings({ kind, search: search || undefined }), session ? getUnreadCount(session.userId) : 0]);

  const chip = (value: ListingKind | undefined, label: string) => {
    const query = new URLSearchParams({ ...(value ? { tipo: value } : {}), ...(search ? { q: search } : {}) });
    const active = kind === value;
    return (
      <Link
        key={label}
        href={`/mercado${query.size ? `?${query}` : ""}`}
        aria-current={active ? "page" : undefined}
        className={cn(
          "inline-flex min-h-11 shrink-0 items-center justify-center rounded-[4px] border px-4 text-sm font-semibold transition-colors",
          active
            ? "border-rift bg-rift text-on-rift shadow-[inset_0_1px_rgb(255_255_255/0.2)]"
            : "border-line bg-surface text-muted hover:border-radiance-line hover:bg-radiance-soft hover:text-ink",
        )}
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
        subtitle="Encontre, venda e troque cartas com jogadores da comunidade."
        art="/art/rift-market.webp"
        action={session &&
          <div className="flex gap-2">
            <Link href="/mensagens" className={buttonClass("secondary", "md", "relative border-white/40 bg-surface/90")} >
              <MessagesSquare size={18} aria-hidden /><span>Conversas</span>
              {unread > 0 && <span className="sr-only">, {unread} {unread === 1 ? "não lida" : "não lidas"}</span>}
              {unread > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-5 rounded-full bg-gold px-1 text-center text-xs leading-5 font-bold text-bg" aria-hidden>{unread > 9 ? "9+" : unread}</span>}
            </Link>
            <Link href="/colecao" className={buttonClass("secondary", "md", "border-white/40 bg-surface/90")}>
              <Library size={18} aria-hidden /><span>Minha coleção</span>
            </Link>
          </div>
        }
      />

      <section aria-label="Busca e filtros do mercado" className="relative mb-7 border border-line bg-surface p-4 shadow-[0_12px_30px_-26px_rgb(41_35_56/0.55)] sm:p-5">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-linear-to-r from-gold via-radiance to-transparent" aria-hidden />
        <form role="search" action="/mercado" className="flex gap-2">
          {kind && <input type="hidden" name="tipo" value={kind} />}
          <div className="relative min-w-0 flex-1">
            <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-rift" aria-hidden />
            <label htmlFor="q" className="sr-only">Buscar carta</label>
            <input id="q" name="q" type="search" defaultValue={search} placeholder="Nome da carta" className="input border-line bg-bg pl-11" />
          </div>
          <button type="submit" className={buttonClass("primary", "md", "shrink-0 rounded-[4px] px-4 sm:px-6")}>Buscar</button>
        </form>
        <div className="mt-4 border-t border-line/70 pt-4 sm:flex sm:items-center sm:gap-4">
          <span className="mb-2 block shrink-0 text-xs font-semibold text-muted sm:mb-0">Filtrar anúncios</span>
          <nav aria-label="Filtrar anúncios" className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
            {chip(undefined, "Tudo")}
            {KINDS.map((k) => chip(k, LISTING_KIND[k].label))}
          </nav>
        </div>
      </section>

      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-ceremony text-2xl leading-tight text-ink sm:text-3xl">{search ? `Resultados para “${search}”` : "Cartas na mesa"}</h2>
          <p className="mt-1 text-sm text-muted">{listings.length} {listings.length === 1 ? "anúncio" : "anúncios"} {kind ? `de ${LISTING_KIND[kind].label.toLowerCase()}` : "na comunidade"}</p>
        </div>
        <Link href="/mercado/novo" className={buttonClass("primary", "md", "shrink-0 rounded-[4px] px-3 sm:px-5")}>
          <Plus size={18} aria-hidden /> <span className="hidden sm:inline">Anunciar carta</span><span className="sm:hidden">Anunciar</span>
        </Link>
      </div>

      {listings.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
