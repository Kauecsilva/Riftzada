import { describe, expect, it } from "vitest";
import { countCards, formatDecklist, parseDecklist } from "@/lib/domain/decklist";

describe("parseDecklist", () => {
  it("entende seções, formatos de quantidade e junta repetidas", () => {
    const parsed = parseDecklist(`Legend:
1 Jinx, Loose Cannon

3 Get Excited!
2x Flame Chompers
Flame Chompers x1
Runes: 6 Fury Rune
6 Chaos Rune
Sideboard:
2 Charm`);
    expect(parsed.errors).toEqual([]);
    expect(parsed.legend).toBe("Jinx, Loose Cannon");
    expect(parsed.cards).toContainEqual({ name: "Flame Chompers", quantity: 3, section: "main" });
    expect(countCards(parsed.cards, "runes")).toBe(12);
    expect(countCards(parsed.cards, "side")).toBe(2);
  });

  it("aponta a linha que não entendeu", () => {
    expect(parseDecklist("3 Get Excited!\nsó texto").errors[0]).toMatch(/Linha 2/);
  });

  it("volta ao mesmo texto ao formatar e ler de novo", () => {
    const first = parseDecklist("Legend:\n1 Ahri\nMain:\n3 Charm\nRunes:\n6 Calm Rune");
    const again = parseDecklist(formatDecklist(first.legend, first.cards));
    expect(again).toEqual(first);
  });
});
