"use server";

// Sugestão de melhoria/ideia vira issue no repositório do app.
// O token do GitHub fica só no servidor (variável da Vercel), nunca no navegador.

import { suggestionIssue } from "@/lib/domain/suggestion";
import { formToObject, zodErrorState, type ActionState } from "@/lib/validation/common";
import { suggestionSchema } from "@/lib/validation/schemas";
import { requireSession } from "../session";
import { demoBlocked } from "./helpers";

const REPO = process.env.GITHUB_REPO || "Kauecsilva/Riftzada";

// shortcut: sem limite por usuário; só membros logados enviam. Se aparecer spam, guardar envios no banco e limitar por dia.
export async function createSuggestion(_prev: ActionState, form: FormData): Promise<ActionState> {
  const session = await requireSession();
  const blocked = demoBlocked();
  if (blocked) return blocked;

  const parsed = suggestionSchema.safeParse(formToObject(form));
  if (!parsed.success) return zodErrorState(parsed.error);

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("[sugestão] GITHUB_TOKEN não configurado");
    return { ok: false, message: "As sugestões ainda não estão ligadas. Avisa a organização do grupo." };
  }

  const issue = suggestionIssue(parsed.data, session.profile);
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(issue),
    });
    if (!res.ok) {
      console.error("[sugestão] GitHub", res.status, (await res.text()).slice(0, 200));
      return { ok: false, message: "Não deu para enviar agora. Tenta de novo?" };
    }
  } catch (e) {
    console.error("[sugestão]", (e as Error).message);
    return { ok: false, message: "Não deu para enviar agora. Tenta de novo?" };
  }
  return { ok: true, message: "Valeu! Sua sugestão chegou para quem cuida do app." };
}
