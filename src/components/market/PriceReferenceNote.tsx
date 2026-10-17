import { CONDITION } from "@/lib/domain/labels";
import { discountLabel, LIGA_LANGUAGE } from "@/lib/domain/pricing";
import { formatPrice } from "@/lib/format";
import type { Listing } from "@/types/domain";

/** "10% abaixo da Liga (R$ 336,66) · Liga: Inglês (americana), NM" embaixo do preço do anúncio. */
export function PriceReferenceNote({ listing }: { listing: Listing }) {
  const liga = listing.liga;
  if (!listing.priceBase && !liga) return null;
  const ligaDetails = liga && [liga.language && LIGA_LANGUAGE[liga.language], liga.condition && CONDITION[liga.condition].short].filter(Boolean).join(", ");
  return (
    <div className="space-y-0.5 text-sm text-muted">
      {listing.priceBase && listing.priceBaseCents != null && (
        <p><span className="font-semibold text-energy">{discountLabel(listing.priceBase, listing.discountPct)}</span> ({formatPrice(listing.priceBaseCents)})</p>
      )}
      {liga && <p>Menor preço na Liga: {formatPrice(liga.priceCents)}{ligaDetails ? ` · ${ligaDetails}` : ""}</p>}
    </div>
  );
}
