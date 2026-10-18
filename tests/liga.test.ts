import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isChallenge, ligaPrices, parseLigaPage } from "@/lib/domain/liga";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

describe("página da carta na Liga", () => {
  it("lê o menor preço da impressão certa, com idioma e condição da oferta mais barata", () => {
    const page = parseLigaPage(fixture("liga-kaisa-ogn.html"))!;
    const items = ligaPrices(page, [
      { id: "base", setCode: "OGN", collectorNo: "039", alternateArt: false },
      { id: "arte", setCode: "OGN", collectorNo: "39", alternateArt: true },
      { id: "outra", setCode: "VEN", collectorNo: "1", alternateArt: false },
    ]);
    expect(items).toEqual([
      { card_id: "base", finish: "normal", low_cents: 33666, avg_cents: 37231, high_cents: 39990, language: "en", condition: "nm" },
    ]);
  });

  it("separa normal e foil, e só a versão mais barata leva idioma e condição", () => {
    const page = parseLigaPage(fixture("liga-kaisa-sp1.html"))!;
    const items = ligaPrices(page, [{ id: "sp1", setCode: "VEN", collectorNo: "SP1", alternateArt: false }]);
    expect(items).toEqual([
      { card_id: "sp1", finish: "normal", low_cents: 45000, avg_cents: 52500, high_cents: 60000, language: null, condition: null },
      { card_id: "sp1", finish: "foil", low_cents: 39495, avg_cents: 43270, high_cents: 49990, language: "en", condition: "nm" },
    ]);
  });

  it("reconhece página sem carta e o desafio da Cloudflare", () => {
    expect(parseLigaPage("<html>nada</html>")).toBeNull();
    expect(isChallenge("<title>Just a moment...</title>")).toBe(true);
    expect(isChallenge(fixture("liga-kaisa-sp1.html"))).toBe(false);
  });
});
