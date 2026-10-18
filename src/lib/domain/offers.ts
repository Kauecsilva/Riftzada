// Texto de oferta e link do WhatsApp, usados no anúncio, no painel do vendedor e nos testes.

import { formatPrice } from "@/lib/format";
import type { Listing, OfferCard } from "@/types/domain";

/** O que o anúncio aceita como oferta: dinheiro abaixo do preço, cartas (+ dinheiro), ou os dois. */
export function offerModes(listing: Pick<Listing, "kind" | "acceptsOffers" | "acceptsTrade">): { money: boolean; trade: boolean } {
  return {
    money: listing.kind === "sell" && listing.acceptsOffers,
    trade: listing.kind === "trade" || (listing.kind === "sell" && listing.acceptsTrade),
  };
}

/** "R$ 15 + 2x Ahri, Alluring + Calm Rune"; só cartas ou só dinheiro também. */
export function offerSummary(offer: { amountCents: number; cards: OfferCard[] }): string {
  const cards = offer.cards.map((c) => (c.qty > 1 ? `${c.qty}x ${c.name}` : c.name));
  const parts = offer.amountCents > 0 ? [formatPrice(offer.amountCents)!, ...cards] : cards;
  return parts.join(" + ") || formatPrice(0)!;
}

/** Link wa.me com a mensagem pronta. Número sem DDI (até 11 dígitos) ganha o 55 do Brasil. */
export function whatsappLink(number: string, text: string): string {
  const digits = number.replace(/\D/g, "");
  const full = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

/** Uma frase que diz como negociar o anúncio: venda, oferta em dinheiro, troca com cartas ou procura. */
export function dealSummary(listing: Pick<Listing, "kind" | "priceCents" | "acceptsOffers" | "minOfferCents" | "acceptsTrade">): string {
  if (listing.kind === "want") return "Procura essa carta. Se você tem, chama na conversa ou no WhatsApp.";
  if (listing.kind === "trade") return "Só troca: oferece cartas e, se quiser, dinheiro junto.";
  const parts = [listing.priceCents != null ? `Vende por ${formatPrice(listing.priceCents)}` : "Vende com preço a combinar"];
  if (listing.acceptsOffers) {
    parts.push(listing.minOfferCents != null ? `aceita ofertas em dinheiro a partir de ${formatPrice(listing.minOfferCents)}` : "aceita ofertas em dinheiro");
  }
  if (listing.acceptsTrade) parts.push("aceita troca por cartas, com ou sem dinheiro junto");
  return `${parts.join(", ")}.`;
}
