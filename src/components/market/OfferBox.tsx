"use client";

import { useActionState, useTransition } from "react";
import { Check, HandCoins, MessageCircle, Repeat, X } from "lucide-react";
import { Field, fieldProps } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { offerModes, offerSummary, whatsappLink } from "@/lib/domain/offers";
import { centsToInput } from "@/lib/domain/pricing";
import { formatPrice } from "@/lib/format";
import { initialActionState } from "@/lib/validation/common";
import { makeOffer, respondOffer } from "@/server/actions/content";
import type { Listing, ListingOffer } from "@/types/domain";
import { OfferCardsInput } from "./OfferCardsInput";
import { OfferStatusBadge } from "./OfferStatusBadge";

/**
 * Comprador oferece dinheiro, cartas ou os dois. Se o vendedor mandar contraproposta, aceita ou recusa aqui.
 * `offers` são só as do próprio comprador (a RLS esconde as dos outros).
 */
export function OfferBox({ listing, offers, whatsapp }: { listing: Listing; offers: ListingOffer[]; whatsapp: string | null }) {
  const [state, action] = useActionState(makeOffer, initialActionState);
  const [pending, start] = useTransition();
  const toast = useToast();
  const modes = offerModes(listing);
  const open = offers.find((o) => o.status === "pending" || o.status === "countered") ?? null;
  const last = open ?? offers[0] ?? null;
  const canOffer = listing.status === "available" && (modes.money || modes.trade);
  const err = state.fieldErrors ?? {};

  const respond = (verb: string) =>
    start(async () => {
      const result = await respondOffer(listing.id, last!.id, verb);
      if (result.message) toast(result.message, result.ok ? "ok" : "error");
    });

  const limits = [
    listing.priceCents != null && `abaixo de ${formatPrice(listing.priceCents)}`,
    modes.money && listing.minOfferCents != null && `a partir de ${formatPrice(listing.minOfferCents)} só em dinheiro`,
  ].filter(Boolean).join(", ");
  const title = modes.trade && !modes.money ? "Propor troca" : modes.trade ? "Fazer oferta ou propor troca" : "Fazer uma oferta";
  const offerText = last && `Oi ${listing.seller.displayName}! Te mandei uma oferta no Riftzada pelo teu anúncio de ${listing.cardName}: ${offerSummary(last)}. Bora fechar?`;

  return (
    <section className="card space-y-4 p-4" aria-labelledby="offer-title">
      <h2 id="offer-title" className="flex items-center gap-2 text-sm font-semibold">
        {modes.trade ? <Repeat size={16} className="text-gold" aria-hidden /> : <HandCoins size={16} className="text-gold" aria-hidden />} {title}
      </h2>

      {last && (
        <div className="space-y-2 rounded-2xl border border-line bg-surface-2 p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <span>Tua oferta: <strong>{offerSummary(last)}</strong></span>
            <OfferStatusBadge status={last.status} />
          </div>
          {last.status === "countered" && last.counterCents != null && (
            <>
              <p>
                {listing.seller.displayName} topa {last.cards.length ? "se o dinheiro for" : "por"} <strong className="text-gold">{formatPrice(last.counterCents)}</strong>
                {last.cards.length > 0 && " junto com as cartas"}. Fecha?
              </p>
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
          {whatsapp && offerText && (last.status === "pending" || last.status === "accepted") && (
            <a href={whatsappLink(whatsapp, offerText)} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm", "w-full")}>
              <MessageCircle size={15} aria-hidden /> Mandar a oferta no WhatsApp
            </a>
          )}
        </div>
      )}

      {canOffer && last?.status !== "accepted" && (
        <form action={action} className="space-y-3" noValidate>
          <input type="hidden" name="listingId" value={listing.id} />
          {modes.trade && (
            <Field label={modes.money ? "Cartas que você dá em troca" : "Cartas que você oferece"} name="cards" error={err.cards} optional={modes.money}
              hint="Busca e toca no + para incluir cada carta.">
              <OfferCardsInput id="cards" key={open?.id ?? "new"} initial={open?.cards} error={err.cards} />
            </Field>
          )}
          <Field
            label={modes.money ? (open ? "Mudar o valor" : "Quanto você oferece") : "Dinheiro junto"}
            name="amount"
            error={err.amount}
            optional={modes.trade}
            hint={[modes.trade ? "Em reais, se quiser completar a troca" : "Em reais", limits].filter(Boolean).join(", ") + "."}
          >
            <input {...fieldProps("amount", err.amount, "hint")} inputMode="decimal" className="input" placeholder={modes.money ? "80,00" : "10,00"}
              defaultValue={open?.amountCents ? centsToInput(open.amountCents) : ""} />
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
