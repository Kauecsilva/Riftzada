import { describe, expect, it } from "vitest";
import { groupMatches, matchRows, parseCsv, publicCode, readCollectionCsv, type CatalogCard } from "@/lib/domain/collection-import";

// Mesmo cabeçalho da exportação da LigaRiftbound (com BOM)
const LIGA = `﻿"Edicao (PTBR)","Edicao (EN)","Edicao (Sigla)","Card (PT)","Card (EN)",Quantidade,"Qualidade (M NM SP MP HP D)","Idioma (BR EN DE ES FR IT JP KO RU TW)",Raridade,"Cor (C D O E Y F R G L M P W)",Extras,"Card #",Comentario,"# Cards na Edicao"
,Origins,OGN,,"Blazing Scorcher",2,NM,EN,C,F,,1,,
,Origins,OGN,,"Sett - Brawler (Alternate Art)",1,NM,EN,AA,B,,164A,,
,Origins,OGN,,"Kai'Sa - Survivor",1,SP,BR,E,F,,39,,
,"Riftbound Organized Play Promotional Cards",ROPP,,"Consult the Past",1,NM,EN,P,M,,83,,
,Spiritforged,SFD,,Riposte,1,NM,EN,E,C,Foil,206,,
,Spiritforged,SFD,,"Seal of Rage (Overnumbered)",1,NM,EN,S,F,Foil,222,,
,Origins,OGN,,"Carta Inventada",1,NM,EN,C,F,,999,,
,Origins,OGN,,"Blazing Scorcher",1,NM,EN,C,F,,1,,
`;

const card = (id: string, name: string, set: string, no: string, flags: Partial<Pick<CatalogCard, "is_alternate_art" | "is_overnumbered" | "is_signature">> = {}): CatalogCard => ({
  id, name, set_code: set, collector_no: no, is_alternate_art: false, is_overnumbered: false, is_signature: false, ...flags,
});

const CATALOG: CatalogCard[] = [
  card("scorcher", "Blazing Scorcher", "OGN", "1"),
  card("scorcher-promo", "Blazing Scorcher", "OPP", "1"),
  card("sett", "Sett - Brawler", "OGN", "164"),
  card("sett-aa", "Sett - Brawler (Alternate Art)", "OGN", "164", { is_alternate_art: true }),
  card("kaisa", "Kai'Sa - Survivor", "OGN", "39"),
  card("kaisa-aa", "Kai'Sa - Survivor (Alternate Art)", "OGN", "39", { is_alternate_art: true }),
  card("consult", "Consult the Past", "OGN", "83"),
  card("consult-promo", "Consult the Past", "OPP", "83"),
  card("riposte", "Riposte", "SFD", "206"),
  card("seal-over", "Seal of Rage (Overnumbered)", "SFD", "222", { is_overnumbered: true }),
];

describe("CSV", () => {
  it("lida com aspas, vírgula dentro de aspas e BOM", () => {
    expect(parseCsv('﻿a,b\n"x, y","diz ""oi"""\n')).toEqual([["a", "b"], ["x, y", 'diz "oi"']]);
  });

  it("aceita ponto e vírgula", () => {
    expect(parseCsv("nome;qtd\r\nJinx;2\r\n")).toEqual([["nome", "qtd"], ["Jinx", "2"]]);
  });
});

describe("exportação da LigaRiftbound", () => {
  const read = readCollectionCsv(LIGA);
  if ("error" in read) throw new Error(read.error);

  it("reconhece o formato e lê as linhas", () => {
    expect(read.format).toBe("ligariftbound");
    expect(read.rows).toHaveLength(8);
    expect(read.rows[1]).toMatchObject({ name: "Sett - Brawler (Alternate Art)", setCode: "OGN", number: "164", suffix: "A" });
  });

  it("converte qualidade, idioma e foil", () => {
    expect(read.rows[2]).toMatchObject({ condition: "lp", variant: "BR" });
    expect(read.rows[4]).toMatchObject({ condition: "nm", variant: "Foil" });
  });

  it("monta o código do catálogo, com a sigla de promo trocada", () => {
    expect(publicCode(read.rows[0])).toBe("OGN-001");
    expect(publicCode(read.rows[3])).toBe("OPP-083");
  });

  it("casa por edição + número e acerta a variante", () => {
    const { matched, unmatched } = matchRows(read.rows, CATALOG);
    expect(matched.map((m) => m.cardId)).toEqual(["scorcher", "sett-aa", "kaisa", "consult-promo", "riposte", "seal-over", "scorcher"]);
    expect(unmatched.map((r) => r.name)).toEqual(["Carta Inventada"]);
  });

  it("soma linhas repetidas da mesma carta", () => {
    const groups = groupMatches(matchRows(read.rows, CATALOG).matched);
    expect(groups.find((g) => g.cardId === "scorcher")?.quantity).toBe(3);
  });
});

describe("formato genérico", () => {
  it("lê nome, edição, número e quantidade em inglês", () => {
    const read = readCollectionCsv("Name,Set Code,Collector Number,Quantity,Foil\nRiposte,SFD,206,2,true\n");
    if ("error" in read) throw new Error(read.error);
    expect(read.format).toBe("generico");
    expect(read.rows[0]).toMatchObject({ name: "Riposte", setCode: "SFD", number: "206", quantity: 2, variant: "Foil" });
    expect(matchRows(read.rows, CATALOG).matched[0].cardId).toBe("riposte");
  });

  it("casa só pelo nome quando não há dúvida", () => {
    const read = readCollectionCsv("nome,quantidade\nRiposte,1\nConsult the Past,1\n");
    if ("error" in read) throw new Error(read.error);
    const { matched, unmatched } = matchRows(read.rows, CATALOG);
    expect(matched.map((m) => m.cardId)).toEqual(["riposte"]);
    expect(unmatched.map((r) => r.name)).toEqual(["Consult the Past"]);
  });

  it("recusa arquivo sem nome ou quantidade", () => {
    expect(readCollectionCsv("foo,bar\n1,2\n")).toHaveProperty("error");
  });
});
