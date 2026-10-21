import { describe, expect, it } from "vitest";
import {
  applyDiscount, centsToInput, cheapestBase, collectionValue, comparePrices, defaultBase, discountLabel, ligaCardUrl, parseBrl, pickFinish,
  referencePrice, tcgBrlCents, usdToBrlCents,
} from "@/lib/domain/pricing";
import { listingQueueHref } from "@/lib/domain/listing-queue";
import { listingQueue, listingSchema, offerSchema, queuePrice } from "@/lib/validation/schemas";
import type { CardPrice, LigaPrice, PriceReference } from "@/types/domain";

const at = "2026-10-17T20:00:00Z";
const normal: CardPrice = { finish: "normal", lowCents: 1000, marketCents: 1200, productUrl: null, updatedAt: at };
const foil: CardPrice = { finish: "foil", lowCents: 4800, marketCents: 5321, productUrl: null, updatedAt: at };

describe("preço sugerido", () => {
  it("lê valores em reais no formato brasileiro", () => {
    expect(parseBrl("336,66")).toBe(33666);
    expect(parseBrl("R$ 1.200,50")).toBe(120050);
    expect(parseBrl("12.5")).toBe(1250);
    expect(parseBrl("")).toBeNull();
    expect(parseBrl("abc")).toBeNaN();
    expect(centsToInput(33666)).toBe("336,66");
    expect(centsToInput(null)).toBe("");
  });

  it("converte dólar e aplica desconto", () => {
    expect(usdToBrlCents(4800, 5.0826)).toBe(24396);
    expect(applyDiscount(33666, 10)).toBe(30299);
    expect(applyDiscount(10000, 0)).toBe(10000);
  });

  it("escolhe o acabamento pela variante", () => {
    expect(pickFinish([normal, foil], "Foil")).toBe(foil);
    expect(pickFinish([normal, foil], null)).toBe(normal);
    expect(pickFinish([foil], "")).toBe(foil);
    expect(pickFinish([], "Foil")).toBeNull();
  });

  it("usa o menor anúncio do TCGplayer e cai para o preço de mercado", () => {
    expect(tcgBrlCents(foil, 5)).toBe(24000);
    expect(tcgBrlCents({ ...foil, lowCents: null }, 5)).toBe(26605);
    expect(tcgBrlCents(foil, null)).toBeNull();
  });

  it("sugere a base mais barata", () => {
    expect(cheapestBase({ liga: 33666, tcgplayer: 24396 })).toBe("tcgplayer");
    expect(cheapestBase({ liga: 20000, tcgplayer: 24396 })).toBe("liga");
    expect(cheapestBase({ liga: null, tcgplayer: 24396 })).toBe("tcgplayer");
    expect(cheapestBase({})).toBeNull();
  });

  it("usa a Liga como base padrão e o TCGplayer só sem Liga", () => {
    expect(defaultBase({ liga: 33666, tcgplayer: 24396 })).toBe("liga");
    expect(defaultBase({ liga: null, tcgplayer: 24396 })).toBe("tcgplayer");
    expect(defaultBase({ liga: 0, tcgplayer: null })).toBeNull();
  });

  it("soma o valor da coleção pelo preço padrão vezes as cópias", () => {
    const liga: LigaPrice = { finish: "normal", lowCents: 2000, avgCents: null, language: "en", condition: "nm", url: "https://www.ligariftbound.com.br/", updatedAt: at };
    const refs: Record<string, PriceReference> = {
      a: { tcgplayer: [normal], liga: [liga], usdBrl: 5, rateUpdatedAt: at },
      b: { tcgplayer: [normal, foil], liga: [], usdBrl: 5, rateUpdatedAt: at },
      c: { tcgplayer: [], liga: [], usdBrl: 5, rateUpdatedAt: at },
    };
    expect(referencePrice(refs.a, null)).toEqual({ base: "liga", cents: 2000 });
    expect(referencePrice(refs.b, "Foil")).toEqual({ base: "tcgplayer", cents: 24000 });
    expect(referencePrice(refs.c, null)).toBeNull();
    expect(referencePrice(undefined, null)).toBeNull();
    expect(collectionValue([
      { cardId: "a", variant: null, quantity: 3 },
      { cardId: "b", variant: "Foil", quantity: 1 },
      { cardId: "c", variant: null, quantity: 2 },
      { cardId: "sem-ref", variant: null, quantity: 1 },
    ], refs)).toEqual({ totalCents: 30000, pricedCopies: 4, unpricedCopies: 3 });
  });

  it("monta a fila de cadastro rápido", () => {
    const a = "11111111-1111-4111-8111-111111111111";
    const b = "22222222-2222-4222-8222-222222222222";
    expect(listingQueueHref([a, b])).toBe(`/mercado/novo?colecao=${a}&fila=${b}`);
    expect(listingQueueHref([a])).toBe(`/mercado/novo?colecao=${a}&fila=`);
    expect(listingQueueHref([])).toBe("/colecao");
    expect(listingQueue.parse(`${a}, x,${b},${a}`)).toEqual([a, b]);
    expect(listingQueue.parse(undefined)).toEqual([]);
    expect(listingQueue.parse("")).toEqual([]);
  });

  it("leva a base e o desconto da fila para todas as cartas", () => {
    const a = "11111111-1111-4111-8111-111111111111";
    const b = "22222222-2222-4222-8222-222222222222";
    expect(listingQueueHref([a, b], { base: "liga", discountPct: 15 })).toBe(`/mercado/novo?colecao=${a}&fila=${b}&base=liga&desconto=15`);
    expect(listingQueueHref([a], null)).toBe(`/mercado/novo?colecao=${a}&fila=`);
    expect(queuePrice.parse({ base: "liga", discountPct: "15" })).toEqual({ base: "liga", discountPct: 15 });
    expect(queuePrice.parse({ base: "tcgplayer", discountPct: "200" })).toEqual({ base: "tcgplayer", discountPct: 0 });
    expect(queuePrice.parse({ base: "ebay", discountPct: "10" })).toBeNull();
  });

  it("compara Liga e TCGplayer", () => {
    expect(comparePrices(33666, 24396)).toEqual({ cheaper: "tcgplayer", diffCents: 9270, diffPct: 28 });
    expect(comparePrices(20000, 25000)).toEqual({ cheaper: "liga", diffCents: 5000, diffPct: 20 });
    expect(comparePrices(1000, 1000).cheaper).toBeNull();
  });

  it("monta o link e o texto da Liga", () => {
    expect(ligaCardUrl("Kai'Sa - Survivor (Alternate Art)")).toBe("https://www.ligariftbound.com.br/?view=cards/card&card=Kai'Sa%20-%20Survivor");
    expect(discountLabel("liga", 10)).toBe("10% abaixo da Liga");
    expect(discountLabel("tcgplayer", 0)).toBe("Preço do TCGplayer");
  });
});

describe("validação do anúncio e da oferta", () => {
  const base = { kind: "sell", cardName: "Kai'Sa - Survivor", condition: "nm", quantity: "1" };

  it("guarda a base, o desconto e a Liga", () => {
    const v = listingSchema.parse({ ...base, price: "302,99", priceBase: "liga", priceBaseCents: "33666", discountPct: "10", ligaPrice: "336,66", ligaLanguage: "en", ligaCondition: "nm", acceptsOffers: "on", minOffer: "250" });
    expect(v).toMatchObject({ price: 30299, priceBase: "liga", priceBaseCents: 33666, discountPct: 10, ligaPrice: 33666, ligaLanguage: "en", acceptsOffers: true, minOffer: 25000 });
  });

  it("campos de preço vazios viram null", () => {
    const v = listingSchema.parse({ ...base, price: "", priceBase: "", ligaPrice: "", minOffer: "" });
    expect(v).toMatchObject({ price: null, priceBase: null, ligaPrice: null, minOffer: null, acceptsOffers: false });
  });

  it("recusa desconto absurdo e preço da Liga inválido", () => {
    expect(listingSchema.safeParse({ ...base, discountPct: "95" }).success).toBe(false);
    expect(listingSchema.safeParse({ ...base, ligaPrice: "barato" }).success).toBe(false);
  });

  it("oferta precisa de valor", () => {
    const listingId = "00000000-0000-4000-8000-500000000001";
    expect(offerSchema.parse({ listingId, amount: "75,00", message: "" })).toEqual({ listingId, amount: 7500, cards: [], message: null });
    expect(offerSchema.safeParse({ listingId, amount: "" }).success).toBe(false);
    expect(offerSchema.safeParse({ listingId, amount: "0" }).success).toBe(false);
  });
});
