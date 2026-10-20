import Link from "next/link";
import { HandCoins, MapPin, Repeat } from "lucide-react";
import { CardBack } from "@/components/cards/CardBack";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, KindTag } from "@/components/ui/Badge";
import { Photo } from "@/components/ui/Photo";
import { listingImageUrl } from "@/lib/cards";
import { CONDITION, LISTING_STATUS } from "@/lib/domain/labels";
import { formatPrice } from "@/lib/format";
import type { Listing } from "@/types/domain";

export function ListingCard({ listing }: { listing: Listing }) {
  const dimmed = listing.status !== "available";
  const details = [listing.setName, listing.variant, CONDITION[listing.condition].short].filter(Boolean).join(" · ");
  const price = listing.priceCents != null ? formatPrice(listing.priceCents) : listing.kind === "want" ? "A combinar" : "Troca";

  return (
    <Link
      href={`/mercado/${listing.id}`}
      className="frame-hex group flex h-full min-w-0 overflow-hidden bg-surface shadow-[0_14px_30px_-24px_rgb(41_35_56/0.6)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-radiance hover:shadow-[0_18px_34px_-24px_rgb(96_59_135/0.65)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-radiance sm:block"
    >
      <div className="relative w-[34%] max-w-36 shrink-0 bg-[#231e36] sm:w-full sm:max-w-none">
        <Photo
          src={listingImageUrl(listing)}
          alt={listing.cardName}
          ratio="3/4"
          sizes="(min-width: 1024px) 260px, (min-width: 640px) 45vw, 130px"
          className={dimmed ? "opacity-60" : undefined}
          fallback={<CardBack kind={listing.kind} />}
        />
        <span className="absolute inset-x-0 bottom-0 h-9 bg-linear-to-t from-[#21172f]/55 to-transparent" aria-hidden />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        <div className="flex flex-wrap items-start gap-1.5">
          <KindTag kind={listing.kind} className="rounded-[3px]" />
          {dimmed && <Badge tone={listing.status === "reserved" ? "gold" : "neutral"} className="rounded-[3px]">{LISTING_STATUS[listing.status]}</Badge>}
        </div>
        <h3 className="mt-2 line-clamp-2 font-display text-lg font-bold leading-tight text-ink sm:text-xl">{listing.cardName}</h3>
        <p className="mt-1 truncate text-xs text-muted">
          {details}{listing.quantity > 1 ? ` · ${listing.quantity}x` : ""}
        </p>

        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span className="font-display text-xl font-bold leading-none text-rift sm:text-2xl">{price}</span>
            <span className="flex items-center gap-1.5">
              {listing.kind === "sell" && listing.acceptsOffers && <HandCoins size={16} className="text-gold" aria-label="Aceita ofertas" />}
              {listing.acceptsTrade && listing.kind !== "trade" && <Repeat size={16} className="text-energy" aria-label="Aceita troca" />}
            </span>
          </div>
          <div className="mt-2.5 flex min-w-0 items-center gap-1.5 border-t border-line/75 pt-2.5 text-xs text-muted">
            <Avatar name={listing.seller.displayName} src={listing.seller.avatarUrl} size={19} />
            <span className="min-w-0 truncate">{listing.seller.displayName}</span>
          </div>
          {listing.sellerRegion && (
            <p className="mt-1 flex items-center gap-1 text-xs text-faint">
              <MapPin size={12} className="shrink-0" aria-hidden /><span className="truncate">{listing.sellerRegion}</span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
