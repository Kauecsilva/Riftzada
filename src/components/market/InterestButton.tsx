import Link from "next/link";
import { MessageCircle, MessagesSquare } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { chatHref } from "@/lib/domain/chat";
import { whatsappLink } from "@/lib/domain/offers";
import type { Listing } from "@/types/domain";

/**
 * Falar com quem anunciou: a conversa do app sempre; o WhatsApp só se a pessoa escolheu compartilhar,
 * já com a carta na mensagem.
 */
export function InterestButton({ listing, me, whatsapp }: { listing: Listing; me: string; whatsapp: string | null }) {
  const name = listing.seller.displayName;
  const text = listing.kind === "want"
    ? `Oi ${name}! Vi no Riftzada que você procura ${listing.cardName}. Eu tenho, bora negociar?`
    : `Oi ${name}! Vi teu anúncio de ${listing.cardName} no Riftzada. Ainda tá disponível?`;
  return (
    <section className="space-y-2" aria-label={`Falar com ${name}`}>
      <Link href={chatHref(listing.id, me)} className={buttonClass("primary", "lg", "w-full")}>
        <MessagesSquare size={20} aria-hidden /> {listing.kind === "want" ? "Tenho essa carta" : `Conversar com ${name}`}
      </Link>
      {whatsapp ? (
        <a href={whatsappLink(whatsapp, text)} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "lg", "w-full")}>
          <MessageCircle size={20} aria-hidden /> Chamar no WhatsApp
        </a>
      ) : (
        <p className="text-center text-xs text-muted">{name} não deixou WhatsApp. A conversa fica aqui no app.</p>
      )}
    </section>
  );
}
