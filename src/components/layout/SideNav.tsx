"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import type { MiniProfile } from "@/types/domain";
import { Logo } from "./Logo";
import { isActive, NAV_ITEMS } from "./nav-items";
import { PublishMenu } from "./PublishMenu";
import { RiftboundCredit } from "./RiftboundCredit";

/** Navegação lateral do desktop (≥1024px). */
export function SideNav({ me, isAdmin, isStore, unread }: { me: MiniProfile; isAdmin: boolean; isStore: boolean; unread: number }) {
  const path = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-gold-line/40 bg-linear-to-b from-surface/60 to-bg px-4 py-6 lg:flex">
      <Link href="/" className="mb-8 px-3" aria-label="Riftzada, início">
        <Logo />
      </Link>
      <nav aria-label="Principal">
        <ul className="space-y-1">
          {NAV_ITEMS.map((it) => {
            const active = isActive(path, it.href, "exact" in it ? it.exact : false);
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-12 items-center gap-3 rounded-md px-3 font-display text-lg font-semibold tracking-wide uppercase transition-colors",
                    active
                      ? "bg-linear-to-r from-gold-soft to-transparent text-gold-strong before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-gold"
                      : "text-muted hover:bg-surface hover:text-ink",
                  )}
                >
                  <it.icon size={21} className={active ? "text-gold" : undefined} aria-hidden />
                  {it.label}
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              href="/notificacoes"
              aria-current={path === "/notificacoes" ? "page" : undefined}
              className={cn(
                "relative flex min-h-12 items-center gap-3 rounded-md px-3 font-display text-lg font-semibold tracking-wide uppercase transition-colors",
                path === "/notificacoes"
                  ? "bg-linear-to-r from-gold-soft to-transparent text-gold-strong before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-gold"
                  : "text-muted hover:bg-surface hover:text-ink",
              )}
            >
              <Bell size={21} className={path === "/notificacoes" ? "text-gold" : undefined} aria-hidden />
              Avisos
              {unread > 0 && (
                <span className="ml-auto rounded-full bg-rift px-2 font-sans text-xs leading-5 font-bold text-on-rift">
                  {unread > 9 ? "9+" : unread}<span className="sr-only"> não {unread === 1 ? "lida" : "lidas"}</span>
                </span>
              )}
            </Link>
          </li>
        </ul>
      </nav>
      <div className="mt-6">
        <PublishMenu isAdmin={isAdmin} isStore={isStore} variant="sidebar" />
      </div>
      <div className="mt-auto space-y-3">
        <RiftboundCredit className="px-3" />
        {isAdmin && (
          <Link href="/admin" className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-muted hover:bg-surface hover:text-ink">
            <Shield size={19} aria-hidden /> Painel admin
          </Link>
        )}
        <div className="flex items-center gap-3 rounded-md border border-line bg-surface p-2.5">
          <Avatar name={me.displayName} src={me.avatarUrl} size={36} />
          <Link href={`/jogador/${me.username}`} className="min-w-0 flex-1 hover:underline">
            <span className="block truncate text-sm font-semibold">{me.displayName}</span>
            <span className="block truncate text-xs text-muted">@{me.username}</span>
          </Link>
          <form action="/auth/sair" method="post">
            <button type="submit" aria-label="Sair" className="inline-flex size-9 items-center justify-center rounded-full text-faint hover:bg-surface-2 hover:text-ink">
              <LogOut size={18} aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
