"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Minus, Plus, Tag } from "lucide-react";
import { CardThumb } from "@/components/cards/CardThumb";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { cardLine } from "@/lib/cards";
import { CONDITION, LISTING_STATUS } from "@/lib/domain/labels";
import { PRICE_BASE } from "@/lib/domain/pricing";
import { formatPrice } from "@/lib/format";
import { setCollectionQuantity } from "@/server/actions/collection";
import type { CollectionItem, PriceBase } from "@/types/domain";

/** Uma carta da coleção: preço padrão da cópia, quantidade (+/−, zero remove) e o atalho para anunciar. */
export function CollectionItemCard({ item, price }: { item: CollectionItem; price: { base: PriceBase; cents: number } | null }) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [pending, start] = useTransition();
  const toast = useToast();

  function change(next: number) {
    if (next === 0 && !window.confirm(`Tirar ${item.card.name} da coleção?`)) return;
    const previous = quantity;
    setQuantity(next);
    start(async () => {
      const result = await setCollectionQuantity(item.id, next);
      if (!result.ok) setQuantity(previous);
      if (result.message) toast(result.message, result.ok ? "ok" : "error");
    });
  }

  return (
    <article className="card flex gap-3 p-3">
      <CardThumb card={item.card} width={72} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="line-clamp-2 leading-snug font-semibold">{item.card.name}</h3>
        <p className="truncate text-xs text-muted">{cardLine(item.card)}</p>
        <p className="text-xs text-muted">
          <Badge>{CONDITION[item.condition].short}</Badge>
          {item.variant && <Badge className="ml-1">{item.variant}</Badge>}
        </p>
        {price && <p className="text-xs text-muted">{PRICE_BASE[price.base]}: <span className="font-semibold text-ink tabular-nums">{formatPrice(price.cents)}</span></p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center rounded-full border border-line bg-surface-2" role="group" aria-label={`Quantidade de ${item.card.name}`}>
            <button type="button" disabled={pending} onClick={() => change(quantity - 1)} aria-label="Menos uma" className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:text-ink disabled:opacity-50">
              <Minus size={16} aria-hidden />
            </button>
            <span className="min-w-7 text-center font-display font-bold tabular-nums" aria-live="polite">{quantity}</span>
            <button type="button" disabled={pending || quantity >= 999} onClick={() => change(quantity + 1)} aria-label="Mais uma" className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:text-ink disabled:opacity-50">
              <Plus size={16} aria-hidden />
            </button>
          </div>
          {item.listing ? (
            <Link href={`/mercado/${item.listing.id}`} className={buttonClass("ghost", "sm")}>
              <Badge tone={item.listing.status === "reserved" ? "gold" : "sell"}>{item.listing.status === "reserved" ? LISTING_STATUS.reserved : "Anunciada"}</Badge>
            </Link>
          ) : (
            <Link href={`/mercado/novo?colecao=${item.id}`} className={buttonClass("secondary", "sm")}>
              <Tag size={15} aria-hidden /> Anunciar
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
