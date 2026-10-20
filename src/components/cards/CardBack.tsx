import { LogoMark } from "@/components/layout/Logo";
import { cn } from "@/lib/cn";
import type { ListingKind } from "@/types/domain";

const GLOW: Record<ListingKind, string> = {
  sell: "from-[#6d375f] via-[#392345] to-[#182838]",
  trade: "from-[#236f77] via-[#243b4e] to-[#24203b]",
  want: "from-[#966b32] via-[#58412f] to-[#29233d]",
};

/** Verso fictício da Riftzada para anúncios sem foto; não representa uma carta oficial. */
export function CardBack({ kind }: { kind: ListingKind }) {
  return (
    <div aria-hidden className={cn("absolute inset-0 flex items-center justify-center overflow-hidden bg-linear-to-br p-2.5", GLOW[kind])}>
      <span className="absolute -top-10 -right-10 size-36 rounded-full border border-[#e6c98f]/30" />
      <span className="absolute -bottom-10 -left-10 size-36 rounded-full border border-[#e6c98f]/25" />
      <div className="relative flex h-[90%] max-h-56 w-[82%] flex-col items-center justify-center overflow-hidden border border-[#e6c98f]/90 bg-[#1d1930]/85 shadow-[0_10px_28px_rgb(19_12_29/0.38)] [clip-path:polygon(9px_0,calc(100%_-_9px)_0,100%_9px,100%_calc(100%_-_9px),calc(100%_-_9px)_100%,9px_100%,0_calc(100%_-_9px),0_9px)]">
        <span className="absolute inset-[5px] border border-[#e6c98f]/45 [clip-path:polygon(7px_0,calc(100%_-_7px)_0,100%_7px,100%_calc(100%_-_7px),calc(100%_-_7px)_100%,7px_100%,0_calc(100%_-_7px),0_7px)]" />
        <span className="absolute size-[75%] rounded-full border border-[#e6c98f]/35" />
        <span className="absolute size-[54%] rotate-45 border border-[#e6c98f]/35" />
        <LogoMark size={44} className="relative drop-shadow-[0_2px_8px_rgb(0_0_0/0.5)]" />
        <span className="relative mt-1 font-display text-[8px] font-bold tracking-[0.25em] text-[#e6c98f]">RIFTZADA</span>
      </div>
    </div>
  );
}
