import "server-only";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import * as demo from "@/lib/demo/store";
import type { CardCondition, CollectionItem, ListingStatus } from "@/types/domain";
import { CARD_FIELDS, mapCard, type CardRow } from "./mappers";

const COLLECTION_FIELDS = `id, quantity, condition, variant, notes, created_at,
  card:cards!collection_items_card_id_fkey(${CARD_FIELDS}),
  listings:market_listings!market_listings_collection_item_id_fkey(id, status)`;

type CollectionRow = {
  id: string; quantity: number; condition: CardCondition; variant: string | null; notes: string | null; created_at: string;
  card: CardRow; listings: { id: string; status: ListingStatus }[];
};

function mapItem(row: CollectionRow): CollectionItem {
  return {
    id: row.id,
    card: mapCard(row.card),
    quantity: row.quantity,
    condition: row.condition,
    variant: row.variant,
    notes: row.notes,
    listing: row.listings.find((l) => l.status !== "done") ?? null,
  };
}

/** Coleção de quem está logado (a RLS só deixa o dono ler). */
export async function getCollection(userId: string): Promise<CollectionItem[]> {
  if (isDemoMode) return demo.demoCollectionList(userId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collection_items")
    .select(COLLECTION_FIELDS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<CollectionRow[]>();
  if (error) throw error;
  return data.map(mapItem);
}

export async function getCollectionItem(userId: string, id: string): Promise<CollectionItem | null> {
  if (isDemoMode) return demo.demoCollectionList(userId).find((i) => i.id === id) ?? null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("collection_items")
    .select(COLLECTION_FIELDS)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle<CollectionRow>();
  return data ? mapItem(data) : null;
}
