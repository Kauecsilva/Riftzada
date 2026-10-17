// Lista de deck em texto <-> linhas estruturadas.
// Aceita o formato que a galera cola do app/planilha:
//   "3 Jinx, Loose Cannon" ou "3x Jinx" ou "Jinx x3"
// Cabeçalhos ("Runes:", "Battlefields:", "Sideboard:", "Legend:") mudam a seção.

import type { DeckCardLine, DeckSection } from "@/types/domain";

const SECTION_HEADERS: Record<string, DeckSection | "legend"> = {
  main: "main",
  "main deck": "main",
  deck: "main",
  champion: "main",
  "chosen champion": "main",
  runes: "runes",
  rune: "runes",
  "rune deck": "runes",
  battlefields: "battlefields",
  battlefield: "battlefields",
  side: "side",
  sideboard: "side",
  legend: "legend",
  lenda: "legend",
};

export type ParsedDecklist = { legend: string | null; cards: DeckCardLine[]; errors: string[] };

export function parseDecklist(text: string): ParsedDecklist {
  let section: DeckSection | "legend" = "main";
  let legend: string | null = null;
  const merged = new Map<string, DeckCardLine>();
  const errors: string[] = [];

  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    let line = raw.trim();
    if (!line || line.startsWith("//") || line.startsWith("#")) continue;

    // Cabeçalho de seção, com ou sem carta na mesma linha ("Runes: 6 Fury Rune")
    const header = line.match(/^([a-zA-Zçã ]+):\s*(.*)$/);
    const headerSection = header && SECTION_HEADERS[header[1].trim().toLowerCase()];
    if (headerSection) {
      section = headerSection;
      line = header[2].trim();
      if (!line) continue;
    }

    if (section === "legend") {
      legend = line.replace(/^\d+\s*x?\s+/i, "");
      section = "main";
      continue;
    }

    addLine(line, section, index, merged, errors);
  }

  return { legend, cards: [...merged.values()], errors };
}

function addLine(line: string, section: DeckSection, index: number, merged: Map<string, DeckCardLine>, errors: string[]) {
  const match = line.match(/^(\d{1,2})\s*x?\s+(.+)$/i) ?? line.match(/^(.+?)\s+x\s?(\d{1,2})$/i);
  if (!match) {
    errors.push(`Linha ${index + 1}: não entendi "${line}". Use "3 Nome da carta".`);
    return;
  }
  const [quantity, name] = /^\d/.test(match[1]) ? [Number(match[1]), match[2]] : [Number(match[2]), match[1]];
  if (quantity < 1) {
    errors.push(`Linha ${index + 1}: quantidade inválida.`);
    return;
  }
  mergeCard(merged, { name: name.trim(), quantity, section });
}

function mergeCard(merged: Map<string, DeckCardLine>, card: DeckCardLine) {
  const key = `${card.section}:${card.name.toLowerCase()}`;
  const existing = merged.get(key);
  if (existing) existing.quantity += card.quantity;
  else merged.set(key, { ...card });
}

const SECTION_TITLES: Record<DeckSection, string> = {
  main: "Main",
  runes: "Runes",
  battlefields: "Battlefields",
  side: "Sideboard",
};

export function sectionTitle(section: DeckSection): string {
  return SECTION_TITLES[section];
}

/** Texto pronto para copiar e colar em outro app. */
export function formatDecklist(legend: string | null, cards: DeckCardLine[]): string {
  const blocks: string[] = [];
  if (legend) blocks.push(`Legend:\n1 ${legend}`);
  for (const section of Object.keys(SECTION_TITLES) as DeckSection[]) {
    const lines = cards.filter((c) => c.section === section);
    if (lines.length) blocks.push(`${SECTION_TITLES[section]}:\n${lines.map((c) => `${c.quantity} ${c.name}`).join("\n")}`);
  }
  return blocks.join("\n\n");
}

export function countCards(cards: DeckCardLine[], section: DeckSection = "main"): number {
  return cards.filter((c) => c.section === section).reduce((sum, c) => sum + c.quantity, 0);
}
