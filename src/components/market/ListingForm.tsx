"use client";

import { useActionState, useState } from "react";
import { CardPicker } from "@/components/cards/CardPicker";
import { Field, fieldProps } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { ImageInput } from "@/components/ui/ImageInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn } from "@/lib/cn";
import { CONDITION, LISTING_KIND } from "@/lib/domain/labels";
import { initialActionState } from "@/lib/validation/common";
import { saveListing } from "@/server/actions/content";
import type { CardCondition, CollectionItem, Listing, ListingKind } from "@/types/domain";

const KIND_HINT: Record<ListingKind, string> = {
  sell: "Tem carta sobrando? Bota preço.",
  trade: "Quer trocar por outra carta.",
  want: "Tá procurando alguma carta.",
};

/** Novo anúncio, edição, ou anúncio a partir de um item da coleção (`fromCollection` já preenche tudo). */
export function ListingForm({ userId, listing, fromCollection }: { userId: string; listing?: Listing; fromCollection?: CollectionItem }) {
  const [state, action] = useActionState(saveListing.bind(null, listing?.id ?? null), initialActionState);
  const [kind, setKind] = useState<ListingKind>(listing?.kind ?? "sell");
  const [setName, setSetName] = useState(listing?.setName ?? fromCollection?.card.setName ?? "");
  const err = state.fieldErrors ?? {};
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
          onSelect={(card) => card?.setName && setSetName(card.setName)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Expansão" name="setName" error={err.setName} optional>
          <input {...fieldProps("setName", err.setName)} value={setName} onChange={(e) => setSetName(e.target.value)} maxLength={60} className="input" placeholder="Origins" />
        </Field>
        <Field label="Variante" name="variant" error={err.variant} optional>
          <input {...fieldProps("variant", err.variant)} defaultValue={listing?.variant ?? fromCollection?.variant ?? ""} maxLength={40} className="input" placeholder="Foil, Showcase…" />
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

      {kind !== "trade" && (
        <Field label={kind === "want" ? "Quanto pagaria" : "Preço"} name="price" error={err.price} optional hint="Em reais. Deixa vazio para combinar.">
          <input {...fieldProps("price", err.price, "hint")} inputMode="decimal" defaultValue={listing?.priceCents != null ? (listing.priceCents / 100).toFixed(2).replace(".", ",") : ""} className="input" placeholder="120,00" />
        </Field>
      )}

      {kind !== "trade" && (
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-line bg-surface-2 px-4">
          <input type="checkbox" name="acceptsTrade" defaultChecked={listing?.acceptsTrade} className="size-5 accent-rift" />
          <span className="text-sm font-medium">Aceito troca também</span>
        </label>
      )}

      <Field label="Foto" name="imagePath" optional hint="Sem foto, o anúncio usa a imagem oficial da carta escolhida.">
        <ImageInput name="imagePath" folder="listings" userId={userId} initialUrl={listing?.imageUrl} label="Foto da carta" />
      </Field>

      <Field label="Detalhes" name="description" error={err.description} optional>
        <textarea {...fieldProps("description", err.description)} defaultValue={listing?.description ?? ""} maxLength={1000} className="input" placeholder="Estado, o que aceita em troca, onde entrega…" />
      </Field>

      <FormMessage state={state} />
      <SubmitButton>{listing ? "Salvar anúncio" : "Anunciar"}</SubmitButton>
    </form>
  );
}
