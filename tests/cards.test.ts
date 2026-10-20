import { describe, expect, it } from "vitest";
import { cardImageUrl, cardLine, listingImageUrl, listingPhotos, offerVerb, pickLegendPrints, splitLegendName, uniqueLegends } from "@/lib/cards";
import { collectionItemSchema, listingSchema } from "@/lib/validation/schemas";

const CARD_ID = "00000000-0000-4000-8000-200000000001";
const card = { id: CARD_ID, name: "Jinx - Rebel", setName: "Origins", code: "OGN-007", rarity: "Epic", imageUrl: "https://cmsassets.rgpub.io/sanity/images/x.png" };

describe("catálogo de cartas", () => {
  it("só aceita imagem do CDN liberado", () => {
    expect(cardImageUrl(card.imageUrl)).toBe(card.imageUrl);
    expect(cardImageUrl("https://outro.site/x.png")).toBeNull();
    expect(cardImageUrl("não é url")).toBeNull();
    expect(cardImageUrl(null)).toBeNull();
  });

  it("capa do anúncio é a imagem oficial; sem carta, a foto do anunciante", () => {
    expect(listingImageUrl({ imageUrl: null, card })).toBe(card.imageUrl);
    expect(listingImageUrl({ imageUrl: "/minha.jpg", card })).toBe(card.imageUrl);
    expect(listingImageUrl({ imageUrl: "/minha.jpg", card: null })).toBe("/minha.jpg");
    expect(listingImageUrl({ imageUrl: null, card: null })).toBeNull();
  });

  it("fotos do anúncio: oficial primeiro, depois a do anunciante", () => {
    expect(listingPhotos({ imageUrl: "/minha.jpg", card })).toEqual([
      { url: card.imageUrl, kind: "official" },
      { url: "/minha.jpg", kind: "seller" },
    ]);
    expect(listingPhotos({ imageUrl: null, card })).toEqual([{ url: card.imageUrl, kind: "official" }]);
    expect(listingPhotos({ imageUrl: "/minha.jpg", card: null })).toEqual([{ url: "/minha.jpg", kind: "seller" }]);
    expect(listingPhotos({ imageUrl: null, card: null })).toEqual([]);
  });

  it("descreve a oferta de quem tem a carta", () => {
    expect(offerVerb({ kind: "sell", acceptsTrade: false })).toBe("está vendendo");
    expect(offerVerb({ kind: "sell", acceptsTrade: true })).toBe("está vendendo ou trocando");
    expect(offerVerb({ kind: "trade", acceptsTrade: false })).toBe("está trocando");
  });

  it("linha da carta junta expansão, código e raridade", () => {
    expect(cardLine(card)).toBe("Origins · OGN-007 · Epic");
    expect(cardLine({ ...card, code: null, rarity: null })).toBe("Origins");
  });
});

describe("anúncio ligado ao catálogo", () => {
  const base = { kind: "sell", cardName: "Jinx", condition: "nm", quantity: "1" };

  it("cardId e item da coleção são opcionais", () => {
    const v = listingSchema.parse({ ...base, cardId: "", collectionItemId: "" });
    expect(v.cardId).toBeNull();
    expect(v.collectionItemId).toBeNull();
    expect(listingSchema.parse({ ...base, cardId: CARD_ID }).cardId).toBe(CARD_ID);
  });

  it("recusa cardId inválido", () => {
    expect(listingSchema.safeParse({ ...base, cardId: "jinx" }).success).toBe(false);
  });
});

describe("coleção", () => {
  it("exige escolher a carta do catálogo", () => {
    const result = collectionItemSchema.safeParse({ cardId: "", quantity: "1", condition: "nm" });
    expect(result.success).toBe(false);
  });

  it("aceita carta, quantidade e variante", () => {
    const v = collectionItemSchema.parse({ cardId: CARD_ID, quantity: "3", condition: "lp", variant: " Foil ", notes: "" });
    expect(v).toMatchObject({ quantity: 3, condition: "lp", variant: "Foil", notes: null });
  });

  it("limita a quantidade", () => {
    expect(collectionItemSchema.safeParse({ cardId: CARD_ID, quantity: "0", condition: "nm" }).success).toBe(false);
    expect(collectionItemSchema.safeParse({ cardId: CARD_ID, quantity: "1000", condition: "nm" }).success).toBe(false);
  });
});

describe("lendas sem repetição", () => {
  it("fica uma por nome, preferindo a impressão normal", () => {
    const legends = uniqueLegends([
      { id: "1", name: "Ahri - Nine-Tailed Fox", rarity: "Promo" },
      { id: "2", name: "Ahri - Nine-Tailed Fox (Metal)", rarity: "Promo" },
      { id: "3", name: "Ahri - Nine-Tailed Fox", rarity: "Rare" },
      { id: "4", name: "Annie - Dark Child (Starter)", rarity: "Rare" },
    ]);
    expect(legends).toEqual([
      { id: "3", name: "Ahri - Nine-Tailed Fox" },
      { id: "4", name: "Annie - Dark Child" },
    ]);
  });
});

describe("carrossel de lendas", () => {
  it("separa campeão e título", () => {
    expect(splitLegendName("Ekko - Boy Who Shattered Time")).toEqual(["Ekko", "Boy Who Shattered Time"]);
    expect(splitLegendName("Riven, The Exile")).toEqual(["Riven", "The Exile"]);
    expect(splitLegendName("Yordle, Kennen - Heart of the Tempest")).toEqual(["Kennen", "Heart of the Tempest"]);
    expect(splitLegendName("Sett")).toEqual(["Sett", null]);
  });

  it("fica uma impressão por código, a que tem o nome do campeão", () => {
    const rows = [
      { name: "Rogue Assassin", public_code: "VEN-139" },
      { name: "Akali - Rogue Assassin", public_code: "VEN-139" },
      { name: "Heart of the Tempest", public_code: "VEN-197" },
      { name: "Ekko - Boy Who Shattered Time", public_code: "RAD-139" },
      { name: "Ekko - Boy Who Shattered Time", public_code: null },
    ];
    expect(pickLegendPrints(rows).map((r) => r.name)).toEqual(["Akali - Rogue Assassin", "Ekko - Boy Who Shattered Time"]);
  });
});
