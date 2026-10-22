import { formatPrice } from "@/lib/format";
import type { AppNotification, NotificationKind } from "@/types/domain";

/** Aviso do próprio app, sem outro jogador: o texto vem pronto do banco e abre a revisão de preços. */
export const isSystemNotification = (kind: NotificationKind) => kind === "price_review";

/** O que o outro jogador fez, sem o nome dele: "ofereceu R$ 75 por Kai'Sa". Aviso do app: a frase inteira. */
export function notificationText(n: Pick<AppNotification, "kind" | "cardName" | "amountCents" | "body">): string {
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
    case "price_review":
      return n.body ?? "Tem anúncio seu com o preço longe da referência de hoje.";
  }
}

