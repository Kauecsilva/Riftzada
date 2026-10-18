import { cn } from "@/lib/cn";
import { comparePrices, PRICE_BASE } from "@/lib/domain/pricing";
import { formatPrice } from "@/lib/format";
import type { PriceBase } from "@/types/domain";

/** Liga x TCGplayer lado a lado, com barras proporcionais e quem está mais barato. */
export function PriceComparison({ ligaCents, tcgCents, className }: { ligaCents: number; tcgCents: number; className?: string }) {
  const result = comparePrices(ligaCents, tcgCents);
  const high = Math.max(ligaCents, tcgCents);
  const rows: [PriceBase, number][] = [["liga", ligaCents], ["tcgplayer", tcgCents]];
  return (
    <div className={cn("space-y-2 rounded-2xl border border-line bg-surface-2 p-3 text-sm", className)}>
      <p className="font-semibold">Liga x TCGplayer</p>
      {rows.map(([base, cents]) => (
        <div key={base} className="grid grid-cols-[76px_1fr_auto] items-center gap-2">
          <span className="text-muted">{PRICE_BASE[base]}</span>
          <span className="h-2 overflow-hidden rounded-full bg-surface-3" aria-hidden>
            <span className={cn("block h-full rounded-full", result.cheaper === base ? "bg-energy" : "bg-muted/60")} style={{ width: `${Math.max(4, (cents / high) * 100)}%` }} />
          </span>
          <span className={cn("text-right font-semibold tabular-nums", result.cheaper === base && "text-energy")}>{formatPrice(cents)}</span>
        </div>
      ))}
      <p className="text-xs text-muted">
        {result.cheaper
          ? `${PRICE_BASE[result.cheaper]} está ${result.diffPct}% mais barato (${formatPrice(result.diffCents)} de diferença).`
          : "Mesmo preço nos dois."}
      </p>
    </div>
  );
}
