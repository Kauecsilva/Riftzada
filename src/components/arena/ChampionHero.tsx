import Link from "next/link";
import { Crown } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { shortDate } from "@/lib/format";
import type { FinishedEvent } from "@/types/domain";
import { playerName } from "./Podium";

/** Destaque grande do último campeão (Home e Hall). */
export function ChampionHero({ event, title = "Campeão da semana" }: { event: FinishedEvent; title?: string }) {
  const champion = event.podium.find((r) => r.placement === 1);
  if (!champion) return null;
  const name = playerName(champion);
  const photo = event.resultsImageUrl ?? (champion.player.kind === "member" ? champion.player.profile.avatarUrl : null);

  return (
    <Link href={`/arena/eventos/${event.id}`} className="group relative block overflow-hidden rounded-[28px] border border-gold/30 shadow-float">
      <Photo src={photo} alt={`${name}, campeão do ${event.name}`} ratio="4/5" priority className="transition-transform duration-500 group-hover:scale-[1.02] md:aspect-[16/10]!" />
      <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-bold tracking-[0.14em] text-gold uppercase backdrop-blur">
          <Crown size={14} aria-hidden /> {title}
        </p>
        <p className="font-display text-5xl leading-none font-extrabold tracking-tight text-white">{name}</p>
        <p className="mt-2 text-lg font-semibold text-white/90">{champion.legend?.name.split(",")[0] ?? "—"}</p>
        <p className="mt-1 text-sm text-white/70">
          {event.name} · {shortDate(event.startsAt)}
          {event.playerCount ? ` · ${event.playerCount} jogadores` : ""}
        </p>
      </div>
    </Link>
  );
}
