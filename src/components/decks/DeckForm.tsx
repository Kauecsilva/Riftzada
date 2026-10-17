"use client";

import { useActionState } from "react";
import { Field, fieldProps } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { initialActionState } from "@/lib/validation/common";
import { createDeck } from "@/server/actions/content";
import type { EventSummary, Legend } from "@/types/domain";

const PLACEHOLDER = `Legend:
1 Jinx, Loose Cannon

Main:
3 Get Excited!
3 Flame Chompers

Runes:
6 Fury Rune
6 Chaos Rune

Battlefields:
1 Zaun Warrens`;

export function DeckForm({ legends, events }: { legends: Legend[]; events: EventSummary[] }) {
  const [state, action] = useActionState(createDeck, initialActionState);
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <Field label="Nome do deck" name="name" error={err.name}>
        <input {...fieldProps("name", err.name)} required maxLength={60} className="input" placeholder="Jinx Aggro" />
      </Field>
      <Field label="Lenda" name="legendId" error={err.legendId} optional>
        <select {...fieldProps("legendId", err.legendId)} className="input" defaultValue="">
          <option value="">Escolhe a lenda</option>
          {legends.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </Field>
      <Field label="Lista" name="decklist" error={err.decklist} hint="Uma carta por linha: quantidade e nome. Seções com Main:, Runes:, Battlefields:, Sideboard:.">
        <textarea {...fieldProps("decklist", err.decklist, "hint")} required rows={12} className="input font-mono text-sm" placeholder={PLACEHOLDER} />
      </Field>
      <Field label="Sobre o deck" name="description" error={err.description} optional>
        <textarea {...fieldProps("description", err.description)} maxLength={2000} className="input" placeholder="Plano de jogo, mulligan, matchups…" />
      </Field>

      <details className="card p-4">
        <summary className="cursor-pointer text-sm font-semibold">Levou para algum torneio?</summary>
        <div className="mt-4 space-y-4">
          <Field label="Evento" name="eventId" optional>
            <select {...fieldProps("eventId")} className="input" defaultValue="">
              <option value="">Nenhum</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Record" name="record" error={err.record} optional>
              <input {...fieldProps("record", err.record)} className="input" placeholder="4-1" />
            </Field>
            <Field label="Colocação" name="placement" error={err.placement} optional>
              <input {...fieldProps("placement", err.placement)} type="number" min={1} inputMode="numeric" className="input" placeholder="2" />
            </Field>
          </div>
        </div>
      </details>

      <Field label="Quem pode ver" name="visibility">
        <select {...fieldProps("visibility")} className="input" defaultValue="public">
          <option value="public">Todo mundo da Riftzada</option>
          <option value="unlisted">Só quem tiver o link</option>
          <option value="private">Só eu</option>
        </select>
      </Field>
      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-line bg-surface-2 px-4">
        <input type="checkbox" name="shareOnFeed" defaultChecked className="size-5 accent-rift" />
        <span className="text-sm font-medium">Avisar a galera no mural</span>
      </label>

      <FormMessage state={state} />
      <SubmitButton pendingLabel="Publicando…">Publicar deck</SubmitButton>
    </form>
  );
}
