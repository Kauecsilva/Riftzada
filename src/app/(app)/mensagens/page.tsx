import type { Metadata } from "next";
import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { CardThumb } from "@/components/cards/CardThumb";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";
import { chatHref } from "@/lib/domain/chat";
import { timeAgo } from "@/lib/format";
import { getConversations } from "@/server/queries/chat";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Conversas" };

export default async function ConversationsPage() {
  const session = await requireSession();
  const conversations = await getConversations(session.userId);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Conversas" subtitle="Papo do mercado: quem te chamou e quem você chamou." back="/mercado" />
      {conversations.length === 0 ? (
        <EmptyState icon={MessagesSquare} title="Nenhuma conversa ainda." text="Abre um anúncio e toca em “Conversar” para chamar quem anunciou." action={{ href: "/mercado", label: "Ir para o Mercado" }} />
      ) : (
        <ul className="card divide-y divide-line">
          {conversations.map((c) => {
            const mine = c.last.senderId === session.userId;
            return (
              <li key={`${c.listing.id}:${c.buyer.id}`}>
                <Link href={chatHref(c.listing.id, c.buyer.id)} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
                  <Avatar name={c.other.displayName} src={c.other.avatarUrl} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn("truncate", c.unread ? "font-bold" : "font-semibold")}>{c.other.displayName}</span>
                      <time dateTime={c.last.createdAt} className="shrink-0 text-xs text-faint">{timeAgo(c.last.createdAt)}</time>
                    </span>
                    <span className="block truncate text-xs text-muted">{c.listing.cardName}</span>
                    <span className={cn("block truncate text-sm", c.unread ? "text-ink" : "text-muted")}>{mine && "Você: "}{c.last.body}</span>
                  </span>
                  {c.unread > 0 && (
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-bg" aria-label={`${c.unread} não lidas`}>{c.unread}</span>
                  )}
                  <CardThumb card={{ name: c.listing.cardName, imageUrl: c.listing.imageUrl }} width={32} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
