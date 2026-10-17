// Preço sugerido do anúncio: menor valor entre a LigaRiftbound e o TCGplayer (convertido para real),
// com desconto opcional. Regras puras, usadas no formulário e na página do anúncio.

import type { CardPrice, LigaLanguage, OfferStatus, PriceBase } from "@/types/domain";

export const LIGA_LANGUAGE: Record<LigaLanguage, string> = {
  en: "Inglês (americana)",
  zh: "Chinês",
  pt: "Português",
  other: "Outro idioma",
};

export const PRICE_BASE: Record<PriceBase, string> = { liga: "Liga", tcgplayer: "TCGplayer" };

export const DISCOUNT_STEPS = [0, 5, 10, 15, 20] as const;

export const OFFER_STATUS: Record<OfferStatus, string> = {
  pending: "Aguardando o vendedor",
  countered: "Contraproposta",
  accepted: "Aceita",
  declined: "Recusada",
  withdrawn: "Retirada",
};

/** "1.200,50", "R$ 12,5" ou "12.5" → centavos. Vazio → null; inválido → NaN. */
export function parseBrl(text: string | null | undefined): number | null {
  // Com vírgula, o ponto é milhar (pt-BR)
  let clean = (text ?? "").trim().replace(/[R$\s]/g, "");
  if (clean.includes(",")) clean = clean.replace(/\./g, "").replace(",", ".");
  if (!clean) return null;
  const value = Number(clean);
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000) return Number.NaN;
  return Math.round(value * 100);
}

/** Centavos → texto do campo de preço ("120,00"). */
export function centsToInput(cents: number | null | undefined): string {
  return cents == null ? "" : (cents / 100).toFixed(2).replace(".", ",");
}

export function usdToBrlCents(usdCents: number, rate: number): number {
  return Math.round(usdCents * rate);
}

export function applyDiscount(cents: number, pct: number): number {
  return Math.round((cents * (100 - pct)) / 100);
}

/** Preço do acabamento certo: foil se a variante diz "foil"; senão normal; senão o que tiver. */
export function pickTcgPrice(prices: CardPrice[], variant: string | null | undefined): CardPrice | null {
  const wanted = /foil/i.test(variant ?? "") ? "foil" : "normal";
  return prices.find((p) => p.finish === wanted) ?? prices[0] ?? null;
}

/** Menor anúncio do TCGplayer em reais (cai para o preço de mercado se não tiver anúncio). */
export function tcgBrlCents(price: CardPrice | null, rate: number | null): number | null {
  const usd = price?.lowCents ?? price?.marketCents ?? null;
  return usd != null && rate ? usdToBrlCents(usd, rate) : null;
}

/** A base sugerida é a mais barata entre as que existem. */
export function cheapestBase(bases: Partial<Record<PriceBase, number | null>>): PriceBase | null {
  let best: PriceBase | null = null;
  for (const key of Object.keys(PRICE_BASE) as PriceBase[]) {
    const value = bases[key];
    if (value != null && value > 0 && (best == null || value < bases[best]!)) best = key;
  }
  return best;
}

/** Página da carta na LigaRiftbound. A Liga não tem as variações "(Alternate Art)" no nome. */
export function ligaCardUrl(cardName: string): string {
  const name = cardName.replace(/\s*\([^)]*\)$/, "");
  return `https://www.ligariftbound.com.br/?view=cards/card&card=${encodeURIComponent(name)}`;
}

/** "10% abaixo da Liga", "Preço da Liga" */
export function discountLabel(base: PriceBase, pct: number | null): string {
  return pct ? `${pct}% abaixo ${base === "liga" ? "da Liga" : "do TCGplayer"}` : `Preço ${base === "liga" ? "da Liga" : "do TCGplayer"}`;
}
