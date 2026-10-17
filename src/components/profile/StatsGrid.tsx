import { cn } from "@/lib/cn";
import type { PlayerStats } from "@/types/domain";

export function StatsGrid({ stats }: { stats: PlayerStats | null }) {
  const items = [
    { label: "Títulos", value: stats?.titles ?? 0, gold: true },
    { label: "2º lugares", value: stats?.seconds ?? 0 },
    { label: "Top 4", value: stats?.top4 ?? 0 },
    { label: "Torneios", value: stats?.eventsPlayed ?? 0 },
  ];
  return (
    <dl className="grid grid-cols-4 gap-2">
      {items.map((it) => (
        <div key={it.label} className="card flex flex-col-reverse items-center px-1 py-4 text-center">
          <dt className="text-xs text-muted">{it.label}</dt>
          <dd className={cn("font-display text-3xl font-extrabold tabular-nums", it.gold && it.value > 0 && "text-prestige")}>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
