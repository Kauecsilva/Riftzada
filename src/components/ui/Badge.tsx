import { cn } from "@/lib/cn";
import { LISTING_KIND } from "@/lib/domain/labels";
import type { ListingKind } from "@/types/domain";

type Tone = "neutral" | "rift" | "energy" | "gold" | "sell" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border-line",
  rift: "bg-rift-soft text-[#c9bfff] border-rift/40",
  energy: "bg-energy/10 text-energy border-energy/30",
  gold: "bg-gold-soft text-gold border-gold/30",
  sell: "bg-sell/10 text-sell border-sell/30",
  danger: "bg-danger/10 text-danger border-danger/30",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", TONES[tone], className)}>
      {children}
    </span>
  );
}

const KIND_TONE: Record<ListingKind, Tone> = { sell: "sell", trade: "energy", want: "gold" };

/** Etiqueta VENDE / TROCA / PROCURA. */
export function KindTag({ kind, className }: { kind: ListingKind; className?: string }) {
  return (
    <Badge tone={KIND_TONE[kind]} className={cn("uppercase tracking-wider", className)}>
      {LISTING_KIND[kind].label}
    </Badge>
  );
}
