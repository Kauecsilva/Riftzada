// Leitura da página de uma coleção na LigaRiftbound (?view=cards/search&card=ed=OGN), usada pela
// coleta diária em src/server/liga-sync.ts.
//
// A página traz a variável JS `cardsjson`: uma entrada por impressão da coleção, com
//   sSigla (coleção), sN (número: "39", "39A" arte alternativa, "299S"/"189*" assinada, "SP1", "R01"),
//   nEN ("Kai'Sa - Survivor (Alternate Art) (39A)") e p1a/p1b/p1c = menor, médio e maior preço,
//   já juntando todas as versões (normal e foil) da impressão.

import type { CardCondition, LigaLanguage } from "@/types/domain";

export type LigaSetEntry = { sSigla: string; sN: string; nEN: string; p1a?: string; p1b?: string; p1c?: string };

/** Carta do nosso catálogo a procurar na coleção. */
export type LigaTarget = { id: string; name: string; setCode: string | null; collectorNo: string | null };

export type LigaPriceItem = {
  card_id: string;
  finish: "normal" | "foil";
  low_cents: number;
  avg_cents: number | null;
  high_cents: number | null;
  language: LigaLanguage | null;
  condition: CardCondition | null;
};

/** Página de desafio da Cloudflare em vez da coleção. */
export function isChallenge(html: string): boolean {
  return /Just a moment|cf-chl|challenge-form/i.test(html) && !html.includes("cardsjson");
}

/** null quando a página não é de coleção (sigla desconhecida ou layout mudou). */
export function parseLigaSet(html: string): LigaSetEntry[] | null {
  const match = html.match(/var cardsjson\s*=\s*(\[.*?\]);/s);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as LigaSetEntry[];
  } catch {
    return null;
  }
}

const cents = (text: string | undefined) => {
  const value = Math.round(Number(text) * 100);
  return Number.isFinite(value) && value > 0 ? value : null;
};
const digits = (text: string | null) => (text ?? "").replace(/\D/g, "").replace(/^0+/, "");
const baseName = (name: string) => name.replace(/(\s*\([^)]*\))+$/, "").toLowerCase();
const kind = (name: string) => (/\(Alternate Art\)/i.test(name) ? "aa" : /\(Signature\)/i.test(name) ? "sig" : "");
/** Nomes iguais ou um terminando no outro ("Zed - Master of Shadows" e "Master of Shadows"). */
const sameName = (a: string, b: string) => a === b || a.endsWith(b) || b.endsWith(a);

/**
 * Menor preço de cada carta na coleção. Casa por coleção + número + tipo (comum, arte alternativa ou
 * assinada); se ainda sobrar mais de uma (SP1, R01 e a carta 1 têm o mesmo número no nosso catálogo),
 * desempata pelo nome. Overnumbered entra como comum: a Liga às vezes marca, às vezes não.
 * Como a Liga junta normal e foil nesse resumo, tudo vai como "normal" e sem idioma/condição.
 */
export function ligaSetPrices(entries: LigaSetEntry[], targets: LigaTarget[]): LigaPriceItem[] {
  return targets.flatMap((target) => {
    const candidates = entries.filter(
      (e) => e.sSigla.toUpperCase() === target.setCode?.toUpperCase() && digits(e.sN) === digits(target.collectorNo) && kind(e.nEN) === kind(target.name),
    );
    const named = candidates.filter((e) => sameName(baseName(e.nEN), baseName(target.name)));
    const entry = candidates.length === 1 ? candidates[0] : named.length === 1 ? named[0] : undefined;
    const low = cents(entry?.p1a);
    if (!entry || !low) return [];
    return [{ card_id: target.id, finish: "normal", low_cents: low, avg_cents: cents(entry.p1b), high_cents: cents(entry.p1c), language: null, condition: null }];
  });
}
