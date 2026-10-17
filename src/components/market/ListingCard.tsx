import Link from "next/link";
import { HandCoins, Repeat } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, KindTag } from "@/components/ui/Badge";
import { Photo } from "@/components/ui/Photo";
import { listingImageUrl } from "@/lib/cards";
import { CONDITION, LISTING_STATUS } from "@/lib/domain/labels";
import { formatPrice } from "@/lib/format";
import type { Listing } from "@/types/domain";

export function ListingCard({ listing }: { listing: Listing }) {
  const dimmed = listing.status !== "available";
  return (
    <Link href={`/mercado/${listing.id}`} className="card group block overflow-hidden transition-transform hover:-translate-y-0.5">
      <div className="relative">
        <Photo src={listingImageUrl(listing)} alt={listing.cardName} ratio="3/4" sizes="(min-width: 1024px) 300px, 50vw" className={dimmed ? "opacity-60" : undefined} />
        <div className="absolute top-2 left-2"><KindTag kind={listing.kind} /></div>
        {dimmed && <div className="absolute top-2 right-2"><Badge tone={listing.status === "reserved" ? "gold" : "neutral"}>{LISTING_STATUS[listing.status]}</Badge></div>}
      </div>
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 leading-snug font-semibold">{listing.cardName}</p>
        <p className="truncate text-xs text-muted">
          {[listing.setName, listing.variant, CONDITION[listing.condition].short].filter(Boolean).join(" · ")}
          {listing.quantity > 1 ? ` · ${listing.quantity}x` : ""}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="font-display text-lg font-bold">
            {listing.priceCents != null ? formatPrice(listing.priceCents) : listing.kind === "want" ? "A combinar" : "Troca"}
          </span>
          <span className="flex items-center gap-1.5">
            {listing.kind === "sell" && listing.acceptsOffers && <HandCoins size={16} className="text-gold" aria-label="Aceita ofertas" />}
            {listing.acceptsTrade && listing.kind !== "trade" && <Repeat size={16} className="text-energy" aria-label="Aceita troca" />}
          </span>
        </div>
        <div className="flex items-center gap-1.5 pt-1 text-xs text-muted">
          <Avatar name={listing.seller.displayName} src={listing.seller.avatarUrl} size={18} />
          <span className="truncate">{listing.seller.displayName}</span>
        </div>
      </div>
    </Link>
  );
}
