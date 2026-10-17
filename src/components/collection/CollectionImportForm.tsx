"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FileUp } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { importCollection, type ImportState } from "@/server/actions/collection";

/** Envia o CSV e mostra o resultado: quantas entraram e quais linhas não casaram com o catálogo. */
export function CollectionImportForm() {
  const [state, action] = useActionState(importCollection, {} as ImportState);
  const unmatched = state.unmatched ?? [];

  return (
    <div className="space-y-5">
      <form action={action} className="card space-y-4 p-4">
        <label htmlFor="file" className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface-2 p-4 text-center hover:border-rift/50">
          <FileUp size={26} className="text-rift-strong" aria-hidden />
          <span className="font-semibold">Escolher arquivo CSV</span>
          <input id="file" name="file" type="file" accept=".csv,text/csv" required className="w-full max-w-xs text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface-3 file:px-3 file:py-1.5 file:text-ink" />
        </label>
        <FormMessage state={state} />
        <SubmitButton size="md" pendingLabel="Importando…">Importar coleção</SubmitButton>
      </form>

      {state.ok && (
        <Link href="/colecao" className={buttonClass("secondary", "md", "w-full")}>Ver minha coleção</Link>
      )}

      {unmatched.length > 0 && (
        <section aria-labelledby="nao-casou" className="card p-4">
          <h2 id="nao-casou" className="font-semibold">Não achei no catálogo ({unmatched.length})</h2>
          <p className="mt-1 text-sm text-muted">Essas linhas ficaram de fora. Dá para adicionar na mão pela busca da coleção.</p>
          <ul className="mt-3 divide-y divide-line text-sm">
            {unmatched.map((r) => (
              <li key={r.line} className="flex justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{r.name}</span>
                  <span className="block text-xs text-faint">Linha {r.line}{r.set ? ` · ${r.set}` : ""}{r.number ? ` #${r.number}` : ""}</span>
                </span>
                <span className="shrink-0 font-display font-bold tabular-nums">{r.quantity}x</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
