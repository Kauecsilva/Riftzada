"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Undo2, X } from "lucide-react";
import { AuthorLine } from "@/components/feed/AuthorLine";
import { buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/format";
import { respondOffer } from "@/server/actions/content";
import type { ListingOffer } from "@/types/domain";
import { OfferStatusBadge } from "./OfferStatusBadge";

/** Ofertas recebidas pelo vendedor: aceitar, recusar ou mandar contraproposta. */
export function OffersPanel({ listingId, offers, priceCents }: { listingId: string; offers: ListingOffer[]; priceCents: number | null }) {
  if (!offers.length) {
    return <p className="card p-4 text-sm text-muted">Nenhuma oferta ainda. Quando alguém oferecer, aparece aqui.</p>;
  }
  return (
    <section className="space-y-3" aria-labelledby="offers-title">
      <h2 id="offers-title" className="text-sm font-semibold">Ofertas recebidas</h2>
      {offers.map((offer) => <ReceivedOffer key={offer.id} listingId={listingId} offer={offer} priceCents={priceCents} />)}
    </section>
  );
}

function ReceivedOffer({ listingId, offer, priceCents }: { listingId: string; offer: ListingOffer; priceCents: number | null }) {
  const [pending, start] = useTransition();
  const [countering, setCountering] = useState(false);
  const [counter, setCounter] = useState("");
  const toast = useToast();
  const run = (action: string, value?: string) =>
    start(async () => {
      const result = await respondOffer(listingId, offer.id, action, value);
      if (result.message) toast(result.message, result.ok ? "ok" : "error");
      if (result.ok) setCountering(false);
    });

  return (
    <article className="card space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <AuthorLine author={offer.buyer} at={offer.updatedAt}>ofereceu</AuthorLine>
        <OfferStatusBadge status={offer.status} />
      </div>
      <p className="font-display text-2xl font-bold">
        {formatPrice(offer.amountCents)}
        {offer.status === "countered" && offer.counterCents != null && (
          <span className="ml-2 text-sm font-semibold text-gold">você pediu {formatPrice(offer.counterCents)}</span>
        )}
      </p>
      {offer.message && <p className="text-sm leading-relaxed whitespace-pre-line text-muted">{offer.message}</p>}

      {offer.status === "pending" && (
        countering ? (
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run("counter", counter); }}>
            <label className="sr-only" htmlFor={`counter-${offer.id}`}>Valor da contraproposta</label>
            <input id={`counter-${offer.id}`} inputMode="decimal" value={counter} onChange={(e) => setCounter(e.target.value)} className="input flex-1" autoFocus
              placeholder={priceCents != null ? `Entre ${formatPrice(offer.amountCents)} e ${formatPrice(priceCents)}` : "Valor"} />
            <button type="submit" disabled={pending || !counter.trim()} className={buttonClass("gold", "md")}>
              {pending && <Loader2 size={16} className="animate-spin" aria-hidden />} Enviar
            </button>
            <button type="button" onClick={() => setCountering(false)} className={buttonClass("ghost", "md")} aria-label="Cancelar contraproposta"><X size={16} aria-hidden /></button>
          </form>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <button type="button" disabled={pending} onClick={() => run("accept")} className={buttonClass("primary", "sm")}><Check size={15} aria-hidden /> Aceitar</button>
            <button type="button" disabled={pending} onClick={() => setCountering(true)} className={buttonClass("secondary", "sm")}><Undo2 size={15} aria-hidden /> Contrapor</button>
            <button type="button" disabled={pending} onClick={() => run("decline")} className={buttonClass("danger", "sm")}><X size={15} aria-hidden /> Recusar</button>
          </div>
        )
      )}
    </article>
  );
}
