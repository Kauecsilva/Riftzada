import Image from "next/image";
import { cn } from "@/lib/cn";
import { RIFTBOUND_LOGO, RIOT_CREDIT } from "@/lib/art";

/** Logo oficial de Riftbound com o crédito à Riot (fã-site, sem afiliação). */
export function RiftboundCredit({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Image src={RIFTBOUND_LOGO.src} alt="Riftbound, o jogo de cartas de League of Legends" width={RIFTBOUND_LOGO.width} height={RIFTBOUND_LOGO.height} sizes="200px" className="h-auto w-36 opacity-90" />
      <p className="text-[11px] leading-snug text-faint">{RIOT_CREDIT}</p>
    </div>
  );
}
