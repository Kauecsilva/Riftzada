"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import type { MiniProfile } from "@/types/domain";
import { Logo } from "./Logo";
import { isActive, NAV_ITEMS } from "./nav-items";
import { PublishMenu } from "./PublishMenu";

/** Navegação lateral do desktop (≥1024px). */
export function SideNav({ me, isAdmin }: { me: MiniProfile; isAdmin: boolean }) {
  const path = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line px-4 py-6 lg:flex">
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
                  className={cn("flex min-h-12 items-center gap-3 rounded-2xl px-3 font-semibold transition-colors", active ? "bg-surface-2 text-ink" : "text-muted hover:bg-surface hover:text-ink")}
                >
                  <it.icon size={22} className={active ? "text-rift-strong" : undefined} aria-hidden />
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-6">
        <PublishMenu isAdmin={isAdmin} variant="sidebar" />
      </div>
      <div className="mt-auto space-y-1">
        {isAdmin && (
          <Link href="/admin" className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-muted hover:bg-surface hover:text-ink">
            <Shield size={19} aria-hidden /> Painel admin
          </Link>
        )}
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
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
