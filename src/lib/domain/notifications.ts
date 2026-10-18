import { formatPrice } from "@/lib/format";
import type { AppNotification } from "@/types/domain";

/** O que o outro jogador fez, sem o nome dele: "ofereceu R$ 75 por Kai'Sa". */
export function notificationText(n: Pick<AppNotification, "kind" | "cardName" | "amountCents">): string {
  const card = n.cardName ?? "um anúncio seu";
  // Oferta só em cartas vem com valor 0: sem "R$ 0" no texto
  const value = n.amountCents ? formatPrice(n.amountCents) : null;
  switch (n.kind) {
    case "offer_received":
      return value ? `ofereceu ${value} por ${card}` : `fez uma oferta por ${card}`;
    case "offer_countered":
      return value ? `fez uma contraproposta de ${value} em ${card}` : `fez uma contraproposta em ${card}`;
    case "offer_accepted":
      return value ? `aceitou fechar ${card} por ${value}` : `aceitou a proposta em ${card}`;
    case "offer_declined":
      return `recusou a proposta em ${card}`;
    case "offer_withdrawn":
      return `retirou a oferta por ${card}`;
    case "trade_offer":
      return `propôs uma troca por ${card}`;
    case "message":
      return `te mandou uma mensagem sobre ${card}`;
  }
}

