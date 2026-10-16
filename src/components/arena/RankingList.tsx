import Link from "next/link";
import { Crown } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { plural } from "@/lib/format";
import type { RankingRow } from "@/types/domain";

const POSITION_COLOR: Record<number, string> = { 1: "text-gold", 2: "text-silver", 3: "text-bronze" };

/** Ranking: posição, foto, nome, títulos e pontos. Destaca o usuário logado. */
export function RankingList({ rows, meId, compact }: { rows: RankingRow[]; meId?: string; compact?: boolean }) {
  return (
    <ol className={cn(!compact && "card divide-y divide-line overflow-hidden")}>
      {rows.map((row) => (
        <li key={row.id}>
          <Link
            href={`/jogador/${row.username}`}
            className={cn(
              "flex items-center gap-3 transition-colors hover:bg-surface-2",
              compact ? "rounded-2xl px-2 py-2" : "px-4 py-3",
              row.id === meId && "bg-rift-soft/50",
            )}
          >
            <span className={cn("w-7 text-center font-display text-lg font-extrabold tabular-nums", POSITION_COLOR[row.position] ?? "text-faint")}>
              {row.position}
            </span>
            <Avatar name={row.displayName} src={row.avatarUrl} size={compact ? 36 : 44} ring={row.position === 1 ? "gold" : undefined} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 truncate font-semibold">
                {row.displayName}
                {row.id === meId && <span className="text-xs font-medium text-rift-strong">(você)</span>}
              </span>
              {!compact && (
                <span className="flex items-center gap-1 text-sm text-muted">
                  {row.titles > 0 && <Crown size={13} className="text-gold" aria-hidden />}
                  {row.titles > 0 ? `${plural(row.titles, "título", "títulos")} · ` : ""}
                  {plural(row.eventsPlayed, "torneio", "torneios")}
                </span>
              )}
            </span>
            <span className="text-right">
              <span className="font-display text-lg font-extrabold tabular-nums">{row.points}</span>
              <span className="ml-1 text-xs text-muted">pts</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
