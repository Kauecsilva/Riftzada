import "server-only";
import { DEMO_MESSAGE, isDemoMode } from "@/lib/env";
import type { ActionState } from "@/lib/validation/common";

/** No modo demonstração nada é salvo: as ações respondem com um aviso. */
export function demoBlocked(): ActionState | null {
  return isDemoMode ? { ok: false, message: DEMO_MESSAGE } : null;
}

/** Erro do banco vira mensagem amigável; o detalhe fica só no log do servidor. */
export function dbError(error: { message: string; code?: string } | null, fallback = "Não deu para salvar. Tenta de novo?"): ActionState {
  if (error) console.error("[db]", error.code, error.message);
  if (error?.code === "42501") return { ok: false, message: "Você não tem permissão para isso." };
  if (error?.code === "23505") return { ok: false, message: "Isso já existe." };
  return { ok: false, message: fallback };
}
