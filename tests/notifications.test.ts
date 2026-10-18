import { describe, expect, it } from "vitest";
import { notificationText } from "@/lib/domain/notifications";
import { formatPrice } from "@/lib/format";

const base = { cardName: "Kai'Sa, Survivor", amountCents: 7500 };
const r75 = formatPrice(7500)!;

describe("texto das notificações", () => {
  it("descreve cada passo da oferta com valor e carta", () => {
    expect(notificationText({ ...base, kind: "offer_received" })).toBe(`ofereceu ${r75} por Kai'Sa, Survivor`);
    expect(notificationText({ ...base, kind: "offer_countered" })).toBe(`fez uma contraproposta de ${r75} em Kai'Sa, Survivor`);
    expect(notificationText({ ...base, kind: "offer_accepted" })).toBe(`aceitou fechar Kai'Sa, Survivor por ${r75}`);
    expect(notificationText({ ...base, kind: "offer_declined" })).toBe("recusou a proposta em Kai'Sa, Survivor");
  });

  it("funciona sem valor e sem nome da carta (anúncio oculto)", () => {
    expect(notificationText({ kind: "offer_received", cardName: null, amountCents: null })).toBe("fez uma oferta por um anúncio seu");
  });
});
