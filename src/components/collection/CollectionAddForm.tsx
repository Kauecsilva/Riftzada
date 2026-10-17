"use client";

import { useActionState, useState } from "react";
import { CardPicker } from "@/components/cards/CardPicker";
import { Field, fieldProps } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { CONDITION } from "@/lib/domain/labels";
import { initialActionState, type ActionState } from "@/lib/validation/common";
import { addCollectionItem } from "@/server/actions/collection";
import type { CardCondition } from "@/types/domain";

/** Busca a carta no catálogo e registra na coleção. Depois de salvar, limpa para a próxima. */
export function CollectionAddForm() {
  // Cada carta salva troca a key do formulário, que volta vazio
  const [round, setRound] = useState(0);
  const [state, action] = useActionState(async (prev: ActionState, form: FormData) => {
    const result = await addCollectionItem(prev, form);
    if (result.ok) setRound((r) => r + 1);
    return result;
  }, initialActionState);
  const err = state.fieldErrors ?? {};

  return (
    <form key={round} action={action} className="card space-y-4 p-4" noValidate>
      <Field label="Carta" name="cardName" error={err.cardId}>
        <CardPicker error={err.cardId} />
      </Field>
      <div className="grid grid-cols-[88px_1fr] gap-3 sm:grid-cols-[88px_1fr_1fr]">
        <Field label="Qtd." name="quantity" error={err.quantity}>
          <input {...fieldProps("quantity", err.quantity)} type="number" inputMode="numeric" min={1} max={999} defaultValue={1} className="input" />
        </Field>
        <Field label="Condição" name="condition" error={err.condition}>
          <select {...fieldProps("condition", err.condition)} defaultValue="nm" className="input">
            {(Object.keys(CONDITION) as CardCondition[]).map((c) => <option key={c} value={c}>{CONDITION[c].short} · {CONDITION[c].label}</option>)}
          </select>
        </Field>
        <Field label="Variante" name="variant" error={err.variant} optional className="col-span-2 sm:col-span-1">
          <input {...fieldProps("variant", err.variant)} maxLength={40} className="input" placeholder="Foil, Showcase…" />
        </Field>
      </div>
      <FormMessage state={state} />
      <SubmitButton size="md" pendingLabel="Adicionando…">Adicionar à coleção</SubmitButton>
    </form>
  );
}
