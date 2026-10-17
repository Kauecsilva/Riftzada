"use client";

import { useActionState, useState } from "react";
import { MessageSquare, Sparkles } from "lucide-react";
import { Field, fieldProps } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { ImageInput } from "@/components/ui/ImageInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn } from "@/lib/cn";
import { initialActionState } from "@/lib/validation/common";
import { createPost } from "@/server/actions/content";

const KINDS = [
  { value: "general", label: "Resenha", text: "Foto, testing, história", icon: MessageSquare },
  { value: "pull", label: "Pull da semana", text: "Abriu carta boa?", icon: Sparkles },
] as const;

export function NewPostForm({ userId }: { userId: string }) {
  const [state, action] = useActionState(createPost, initialActionState);
  const [kind, setKind] = useState<"general" | "pull">("general");
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="sr-only">Tipo de post</legend>
        {KINDS.map((k) => (
          <label key={k.value} className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors has-focus-visible:outline-3 has-focus-visible:outline-rift-strong",
            kind === k.value ? (k.value === "pull" ? "border-gold/60 bg-gold-soft" : "border-rift bg-rift-soft") : "border-line bg-surface-2 hover:bg-surface-3")}>
            <input type="radio" name="kind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="sr-only" />
            <k.icon size={22} className={k.value === "pull" ? "text-gold" : "text-rift-strong"} aria-hidden />
            <span>
              <span className="block text-sm font-semibold">{k.label}</span>
              <span className="block text-xs text-muted">{k.text}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <Field label={kind === "pull" ? "Conta como foi" : "O que rolou?"} name="body" error={err.body}>
        <textarea {...fieldProps("body", err.body)} maxLength={2000} className="input" placeholder={kind === "pull" ? "Abri um booster e veio…" : "Rolou testing hoje antes do torneio…"} />
      </Field>

      <Field label="Fotos" name="images" error={err.images} optional hint="Até 4. A gente reduz o tamanho antes de enviar.">
        <ImageInput name="images" folder="posts" userId={userId} max={4} />
      </Field>

      <FormMessage state={state} />
      <SubmitButton pendingLabel="Publicando…">Publicar no mural</SubmitButton>
    </form>
  );
}
