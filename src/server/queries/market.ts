import "server-only";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import * as demo from "@/lib/demo/store";
import type { Listing, ListingKind, ListingOffer, PriceBase, PriceDrift } from "@/types/domain";
import { getCommunityId } from "../session";
import { LISTING_FIELDS, mapListing, mapOffer, OFFER_FIELDS, type ListingRow, type OfferRow } from "./mappers";

export type ListingFilter = { kind?: ListingKind; search?: string; sellerId?: string; includeDone?: boolean; includeHidden?: boolean; limit?: number };

export async function getListings(filter: ListingFilter = {}): Promise<Listing[]> {
  const limit = filter.limit ?? 60;
  if (isDemoMode) {
    const term = filter.search?.toLowerCase();
    return demo
      .demoListingsList()
      .filter((l) => (!filter.kind || l.kind === filter.kind)
        && (!filter.sellerId || l.seller.id === filter.sellerId)
        && (filter.includeDone || l.status !== "done")
        && (!term || l.cardName.toLowerCase().includes(term)))
      .slice(0, limit);
  }
  const [supabase, communityId] = await Promise.all([createClient(), getCommunityId()]);
  let query = supabase.from("market_listings").select(LISTING_FIELDS).eq("community_id", communityId);
  if (!filter.includeHidden) query = query.eq("is_hidden", false);
  if (filter.kind) query = query.eq("kind", filter.kind);
  if (filter.sellerId) query = query.eq("seller_id", filter.sellerId);
  if (!filter.includeDone) query = query.neq("status", "done");
  // Escapa os curingas do ILIKE para a busca ser literal
  if (filter.search) query = query.ilike("card_name", `%${filter.search.replace(/[%_\\]/g, (m) => `\\${m}`)}%`);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(limit).returns<ListingRow[]>();
  if (error) throw error;
  return data.map(mapListing);
}

/**
 * Quem está vendendo ou trocando a carta de uma procura: anúncios disponíveis de outras pessoas,
 * pela carta do catálogo ou, sem ela, pelo nome digitado.
 */
export async function getOffersFor(want: Pick<Listing, "card" | "cardName" | "seller">, limit = 12): Promise<Listing[]> {
  const name = want.cardName.trim().toLowerCase();
  if (isDemoMode) {
    return demo
      .demoListingsList()
      .filter((l) => l.kind !== "want" && l.status === "available" && !l.isHidden && l.seller.id !== want.seller.id
        && (want.card ? l.card?.id === want.card.id : l.cardName.trim().toLowerCase() === name))
      .slice(0, limit);
  }
  const [supabase, communityId] = await Promise.all([createClient(), getCommunityId()]);
  let query = supabase
    .from("market_listings")
    .select(LISTING_FIELDS)
    .eq("community_id", communityId)
    .in("kind", ["sell", "trade"])
    .eq("status", "available")
    .eq("is_hidden", false)
    .neq("seller_id", want.seller.id);
  query = want.card
    ? query.eq("card_id", want.card.id)
    : query.ilike("card_name", want.cardName.trim().replace(/[%_\\]/g, (m) => `\\${m}`));
  const { data, error } = await query.order("created_at", { ascending: false }).limit(limit).returns<ListingRow[]>();
  if (error) throw error;
  return data.map(mapListing);
}

export async function getListing(id: string): Promise<Listing | null> {
  if (isDemoMode) return demo.demoListing(id);
  const [supabase, communityId] = await Promise.all([createClient(), getCommunityId()]);
  const { data } = await supabase
    .from("market_listings")
    .select(LISTING_FIELDS)
    .eq("community_id", communityId)
    .eq("id", id)
    .maybeSingle<ListingRow>();
  return data ? mapListing(data) : null;
}

/** WhatsApp de cada pessoa, só de quem escolheu compartilhar (a RLS também garante). */
export async function getSharedWhatsapps(userIds: string[]): Promise<Record<string, string | null>> {
  const ids = [...new Set(userIds)];
  if (!ids.length) return {};
  if (isDemoMode) {
    return Object.fromEntries(ids.map((id) => {
      const contact = demo.demoContact(id);
      return [id, contact.shareWhatsapp ? contact.whatsapp : null];
    }));
  }
  const supabase = await createClient();
  const { data } = await supabase.from("profile_contacts").select("user_id, whatsapp, share_whatsapp").in("user_id", ids);
  return Object.fromEntries(ids.map((id) => {
    const row = data?.find((c) => c.user_id === id);
    return [id, row?.share_whatsapp ? (row.whatsapp as string | null) : null];
  }));
}

/** WhatsApp do vendedor, só se ele escolheu compartilhar. */
export async function getSharedWhatsapp(userId: string): Promise<string | null> {
  return (await getSharedWhatsapps([userId]))[userId] ?? null;
}

/** Ofertas do anúncio: o vendedor vê todas, o comprador só as dele (a RLS decide). Em aberto primeiro. */
export async function getListingOffers(listingId: string): Promise<ListingOffer[]> {
  if (isDemoMode) return demo.demoOffers(listingId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listing_offers")
    .select(OFFER_FIELDS)
    .eq("listing_id", listingId)
    .order("updated_at", { ascending: false })
    .limit(50)
    .returns<OfferRow[]>();
  if (error) throw error;
  const open = (o: ListingOffer) => (o.status === "pending" || o.status === "countered" ? 0 : 1);
  return data.map(mapOffer).sort((a, b) => open(a) - open(b));
}

type DriftRow = {
  listing_id: string; card_name: string; variant: string | null; price_cents: number; price_base: PriceBase;
  price_base_cents: number; base_now_cents: number; discount_pct: number; expected_cents: number;
};

/** Anúncios do vendedor feitos pela regra (ex.: Liga −10%) cujo preço ficou longe do que a regra dá hoje. */
export async function getPriceDrift(userId: string): Promise<PriceDrift[]> {
  if (isDemoMode) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listing_price_drift")
    .select("listing_id, card_name, variant, price_cents, price_base, price_base_cents, base_now_cents, discount_pct, expected_cents")
    .eq("seller_id", userId)
    .eq("drifted", true)
    .order("card_name")
    .returns<DriftRow[]>();
  if (error) throw error;
  return data.map((r) => ({
    listingId: r.listing_id, cardName: r.card_name, variant: r.variant, priceCents: r.price_cents, base: r.price_base,
    baseCents: r.price_base_cents, baseNowCents: r.base_now_cents, discountPct: r.discount_pct, expectedCents: r.expected_cents,
  }));
}
