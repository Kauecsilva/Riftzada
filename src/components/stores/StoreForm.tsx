"use client";

import { useActionState } from "react";
import { Field, fieldProps } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { initialActionState } from "@/lib/validation/common";
import { saveStore } from "@/server/actions/stores";
import type { Store } from "@/types/domain";

export function StoreForm({ store }: { store?: Store }) {
  const [state, action] = useActionState(saveStore, initialActionState);
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      {store && <input type="hidden" name="id" value={store.id} />}
      <Field label="Nome da loja" name="name" error={err.name}>
        <input {...fieldProps("name", err.name)} defaultValue={store?.name} required maxLength={60} className="input" placeholder="Toca do Rift" />
      </Field>
      <Field label="Endereço" name="address" error={err.address} optional hint="Vira o local padrão dos seus eventos.">
        <input {...fieldProps("address", err.address, "hint")} defaultValue={store?.address ?? ""} maxLength={120} className="input" placeholder="Rua, número, bairro" />
      </Field>
      <Field label="Instagram" name="instagram" error={err.instagram} optional>
        <input {...fieldProps("instagram", err.instagram)} defaultValue={store?.instagram ?? ""} maxLength={80} className="input" placeholder="@sualoja" />
      </Field>
      <Field label="Sobre a loja" name="description" error={err.description} optional>
        <textarea {...fieldProps("description", err.description)} defaultValue={store?.description ?? ""} maxLength={500} className="input" placeholder="Horários, mesas livres, o que tem para vender…" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton>{store ? "Salvar loja" : "Enviar para aprovação"}</SubmitButton>
    </form>
  );
}
