import Link from "next/link";
import { CardBack } from "@/components/cards/CardBack";
import { KindTag } from "@/components/ui/Badge";
import { Photo } from "@/components/ui/Photo";
import { listingImageUrl } from "@/lib/cards";
import { LISTING_KIND } from "@/lib/domain/labels";
import { formatPrice } from "@/lib/format";
import type { Listing } from "@/types/domain";
import { AuthorLine } from "./AuthorLine";

/** Anúncio no feed: "Rafael está vendendo uma Kai'Sa." */
export function ListingFeedCard({ listing }: { listing: Listing }) {
  return (
    <article className="card border-l-4 border-l-radiance p-4">
      <AuthorLine author={listing.seller} at={listing.createdAt} region={listing.sellerRegion}>{LISTING_KIND[listing.kind].verb}</AuthorLine>
      <Link href={`/mercado/${listing.id}`} className="group mt-3 flex min-w-0 gap-3 overflow-hidden border border-gold-line/65 bg-bg p-2 transition-colors hover:border-radiance hover:bg-radiance-soft focus-visible:outline-radiance">
        <div className="w-18 shrink-0 border border-gold-line/60"><Photo src={listingImageUrl(listing)} alt={listing.cardName} ratio="3/4" sizes="72px" fallback={<CardBack kind={listing.kind} />} /></div>
        <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
          <div><KindTag kind={listing.kind} className="rounded-[3px]" /></div>
          <p className="mt-1.5 truncate font-display text-lg font-bold leading-tight text-ink">{listing.cardName}</p>
          <p className="truncate text-xs text-muted">{[listing.setName, listing.variant].filter(Boolean).join(" · ")}</p>
          {listing.priceCents != null && <p className="mt-1 font-display text-lg font-bold leading-none text-rift">{formatPrice(listing.priceCents)}</p>}
        </div>
      </Link>
    </article>
  );
}
