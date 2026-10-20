import { cn } from "@/lib/cn";
import { RIOT_CREDIT } from "@/lib/art";

/** Crédito às artes oficiais e à marca da Riot (fã-site, sem afiliação). */
export function RiftboundCredit({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="font-display text-lg font-extrabold tracking-[0.08em] text-gold-strong">RIFTBOUND</p>
      <p className="text-[11px] leading-snug text-faint">{RIOT_CREDIT}</p>
    </div>
  );
}
