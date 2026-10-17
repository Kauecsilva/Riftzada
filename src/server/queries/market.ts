import "server-only";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import * as demo from "@/lib/demo/store";
import type { Listing, ListingKind, ListingOffer } from "@/types/domain";
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

/** WhatsApp do vendedor, só se ele escolheu compartilhar (a RLS também garante). */
export async function getSharedWhatsapp(userId: string): Promise<string | null> {
  if (isDemoMode) {
    const contact = demo.demoContact(userId);
    return contact.shareWhatsapp ? contact.whatsapp : null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_contacts")
    .select("whatsapp, share_whatsapp")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.share_whatsapp ? data.whatsapp : null;
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
