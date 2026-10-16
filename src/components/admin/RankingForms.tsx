"use client";

import { useActionState, useEffect, useRef } from "react";
import { Field, fieldProps } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { initialActionState } from "@/lib/validation/common";
import { addLegend, addRankingEntry, saveRankingRules } from "@/server/actions/admin";
import type { MiniProfile, RankingRules } from "@/types/domain";

export function RulesForm({ rules }: { rules: RankingRules }) {
  const [state, action] = useActionState(saveRankingRules, initialActionState);
  const slots = Math.max(4, rules.pointsByPlacement.length);
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: slots }, (_, i) => (
          <Field key={i} label={`${i + 1}º`} name={`points-${i}`}>
            <input id={`points-${i}`} name="points" type="number" min={0} inputMode="numeric" defaultValue={rules.pointsByPlacement[i] ?? 0} className="input text-center" />
          </Field>
        ))}
      </div>
      <Field label="Pontos por torneio jogado" name="participationPoints">
        <input {...fieldProps("participationPoints")} type="number" min={0} inputMode="numeric" defaultValue={rules.participationPoints} className="input max-w-40" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton full={false} size="md">Salvar regra</SubmitButton>
    </form>
  );
}

/** Limpa o formulário depois de um envio que deu certo. */
function useResetOnSuccess(ok: boolean | undefined) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (ok) ref.current?.reset();
  }, [ok]);
  return ref;
}

export function EntryForm({ players }: { players: MiniProfile[] }) {
  const [state, action] = useActionState(addRankingEntry, initialActionState);
  const ref = useResetOnSuccess(state.ok);
  const err = state.fieldErrors ?? {};
  return (
    <form ref={ref} action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <Field label="Jogador" name="userId" error={err.userId}>
          <select {...fieldProps("userId", err.userId)} required className="input" defaultValue="">
            <option value="" disabled>Escolhe</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
          </select>
        </Field>
        <Field label="Pontos (±)" name="points" error={err.points}>
          <input {...fieldProps("points", err.points)} type="number" required className="input" placeholder="20" />
        </Field>
      </div>
      <Field label="Motivo" name="reason" error={err.reason}>
        <input {...fieldProps("reason", err.reason)} required maxLength={120} className="input" placeholder="Bônus de organização, correção…" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton full={false} size="md">Lançar ajuste</SubmitButton>
    </form>
  );
}

export function LegendForm() {
  const [state, action] = useActionState(addLegend, initialActionState);
  const ref = useResetOnSuccess(state.ok);
  const err = state.fieldErrors ?? {};
  return (
    <form ref={ref} action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
        <Field label="Nome da lenda" name="name" error={err.name}>
          <input {...fieldProps("name", err.name)} required maxLength={120} className="input" placeholder="Sett, The Boss" />
        </Field>
        <Field label="Expansão" name="setName" optional>
          <input {...fieldProps("setName")} maxLength={60} defaultValue="Origins" className="input" />
        </Field>
      </div>
      <FormMessage state={state} />
      <SubmitButton full={false} size="md">Cadastrar lenda</SubmitButton>
    </form>
  );
}
