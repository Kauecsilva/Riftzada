import { describe, expect, it } from "vitest";
import {
  applyDiscount, centsToInput, cheapestBase, discountLabel, ligaCardUrl, parseBrl, pickTcgPrice, tcgBrlCents, usdToBrlCents,
} from "@/lib/domain/pricing";
import { listingSchema, offerSchema } from "@/lib/validation/schemas";
import type { CardPrice } from "@/types/domain";

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
    expect(pickTcgPrice([normal, foil], "Foil")).toBe(foil);
    expect(pickTcgPrice([normal, foil], null)).toBe(normal);
    expect(pickTcgPrice([foil], "")).toBe(foil);
    expect(pickTcgPrice([], "Foil")).toBeNull();
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
    expect(offerSchema.parse({ listingId, amount: "75,00", message: "" })).toEqual({ listingId, amount: 7500, message: null });
    expect(offerSchema.safeParse({ listingId, amount: "" }).success).toBe(false);
    expect(offerSchema.safeParse({ listingId, amount: "0" }).success).toBe(false);
  });
});
