import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Crown } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { shortDate } from "@/lib/format";
import type { FinishedEvent } from "@/types/domain";
import { playerName } from "./Podium";

/** Troféu do campeão mais recente; fotos reais do resultado aparecem à direita. */
export function ChampionHero({ event, title = "Campeão da semana" }: { event: FinishedEvent; title?: string }) {
  const champion = event.podium.find((r) => r.placement === 1);
  if (!champion) return null;
  const name = playerName(champion);
  const avatar = champion.player.kind === "member" ? champion.player.profile.avatarUrl : null;
  // O seed traz cartazes SVG, não fotografias de resultado.
  const photo = event.resultsImageUrl?.startsWith("/demo/") ? null : event.resultsImageUrl;

  return (
    <Link href={`/arena/eventos/${event.id}`} className="group relative isolate block overflow-hidden rounded-lg border border-[#a77c3b] bg-[radial-gradient(circle_at_80%_25%,#754576_0%,#392b4c_35%,#1d1b30_76%)] text-white shadow-float transition-transform hover:-translate-y-0.5">
      {photo ? (
        <div className="absolute inset-y-0 right-0 w-[58%] overflow-hidden">
          <Image src={photo} alt="" fill sizes="(min-width: 1024px) 380px, 58vw" className="object-cover" />
        </div>
      ) : (
        <div className="absolute top-1/2 right-[-1.5rem] flex size-44 -translate-y-1/2 items-center justify-center rounded-full border border-[#d6b36f]/25 bg-[#e6bc75]/5 text-[#efd39a]/35 sm:right-8 sm:size-56" aria-hidden>
          <div className="absolute inset-4 rounded-full border border-[#d6b36f]/35" />
          <Crown size={84} strokeWidth={1} />
        </div>
      )}
      <div className="absolute inset-0 bg-linear-to-r from-[#1d1b30] via-[#1d1b30]/95 to-[#1d1b30]/25" aria-hidden />
      <div className="pointer-events-none absolute inset-[5px] rounded-[5px] border border-[#e8c98e]/40" aria-hidden />
      <div className="relative flex min-h-[224px] flex-col justify-between gap-5 p-5 sm:min-h-[240px] sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.17em] text-[#f0d18f] uppercase">
            <Crown size={15} aria-hidden /> {title}
          </span>
          <ArrowUpRight size={18} className="text-[#e8c98e] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </div>
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-ceremony text-[clamp(2.1rem,7vw,3.3rem)] leading-none font-semibold tracking-[-0.035em] text-[#f5dfad]">{name}</p>
            {champion.legend && <p className="mt-2 text-sm font-semibold text-white/90">{champion.legend.name.split(",")[0]}</p>}
            <p className="mt-3 max-w-[42ch] text-xs leading-snug text-white/70 sm:text-sm">
              {event.name} · {shortDate(event.startsAt)}
              {event.playerCount ? ` · ${event.playerCount} jogadores` : ""}
            </p>
          </div>
          <div className="shrink-0 rounded-full border border-[#e8c98e]/70 p-0.5 shadow-[0_0_24px_rgb(232_201_142/0.2)]">
            <Avatar name={name} src={avatar} size={48} />
          </div>
        </div>
      </div>
    </Link>
  );
}
