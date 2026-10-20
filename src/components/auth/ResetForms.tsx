"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, fieldProps } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requestPasswordReset, updatePassword } from "@/server/actions/auth";
import { initialActionState } from "@/lib/validation/common";

export function ResetRequestForm() {
  const [state, action] = useActionState(requestPasswordReset, initialActionState);
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <p className="text-sm text-muted">Manda teu e-mail que a gente envia um link para criar uma senha nova.</p>
      <Field label="E-mail" name="email" error={err.email}>
        <input {...fieldProps("email", err.email)} type="email" autoComplete="email" inputMode="email" required className="input" />
      </Field>
      <FormMessage state={state} />
      {!state.ok && <SubmitButton pendingLabel="Enviando…">Enviar link</SubmitButton>}
      <p className="text-center text-sm">
        <Link href="/entrar" className="inline-flex min-h-11 items-center text-muted hover:text-ink">Voltar para o login</Link>
      </p>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState(updatePassword, initialActionState);
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Nova senha" name="password" error={err.password} hint="Pelo menos 8 caracteres.">
        <input {...fieldProps("password", err.password, "hint")} type="password" autoComplete="new-password" minLength={8} required className="input" />
      </Field>
      <Field label="Repete a senha" name="confirm" error={err.confirm}>
        <input {...fieldProps("confirm", err.confirm)} type="password" autoComplete="new-password" required className="input" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton>Salvar nova senha</SubmitButton>
    </form>
  );
}
