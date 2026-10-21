import { describe, expect, it } from "vitest";
import { isPublicPath } from "@/lib/supabase/proxy";

describe("rotas abertas para visitante", () => {
  it("abre a vitrine do mercado", () => {
    expect(isPublicPath("/mercado")).toBe(true);
    expect(isPublicPath("/mercado/00000000-0000-4000-8000-500000000001")).toBe(true);
  });

  it("pede login para anunciar, editar e o resto do app", () => {
    for (const path of ["/mercado/novo", "/mercado/abc/editar", "/mensagens", "/mensagens/a/b", "/", "/arena", "/perfil", "/mercadox"]) {
      expect(isPublicPath(path), path).toBe(false);
    }
  });

  it("mantém as telas de autenticação abertas", () => {
    expect(isPublicPath("/entrar")).toBe(true);
    expect(isPublicPath("/auth/confirm")).toBe(true);
  });
});
