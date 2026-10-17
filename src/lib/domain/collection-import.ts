// Importação de coleção a partir de CSV exportado de outros sites.
// Regras puras (sem banco): ler o CSV, reconhecer o formato e casar cada linha com o catálogo.

import type { CardCondition } from "@/types/domain";

export type ImportRow = {
  line: number;
  name: string;
  setCode: string | null;
  setName: string | null;
  /** Número da carta sem a letra (ex.: "164" de "164A"). */
  number: string | null;
  /** Letra depois do número: na LigaRiftbound, "A" = arte alternativa. */
  suffix: string;
  quantity: number;
  condition: CardCondition;
  variant: string | null;
};

export type ImportFormat = "ligariftbound" | "generico";

export type CatalogCard = {
  id: string;
  name: string;
  set_code: string | null;
  collector_no: string | null;
  is_alternate_art: boolean;
  is_overnumbered: boolean;
  is_signature: boolean;
};

// ---------- CSV ----------

/** CSV com aspas, vírgula ou ponto e vírgula, e quebra de linha dentro de aspas. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.slice(0, src.indexOf("\n") === -1 ? undefined : src.indexOf("\n"));
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

// ---------- Formatos ----------

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Qualidade da LigaRiftbound (M NM SP MP HP D) e siglas comuns em inglês. */
const CONDITIONS: Record<string, CardCondition> = {
  m: "nm", nm: "nm", mint: "nm", "near mint": "nm",
  sp: "lp", lp: "lp", ex: "lp", "lightly played": "lp", "slightly played": "lp",
  mp: "mp", "moderately played": "mp", pl: "mp",
  hp: "hp", "heavily played": "hp",
  d: "damaged", dmg: "damaged", damaged: "damaged", po: "damaged",
};

function column(headers: string[], ...names: string[]): number {
  const h = headers.map(norm);
  for (const name of names) {
    const i = h.indexOf(norm(name));
    if (i !== -1) return i;
  }
  return -1;
}

/** Reconhece a exportação pelo cabeçalho e transforma cada linha em ImportRow. */
export function readCollectionCsv(text: string): { format: ImportFormat; rows: ImportRow[]; skipped: number[] } | { error: string } {
  const table = parseCsv(text);
  if (table.length < 2) return { error: "O arquivo está vazio ou não é um CSV." };
  const headers = table[0];

  const liga = column(headers, "Card (EN)") !== -1 && column(headers, "Edicao (Sigla)") !== -1;
  const col = liga
    ? {
        name: column(headers, "Card (EN)"),
        setCode: column(headers, "Edicao (Sigla)"),
        setName: column(headers, "Edicao (EN)"),
        number: column(headers, "Card #"),
        quantity: column(headers, "Quantidade"),
        condition: column(headers, "Qualidade (M NM SP MP HP D)"),
        language: column(headers, "Idioma (BR EN DE ES FR IT JP KO RU TW)"),
        extras: column(headers, "Extras"),
      }
    : {
        name: column(headers, "name", "card name", "card", "nome", "carta"),
        setCode: column(headers, "set code", "set", "set_code", "edition code", "sigla"),
        setName: column(headers, "set name", "edition", "expansion", "edicao", "expansao"),
        number: column(headers, "collector number", "card number", "number", "collector_number", "numero", "#"),
        quantity: column(headers, "quantity", "qty", "count", "amount", "quantidade", "qtd"),
        condition: column(headers, "condition", "condicao", "qualidade"),
        language: column(headers, "language", "idioma"),
        extras: column(headers, "foil", "finish", "printing", "extras"),
      };
  if (col.name === -1 || col.quantity === -1) {
    return { error: "Não reconheci o formato. Precisa ter pelo menos as colunas de nome da carta e quantidade." };
  }

  const get = (cells: string[], i: number) => (i === -1 ? "" : (cells[i] ?? "").trim());
  const rows: ImportRow[] = [];
  const skipped: number[] = [];
  table.slice(1).forEach((cells, index) => {
    const line = index + 2;
    const name = get(cells, col.name);
    const quantity = Number.parseInt(get(cells, col.quantity) || "1", 10);
    if (!name || !Number.isFinite(quantity) || quantity < 1) {
      skipped.push(line);
      return;
    }
    const numberMatch = get(cells, col.number).match(/^0*(\d+)\s*([a-z*]*)$/i);
    const extras = norm(get(cells, col.extras));
    const language = get(cells, col.language).toUpperCase();
    const variant = [
      extras && extras !== "normal" && extras !== "non-foil" && extras !== "false" ? (extras === "true" || extras.includes("foil") ? "Foil" : get(cells, col.extras)) : null,
      language && language !== "EN" ? language : null,
    ].filter(Boolean).join(" ");
    rows.push({
      line,
      name,
      setCode: get(cells, col.setCode).toUpperCase() || null,
      setName: get(cells, col.setName) || null,
      number: numberMatch ? numberMatch[1] : null,
      suffix: numberMatch ? numberMatch[2].toUpperCase() : "",
      quantity: Math.min(quantity, 999),
      condition: CONDITIONS[norm(get(cells, col.condition))] ?? "nm",
      variant: variant ? variant.slice(0, 40) : null,
    });
  });
  return { format: liga ? "ligariftbound" : "generico", rows, skipped };
}

// ---------- Casamento com o catálogo ----------

/** Siglas que outros sites usam diferente do catálogo (Riftcodex). */
export const SET_ALIASES: Record<string, string> = { ROPP: "OPP" };

export const catalogSetCode = (code: string) => SET_ALIASES[code] ?? code;

/** Código público do catálogo para a linha (ex.: "OGN-007"). */
export function publicCode(row: ImportRow): string | null {
  if (!row.setCode || !row.number) return null;
  return `${catalogSetCode(row.setCode)}-${row.number.padStart(3, "0")}`;
}

const baseName = (name: string) => norm(name.replace(/\s*\([^)]*\)\s*$/, ""));

function flags(row: ImportRow) {
  const n = norm(row.name);
  return {
    alt: row.suffix === "A" || n.includes("(alternate art)"),
    over: n.includes("(overnumbered)"),
    sig: row.suffix === "*" || n.includes("(signature)"),
  };
}

/**
 * Casa cada linha com uma carta do catálogo:
 * 1. edição + número, escolhendo pelo nome exato ou pela variante (arte alternativa etc.);
 * 2. se não der, nome exato no catálogo todo (só quando não há dúvida).
 */
export function matchRows(rows: ImportRow[], catalog: CatalogCard[]): { matched: { row: ImportRow; cardId: string }[]; unmatched: ImportRow[] } {
  const bySetNumber = new Map<string, CatalogCard[]>();
  const byName = new Map<string, CatalogCard[]>();
  for (const card of catalog) {
    if (card.set_code && card.collector_no) {
      const key = `${card.set_code}|${card.collector_no.replace(/^0+/, "")}`;
      bySetNumber.set(key, [...(bySetNumber.get(key) ?? []), card]);
    }
    byName.set(norm(card.name), [...(byName.get(norm(card.name)) ?? []), card]);
  }

  const matched: { row: ImportRow; cardId: string }[] = [];
  const unmatched: ImportRow[] = [];
  for (const row of rows) {
    const f = flags(row);
    const sameFlags = (c: CatalogCard) => c.is_alternate_art === f.alt && c.is_overnumbered === f.over && c.is_signature === f.sig;
    let card: CatalogCard | undefined;

    const candidates = row.setCode && row.number ? bySetNumber.get(`${catalogSetCode(row.setCode)}|${row.number}`) ?? [] : [];
    card = candidates.find((c) => norm(c.name) === norm(row.name));
    if (!card) {
      const variants = candidates.filter(sameFlags);
      card = variants.find((c) => baseName(c.name) === baseName(row.name)) ?? (variants.length === 1 ? variants[0] : undefined);
    }
    if (!card) {
      const named = byName.get(norm(row.name)) ?? [];
      const inSet = named.filter((c) => row.setCode && c.set_code === catalogSetCode(row.setCode));
      card = inSet.length === 1 ? inSet[0] : named.length === 1 ? named[0] : undefined;
    }

    if (card) matched.push({ row, cardId: card.id });
    else unmatched.push(row);
  }
  return { matched, unmatched };
}

/** Junta linhas repetidas (mesma carta, condição e variante) somando as quantidades. */
export function groupMatches(matched: { row: ImportRow; cardId: string }[]) {
  const groups = new Map<string, { cardId: string; condition: CardCondition; variant: string | null; quantity: number }>();
  for (const { row, cardId } of matched) {
    const key = `${cardId}|${row.condition}|${row.variant ?? ""}`;
    const current = groups.get(key);
    if (current) current.quantity = Math.min(999, current.quantity + row.quantity);
    else groups.set(key, { cardId, condition: row.condition, variant: row.variant, quantity: row.quantity });
  }
  return [...groups.values()];
}
