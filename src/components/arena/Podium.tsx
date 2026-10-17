import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { PlacementBadge } from "@/components/ui/PlacementBadge";
import { cn } from "@/lib/cn";
import type { EventResult } from "@/types/domain";

function playerName(result: EventResult): string {
  return result.player.kind === "member" ? result.player.profile.displayName : result.player.name;
}

/** Lista de colocações: medalha, foto, nome, lenda e record. */
export function Podium({ results, compact }: { results: EventResult[]; compact?: boolean }) {
  return (
    <ol className="space-y-2">
      {results.map((r) => {
        const name = playerName(r);
        const content = (
          <>
            <PlacementBadge placement={r.placement} size={compact ? 28 : 34} />
            <Avatar name={name} src={r.player.kind === "member" ? r.player.profile.avatarUrl : null} size={compact ? 32 : 40} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{name}</span>
              {r.legend && <span className="block truncate text-sm text-muted">{r.legend.name.split(",")[0]}</span>}
            </span>
            {r.record && <span className="font-display text-sm font-bold text-muted tabular-nums">{r.record}</span>}
          </>
        );
        const cls = cn("flex items-center gap-3 rounded-2xl", compact ? "py-1" : "border border-line bg-surface-2 p-2.5 pr-4");
        return (
          <li key={r.id}>
            {r.player.kind === "member" ? (
              <Link href={`/jogador/${r.player.profile.username}`} className={cn(cls, "transition-colors hover:bg-surface-3")}>
                {content}
              </Link>
            ) : (
              <div className={cls}>{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export { playerName };
