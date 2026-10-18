"use client";

import { useActionState, useState } from "react";
import { Lightbulb, Wrench } from "lucide-react";
import { Field, fieldProps } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn } from "@/lib/cn";
import { initialActionState } from "@/lib/validation/common";
import { createSuggestion } from "@/server/actions/suggestions";

const KINDS = [
  { value: "improvement", label: "Melhoria", text: "Algo que já existe pode ficar melhor", icon: Wrench },
  { value: "idea", label: "Ideia nova", text: "Algo que o app ainda não tem", icon: Lightbulb },
] as const;

export function SuggestionForm() {
  const [state, action] = useActionState(createSuggestion, initialActionState);
  const [kind, setKind] = useState<"improvement" | "idea">("improvement");
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="sr-only">Tipo de sugestão</legend>
        {KINDS.map((k) => (
          <label key={k.value} className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors has-focus-visible:outline-3 has-focus-visible:outline-rift-strong",
            kind === k.value ? "border-rift bg-rift-soft" : "border-line bg-surface-2 hover:bg-surface-3")}>
            <input type="radio" name="kind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="sr-only" />
            <k.icon size={22} className="text-rift-strong" aria-hidden />
            <span>
              <span className="block text-sm font-semibold">{k.label}</span>
              <span className="block text-xs text-muted">{k.text}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <Field label="Em uma frase" name="title" error={err.title}>
        <input {...fieldProps("title", err.title)} required minLength={5} maxLength={100} className="input" placeholder="Filtrar o mercado por coleção" />
      </Field>

      <Field label="Detalhes" name="details" error={err.details} optional hint="Como você usaria, onde ficaria, o que te incomoda hoje.">
        <textarea {...fieldProps("details", err.details, "hint")} maxLength={3000} className="input min-h-32" />
      </Field>

      <FormMessage state={state} />
      <SubmitButton pendingLabel="Enviando…">Enviar sugestão</SubmitButton>
    </form>
  );
}
