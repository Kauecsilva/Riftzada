// Preço sugerido do anúncio: a LigaRiftbound é o padrão e o TCGplayer (convertido para real) entra quando a
// Liga não tem preço, com desconto opcional. Regras puras, usadas no formulário, no anúncio e na coleção.

import type { CardPrice, LigaLanguage, LigaPrice, OfferStatus, PriceBase, PriceReference } from "@/types/domain";

export const LIGA_LANGUAGE: Record<LigaLanguage, string> = {
  en: "Inglês (americana)",
  zh: "Chinês",
  pt: "Português",
  other: "Outro idioma",
};

export const PRICE_BASE: Record<PriceBase, string> = { liga: "Liga", tcgplayer: "TCGplayer" };

/** Preço da Liga que a coleta não renovou numa semana (carta sem oferta na Liga) não vale mais. */
export const LIGA_MAX_AGE_MS = 7 * 86_400_000;

/**
 * Anúncio pela regra cujo preço ficou longe do que a regra dá hoje: diferença de pelo menos 20% do preço de hoje
 * e de pelo menos R$ 2. Quem decide é public.price_drifted (migration 0018); aqui só para o texto.
 */
export const PRICE_DRIFT = { pct: 20, minCents: 200 } as const;

/** Quanto o preço de hoje pela regra está acima (+) ou abaixo (−) do anunciado, em %. */
export function driftPct(priceCents: number, expectedCents: number): number {
  return Math.round(((expectedCents - priceCents) / priceCents) * 100);
}

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
export function pickFinish<T extends Pick<CardPrice, "finish">>(prices: T[], variant: string | null | undefined): T | null {
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

/** A Liga é a base padrão; o TCGplayer só entra quando a Liga não tem preço. */
export function defaultBase(bases: Partial<Record<PriceBase, number | null>>): PriceBase | null {
  return (Object.keys(PRICE_BASE) as PriceBase[]).find((key) => (bases[key] ?? 0) > 0) ?? null;
}

/** Preço de uma cópia na base padrão (Liga; sem Liga, TCGplayer em reais), no acabamento da variante. */
export function referencePrice(ref: PriceReference | undefined, variant: string | null | undefined): { base: PriceBase; cents: number } | null {
  if (!ref) return null;
  const bases: Record<PriceBase, number | null> = {
    liga: pickFinish(ref.liga, variant)?.lowCents ?? null,
    tcgplayer: tcgBrlCents(pickFinish(ref.tcgplayer, variant), ref.usdBrl),
  };
  const base = defaultBase(bases);
  return base ? { base, cents: bases[base]! } : null;
}

/**
 * Preço do anúncio na venda em massa: base escolhida (sem preço nela, usa a outra) com o desconto.
 * Devolve também o menor preço da Liga, que o anúncio guarda como referência.
 */
export function bulkListingPrice(
  ref: PriceReference | undefined, variant: string | null | undefined, preset: { base: PriceBase; discountPct: number },
): { base: PriceBase; baseCents: number; cents: number; liga: LigaPrice | null } | null {
  if (!ref) return null;
  const liga = pickFinish(ref.liga, variant);
  const bases: Record<PriceBase, number | null> = { liga: liga?.lowCents ?? null, tcgplayer: tcgBrlCents(pickFinish(ref.tcgplayer, variant), ref.usdBrl) };
  const base = (bases[preset.base] ?? 0) > 0 ? preset.base : defaultBase(bases);
  if (!base) return null;
  const baseCents = bases[base]!;
  return { base, baseCents, cents: applyDiscount(baseCents, preset.discountPct), liga };
}

/** Valor da coleção: preço padrão de cada carta vezes as cópias. Conta as cópias sem preço à parte. */
export function collectionValue(
  items: { cardId: string; variant: string | null; quantity: number }[],
  refs: Record<string, PriceReference>,
): { totalCents: number; pricedCopies: number; unpricedCopies: number } {
  let totalCents = 0, pricedCopies = 0, unpricedCopies = 0;
  for (const item of items) {
    const price = referencePrice(refs[item.cardId], item.variant);
    if (price) {
      totalCents += price.cents * item.quantity;
      pricedCopies += item.quantity;
    } else unpricedCopies += item.quantity;
  }
  return { totalCents, pricedCopies, unpricedCopies };
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

export type PriceComparison = { cheaper: PriceBase; diffCents: number; diffPct: number } | { cheaper: null; diffCents: 0; diffPct: 0 };

/** Quem está mais barato e por quanto (a % é sobre o preço mais caro). */
export function comparePrices(ligaCents: number, tcgCents: number): PriceComparison {
  if (ligaCents === tcgCents) return { cheaper: null, diffCents: 0, diffPct: 0 };
  const cheaper: PriceBase = ligaCents < tcgCents ? "liga" : "tcgplayer";
  const high = Math.max(ligaCents, tcgCents);
  const diffCents = high - Math.min(ligaCents, tcgCents);
  return { cheaper, diffCents, diffPct: Math.round((diffCents / high) * 100) };
}
