import "server-only";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import * as demo from "@/lib/demo/store";
import type { DeckDetail, DeckSummary } from "@/types/domain";
import { getCommunityId } from "../session";
import { DECK_FIELDS, mapDeck, toDeckSummary, type DeckRow } from "./mappers";

export async function getDecks(opts: { authorId?: string; ids?: string[]; limit?: number } = {}): Promise<DeckSummary[]> {
  if (isDemoMode) {
    return demo
      .demoDecksList(opts.authorId)
      .filter((d) => !opts.ids || opts.ids.includes(d.id))
      .slice(0, opts.limit ?? 50);
  }
  if (opts.ids && opts.ids.length === 0) return [];
  const [supabase, communityId] = await Promise.all([createClient(), getCommunityId()]);
  // A RLS já esconde os privados de quem não é o autor; aqui a listagem mostra só os públicos
  let query = supabase.from("decks").select(DECK_FIELDS).eq("community_id", communityId);
  if (opts.authorId) query = query.eq("author_id", opts.authorId);
  if (opts.ids) query = query.in("id", opts.ids);
  else query = query.eq("visibility", "public");
  const { data, error } = await query.order("created_at", { ascending: false }).limit(opts.limit ?? 50).returns<DeckRow[]>();
  if (error) throw error;
  return data.map((row) => toDeckSummary(mapDeck(row)));
}

export async function getDeck(id: string): Promise<DeckDetail | null> {
  if (isDemoMode) return demo.demoDeck(id);
  const [supabase, communityId] = await Promise.all([createClient(), getCommunityId()]);
  const { data } = await supabase
    .from("decks")
    .select(DECK_FIELDS)
    .eq("community_id", communityId)
    .eq("id", id)
    .maybeSingle<DeckRow>();
  return data ? mapDeck(data) : null;
}
