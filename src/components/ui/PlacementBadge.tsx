import { cn } from "@/lib/cn";

const STYLE: Record<number, string> = {
  1: "bg-linear-to-br from-[#ffe39a] to-gold text-[#2b1f04]",
  2: "bg-linear-to-br from-white to-silver text-[#1b1e36]",
  3: "bg-linear-to-br from-[#f0b88f] to-bronze text-[#2b1606]",
  4: "bg-linear-to-br from-[#f0b88f] to-bronze text-[#2b1606]",
};

/** Medalha com a colocação: ouro, prata, bronze. */
export function PlacementBadge({ placement, size = 32, className }: { placement: number; size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-display font-extrabold", STYLE[placement] ?? "bg-surface-3 text-muted", className)}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-label={`${placement}º lugar`}
    >
      {placement}º
    </span>
  );
}
