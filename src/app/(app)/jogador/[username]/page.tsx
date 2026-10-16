import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LogOut, Shield } from "lucide-react";
import { DeckCard } from "@/components/decks/DeckCard";
import { PostCard } from "@/components/feed/PostCard";
import { ListingCard } from "@/components/market/ListingCard";
import { AchievementList } from "@/components/profile/AchievementList";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsGrid } from "@/components/profile/StatsGrid";
import { buttonClass } from "@/components/ui/button";
import { PlacementBadge } from "@/components/ui/PlacementBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FlashToast } from "@/components/ui/Toast";
import { earnedAchievements } from "@/lib/domain/achievements";
import { shortDate } from "@/lib/format";
import { getDecks } from "@/server/queries/decks";
import { getPosts } from "@/server/queries/feed";
import { getListings } from "@/server/queries/market";
import { getPlayerResults, getPlayerStats, getProfileByUsername } from "@/server/queries/profiles";
import { canModerate, requireSession } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/jogador/[username]">): Promise<Metadata> {
  const profile = await getProfileByUsername((await params).username);
  return { title: profile?.displayName ?? "Jogador" };
}

export default async function PlayerPage({ params, searchParams }: PageProps<"/jogador/[username]">) {
  const [{ username }, query, session] = await Promise.all([params, searchParams, requireSession()]);
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();
  const mine = profile.id === session.userId;

  const [stats, results, decks, listings, posts] = await Promise.all([
    getPlayerStats(profile.id),
    getPlayerResults(profile.id, 10),
    getDecks({ authorId: profile.id, limit: 6 }),
    getListings({ sellerId: profile.id, limit: 6 }),
    getPosts({ authorId: profile.id, limit: 3 }),
  ]);
  const achievements = earnedAchievements(stats, { decks: decks.length, listings: listings.length });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {query.salvo && <FlashToast text="Perfil atualizado!" />}
      <ProfileHeader profile={profile} mine={mine} champion={(stats?.titles ?? 0) > 0} />
      <StatsGrid stats={stats} />

      <section aria-labelledby="conquistas">
        <SectionHeader id="conquistas" title="Conquistas" />
        <AchievementList items={achievements} />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="historico">
          <SectionHeader id="historico" title="Histórico" />
          {results.length ? (
            <ul className="card divide-y divide-line">
              {results.map((r) => (
                <li key={r.id}>
                  <Link href={`/arena/eventos/${r.event.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                    <PlacementBadge placement={r.placement} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{r.event.name}</span>
                      <span className="block truncate text-sm text-muted">{[r.legend?.name.split(",")[0], shortDate(r.event.startsAt)].filter(Boolean).join(" · ")}</span>
                    </span>
                    {r.record && <span className="font-display font-bold text-muted tabular-nums">{r.record}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="card p-4 text-sm text-muted">{mine ? "Teu primeiro top 4 vai aparecer aqui." : "Ainda sem colocações registradas."}</p>
          )}
        </section>

        <section aria-labelledby="decks">
          <SectionHeader id="decks" title="Decks" />
          {decks.length ? (
            <ul className="space-y-3">{decks.map((d) => <li key={d.id}><DeckCard deck={d} /></li>)}</ul>
          ) : (
            <p className="card p-4 text-sm text-muted">{mine ? <>Mostra pra galera o que você está cozinhando. <Link href="/decks/novo" className="font-semibold text-rift-strong">Publicar deck</Link></> : "Nenhum deck publicado."}</p>
          )}
        </section>
      </div>

      {listings.length > 0 && (
        <section aria-labelledby="anuncios">
          <SectionHeader id="anuncios" title="Anúncios ativos" />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">{listings.map((l) => <li key={l.id}><ListingCard listing={l} /></li>)}</ul>
        </section>
      )}

      {posts.length > 0 && (
        <section aria-labelledby="posts" className="max-w-2xl">
          <SectionHeader id="posts" title="Posts recentes" />
          <div className="space-y-4">
            {posts.map((p) => <PostCard key={p.id} post={p} canDelete={mine} canModerate={canModerate(session)} />)}
          </div>
        </section>
      )}

      {mine && (
        <div className="flex flex-wrap gap-2 lg:hidden">
          {session.role === "admin" && <Link href="/admin" className={buttonClass("secondary", "md", "flex-1")}><Shield size={17} aria-hidden /> Painel admin</Link>}
          <form action="/auth/sair" method="post" className="flex-1">
            <button type="submit" className={buttonClass("ghost", "md", "w-full")}><LogOut size={17} aria-hidden /> Sair</button>
          </form>
        </div>
      )}
    </div>
  );
}
