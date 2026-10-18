import Image from "next/image";
import { CalendarX2 } from "lucide-react";
import { ChampionHero } from "@/components/arena/ChampionHero";
import { EventCard } from "@/components/arena/EventCard";
import { RankingList } from "@/components/arena/RankingList";
import { FeedList } from "@/components/feed/FeedList";
import { Logo } from "@/components/layout/Logo";
import { RiftboundCredit } from "@/components/layout/RiftboundCredit";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FlashToast } from "@/components/ui/Toast";
import { ART } from "@/lib/art";
import { getLatestChampion, getNextEvent, getRanking } from "@/server/queries/arena";
import { getFeed } from "@/server/queries/feed";
import { requireSession } from "@/server/session";

const PAGE = 15;

const FLASH: Record<string, string> = {
  publicado: "Publicado no mural!",
  bemvindo: "Bem-vindo à Riftzada!",
  senha: "Senha nova salva.",
};

function greeting(): string {
  const hour = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }));
  if (hour < 5) return "Boa madrugada";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

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
  const flash = Object.keys(FLASH).find((k) => params[k]);

  const nextEventBlock = (
    <section aria-labelledby="proximo-evento">
      <SectionHeader id="proximo-evento" title="Próxima batalha" href="/arena" linkLabel="Arena" />
      {nextEvent ? (
        <EventCard event={nextEvent} highlight />
      ) : (
        <EmptyState icon={CalendarX2} title="Nenhum torneio marcado." text="A Rift está tranquila demais…" />
      )}
    </section>
  );

  const rankingBlock = ranking.length > 0 && (
    <section aria-labelledby="ranking-home" className="card p-4">
      <SectionHeader id="ranking-home" title="Ranking" href="/arena/ranking" />
      <RankingList rows={ranking.slice(0, 3)} meId={session.userId} compact />
    </section>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      {flash && <FlashToast text={FLASH[flash]} />}
      <div className="min-w-0 space-y-8">
        <header className="flex items-center justify-between lg:hidden">
          <Logo size={26} />
        </header>
        <section aria-label="Boas-vindas" className="frame-hex relative overflow-hidden bg-surface">
          <Image src={ART.launch} alt="Ahri, Yasuo e Jinx na arte de lançamento de Riftbound" fill priority sizes="(min-width: 1024px) 760px, 100vw" className="object-cover object-[50%_15%]" />
          <div className="absolute inset-0 bg-linear-to-t from-bg from-10% via-bg/75 to-bg/0" aria-hidden />
          <div className="absolute inset-0 bg-linear-to-r from-bg/70 to-transparent" aria-hidden />
          <div className="relative px-5 pt-32 pb-5 md:px-8 md:pt-48 md:pb-7">
            <h1 className="font-display text-[40px] leading-[0.95] font-extrabold tracking-tight uppercase drop-shadow-[0_2px_12px_rgb(0_0_0/0.8)] md:text-6xl">
              {greeting()}, {session.profile.displayName}.
            </h1>
            <p className="mt-2 text-ink/85">Olha o que rolou na Riftzada.</p>
          </div>
        </section>

        {champion && (
          <section aria-label="Campeão da semana">
            <ChampionHero event={champion} />
          </section>
        )}

        <div className="space-y-8 lg:hidden">
          {!before && nextEventBlock}
          {!before && rankingBlock}
        </div>

        <section aria-labelledby="mural" className="scroll-mt-6">
          <SectionHeader id="mural" title="Na Riftzada" />
          <FeedList items={feed} session={session} pageSize={PAGE} />
        </section>

        <RiftboundCredit className="lg:hidden" />
      </div>

      <aside className="hidden space-y-8 lg:block">
        <div className="sticky top-8 space-y-8">
          {nextEventBlock}
          {rankingBlock}
        </div>
      </aside>
    </div>
  );
}
