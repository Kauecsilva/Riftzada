"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Store, Swords } from "lucide-react";
import { cn } from "@/lib/cn";
import { Field, fieldProps } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { signUp } from "@/server/actions/auth";
import { initialActionState } from "@/lib/validation/common";

const KINDS = [
  { value: "player", label: "Jogador", text: "Joga, posta e anuncia cartas", icon: Swords },
  { value: "store", label: "Loja", text: "Divulga eventos e semanais", icon: Store },
] as const;

export function SignUpForm() {
  const [state, action] = useActionState(signUp, initialActionState);
  const [kind, setKind] = useState<"player" | "store">("player");
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
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="mb-2 text-sm font-semibold">Tipo de conta</legend>
        {KINDS.map((k) => (
          <label key={k.value} className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors has-focus-visible:outline-3 has-focus-visible:outline-rift-strong",
            kind === k.value ? "border-rift bg-rift-soft" : "border-line bg-surface-2 hover:bg-surface-3")}>
            <input type="radio" name="accountKind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="sr-only" />
            <k.icon size={22} className="shrink-0 text-rift-strong" aria-hidden />
            <span>
              <span className="block text-sm font-semibold">{k.label}</span>
              <span className="block text-xs text-muted">{k.text}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {kind === "store" && <p className="text-sm text-muted">Depois do cadastro, você preenche os dados da loja e a organização aprova antes dos eventos irem ao ar.</p>}
      <Field label={kind === "store" ? "Apelido da loja" : "Apelido"} name="username" error={err.username} hint="É como a galera te vê na Riftzada. Letras, números e _.">
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
