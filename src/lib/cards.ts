import type { CardSummary, Listing } from "@/types/domain";

/** Imagens do catálogo vêm do CDN da Riot (via Riftcodex). É o host liberado no next.config. */
export const CARD_IMAGE_HOST = "cmsassets.rgpub.io";

/** Só aceita imagem do CDN liberado (o next/image quebra com qualquer outro host). */
export function cardImageUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname === CARD_IMAGE_HOST ? url : null;
  } catch {
    return null;
  }
}

/** Foto do anunciante; sem foto, a imagem oficial da carta do catálogo. */
export function listingImageUrl(listing: Pick<Listing, "imageUrl" | "card">): string | null {
  return listing.imageUrl ?? listing.card?.imageUrl ?? null;
}

/** "Origins · OGN-007 · Epic" */
export function cardLine(card: CardSummary): string {
  return [card.setName, card.code, card.rarity].filter(Boolean).join(" · ");
}
