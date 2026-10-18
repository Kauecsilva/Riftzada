"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Loader2, MessageCircle, MessagesSquare, Undo2, X } from "lucide-react";
import { AuthorLine } from "@/components/feed/AuthorLine";
import { buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { chatHref } from "@/lib/domain/chat";
import { offerSummary, whatsappLink } from "@/lib/domain/offers";
import { formatPrice } from "@/lib/format";
import { respondOffer } from "@/server/actions/content";
import type { ListingOffer } from "@/types/domain";
import { OfferStatusBadge } from "./OfferStatusBadge";

type PanelProps = { listingId: string; cardName: string; priceCents: number | null };

/**
 * Ofertas recebidas pelo vendedor: aceitar, recusar ou mandar contraproposta, e chamar o comprador
 * na conversa do app ou no WhatsApp (se ele compartilha; `whatsapps` vem por id do comprador).
 */
export function OffersPanel({ offers, whatsapps, ...props }: PanelProps & { offers: ListingOffer[]; whatsapps: Record<string, string | null> }) {
  if (!offers.length) {
    return <p className="card p-4 text-sm text-muted">Nenhuma oferta ainda. Quando alguém oferecer, aparece aqui.</p>;
  }
  return (
    <section className="space-y-3" aria-labelledby="offers-title">
      <h2 id="offers-title" className="text-sm font-semibold">Ofertas recebidas</h2>
      {offers.map((offer) => <ReceivedOffer key={offer.id} {...props} offer={offer} whatsapp={whatsapps[offer.buyer.id] ?? null} />)}
    </section>
  );
}

function ReceivedOffer({ listingId, cardName, priceCents, offer, whatsapp }: PanelProps & { offer: ListingOffer; whatsapp: string | null }) {
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
        {offer.amountCents > 0 || !offer.cards.length ? formatPrice(offer.amountCents) : "Troca"}
        {offer.status === "countered" && offer.counterCents != null && (
          <span className="ml-2 text-sm font-semibold text-gold">você pediu {formatPrice(offer.counterCents)}{offer.cards.length > 0 && " + cartas"}</span>
        )}
      </p>
      {offer.cards.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Cartas oferecidas">
          {offer.cards.map((c, i) => (
            <li key={`${c.name}-${i}`} className="rounded-full border border-line bg-surface-2 px-3 py-1 text-sm">{c.qty > 1 && <strong>{c.qty}x </strong>}{c.name}</li>
          ))}
        </ul>
      )}
      {offer.message && <p className="text-sm leading-relaxed whitespace-pre-line text-muted">{offer.message}</p>}

      {offer.status === "pending" && (
        countering ? (
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run("counter", counter); }}>
            <label className="sr-only" htmlFor={`counter-${offer.id}`}>Valor da contraproposta</label>
            <input id={`counter-${offer.id}`} inputMode="decimal" value={counter} onChange={(e) => setCounter(e.target.value)} className="input flex-1" autoFocus
              placeholder={priceCents != null ? `Entre ${formatPrice(offer.amountCents)} e ${formatPrice(priceCents)}` : `Mais de ${formatPrice(offer.amountCents)}`} />
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
      <div className="flex flex-wrap gap-2">
        <Link href={chatHref(listingId, offer.buyer.id)} className={buttonClass("secondary", "sm")}><MessagesSquare size={15} aria-hidden /> Conversar</Link>
        {whatsapp && (
          <a href={whatsappLink(whatsapp, `Oi ${offer.buyer.displayName}! Vi tua oferta no Riftzada pelo ${cardName}: ${offerSummary(offer)}.`)}
            target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
            <MessageCircle size={15} aria-hidden /> WhatsApp
          </a>
        )}
      </div>
    </article>
  );
}
