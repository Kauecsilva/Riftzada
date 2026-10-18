import { describe, expect, it } from "vitest";
import { suggestionIssue } from "@/lib/domain/suggestion";
import { suggestionSchema } from "@/lib/validation/schemas";

const author = { username: "kaue", displayName: "Kauê" };

describe("sugestão → issue", () => {
  it("monta título com o tipo e corpo com o autor", () => {
    const issue = suggestionIssue({ kind: "idea", title: "Filtro por coleção", details: "No mercado" }, author);
    expect(issue.title).toBe("[Ideia] Filtro por coleção");
    expect(issue.body).toContain("No mercado");
    expect(issue.body).toContain("Kauê (kaue)");
  });

  it("não deixa marcar ninguém no GitHub", () => {
    const issue = suggestionIssue({ kind: "improvement", title: "fala @admin", details: "cc @org/time" }, author);
    expect(issue.title).not.toMatch(/@[a-z]/);
    expect(issue.body).not.toMatch(/@[a-z]/);
  });

  it("aceita sem detalhes e recusa título curto", () => {
    expect(suggestionSchema.parse({ kind: "idea", title: "Modo escuro", details: "" }).details).toBeNull();
    expect(suggestionIssue({ kind: "idea", title: "Modo escuro", details: null }, author).body).toContain("Sem detalhes");
    expect(suggestionSchema.safeParse({ kind: "idea", title: "oi" }).success).toBe(false);
    expect(suggestionSchema.safeParse({ kind: "bug", title: "Modo escuro" }).success).toBe(false);
  });
});
