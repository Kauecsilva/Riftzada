import { CalendarX2 } from "lucide-react";
import { ChampionHero } from "@/components/arena/ChampionHero";
import { EventCard } from "@/components/arena/EventCard";
import { RankingList } from "@/components/arena/RankingList";
import { FeedList } from "@/components/feed/FeedList";
import { Logo } from "@/components/layout/Logo";
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
        <div>
          <p className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            {greeting()}, <span className="text-brand">{session.profile.displayName}</span>.
          </p>
          <p className="mt-1 text-muted">Olha o que rolou na Riftzada.</p>
        </div>

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
