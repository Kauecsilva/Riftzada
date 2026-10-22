import { describe, expect, it } from "vitest";
import { isSystemNotification, notificationText } from "@/lib/domain/notifications";
import { formatPrice } from "@/lib/format";

const base = { cardName: "Kai'Sa, Survivor", amountCents: 7500, body: null };
const r75 = formatPrice(7500)!;

describe("texto das notificações", () => {
  it("descreve cada passo da oferta com valor e carta", () => {
    expect(notificationText({ ...base, kind: "offer_received" })).toBe(`ofereceu ${r75} por Kai'Sa, Survivor`);
    expect(notificationText({ ...base, kind: "offer_countered" })).toBe(`fez uma contraproposta de ${r75} em Kai'Sa, Survivor`);
    expect(notificationText({ ...base, kind: "offer_accepted" })).toBe(`aceitou fechar Kai'Sa, Survivor por ${r75}`);
    expect(notificationText({ ...base, kind: "offer_declined" })).toBe("recusou a proposta em Kai'Sa, Survivor");
  });

  it("funciona sem valor e sem nome da carta (anúncio oculto)", () => {
    expect(notificationText({ kind: "offer_received", cardName: null, amountCents: null, body: null })).toBe("fez uma oferta por um anúncio seu");
    expect(notificationText({ kind: "offer_received", cardName: "Ahri", amountCents: 0, body: null })).toBe("fez uma oferta por Ahri");
  });

  it("aviso de preço desatualizado usa a frase do banco e é do app", () => {
    const body = "2 anúncios seus estão com o preço longe da referência de hoje.";
    expect(notificationText({ kind: "price_review", cardName: null, amountCents: null, body })).toBe(body);
    expect(isSystemNotification("price_review")).toBe(true);
    expect(isSystemNotification("offer_received")).toBe(false);
  });
});
