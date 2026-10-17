"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, fieldProps } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { signUp } from "@/server/actions/auth";
import { initialActionState } from "@/lib/validation/common";

export function SignUpForm() {
  const [state, action] = useActionState(signUp, initialActionState);
  const err = state.fieldErrors ?? {};
  if (state.ok) {
    return (
      <div className="space-y-4 text-center">
        <FormMessage state={state} />
        <Link href="/entrar" className="text-sm font-semibold text-rift-strong hover:underline">Voltar para o login</Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Como a galera te chama?" name="displayName" error={err.displayName}>
        <input {...fieldProps("displayName", err.displayName)} autoComplete="name" maxLength={40} required className="input" placeholder="Kauê" />
      </Field>
      <Field label="Apelido" name="username" error={err.username} hint="Vai no teu link: riftzada.app/jogador/apelido">
        <input {...fieldProps("username", err.username, "hint")} autoComplete="username" maxLength={20} required pattern="[a-zA-Z0-9_]{3,20}" className="input lowercase" placeholder="kaue" />
      </Field>
      <Field label="E-mail" name="email" error={err.email} hint="Ninguém da comunidade vê teu e-mail.">
        <input {...fieldProps("email", err.email, "hint")} type="email" autoComplete="email" inputMode="email" required className="input" />
      </Field>
      <Field label="Senha" name="password" error={err.password} hint="Pelo menos 8 caracteres.">
        <input {...fieldProps("password", err.password, "hint")} type="password" autoComplete="new-password" minLength={8} required className="input" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Criando…">Criar conta</SubmitButton>
      <p className="text-center text-sm text-muted">
        Já tem conta? <Link href="/entrar" className="font-semibold text-rift-strong hover:underline">Entrar</Link>
      </p>
    </form>
  );
}
