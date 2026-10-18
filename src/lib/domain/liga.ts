// Leitura da página de uma carta na LigaRiftbound (usada pelo script scripts/liga-sync.mts, que roda
// no computador de alguém, porque a Liga bloqueia acesso vindo de servidor).
//
// A página traz JSON embutido em variáveis JS:
//   cards_editions: uma entrada por impressão (code = set, num = número) com price por versão:
//                   "0" normal, "2" foil, "3" arte alternativa; p = menor, m = médio, g = maior.
//   cards_stock:    as ofertas das lojas, já em ordem de preço (p = posição), com idioma e qualid.
//                   O preço de cada oferta vem ofuscado (sprite CSS), por isso usamos o resumo acima.
// Sem import de runtime de "@/": o script roda direto no Node.

import type { CardCondition, LigaLanguage } from "@/types/domain";

type PriceBlock = { p?: string; m?: string; g?: string };
export type LigaEdition = { id: number | string; code: string; num: string; price?: Record<string, PriceBlock | unknown[]> };
export type LigaStock = { p: number; idEdicao: string | number; num: string; qualid: string | number; idioma: string | number };
export type LigaPage = { editions: LigaEdition[]; stock: LigaStock[] };

/** Carta do nosso catálogo a procurar na página (o nome base é o da página). */
export type LigaTarget = { id: string; setCode: string | null; collectorNo: string | null; alternateArt: boolean };

export type LigaPriceItem = {
  card_id: string;
  finish: "normal" | "foil";
  low_cents: number;
  avg_cents: number | null;
  high_cents: number | null;
  language: LigaLanguage | null;
  condition: CardCondition | null;
};

const LANGUAGE: Record<string, LigaLanguage> = { "2": "en", "10": "zh", "8": "pt", "11": "pt" };
const CONDITION: Record<string, CardCondition> = { "1": "nm", "2": "nm", "3": "lp", "4": "mp", "5": "hp", "6": "damaged" };

function jsonVar<T>(html: string, name: string): T | null {
  const match = html.match(new RegExp(`var ${name}\\s*=\\s*(\\[.*?\\]);`, "s"));
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as T;
  } catch {
    return null;
  }
}

/** Página de desafio da Cloudflare em vez da carta. */
export function isChallenge(html: string): boolean {
  return /Just a moment|cf-chl|challenge-form/i.test(html) && !html.includes("cards_editions");
}

/** null quando a página não é de carta (nome não achado ou layout mudou). */
export function parseLigaPage(html: string): LigaPage | null {
  const editions = jsonVar<LigaEdition[]>(html, "cards_editions");
  if (!editions) return null;
  return { editions, stock: jsonVar<LigaStock[]>(html, "cards_stock") ?? [] };
}

const cents = (text: string | undefined) => {
  const value = Math.round(Number(text) * 100);
  return Number.isFinite(value) && value > 0 ? value : null;
};
/** "039", "39" e "SP1" comparados sem zeros à esquerda e sem caixa. */
const sameNum = (a: string | null, b: string) => (a ?? "").replace(/^0+/, "").toLowerCase() === b.replace(/^0+/, "").toLowerCase();

/**
 * Menor preço de cada carta pedida que existe na página. Idioma e condição são os da oferta mais barata
 * da impressão, então só vão para a versão (normal/foil/arte) que tem esse menor preço.
 */
export function ligaPrices(page: LigaPage, targets: LigaTarget[]): LigaPriceItem[] {
  const items: LigaPriceItem[] = [];
  for (const target of targets) {
    const edition = page.editions.find((e) => e.code?.toUpperCase() === target.setCode?.toUpperCase() && sameNum(target.collectorNo, e.num));
    if (!edition?.price) continue;
    const keys: [string, LigaPriceItem["finish"]][] = target.alternateArt ? [["3", "normal"]] : [["0", "normal"], ["2", "foil"]];
    const found = keys.flatMap(([key, finish]) => {
      const block = edition.price![key];
      const low = block && !Array.isArray(block) ? cents((block as PriceBlock).p) : null;
      if (!low) return [];
      const b = block as PriceBlock;
      return [{ card_id: target.id, finish, low_cents: low, avg_cents: cents(b.m), high_cents: cents(b.g), language: null, condition: null } as LigaPriceItem];
    });
    // A oferta mais barata da impressão é a do menor preço entre todas as versões dela
    const allLows = Object.values(edition.price).flatMap((b) => (b && !Array.isArray(b) ? [cents((b as PriceBlock).p)] : [])).filter((v): v is number => v != null);
    const cheapestOverall = Math.min(...allLows);
    const cheapestOffer = page.stock
      .filter((s) => String(s.idEdicao) === String(edition.id) && s.num === edition.num)
      .sort((a, b) => a.p - b.p)[0];
    for (const item of found) {
      if (cheapestOffer && item.low_cents === cheapestOverall) {
        item.language = LANGUAGE[String(cheapestOffer.idioma)] ?? "other";
        item.condition = CONDITION[String(cheapestOffer.qualid)] ?? null;
      }
      items.push(item);
    }
  }
  return items;
}
