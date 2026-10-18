"use server";

import { redirect } from "next/navigation";
import { SITE_URL } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { formToObject, zodErrorState, type ActionState } from "@/lib/validation/common";
import { newPasswordSchema, resetRequestSchema, signInSchema, signUpSchema } from "@/lib/validation/schemas";
import { demoBlocked } from "./helpers";

/** Só aceita voltar para caminhos internos (evita redirecionamento aberto). */
function safeNext(next: string | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function signIn(_: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const parsed = signInSchema.safeParse(formToObject(form));
  if (!parsed.success) return zodErrorState(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) {
    if (error.code === "email_not_confirmed") return { ok: false, message: "Confirma teu e-mail primeiro (olha a caixa de spam também)." };
    return { ok: false, message: "E-mail ou senha não conferem." };
  }
  redirect(safeNext(parsed.data.next));
}

export async function signUp(_: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const parsed = signUpSchema.safeParse(formToObject(form));
  if (!parsed.success) return zodErrorState(parsed.error);
  const { displayName, username, email, password } = parsed.data;

  const supabase = await createClient();
  const { data: available } = await supabase.rpc("username_available", { name: username });
  if (available === false) return { ok: false, message: "Esse apelido já tem dono.", fieldErrors: { username: "Esse apelido já tem dono." } };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, display_name: displayName }, emailRedirectTo: `${SITE_URL}/auth/confirm` },
  });
  if (error) {
    console.error("[auth] signUp", error.code, error.message);
    if (error.code === "weak_password") return { ok: false, message: "Senha fraca demais. Tenta uma mais longa." };
    if (error.code === "over_email_send_rate_limit") {
      return { ok: false, message: "Muita gente se cadastrando agora e o envio de e-mails travou. Tenta de novo daqui a uma hora." };
    }
    return { ok: false, message: "Não deu para criar a conta agora. Tenta de novo em instantes." };
  }
  // Sem confirmação de e-mail ligada no Supabase, o cadastro já volta com sessão: entra direto
  if (data.session) redirect("/?bemvindo=1");
  // Mesma resposta se o e-mail já existir: não revela quem tem conta
  return { ok: true, message: "Conta criada! Enviamos um link de confirmação para o teu e-mail." };
}

export async function requestPasswordReset(_: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const parsed = resetRequestSchema.safeParse(formToObject(form));
  if (!parsed.success) return zodErrorState(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/auth/confirm?next=/redefinir-senha`,
  });
  if (error) console.error("[auth] reset", error.code, error.message);
  return { ok: true, message: "Se esse e-mail tiver conta, o link para criar uma nova senha já está a caminho." };
}

export async function updatePassword(_: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const parsed = newPasswordSchema.safeParse(formToObject(form));
  if (!parsed.success) return zodErrorState(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    console.error("[auth] updatePassword", error.code, error.message);
    if (error.code === "same_password") return { ok: false, message: "A nova senha precisa ser diferente da atual." };
    return { ok: false, message: "O link expirou. Pede um novo em \"Esqueci a senha\"." };
  }
  redirect("/?senha=ok");
}
