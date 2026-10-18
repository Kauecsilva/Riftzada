// Conversas do mercado no modo demonstração.

import type { ChatMessageRow } from "@/lib/domain/chat";
import { resolveRelDate } from "./dates";
import { demoMessages } from "./fixtures";
import { DEMO_USER_ID, demoListing, demoProfileById } from "./store";

/** Mensagens das conversas do usuário demo (mais novas primeiro), no formato que a tela de conversas agrupa. */
export function demoChatMessages(): ChatMessageRow[] {
  return demoMessages
    .map((m) => {
      const l = demoListing(m.listingId)!;
      const { id, username, displayName, avatarUrl } = demoProfileById(m.buyerId)!;
      return {
        id: m.id, senderId: m.senderId, body: m.body, createdAt: resolveRelDate(m.createdAt), read: m.read,
        buyer: { id, username, displayName, avatarUrl },
        listing: { id: l.id, cardName: l.cardName, kind: l.kind, imageUrl: l.card?.imageUrl ?? l.imageUrl, seller: l.seller },
      };
    })
    .filter((m) => m.buyer.id === DEMO_USER_ID || m.listing.seller.id === DEMO_USER_ID)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
