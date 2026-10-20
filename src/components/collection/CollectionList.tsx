"use client";

import { useState, useTransition } from "react";
import { CheckSquare, Trash2, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { removeCollectionItems } from "@/server/actions/collection";
import type { CollectionItem } from "@/types/domain";
import { CollectionItemCard } from "./CollectionItemCard";

/** Grade da coleção com modo de seleção para remover várias cartas de uma vez. */
export function CollectionList({ items }: { items: CollectionItem[] }) {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const toast = useToast();
  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  const count = items.filter((i) => selected.has(i.id)).length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exit() {
    setSelecting(false);
    setSelected(new Set());
  }

  function remove() {
    const ids = items.filter((i) => selected.has(i.id)).map((i) => i.id);
    if (!ids.length) return;
    const copies = items.filter((i) => selected.has(i.id)).reduce((sum, i) => sum + i.quantity, 0);
    const what = ids.length === 1 ? "1 carta" : `${ids.length} cartas`;
    if (!window.confirm(`Tirar ${what} da coleção (${copies} ${copies === 1 ? "cópia" : "cópias"})? Não dá para desfazer.`)) return;
    start(async () => {
      const result = await removeCollectionItems(ids);
      if (result.message) toast(result.message, result.ok ? "ok" : "error");
      if (result.ok) exit();
    });
  }

  return (
    <>
      {selecting ? (
        <div className="sticky top-[76px] z-10 lg:top-[84px] mb-3 flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface p-2 shadow-sm" role="toolbar" aria-label="Seleção da coleção">
          <button type="button" onClick={() => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)))} className={buttonClass("secondary", "sm")}>
            <CheckSquare size={15} aria-hidden /> {allSelected ? "Limpar seleção" : `Selecionar tudo (${items.length})`}
          </button>
          <span className="text-sm text-muted" aria-live="polite">{count} {count === 1 ? "selecionada" : "selecionadas"}</span>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={exit} disabled={pending} className={buttonClass("ghost", "sm")}>
              <X size={15} aria-hidden /> Cancelar
            </button>
            <button type="button" onClick={remove} disabled={pending || count === 0} className={buttonClass("danger", "sm")}>
              <Trash2 size={15} aria-hidden /> {pending ? "Removendo…" : "Remover"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-3 flex justify-end">
          <button type="button" onClick={() => setSelecting(true)} className={buttonClass("ghost", "sm")}>
            <CheckSquare size={15} aria-hidden /> Selecionar várias
          </button>
        </div>
      )}
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={`${item.id}-${item.quantity}`} className="relative">
            <CollectionItemCard item={item} />
            {selecting && (
              <label className={`absolute inset-0 flex cursor-pointer items-start justify-end rounded-[var(--radius-card)] p-3 ${selected.has(item.id) ? "bg-rift-soft/60 ring-2 ring-rift" : "bg-surface/30"}`}>
                <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} className="size-5 accent-rift" />
                <span className="sr-only">Selecionar {item.card.name}</span>
              </label>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
