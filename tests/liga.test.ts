import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isChallenge, ligaSetPrices, parseLigaSet } from "@/lib/domain/liga";

const html = readFileSync(new URL("./fixtures/liga-set.html", import.meta.url), "utf8");
const card = (id: string, setCode: string, collectorNo: string, name: string) => ({ id, setCode, collectorNo, name });
const lows = (targets: ReturnType<typeof card>[]) =>
  Object.fromEntries(ligaSetPrices(parseLigaSet(html)!, targets).map((i) => [i.card_id, i.low_cents]));

describe("página da coleção na Liga", () => {
  it("lê menor, médio e maior preço da impressão certa", () => {
    expect(ligaSetPrices(parseLigaSet(html)!, [card("base", "OGN", "39", "Kai'Sa - Survivor")])).toEqual([
      { card_id: "base", finish: "normal", low_cents: 33666, avg_cents: 37231, high_cents: 39990, language: null, condition: null },
    ]);
  });

  it("separa arte alternativa, overnumbered e assinada do mesmo nome", () => {
    expect(
      lows([
        card("aa", "OGN", "39", "Kai'Sa - Survivor (Alternate Art)"),
        card("comum", "OGN", "247", "Kai'Sa - Daughter of the Void"),
        card("over", "OGN", "299", "Kai'Sa - Daughter of the Void (Overnumbered)"),
        card("assinada", "OGN", "299", "Kai'Sa - Daughter of the Void (Signature)"),
      ]),
    ).toEqual({ aa: 34975, comum: 224, over: 64899, assinada: 3000000 });
  });

  it("desempata pelo nome quando o número se repete e aceita nome sem o campeão", () => {
    expect(
      lows([
        card("sp1", "VEN", "1", "Kai'Sa, Survivor"),
        card("runa", "VEN", "1", "Fury Rune"),
        card("comum", "VEN", "1", "Baccai Sandspinner"),
        card("zed", "VEN", "191", "Master of Shadows"),
      ]),
    ).toEqual({ sp1: 39495, runa: 19, comum: 5, zed: 54600 });
  });

  it("ignora carta sem preço, de outra coleção ou que a Liga não tem", () => {
    expect(
      lows([
        card("sem-preco", "VEN", "189", "Akali - Rogue Assassin (Signature)"),
        card("outra", "SFD", "39", "Kai'Sa - Survivor"),
        card("nao-tem", "OGN", "5", "Carta Inventada"),
      ]),
    ).toEqual({});
  });

  it("reconhece página sem coleção e o desafio da Cloudflare", () => {
    expect(parseLigaSet("<html>nada</html>")).toBeNull();
    expect(isChallenge("<title>Just a moment...</title>")).toBe(true);
    expect(isChallenge(html)).toBe(false);
  });
});
