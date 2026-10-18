import "server-only";
import { cache } from "react";
import { cardImageUrl } from "@/lib/cards";
import { groupConversations, type ChatMessageRow } from "@/lib/domain/chat";
import { isDemoMode } from "@/lib/env";
import { mediaUrl } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";
import { demoChatMessages } from "@/lib/demo/chat";
import type { Conversation, ListingKind, ListingMessage } from "@/types/domain";
import { mapMini, MINI, type MiniRow } from "./mappers";

// A RLS só devolve as conversas em que a pessoa é uma das pontas.
const MESSAGE_FIELDS = `id, sender_id, body, read_at, created_at, buyer:profiles!listing_messages_buyer_id_fkey(${MINI}),
  listing:market_listings!inner(id, card_name, kind, image_path, card:cards!market_listings_card_id_fkey(image_url), seller:profiles!market_listings_seller_id_fkey(${MINI}))`;
type MessageRow = {
  id: string; sender_id: string; body: string; read_at: string | null; created_at: string; buyer: MiniRow;
  listing: { id: string; card_name: string; kind: ListingKind; image_path: string | null; card: { image_url: string | null } | null; seller: MiniRow };
};

function mapRow(row: MessageRow): ChatMessageRow {
  return {
    id: row.id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    read: row.read_at != null,
    buyer: mapMini(row.buyer),
    listing: {
      id: row.listing.id,
      cardName: row.listing.card_name,
      kind: row.listing.kind,
      imageUrl: (row.listing.card && cardImageUrl(row.listing.card.image_url)) ?? mediaUrl(row.listing.image_path),
      seller: mapMini(row.listing.seller),
    },
  };
}

/** Conversas do usuário, a mais recente primeiro. */
export async function getConversations(userId: string): Promise<Conversation[]> {
  if (isDemoMode) return groupConversations(demoChatMessages(), userId);
  const supabase = await createClient();
  // shortcut: agrupa as últimas 500 mensagens no servidor; com muito volume, trocar por uma view com a última de cada conversa.
  const { data, error } = await supabase
    .from("listing_messages")
    .select(MESSAGE_FIELDS)
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<MessageRow[]>();
  if (error) throw error;
  return groupConversations(data.map(mapRow), userId);
}

/** Mensagens de uma conversa, da mais antiga para a mais nova. Vazio se a pessoa não é uma das pontas. */
export async function getChatMessages(listingId: string, buyerId: string): Promise<ListingMessage[]> {
  if (isDemoMode) {
    return demoChatMessages()
      .filter((m) => m.listing.id === listingId && m.buyer.id === buyerId)
      .reverse()
      .map(({ id, senderId, body, createdAt }) => ({ id, senderId, body, createdAt }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listing_messages")
    .select("id, sender_id, body, created_at")
    .eq("listing_id", listingId)
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: true })
    .limit(300);
  if (error) throw error;
  return data.map((m) => ({ id: m.id as string, senderId: m.sender_id as string, body: m.body as string, createdAt: m.created_at as string }));
}

/** Mensagens que a outra ponta mandou e a pessoa ainda não abriu (uma consulta por requisição: menu e página usam). */
export const getUnreadCount = cache(async (userId: string): Promise<number> => {
  if (isDemoMode) return demoChatMessages().filter((m) => !m.read && m.senderId !== userId).length;
  const supabase = await createClient();
  const { count } = await supabase
    .from("listing_messages")
    .select("id", { count: "exact", head: true })
    .is("read_at", null)
    .neq("sender_id", userId);
  return count ?? 0;
});
