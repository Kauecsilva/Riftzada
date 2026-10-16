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
import type { EventStatus, EventSummary } from "@/types/domain";

export function EventForm({ userId, event, suggestedName }: { userId: string; event?: EventSummary; suggestedName?: string }) {
  const [state, action] = useActionState(saveEvent, initialActionState);
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      {event && <input type="hidden" name="id" value={event.id} />}
      <Field label="Nome" name="name" error={err.name}>
        <input {...fieldProps("name", err.name)} defaultValue={event?.name ?? suggestedName} required maxLength={80} className="input" placeholder="Riftbound Weekly #23" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Data e horário" name="startsAt" error={err.startsAt}>
          <input {...fieldProps("startsAt", err.startsAt)} type="datetime-local" defaultValue={event ? toLocalInput(event.startsAt) : undefined} required className="input" />
        </Field>
        <Field label="Local" name="location" error={err.location}>
          <input {...fieldProps("location", err.location)} defaultValue={event?.location ?? "X1 Arena Cards"} required maxLength={80} className="input" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Formato" name="format" error={err.format} optional>
          <input {...fieldProps("format", err.format)} defaultValue={event?.format ?? "Constructed Bo1"} maxLength={40} className="input" />
        </Field>
        <Field label="Limite de jogadores" name="maxPlayers" error={err.maxPlayers} optional>
          <input {...fieldProps("maxPlayers", err.maxPlayers)} type="number" min={2} inputMode="numeric" defaultValue={event?.maxPlayers ?? ""} className="input" placeholder="16" />
        </Field>
        <Field label="Status" name="status">
          <select {...fieldProps("status")} defaultValue={event?.status ?? "scheduled"} className="input">
            {(Object.keys(EVENT_STATUS) as EventStatus[]).map((s) => <option key={s} value={s}>{EVENT_STATUS[s]}</option>)}
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
