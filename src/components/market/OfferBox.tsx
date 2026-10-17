"use client";

import { useActionState, useTransition } from "react";
import { Check, HandCoins, X } from "lucide-react";
import { Field, fieldProps } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/format";
import { initialActionState } from "@/lib/validation/common";
import { makeOffer, respondOffer } from "@/server/actions/content";
import type { Listing, ListingOffer } from "@/types/domain";
import { OfferStatusBadge } from "./OfferStatusBadge";

/**
 * Comprador oferece um valor abaixo do preço. Se o vendedor mandar contraproposta, aceita ou recusa aqui.
 * `offers` são só as do próprio comprador (a RLS esconde as dos outros).
 */
export function OfferBox({ listing, offers }: { listing: Listing; offers: ListingOffer[] }) {
  const [state, action] = useActionState(makeOffer, initialActionState);
  const [pending, start] = useTransition();
  const toast = useToast();
  const open = offers.find((o) => o.status === "pending" || o.status === "countered") ?? null;
  const last = open ?? offers[0] ?? null;
  const canOffer = listing.status === "available" && listing.acceptsOffers;
  const err = state.fieldErrors ?? {};

  const respond = (verb: string) =>
    start(async () => {
      const result = await respondOffer(listing.id, last!.id, verb);
      if (result.message) toast(result.message, result.ok ? "ok" : "error");
    });

  const limits = [
    listing.priceCents != null && `abaixo de ${formatPrice(listing.priceCents)}`,
    listing.minOfferCents != null && `a partir de ${formatPrice(listing.minOfferCents)}`,
  ].filter(Boolean).join(", ");

  return (
    <section className="card space-y-4 p-4" aria-labelledby="offer-title">
      <h2 id="offer-title" className="flex items-center gap-2 text-sm font-semibold"><HandCoins size={16} className="text-gold" aria-hidden /> Fazer uma oferta</h2>

      {last && (
        <div className="space-y-2 rounded-2xl border border-line bg-surface-2 p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span>Tua oferta: <strong>{formatPrice(last.amountCents)}</strong></span>
            <OfferStatusBadge status={last.status} />
          </div>
          {last.status === "countered" && last.counterCents != null && (
            <>
              <p>{listing.seller.displayName} topa por <strong className="text-gold">{formatPrice(last.counterCents)}</strong>. Fecha?</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" disabled={pending} onClick={() => respond("accept")} className={buttonClass("primary", "sm")}><Check size={15} aria-hidden /> Aceitar</button>
                <button type="button" disabled={pending} onClick={() => respond("decline")} className={buttonClass("danger", "sm")}><X size={15} aria-hidden /> Recusar</button>
              </div>
            </>
          )}
          {last.status === "accepted" && <p className="text-energy">Fechado! Chama {listing.seller.displayName} para combinar a entrega.</p>}
          {last.status === "pending" && (
            <button type="button" disabled={pending} onClick={() => respond("withdraw")} className="text-xs text-muted underline hover:text-ink">Retirar oferta</button>
          )}
        </div>
      )}

      {canOffer && last?.status !== "accepted" && (
        <form action={action} className="space-y-3" noValidate>
          <input type="hidden" name="listingId" value={listing.id} />
          <Field label={open ? "Mudar a oferta" : "Quanto você oferece"} name="amount" error={err.amount} hint={limits ? `Em reais, ${limits}.` : "Em reais."}>
            <input {...fieldProps("amount", err.amount, "hint")} inputMode="decimal" className="input" placeholder="80,00" required />
          </Field>
          <Field label="Recado" name="message" error={err.message} optional>
            <input {...fieldProps("message", err.message)} maxLength={280} className="input" placeholder="Pego no sábado na loja" />
          </Field>
          <FormMessage state={state} />
          <SubmitButton variant="gold" size="md" pendingLabel="Enviando…">{open ? "Atualizar oferta" : "Enviar oferta"}</SubmitButton>
        </form>
      )}
    </section>
  );
}
