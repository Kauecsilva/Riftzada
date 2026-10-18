// Agrupa mensagens do mercado em conversas (anúncio + pessoa interessada).

import type { Conversation, MiniProfile } from "@/types/domain";

/** Uma mensagem com o anúncio e o interessado já resolvidos. */
export type ChatMessageRow = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  read: boolean;
  buyer: MiniProfile;
  listing: Conversation["listing"];
};

/** Recebe as mensagens da mais nova para a mais antiga; devolve uma conversa por par, a mais recente primeiro. */
export function groupConversations(rows: ChatMessageRow[], me: string): Conversation[] {
  const byKey = new Map<string, Conversation>();
  for (const row of rows) {
    const key = `${row.listing.id}:${row.buyer.id}`;
    let conv = byKey.get(key);
    if (!conv) {
      const other = row.buyer.id === me ? row.listing.seller : row.buyer;
      conv = { listing: row.listing, buyer: row.buyer, other, unread: 0, last: { id: row.id, senderId: row.senderId, body: row.body, createdAt: row.createdAt } };
      byKey.set(key, conv);
    }
    if (!row.read && row.senderId !== me) conv.unread += 1;
  }
  return [...byKey.values()];
}

/** Endereço da conversa; serve para as duas pontas. */
export function chatHref(listingId: string, buyerId: string): string {
  return `/mensagens/${listingId}/${buyerId}`;
}
