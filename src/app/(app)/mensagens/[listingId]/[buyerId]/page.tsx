import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { ChatThread } from "@/components/chat/ChatThread";
import { CardThumb } from "@/components/cards/CardThumb";
import { KindTag } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { buttonClass } from "@/components/ui/button";
import { listingImageUrl } from "@/lib/cards";
import { whatsappLink } from "@/lib/domain/offers";
import { formatPrice } from "@/lib/format";
import { getChatMessages, getConversations } from "@/server/queries/chat";
import { getListing, getSharedWhatsapp } from "@/server/queries/market";
import { getProfileById } from "@/server/queries/profiles";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Conversa" };

/** Conversa entre quem anunciou e uma pessoa interessada. As duas pontas usam este endereço. */
export default async function ChatPage({ params }: PageProps<"/mensagens/[listingId]/[buyerId]">) {
  const [{ listingId, buyerId }, session] = await Promise.all([params, requireSession()]);
  const listing = await getListing(listingId);
  if (!listing) notFound();
  const sellerView = listing.seller.id === session.userId;
  if (sellerView ? buyerId === session.userId : buyerId !== session.userId) notFound();

  const [buyer, messages, conversations, whatsapp] = await Promise.all([
    sellerView ? getProfileById(buyerId) : session.profile,
    getChatMessages(listingId, buyerId),
    getConversations(session.userId),
    // Comprador vê o WhatsApp do vendedor; o vendedor, o do comprador (se compartilham)
    getSharedWhatsapp(sellerView ? buyerId : listing.seller.id),
  ]);
  if (!buyer) notFound();
  const other = sellerView ? buyer : listing.seller;
  const unread = conversations.find((c) => c.listing.id === listingId && c.buyer.id === buyerId)?.unread ?? 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={other.displayName} subtitle={`Sobre ${listing.cardName}`} back="/mensagens" />
      <Link href={`/mercado/${listing.id}`} className="card mb-5 flex items-center gap-3 p-3 transition-colors hover:bg-surface-2">
        <CardThumb card={{ name: listing.cardName, imageUrl: listingImageUrl(listing) }} width={44} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{listing.cardName}</span>
          <span className="mt-1 flex items-center gap-2 text-sm text-muted">
            <KindTag kind={listing.kind} />
            {listing.priceCents != null && formatPrice(listing.priceCents)}
          </span>
        </span>
        <span className="text-sm text-muted">Ver anúncio</span>
      </Link>
      {whatsapp && (
        <a href={whatsappLink(whatsapp, `Oi ${other.displayName}! Sobre o anúncio de ${listing.cardName} no Riftzada:`)}
          target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md", "mb-5 w-full")}>
          <MessageCircle size={18} aria-hidden /> Continuar no WhatsApp
        </a>
      )}
      <ChatThread listingId={listingId} buyerId={buyerId} me={session.userId} otherName={other.displayName} messages={messages} hasUnread={unread > 0} />
    </div>
  );
}
