import type { Metadata } from "next";
import Link from "next/link";
import { Crown, Medal } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { plural } from "@/lib/format";
import { getHallOfFame } from "@/server/queries/arena";
import type { PlayerStats } from "@/types/domain";

export const metadata: Metadata = { title: "Hall da Fama" };

function Stat({ value, label, gold }: { value: number; label: string; gold?: boolean }) {
  return (
    <div className="text-center">
      <p className={cn("font-display text-2xl font-extrabold tabular-nums text-[#fff8ec]", gold && "text-[#e8c77e]")}>{value}</p>
      <p className="text-xs text-[#fff8ec]/75">{label}</p>
    </div>
  );
}

function Legend({ player, rank }: { player: PlayerStats; rank: number }) {
  return (
    <Link
      href={`/jogador/${player.username}`}
      className={cn(
        "group relative block overflow-hidden rounded-[28px] border",
        rank === 1 ? "border-gold/40 md:col-span-2" : "border-line",
      )}
    >
      {/* A foto fica num medalhão: selfie esticada em tela cheia cortava o rosto e brigava com o nome. */}
      <div className="absolute inset-0 bg-[#1d1729] bg-[radial-gradient(circle_at_50%_0%,rgb(245_193_75/0.28),transparent_60%)] transition-transform duration-500 group-hover:scale-[1.03]" aria-hidden />
      <div className={cn("relative flex flex-col justify-end p-5", rank === 1 ? "min-h-72 md:min-h-80" : "min-h-72")}>
        <Avatar
          name={player.displayName}
          src={player.avatarUrl}
          size={rank === 1 ? 96 : 72}
          className={cn("mb-4 ring-2 ring-offset-2 ring-offset-[#1d1729]", rank === 1 ? "ring-[#e8c77e]" : "ring-white/30")}
        />
        {player.titles > 0 && (
          <p className="mb-1 inline-flex items-center gap-1 text-xs font-bold tracking-[0.14em] text-gold uppercase">
            <Crown size={14} aria-hidden /> {plural(player.titles, "título", "títulos")}
          </p>
        )}
        <p className="font-display text-3xl leading-none font-extrabold text-white">{player.displayName}</p>
        {player.lastTitle && <p className="mt-1 text-sm text-white/75">Último título: {player.lastTitle.name}</p>}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-black/40 p-3 backdrop-blur">
          <Stat value={player.titles} label="títulos" gold />
          <Stat value={player.top4} label="top 4" />
          <Stat value={player.eventsPlayed} label="torneios" />
        </div>
      </div>
    </Link>
  );
}

export default async function HallPage() {
  const hall = await getHallOfFame();
  if (!hall.length) {
    return <EmptyState icon={Medal} title="O Hall ainda está vazio." text="Quem fizer o primeiro top 4 ganha lugar aqui para sempre." />;
  }
  const [stars, rest] = [hall.slice(0, 5), hall.slice(5)];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">Hall da <span className="text-prestige">Riftzada</span></h2>
        <p className="text-muted">Quem já subiu ao pódio da comunidade.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {stars.map((player, i) => <Legend key={player.id} player={player} rank={i + 1} />)}
      </div>
      {rest.length > 0 && (
        <ul className="card divide-y divide-line">
          {rest.map((p) => (
            <li key={p.id}>
              <Link href={`/jogador/${p.username}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                <Avatar name={p.displayName} src={p.avatarUrl} size={40} />
                <span className="flex-1 font-semibold">{p.displayName}</span>
                <span className="text-sm text-muted">{plural(p.top4, "top 4", "top 4")} · {plural(p.eventsPlayed, "torneio", "torneios")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
