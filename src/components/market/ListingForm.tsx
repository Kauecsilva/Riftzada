"use client";

import { useActionState, useState } from "react";
import { CardPicker } from "@/components/cards/CardPicker";
import { Field, fieldProps } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { ImageInput } from "@/components/ui/ImageInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn } from "@/lib/cn";
import { CONDITION, LISTING_KIND } from "@/lib/domain/labels";
import { centsToInput, discountLabel, parseBrl } from "@/lib/domain/pricing";
import { initialActionState } from "@/lib/validation/common";
import { saveListing } from "@/server/actions/content";
import type { CardCondition, CollectionItem, Listing, ListingKind } from "@/types/domain";
import { PriceSuggestion, type AppliedPrice } from "./PriceSuggestion";

const KIND_HINT: Record<ListingKind, string> = {
  sell: "Tem carta sobrando? Bota preço.",
  trade: "Quer trocar por outra carta.",
  want: "Tá procurando alguma carta.",
};

/**
 * Novo anúncio, edição, ou anúncio a partir de um item da coleção (`fromCollection` já preenche tudo).
 * Quem ainda não compartilha WhatsApp pode deixar o número aqui mesmo (vai para o perfil).
 */
export function ListingForm({ userId, listing, fromCollection, sharesWhatsapp }: {
  userId: string; listing?: Listing; fromCollection?: CollectionItem; sharesWhatsapp: boolean;
}) {
  const [state, action] = useActionState(saveListing.bind(null, listing?.id ?? null), initialActionState);
  const [kind, setKind] = useState<ListingKind>(listing?.kind ?? "sell");
  const [setName, setSetName] = useState(listing?.setName ?? fromCollection?.card.setName ?? "");
  const [card, setCard] = useState(listing?.card ?? fromCollection?.card ?? null);
  const [variant, setVariant] = useState(listing?.variant ?? fromCollection?.variant ?? "");
  const [price, setPrice] = useState(centsToInput(listing?.priceCents));
  const [applied, setApplied] = useState<AppliedPrice | null>(
    listing?.priceBase && listing.priceBaseCents != null && listing.priceCents != null
      ? { base: listing.priceBase, baseCents: listing.priceBaseCents, discountPct: listing.discountPct ?? 0, cents: listing.priceCents }
      : null,
  );
  const [acceptsOffers, setAcceptsOffers] = useState(listing?.acceptsOffers ?? false);
  const err = state.fieldErrors ?? {};
  // A base e o desconto só valem enquanto o preço for o sugerido; mexeu no valor, vira preço livre
  const priceFromSuggestion = kind === "sell" && applied != null && parseBrl(price) === applied.cents ? applied : null;
  const collectionItemId = fromCollection?.id ?? listing?.collectionItemId ?? "";

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="collectionItemId" value={collectionItemId} />
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Tá…</legend>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(LISTING_KIND) as ListingKind[]).map((k) => (
            <label key={k} className={cn("flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border text-sm font-semibold transition-colors has-focus-visible:outline-3 has-focus-visible:outline-rift-strong",
              kind === k ? "border-rift bg-rift-soft text-ink" : "border-line bg-surface-2 text-muted hover:text-ink")}>
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
              {k === "sell" ? "Vendendo" : k === "trade" ? "Trocando" : "Procurando"}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-faint">{KIND_HINT[kind]}</p>
      </fieldset>

      <Field label="Carta" name="cardName" error={err.cardName}>
        <CardPicker
          initial={listing?.card ?? fromCollection?.card}
          initialName={listing?.cardName}
          allowFreeText
          error={err.cardName}
          onSelect={(picked) => {
            setCard(picked);
            if (picked?.setName) setSetName(picked.setName);
          }}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Expansão" name="setName" error={err.setName} optional>
          <input {...fieldProps("setName", err.setName)} value={setName} onChange={(e) => setSetName(e.target.value)} maxLength={60} className="input" placeholder="Origins" />
        </Field>
        <Field label="Variante" name="variant" error={err.variant} optional>
          <input {...fieldProps("variant", err.variant)} value={variant} onChange={(e) => setVariant(e.target.value)} maxLength={40} className="input" placeholder="Foil, Showcase…" />
        </Field>
      </div>

      <div className="grid grid-cols-[1fr_96px] gap-3">
        <Field label="Condição" name="condition" error={err.condition}>
          <select {...fieldProps("condition", err.condition)} defaultValue={listing?.condition ?? fromCollection?.condition ?? "nm"} className="input">
            {(Object.keys(CONDITION) as CardCondition[]).map((c) => <option key={c} value={c}>{CONDITION[c].short} · {CONDITION[c].label}</option>)}
          </select>
        </Field>
        <Field label="Qtd." name="quantity" error={err.quantity}>
          <input {...fieldProps("quantity", err.quantity)} type="number" inputMode="numeric" min={1} max={99} defaultValue={listing?.quantity ?? 1} className="input" />
        </Field>
      </div>

      {kind === "sell" && (
        <PriceSuggestion
          cardId={card?.id ?? null}
          cardName={card?.name ?? listing?.cardName ?? ""}
          variant={variant}
          listing={listing}
          onApply={(next) => {
            setApplied(next);
            setPrice(centsToInput(next.cents));
          }}
        />
      )}

      {kind !== "trade" && (
        <Field label={kind === "want" ? "Quanto pagaria" : "Preço"} name="price" error={err.price} optional
          hint={priceFromSuggestion ? `${discountLabel(priceFromSuggestion.base, priceFromSuggestion.discountPct)}. Em reais.` : "Em reais. Deixa vazio para combinar."}>
          <input {...fieldProps("price", err.price, "hint")} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="input" placeholder="120,00" />
        </Field>
      )}
      {priceFromSuggestion && (
        <>
          <input type="hidden" name="priceBase" value={priceFromSuggestion.base} />
          <input type="hidden" name="priceBaseCents" value={priceFromSuggestion.baseCents} />
          <input type="hidden" name="discountPct" value={priceFromSuggestion.discountPct} />
        </>
      )}

      {kind === "sell" && (
        <div className="space-y-3 rounded-2xl border border-line bg-surface-2 p-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" name="acceptsOffers" checked={acceptsOffers} onChange={(e) => setAcceptsOffers(e.target.checked)} className="size-5 accent-rift" />
            <span>
              <span className="block text-sm font-medium">Aceito ofertas abaixo do preço</span>
              <span className="block text-xs text-faint">O comprador oferece um valor; você aceita, recusa ou faz uma contraproposta.</span>
            </span>
          </label>
          {acceptsOffers && (
            <Field label="Oferta mínima" name="minOffer" error={err.minOffer} optional hint="Ofertas abaixo disso nem chegam.">
              <input {...fieldProps("minOffer", err.minOffer, "hint")} inputMode="decimal" defaultValue={centsToInput(listing?.minOfferCents)} className="input" placeholder="80,00" />
            </Field>
          )}
        </div>
      )}

      {kind !== "trade" && (
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-line bg-surface-2 px-4">
          <input type="checkbox" name="acceptsTrade" defaultChecked={listing?.acceptsTrade} className="size-5 accent-rift" />
          <span className="text-sm font-medium">Aceito troca também <span className="font-normal text-faint">(cartas, com ou sem dinheiro)</span></span>
        </label>
      )}

      <Field label="Foto" name="imagePath" optional hint="O anúncio mostra primeiro a imagem oficial da carta e depois a tua foto.">
        <ImageInput name="imagePath" folder="listings" userId={userId} initialUrl={listing?.imageUrl} label="Foto da carta" />
      </Field>

      <Field label="Detalhes" name="description" error={err.description} optional>
        <textarea {...fieldProps("description", err.description)} defaultValue={listing?.description ?? ""} maxLength={1000} className="input" placeholder="Estado, o que aceita em troca, onde entrega…" />
      </Field>

      {!sharesWhatsapp && (
        <Field label="Teu WhatsApp" name="whatsapp" error={err.whatsapp} optional
          hint="Quem se interessar te chama direto, já com a carta e a oferta na mensagem. Fica no teu perfil e dá para tirar quando quiser.">
          <input {...fieldProps("whatsapp", err.whatsapp, "hint")} type="tel" inputMode="tel" autoComplete="tel" className="input" placeholder="(11) 98765-4321" />
        </Field>
      )}

      <FormMessage state={state} />
      <SubmitButton>{listing ? "Salvar anúncio" : "Anunciar"}</SubmitButton>
    </form>
  );
}
