import type { Metadata } from "next";
import Link from "next/link";
import { BellOff, CheckCheck, MessagesSquare } from "lucide-react";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { chatHref } from "@/lib/domain/chat";
import { timeAgo } from "@/lib/format";
import { markAllNotificationsRead } from "@/server/actions/notifications";
import { getConversations } from "@/server/queries/chat";
import { getNotifications } from "@/server/queries/notifications";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Notificações" };

export default async function NotificationsPage() {
  const session = await requireSession();
  const [items, conversations] = await Promise.all([getNotifications(), getConversations(session.userId)]);
  // Mensagens novas vêm do chat (que tem a própria marcação de lida): abrir a conversa zera
  const chats = conversations.filter((c) => c.unread > 0);
  const unreadNotifications = items.filter((n) => !n.readAt).length;
  const unread = unreadNotifications + chats.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notificações"
        back="/"
        subtitle={unread ? `${unread} ${unread === 1 ? "nova" : "novas"}` : "Propostas e interações da galera com você."}
        action={unreadNotifications > 0 && (
          <form action={markAllNotificationsRead}>
            <button type="submit" className={buttonClass("secondary", "md")} aria-label="Marcar todas como lidas">
              <CheckCheck size={18} aria-hidden /><span className="hidden md:inline">Marcar todas como lidas</span>
            </button>
          </form>
        )}
      />
      {chats.length > 0 && (
        <ul className="mb-2.5 space-y-2.5" aria-label="Mensagens novas">
          {chats.map((c) => (
            <li key={`${c.listing.id}:${c.buyer.id}`}>
              <Link href={chatHref(c.listing.id, c.buyer.id)} className="card flex items-start gap-3 border-rift/50 bg-rift-soft/40 p-3.5 transition-colors hover:border-gold-line">
                <Avatar name={c.other.displayName} src={c.other.avatarUrl} size={42} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] leading-snug">
                    <strong className="font-semibold">{c.other.displayName}</strong>{" "}
                    {c.unread === 1 ? "te mandou uma mensagem" : `te mandou ${c.unread} mensagens`} sobre {c.listing.cardName}
                  </span>
                  <span className="mt-1 block truncate text-sm text-muted">“{c.last.body}”</span>
                  <span className="mt-1 block text-xs text-faint">{timeAgo(c.last.createdAt)}</span>
                </span>
                <MessagesSquare size={18} className="mt-1 shrink-0 text-rift" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {items.length ? (
        <ul className="space-y-2.5">
          {items.map((n) => <li key={n.id}><NotificationItem n={n} /></li>)}
        </ul>
      ) : chats.length === 0 && (
        <EmptyState icon={BellOff} title="Nada por aqui ainda." text="Quando alguém fizer uma oferta, responder a sua ou falar com você, aparece aqui." action={{ href: "/mercado", label: "Ir ao mercado" }} />
      )}
    </div>
  );
}
