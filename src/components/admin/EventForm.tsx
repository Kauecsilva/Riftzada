"use client";

import { useActionState } from "react";
import { Field, fieldProps } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { ImageInput } from "@/components/ui/ImageInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EVENT_STATUS } from "@/lib/domain/labels";
import { toLocalInput } from "@/lib/format";
import { initialActionState } from "@/lib/validation/common";
import { saveEvent } from "@/server/actions/admin";
import { saveStoreEvent } from "@/server/actions/stores";
import type { EventStatus, EventSummary, Store } from "@/types/domain";

/** Formulário de evento do painel e das lojas. A loja não finaliza evento (resultado é do admin) e pode repetir toda semana. */
export function EventForm({ userId, event, suggestedName, store }: { userId: string; event?: EventSummary; suggestedName?: string; store?: Store }) {
  const [state, action] = useActionState(store ? saveStoreEvent : saveEvent, initialActionState);
  const err = state.fieldErrors ?? {};
  const statuses = (Object.keys(EVENT_STATUS) as EventStatus[]).filter((s) => !store || s !== "finished");
  return (
    <form action={action} className="space-y-5" noValidate>
      {event && <input type="hidden" name="id" value={event.id} />}
      {store && <input type="hidden" name="storeId" value={store.id} />}
      <Field label="Nome" name="name" error={err.name}>
        <input {...fieldProps("name", err.name)} defaultValue={event?.name ?? suggestedName} required maxLength={80} className="input" placeholder={store ? "Semanal de Riftbound" : "Riftbound Weekly #23"} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Data e horário" name="startsAt" error={err.startsAt}>
          <input {...fieldProps("startsAt", err.startsAt)} type="datetime-local" defaultValue={event ? toLocalInput(event.startsAt) : undefined} required className="input" />
        </Field>
        <Field label="Local" name="location" error={err.location}>
          <input {...fieldProps("location", err.location)} defaultValue={event?.location ?? (store ? store.address ?? store.name : "X1 Arena Cards")} required maxLength={80} className="input" />
        </Field>
      </div>
      {store && !event && (
        <fieldset className="card space-y-3 p-4">
          <label className="flex items-center gap-3 font-semibold">
            <input type="checkbox" name="repeatWeekly" className="size-5 accent-rift" />
            Repetir toda semana
          </label>
          <Field label="Por quantas semanas" name="weeks" error={err.weeks} hint="Cada semana vira uma data com o próprio “Vou jogar”. Dá para estender depois.">
            <select {...fieldProps("weeks", err.weeks, "hint")} defaultValue="8" className="input">
              {[4, 8, 12].map((n) => <option key={n} value={n}>{n} semanas</option>)}
            </select>
          </Field>
        </fieldset>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Formato" name="format" error={err.format} optional>
          <input {...fieldProps("format", err.format)} defaultValue={event?.format ?? "Constructed Bo1"} maxLength={40} className="input" />
        </Field>
        <Field label="Limite de jogadores" name="maxPlayers" error={err.maxPlayers} optional>
          <input {...fieldProps("maxPlayers", err.maxPlayers)} type="number" min={2} inputMode="numeric" defaultValue={event?.maxPlayers ?? ""} className="input" placeholder="16" />
        </Field>
        <Field label="Status" name="status">
          <select {...fieldProps("status")} defaultValue={event?.status ?? "scheduled"} className="input">
            {statuses.map((s) => <option key={s} value={s}>{EVENT_STATUS[s]}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Descrição" name="description" error={err.description} optional>
        <textarea {...fieldProps("description", err.description)} defaultValue={event?.description ?? ""} maxLength={1000} className="input" placeholder="Rodadas, premiação, horário de check-in…" />
      </Field>
      <Field label="Link de inscrição externa" name="signupUrl" error={err.signupUrl} optional>
        <input {...fieldProps("signupUrl", err.signupUrl)} type="url" defaultValue={event?.signupUrl ?? ""} className="input" placeholder="https://…" />
      </Field>
      <Field label="Imagem de capa" name="imagePath" optional>
        <ImageInput name="imagePath" folder="events" userId={userId} initialUrl={event?.imageUrl} label="Capa" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton>{event ? "Salvar evento" : "Criar evento"}</SubmitButton>
    </form>
  );
}
