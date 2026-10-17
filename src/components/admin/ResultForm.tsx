"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Field, fieldProps } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { ImageInput } from "@/components/ui/ImageInput";
import { PlacementBadge } from "@/components/ui/PlacementBadge";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { buttonClass } from "@/components/ui/button";
import { initialActionState } from "@/lib/validation/common";
import { saveResults } from "@/server/actions/admin";
import type { EventDetail, Legend, Member } from "@/types/domain";

const GUEST = "__guest";

type Row = { player: string; guest: string; legend: string; record: string };

function initialRows(event: EventDetail): Row[] {
  const rows = event.results.map((r) => ({
    player: r.player.kind === "member" ? r.player.profile.id : GUEST,
    guest: r.player.kind === "guest" ? r.player.name : "",
    legend: r.legend?.id ?? "",
    record: r.record ?? "",
  }));
  while (rows.length < 4) rows.push({ player: "", guest: "", legend: "", record: "" });
  return rows;
}

/** Registro do resultado: quem jogou + top 4 (ou mais). Alimenta ranking, Hall e perfis. */
export function ResultForm({ event, members, legends, userId }: { event: EventDetail; members: Member[]; legends: Legend[]; userId: string }) {
  const [state, action] = useActionState(saveResults, initialActionState);
  const [rows, setRows] = useState<Row[]>(() => initialRows(event));
  const confirmed = new Set(event.participants.map((p) => p.id));
  const update = (i: number, change: Partial<Row>) => setRows((list) => list.map((r, j) => (j === i ? { ...r, ...change } : r)));
  const active = members.filter((m) => !m.isBanned);

  return (
    <form action={action} className="space-y-8" noValidate>
      <input type="hidden" name="eventId" value={event.id} />
      <input type="hidden" name="slots" value={rows.length} />

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">Colocações</h2>
        {rows.map((row, i) => (
          <fieldset key={i} className="card space-y-3 p-4">
            <legend className="sr-only">{i + 1}º lugar</legend>
            <input type="hidden" name={`placement_${i}`} value={i + 1} />
            <div className="flex items-center gap-3">
              <PlacementBadge placement={i + 1} size={36} />
              <select
                aria-label={`Jogador em ${i + 1}º`}
                name={row.player === GUEST ? undefined : `user_${i}`}
                value={row.player}
                onChange={(e) => update(i, { player: e.target.value })}
                className="input flex-1"
              >
                <option value="">Ninguém</option>
                {active.map((m) => <option key={m.id} value={m.id}>{m.displayName} (@{m.username})</option>)}
                <option value={GUEST}>Jogador sem conta…</option>
              </select>
            </div>
            {row.player === GUEST && (
              <input name={`guest_${i}`} aria-label="Nome do jogador sem conta" value={row.guest} onChange={(e) => update(i, { guest: e.target.value })} maxLength={40} className="input" placeholder="Nome do jogador" />
            )}
            <div className="grid grid-cols-[1fr_96px] gap-2">
              <select aria-label="Lenda" name={`legend_${i}`} value={row.legend} onChange={(e) => update(i, { legend: e.target.value })} className="input">
                <option value="">Lenda</option>
                {legends.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <input aria-label="Record" name={`record_${i}`} value={row.record} onChange={(e) => update(i, { record: e.target.value })} className="input" placeholder="4-1" />
            </div>
          </fieldset>
        ))}
        {rows.length < 16 && (
          <button type="button" onClick={() => setRows((r) => [...r, { player: "", guest: "", legend: "", record: "" }])} className={buttonClass("secondary", "md")}>
            <Plus size={16} aria-hidden /> Adicionar colocação
          </button>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">Quem jogou</h2>
        <p className="text-sm text-muted">Conta presença e pontos de participação. Quem disse “vou jogar” já vem marcado.</p>
        <ul className="card grid max-h-80 gap-1 overflow-y-auto p-2 sm:grid-cols-2">
          {active.map((m) => (
            <li key={m.id}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 hover:bg-surface-2">
                <input type="checkbox" name="played" value={m.id} defaultChecked={confirmed.has(m.id)} className="size-5 accent-rift" />
                <span className="text-sm font-medium">{m.displayName}</span>
              </label>
            </li>
          ))}
        </ul>
        <Field label="Total de jogadores" name="playerCount" hint="Inclui quem não tem conta. Vazio = conta automática." optional>
          <input {...fieldProps("playerCount", undefined, "hint")} type="number" min={0} inputMode="numeric" defaultValue={event.playerCount ?? ""} className="input max-w-40" />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold">Foto e recado</h2>
        <Field label="Foto do pódio" name="imagePath" optional>
          <ImageInput name="imagePath" folder="results" userId={userId} initialUrl={event.resultsImageUrl} label="Foto do pódio" />
        </Field>
        <Field label="Observações" name="notes" optional>
          <textarea {...fieldProps("notes")} defaultValue={event.resultsNotes ?? ""} maxLength={1000} className="input" placeholder="Final decidida no último ponto…" />
        </Field>
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-gold/30 bg-gold-soft/50 px-4">
          <input type="checkbox" name="publishChampion" defaultChecked className="size-5 accent-gold" />
          <span className="text-sm font-semibold">Publicar o campeão no mural</span>
        </label>
        <Field label="Recado no post do campeão" name="championMessage" optional>
          <input {...fieldProps("championMessage")} maxLength={500} className="input" placeholder="Parabéns, campeão!" />
        </Field>
      </section>

      <FormMessage state={state} />
      <SubmitButton variant="gold" pendingLabel="Publicando…">Publicar resultado</SubmitButton>
    </form>
  );
}
