import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarX2, Library, Store, Swords } from "lucide-react";
import { ChampionHero } from "@/components/arena/ChampionHero";
import { NextEventCard } from "@/components/arena/NextEventCard";
import { RankingList } from "@/components/arena/RankingList";
import { FeedList } from "@/components/feed/FeedList";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FlashToast } from "@/components/ui/Toast";
import { getLatestChampion, getNextEvent, getRanking } from "@/server/queries/arena";
import { getFeed } from "@/server/queries/feed";
import { requireSession } from "@/server/session";

const PAGE = 15;
const FLASH: Record<string, string> = {
  publicado: "Publicado no mural!",
  bemvindo: "Bem-vindo à Riftzada!",
  senha: "Senha nova salva.",
};
const RADIANCE_CARDS = [
  { name: "Seraphine", src: "/art/cards/RAD-151.webp" },
  { name: "Ekko", src: "/art/cards/RAD-139.webp" },
  { name: "Riven", src: "/art/cards/RAD-149.webp" },
] as const;
const SETS = ["Origins", "Spiritforged", "Unleashed", "Vendetta", "Radiance"] as const;
const SHORTCUTS = [
  { href: "/arena", label: "Jogar", detail: "Torneios e ranking", icon: Swords },
  { href: "/mercado", label: "Trocar", detail: "Cartas da comunidade", icon: Store },
  { href: "/colecao", label: "Coleção", detail: "Suas cartas", icon: Library },
] as const;

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const before = typeof params.antes === "string" ? params.antes : undefined;
  const [session, champion, nextEvent, ranking, feed] = await Promise.all([
    requireSession(),
    before ? null : getLatestChampion(),
    getNextEvent(),
    getRanking(5),
    getFeed({ limit: PAGE, before }),
  ]);
  const flash = Object.keys(FLASH).find((key) => params[key]);

  return (
    <div className="space-y-7 pb-4 md:space-y-9">
      {flash && <FlashToast text={FLASH[flash]} />}

      <section aria-label="Radiance, coleção atual de Riftbound" className="radiance-panel relative isolate overflow-hidden text-[#fff8ee]">
        <Image src="/art/radiance-champions.webp" alt="" fill priority sizes="(min-width: 1280px) 1240px, 100vw" className="object-cover object-[62%_center] md:object-center" />
        <div className="absolute inset-0 bg-linear-to-r from-[#171326]/95 via-[#171326]/74 to-[#171326]/5" aria-hidden />
        <div className="absolute inset-0 bg-linear-to-t from-[#171326]/80 via-transparent to-transparent md:hidden" aria-hidden />
        <div className="pointer-events-none absolute inset-2 rounded-md border border-[#f1d292]/45" aria-hidden />
        <div className="relative flex min-h-[370px] flex-col justify-end px-7 py-9 sm:px-9 md:min-h-[440px] md:px-12 md:py-12">
          <p className="mb-3 text-xs font-bold tracking-[0.24em] text-[#f4d891] uppercase">Riftbound · coleção atual</p>
          <h1 className="font-ceremony text-[46px] leading-none font-bold tracking-[-0.06em] text-[#fff5dd] sm:text-[64px] md:text-[82px] xl:text-[100px]">Radiance</h1>
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
        <section aria-labelledby="radiance-destaque" className="card relative overflow-hidden px-5 py-6 md:px-7 md:py-7">
          <div className="pointer-events-none absolute -right-12 -top-24 size-72 rounded-full bg-[#eac5e7]/35 blur-3xl" aria-hidden />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-radiance uppercase">Da coleção para a mesa</p>
              <h2 id="radiance-destaque" className="mt-1 font-ceremony text-[26px] leading-tight font-bold text-ink md:text-[31px]">Lendas de Radiance</h2>
              <p className="mt-2 max-w-[45ch] text-sm leading-relaxed text-muted">Conheça três das novas lendas. Cada carta traz uma forma diferente de jogar.</p>
            </div>
            <span className="rounded-sm border border-gold-line bg-gold-soft px-2.5 py-1 text-xs font-bold text-gold-strong">RAD · 2026</span>
          </div>

          <div className="relative mx-auto mt-6 grid max-w-[530px] grid-cols-3 items-end gap-2 sm:gap-4" aria-label="Cartas oficiais da coleção Radiance">
            {RADIANCE_CARDS.map((card, index) => (
              <div key={card.name} className={index === 1 ? "translate-y-1" : "-translate-y-1"}>
                <div className="relative aspect-[744/1039] overflow-hidden rounded-[5px] border border-[#d6b770] bg-[#251d39] shadow-[0_14px_24px_-11px_rgb(25_17_41/0.65)]">
                  <Image src={card.src} alt={`Carta de ${card.name} da coleção Radiance`} fill sizes="(min-width: 1024px) 160px, 30vw" className="object-cover" />
                </div>
                <p className="mt-2 text-center font-display text-base font-bold text-ink">{card.name}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-6 flex gap-2 overflow-x-auto border-t border-line pt-4 text-[11px] font-semibold whitespace-nowrap text-muted [scrollbar-width:none]" aria-label="Coleções de Riftbound">
            {SETS.map((set) => <span key={set} className={set === "Radiance" ? "rounded-sm bg-rift px-2.5 py-1 text-on-rift" : "rounded-sm border border-line px-2.5 py-1"}>{set}</span>)}
          </div>
        </section>

        {!before && (
          <aside className="space-y-6">
            <section aria-labelledby="proximo-evento">
              <SectionHeader id="proximo-evento" title="Próxima batalha" href="/arena" linkLabel="Arena" />
              {nextEvent ? <NextEventCard event={nextEvent} /> : <EmptyState icon={CalendarX2} title="Nenhum torneio marcado." text="A Rift está tranquila demais…" />}
            </section>
            {champion && <section aria-label="Campeão da semana"><ChampionHero event={champion} /></section>}
          </aside>
        )}
      </div>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section id="mural" aria-labelledby="mural-titulo" className="min-w-0 scroll-mt-24">
          <SectionHeader id="mural-titulo" title="Mural da galera" />
          <FeedList items={feed} session={session} pageSize={PAGE} />
        </section>
        {ranking.length > 0 && (
          <aside aria-labelledby="ranking-home" className="card h-fit p-4 md:p-5">
            <SectionHeader id="ranking-home" title="Ranking" href="/arena/ranking" />
            <RankingList rows={ranking.slice(0, 3)} meId={session.userId} compact />
          </aside>
        )}
      </div>
    </div>
  );
}
