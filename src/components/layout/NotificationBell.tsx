import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";

/** Sininho com o número de avisos não lidos. Leva para /notificacoes. */
export function NotificationBell({ unread, className }: { unread: number; className?: string }) {
  const label = unread ? `Notificações, ${unread} não ${unread === 1 ? "lida" : "lidas"}` : "Notificações";
  return (
    <Link href="/notificacoes" aria-label={label} className={cn("relative inline-flex size-11 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink", className)}>
      <Bell size={22} aria-hidden />
      {unread > 0 && (
        <span aria-hidden className="absolute top-1 right-1 flex min-w-5 items-center justify-center rounded-full bg-rift px-1 text-[11px] leading-5 font-bold text-on-rift ring-2 ring-bg">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
