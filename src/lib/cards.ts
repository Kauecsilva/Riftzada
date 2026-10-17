import type { CardSummary, Legend, Listing } from "@/types/domain";

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

/** Capa do anúncio: a imagem oficial da carta; sem carta do catálogo, a foto do anunciante. */
export function listingImageUrl(listing: Pick<Listing, "imageUrl" | "card">): string | null {
  return listing.card?.imageUrl ?? listing.imageUrl ?? null;
}

export type ListingPhoto = { url: string; kind: "official" | "seller" };

/** Fotos do anúncio na ordem de exibição: primeiro a oficial da carta, depois a tirada pelo anunciante. */
export function listingPhotos(listing: Pick<Listing, "imageUrl" | "card">): ListingPhoto[] {
  const photos: ListingPhoto[] = [];
  if (listing.card?.imageUrl) photos.push({ url: listing.card.imageUrl, kind: "official" });
  if (listing.imageUrl && listing.imageUrl !== listing.card?.imageUrl) photos.push({ url: listing.imageUrl, kind: "seller" });
  return photos;
}

/** "está vendendo", "está trocando" ou "está vendendo ou trocando" essa carta. */
export function offerVerb(listing: Pick<Listing, "kind" | "acceptsTrade">): string {
  if (listing.kind === "trade") return "está trocando";
  return listing.acceptsTrade ? "está vendendo ou trocando" : "está vendendo";
}

/** "Origins · OGN-007 · Epic" */
export function cardLine(card: CardSummary): string {
  return [card.setName, card.code, card.rarity].filter(Boolean).join(" · ");
}

/**
 * Uma lenda por nome: o catálogo tem várias impressões da mesma ("Ahri - Nine-Tailed Fox",
 * "(Metal)", "(Starter)", promo). Fica a impressão normal, sem o sufixo entre parênteses.
 */
export function uniqueLegends(rows: { id: string; name: string; rarity: string | null }[]): Legend[] {
  const byName = new Map<string, { id: string; name: string; promo: boolean }>();
  for (const row of rows) {
    const name = row.name.replace(/\s*\([^)]*\)$/, "");
    const promo = row.name !== name || row.rarity === "Promo";
    const current = byName.get(name);
    if (!current || (current.promo && !promo)) byName.set(name, { id: row.id, name, promo });
  }
  return [...byName.values()].map(({ id, name }) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
}
