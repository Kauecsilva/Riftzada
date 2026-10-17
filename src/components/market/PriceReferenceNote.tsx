import { CONDITION } from "@/lib/domain/labels";
import { discountLabel, LIGA_LANGUAGE } from "@/lib/domain/pricing";
import { formatPrice } from "@/lib/format";
import type { Listing } from "@/types/domain";
import { PriceComparison } from "./PriceComparison";

/**
 * Embaixo do preço do anúncio: "10% abaixo da Liga (R$ 336,66)", o menor preço da Liga (idioma, condição)
 * e a comparação com o TCGplayer de hoje (`tcgCents`, já em reais).
 */
export function PriceReferenceNote({ listing, tcgCents }: { listing: Listing; tcgCents: number | null }) {
  const liga = listing.liga;
  if (!listing.priceBase && !liga && tcgCents == null) return null;
  const ligaDetails = liga && [liga.language && LIGA_LANGUAGE[liga.language], liga.condition && CONDITION[liga.condition].short].filter(Boolean).join(", ");
  return (
    <div className="space-y-0.5 text-sm text-muted">
      {listing.priceBase && listing.priceBaseCents != null && (
        <p><span className="font-semibold text-energy">{discountLabel(listing.priceBase, listing.discountPct)}</span> ({formatPrice(listing.priceBaseCents)})</p>
      )}
      {liga && <p>Menor preço na Liga: {formatPrice(liga.priceCents)}{ligaDetails ? ` · ${ligaDetails}` : ""}</p>}
      {tcgCents != null && !liga && <p>TCGplayer hoje: {formatPrice(tcgCents)}</p>}
      {tcgCents != null && liga && <PriceComparison ligaCents={liga.priceCents} tcgCents={tcgCents} className="mt-2" />}
    </div>
  );
}
