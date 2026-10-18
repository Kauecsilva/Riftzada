import { describe, expect, it } from "vitest";
import { groupConversations } from "@/lib/domain/chat";
import { dealSummary, offerSummary, whatsappLink } from "@/lib/domain/offers";
import { offerSchema } from "@/lib/validation/schemas";

const id = "00000000-0000-4000-8000-500000000003";
const nbsp = (s: string) => s.replace(/ /g, " ");

describe("offerSummary", () => {
  it("junta valor e cartas", () => {
    expect(nbsp(offerSummary({ amountCents: 1500, cards: [{ name: "Ahri, Alluring", qty: 2, cardId: null }, { name: "Calm Rune", qty: 1, cardId: null }] })))
      .toBe("R$ 15 + 2x Ahri, Alluring + Calm Rune");
  });
  it("só cartas não mostra R$ 0", () => {
    expect(offerSummary({ amountCents: 0, cards: [{ name: "Calm Rune", qty: 1, cardId: null }] })).toBe("Calm Rune");
  });
  it("só dinheiro", () => {
    expect(nbsp(offerSummary({ amountCents: 7550, cards: [] }))).toBe("R$ 75,50");
  });
});

describe("whatsappLink", () => {
  it("põe o 55 em número brasileiro e codifica o texto", () => {
    expect(whatsappLink("(11) 98765-4321", "Oi & tal")).toBe("https://wa.me/5511987654321?text=Oi%20%26%20tal");
  });
  it("mantém número que já tem DDI", () => {
    expect(whatsappLink("5511987654321", "x")).toBe("https://wa.me/5511987654321?text=x");
  });
});

describe("offerSchema", () => {
  it("aceita só cartas, sem valor", () => {
    const parsed = offerSchema.parse({ listingId: id, amount: "", cards: JSON.stringify([{ name: "Calm Rune", qty: 1, cardId: null }]) });
    expect(parsed.amount).toBe(0);
    expect(parsed.cards).toEqual([{ name: "Calm Rune", qty: 1, cardId: null }]);
  });
  it("sem cartas exige valor", () => {
    expect(offerSchema.safeParse({ listingId: id, amount: "", cards: "[]" }).success).toBe(false);
  });
  it("recusa lista de cartas malformada", () => {
    expect(offerSchema.safeParse({ listingId: id, amount: "10", cards: "{oi" }).success).toBe(false);
    expect(offerSchema.safeParse({ listingId: id, amount: "10", cards: JSON.stringify([{ name: "", qty: 1 }]) }).success).toBe(false);
  });
});

describe("groupConversations", () => {
  const p = (id: string) => ({ id, username: id, displayName: id, avatarUrl: null });
  const listing = { id: "l1", cardName: "Viktor", kind: "trade" as const, imageUrl: null, seller: p("bia") };
  const row = (id: string, senderId: string, buyer: string, read: boolean, createdAt: string) =>
    ({ id, senderId, body: id, createdAt, read, buyer: p(buyer), listing });

  it("uma conversa por interessado, com a última mensagem e as não lidas", () => {
    const rows = [
      row("m3", "bia", "kaue", false, "2026-10-18T12:00:00Z"),
      row("m2", "joao", "joao", false, "2026-10-18T11:00:00Z"),
      row("m1", "kaue", "kaue", false, "2026-10-18T10:00:00Z"),
    ];
    const asSeller = groupConversations(rows, "bia");
    expect(asSeller.map((c) => [c.other.id, c.last.id, c.unread])).toEqual([["kaue", "m3", 1], ["joao", "m2", 1]]);
    const asBuyer = groupConversations(rows.filter((r) => r.buyer.id === "kaue"), "kaue");
    expect(asBuyer.map((c) => [c.other.id, c.unread])).toEqual([["bia", 1]]);
  });
});

describe("dealSummary", () => {
  const base = { kind: "sell" as const, priceCents: 9000, acceptsOffers: false, minOfferCents: null, acceptsTrade: false };
  it("venda simples", () => expect(nbsp(dealSummary(base))).toBe("Vende por R$ 90."));
  it("venda com oferta e troca", () =>
    expect(nbsp(dealSummary({ ...base, acceptsOffers: true, minOfferCents: 6000, acceptsTrade: true })))
      .toBe("Vende por R$ 90, aceita ofertas em dinheiro a partir de R$ 60, aceita troca por cartas, com ou sem dinheiro junto."));
  it("troca", () => expect(dealSummary({ ...base, kind: "trade", priceCents: null })).toMatch(/^Só troca/));
});
