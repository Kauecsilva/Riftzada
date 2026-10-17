import Link from "next/link";
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
    <article className="card p-4">
      <AuthorLine author={listing.seller} at={listing.createdAt}>{LISTING_KIND[listing.kind].verb}</AuthorLine>
      <Link href={`/mercado/${listing.id}`} className="mt-3 flex gap-3 rounded-2xl border border-line bg-surface-2 p-2.5 transition-colors hover:bg-surface-3">
        <div className="w-16 shrink-0"><Photo src={listingImageUrl(listing)} alt={listing.cardName} ratio="3/4" className="rounded-xl" sizes="64px" /></div>
        <div className="min-w-0 flex-1 py-0.5">
          <KindTag kind={listing.kind} />
          <p className="mt-1.5 truncate font-semibold">{listing.cardName}</p>
          <p className="truncate text-sm text-muted">{[listing.setName, listing.variant].filter(Boolean).join(" · ")}</p>
        </div>
        {listing.priceCents != null && <p className="self-center pr-1 font-display text-lg font-bold">{formatPrice(listing.priceCents)}</p>}
      </Link>
    </article>
  );
}
