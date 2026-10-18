import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { notificationText } from "@/lib/domain/notifications";
import { timeAgo } from "@/lib/format";
import { openNotification } from "@/server/actions/notifications";
import type { AppNotification } from "@/types/domain";

/** Um aviso: quem fez, o quê, quando. Tocar marca como lido e abre o anúncio. */
export function NotificationItem({ n }: { n: AppNotification }) {
  const unread = !n.readAt;
  const who = n.actor?.displayName ?? "Alguém";
  return (
    <form action={openNotification}>
      <input type="hidden" name="id" value={n.id} />
      <input type="hidden" name="listingId" value={n.listingId ?? ""} />
      <button
        type="submit"
        className={cn(
          "card flex w-full items-start gap-3 p-3.5 text-left transition-colors hover:border-gold-line",
          unread && "border-rift/50 bg-rift-soft/40",
        )}
      >
        <Avatar name={who} src={n.actor?.avatarUrl ?? null} size={42} />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] leading-snug">
            <strong className="font-semibold">{who}</strong> {notificationText(n)}
          </span>
          {n.body && <span className="mt-1 block truncate text-sm text-muted">“{n.body}”</span>}
          <span className="mt-1 block text-xs text-faint">{timeAgo(n.createdAt)}</span>
        </span>
        {unread && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-rift"><span className="sr-only">Não lida</span></span>}
      </button>
    </form>
  );
}
