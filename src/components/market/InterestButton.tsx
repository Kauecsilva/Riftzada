import Link from "next/link";
import { MessageCircle, UserRound } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import type { Listing } from "@/types/domain";

/**
 * "Tenho interesse": abre o WhatsApp só se o vendedor escolheu compartilhar o número.
 * Sem número, leva ao perfil (o contato acontece na loja ou pelo Instagram, se houver).
 */
export function InterestButton({ listing, whatsapp }: { listing: Listing; whatsapp: string | null }) {
  if (whatsapp) {
    const text = encodeURIComponent(`Oi ${listing.seller.displayName}! Vi teu anúncio de ${listing.cardName} na Riftzada. Ainda tá disponível?`);
    const number = whatsapp.length <= 11 ? `55${whatsapp}` : whatsapp;
    return (
      <a href={`https://wa.me/${number}?text=${text}`} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "lg", "w-full")}>
        <MessageCircle size={20} aria-hidden /> Tenho interesse
      </a>
    );
  }
  return (
    <div className="space-y-2">
      <Link href={`/jogador/${listing.seller.username}`} className={buttonClass("primary", "lg", "w-full")}>
        <UserRound size={20} aria-hidden /> Tenho interesse
      </Link>
      <p className="text-center text-xs text-muted">{listing.seller.displayName} não deixou WhatsApp. Chama no perfil ou na próxima ida à loja.</p>
    </div>
  );
}
