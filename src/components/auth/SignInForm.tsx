"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, fieldProps } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { signIn } from "@/server/actions/auth";
import { initialActionState } from "@/lib/validation/common";

export function SignInForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signIn, initialActionState);
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? "/"} />
      <Field label="E-mail" name="email" error={err.email}>
        <input {...fieldProps("email", err.email)} type="email" autoComplete="email" inputMode="email" required className="input" />
      </Field>
      <Field label="Senha" name="password" error={err.password}>
        <input {...fieldProps("password", err.password)} type="password" autoComplete="current-password" required className="input" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Entrando…">Entrar na Riftzada</SubmitButton>
      <div className="flex justify-between text-sm">
        <Link href="/esqueci-senha" className="text-muted hover:text-ink">Esqueci a senha</Link>
        <Link href="/cadastro" className="font-semibold text-rift-strong hover:underline">Criar conta</Link>
      </div>
    </form>
  );
}
