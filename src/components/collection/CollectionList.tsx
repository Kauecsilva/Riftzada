"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckSquare, Tag, Trash2, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { listingQueueHref } from "@/lib/domain/listing-queue";
import { removeCollectionItems } from "@/server/actions/collection";
import type { CollectionItem, PriceBase } from "@/types/domain";
import { CollectionItemCard } from "./CollectionItemCard";

/**
 * Grade da coleção com modo de seleção para remover várias cartas de uma vez ou colocá-las à venda numa
 * fila de cadastro rápido. `prices` é o preço padrão de cada item (por id), quando tem.
 */
export function CollectionList({ items, prices }: { items: CollectionItem[]; prices: Record<string, { base: PriceBase; cents: number } | null> }) {
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const toast = useToast();
  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  const count = items.filter((i) => selected.has(i.id)).length;
  // Carta que já tem anúncio aberto não entra na fila de venda
  const toSell = items.filter((i) => selected.has(i.id) && !i.listing);

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

  function sell() {
    if (!toSell.length) return;
    const skipped = count - toSell.length;
    if (skipped) toast(`${skipped === 1 ? "1 carta já anunciada ficou" : `${skipped} cartas já anunciadas ficaram`} de fora.`, "ok");
    router.push(listingQueueHref(toSell.map((i) => i.id)));
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
            <button type="button" onClick={sell} disabled={pending || toSell.length === 0} className={buttonClass("secondary", "sm")}
              title={count > 0 && toSell.length === 0 ? "As cartas selecionadas já estão anunciadas" : undefined}>
              <Tag size={15} aria-hidden /> Vender{toSell.length > 0 ? ` (${toSell.length})` : ""}
            </button>
            <button type="button" onClick={remove} disabled={pending || count === 0} className={buttonClass("danger", "sm")}>
              <Trash2 size={15} aria-hidden /> {pending ? "Removendo…" : "Remover"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-3 flex justify-end">
          <button type="button" onClick={() => setSelecting(true)} className={buttonClass("ghost", "sm")}>
            <CheckSquare size={15} aria-hidden /> Selecionar várias (vender ou remover)
          </button>
        </div>
      )}
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={`${item.id}-${item.quantity}`} className="relative">
            <CollectionItemCard item={item} price={prices[item.id] ?? null} />
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
