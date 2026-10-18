import type { Metadata } from "next";
import { BellOff, CheckCheck } from "lucide-react";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { markAllNotificationsRead } from "@/server/actions/notifications";
import { getNotifications } from "@/server/queries/notifications";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Notificações" };

export default async function NotificationsPage() {
  await requireSession();
  const items = await getNotifications();
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notificações"
        back="/"
        subtitle={unread ? `${unread} ${unread === 1 ? "nova" : "novas"}` : "Propostas e interações da galera com você."}
        action={unread > 0 && (
          <form action={markAllNotificationsRead}>
            <button type="submit" className={buttonClass("secondary", "md")} aria-label="Marcar todas como lidas">
              <CheckCheck size={18} aria-hidden /><span className="hidden md:inline">Marcar todas como lidas</span>
            </button>
          </form>
        )}
      />
      {items.length ? (
        <ul className="space-y-2.5">
          {items.map((n) => <li key={n.id}><NotificationItem n={n} /></li>)}
        </ul>
      ) : (
        <EmptyState icon={BellOff} title="Nada por aqui ainda." text="Quando alguém fizer uma oferta, responder a sua ou falar com você, aparece aqui." action={{ href: "/mercado", label: "Ir ao mercado" }} />
      )}
    </div>
  );
}
