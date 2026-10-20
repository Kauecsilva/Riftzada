import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarX2, Library, Store, Swords } from "lucide-react";
import { ChampionHero } from "@/components/arena/ChampionHero";
import { LegendCarousel } from "@/components/cards/LegendCarousel";
import { NextEventCard } from "@/components/arena/NextEventCard";
import { RankingList } from "@/components/arena/RankingList";
import { FeedList } from "@/components/feed/FeedList";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FlashToast } from "@/components/ui/Toast";
import { getLatestChampion, getNextEvent, getRanking } from "@/server/queries/arena";
import { getSetLegends } from "@/server/queries/cards";
import { getFeed } from "@/server/queries/feed";
import { requireSession } from "@/server/session";

const PAGE = 15;
const FLASH: Record<string, string> = {
  publicado: "Publicado no mural!",
  bemvindo: "Bem-vindo à Riftzada!",
  senha: "Senha nova salva.",
};
const SHORTCUTS = [
  { href: "/arena", label: "Jogar", detail: "Torneios e ranking", icon: Swords },
  { href: "/mercado", label: "Trocar", detail: "Cartas da comunidade", icon: Store },
  { href: "/colecao", label: "Coleção", detail: "Suas cartas", icon: Library },
] as const;

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const before = typeof params.antes === "string" ? params.antes : undefined;
  const [session, champion, nextEvent, ranking, feed, legends] = await Promise.all([
    requireSession(),
    before ? null : getLatestChampion(),
    getNextEvent(),
    getRanking(5),
    getFeed({ limit: PAGE, before }),
    before ? [] : getSetLegends(),
  ]);
  const flash = Object.keys(FLASH).find((key) => params[key]);

  return (
    <div className="space-y-7 pb-4 md:space-y-9">
      {flash && <FlashToast text={FLASH[flash]} />}

      <section aria-label="Radiance, coleção atual de Riftbound" className="radiance-panel relative isolate overflow-hidden text-[#fff8ee]">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[76%]">
          <Image src="/art/radiance-key-art.webp" alt="" fill priority sizes="(min-width: 1280px) 940px, (min-width: 1024px) 76vw, 100vw" className="object-cover object-[58%_center] lg:object-[22%_center]" />
        </div>
        <div className="absolute inset-0 bg-linear-to-r from-[#171326]/95 via-[#171326]/74 to-[#171326]/5 lg:from-[#171326] lg:from-24% lg:via-[#171326]/50 lg:via-48%" aria-hidden />
        <div className="absolute inset-0 bg-linear-to-t from-[#171326]/80 via-transparent to-transparent md:hidden" aria-hidden />
        <div className="pointer-events-none absolute inset-2 rounded-md border border-[#f1d292]/45" aria-hidden />
        <div className="relative flex min-h-[370px] flex-col justify-end px-7 py-9 sm:px-9 md:min-h-[440px] md:px-12 md:py-12">
          <p className="mb-3 text-xs font-bold tracking-[0.24em] text-[#f4d891] uppercase">Riftbound · coleção atual</p>
          <h1 className="w-[min(100%,260px)] sm:w-[340px] md:w-[420px] xl:w-[500px]">
            <Image src="/art/radiance-logo.webp" alt="Radiance" width={1200} height={300} priority sizes="(min-width: 1280px) 500px, (min-width: 768px) 420px, 340px" className="h-auto w-full drop-shadow-[0_4px_14px_rgb(0_0_0/0.45)]" />
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#f6e8da] md:text-base">
            Ekko, Riven e Seraphine chegam à mesa. Encontre a galera para jogar, trocar cartas e construir sua próxima história no Rift.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/arena" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#f5dc9f] bg-[#f1d48c] px-5 text-sm font-bold text-[#261c30] shadow-[0_10px_24px_rgb(0_0_0/0.25)] hover:bg-[#ffe5aa]">
              <Swords size={18} aria-hidden /> Encontrar torneio
            </Link>
            <Link href="/mercado" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#fff0cf]/60 bg-[#1c1731]/45 px-5 text-sm font-semibold text-[#fff8ee] backdrop-blur-sm hover:bg-[#1c1731]/70">
              Ver mercado <ArrowUpRight size={17} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <nav aria-label="Acessos rápidos" className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-md border border-line bg-surface shadow-[0_8px_25px_-22px_rgb(38_24_49/0.5)]">
        {SHORTCUTS.map(({ href, label, detail, icon: Icon }) => (
          <Link key={href} href={href} className="group flex min-h-22 flex-col items-center justify-center gap-1.5 px-2 py-3 text-center hover:bg-rift-soft sm:min-h-24 sm:flex-row sm:gap-3 sm:text-left">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-rift-soft text-rift group-hover:bg-rift group-hover:text-on-rift"><Icon size={20} aria-hidden /></span>
            <span><strong className="block font-display text-base leading-none text-ink sm:text-xl">{label}</strong><span className="mt-1 hidden text-xs text-muted sm:block">{detail}</span></span>
          </Link>
        ))}
      </nav>

      {/* Celular: próxima batalha, lendas, mural, campeão e ranking. Desktop: mural à esquerda, o resto na coluna. */}
      <div className="flex flex-col gap-7 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="contents lg:block lg:min-w-0 lg:space-y-7">
          {!before && legends.length > 0 && <div className="order-2 min-w-0"><LegendCarousel sets={legends} /></div>}
          <section id="mural" aria-labelledby="mural-titulo" className="order-3 min-w-0 scroll-mt-24">
            <SectionHeader id="mural-titulo" title="Mural da galera" />
            <FeedList items={feed} session={session} pageSize={PAGE} />
          </section>
        </div>
        <div className="contents lg:block lg:space-y-6">
          {!before && (
            <section aria-labelledby="proximo-evento" className="order-1">
              <SectionHeader id="proximo-evento" title="Próxima batalha" href="/arena" linkLabel="Arena" />
              {nextEvent ? <NextEventCard event={nextEvent} /> : <EmptyState icon={CalendarX2} title="Nenhum torneio marcado." text="A Rift está tranquila demais…" />}
            </section>
          )}
          {champion && <section aria-label="Campeão da semana" className="order-4"><ChampionHero event={champion} /></section>}
          {ranking.length > 0 && (
            <section aria-labelledby="ranking-home" className="card order-5 h-fit p-4 md:p-5">
              <SectionHeader id="ranking-home" title="Ranking" href="/arena/ranking" />
              <RankingList rows={ranking.slice(0, 3)} meId={session.userId} compact />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
