"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isActive, NAV_ITEMS, unreadLabel } from "./nav-items";
import { PublishMenu } from "./PublishMenu";

/** Barra inferior do celular: Home, Arena, +, Mercado, Perfil. */
export function BottomNav({ isAdmin, isStore, unread }: { isAdmin: boolean; isStore: boolean; unread: number }) {
  const path = usePathname();
  const [home, arena, market, profile] = NAV_ITEMS;

  const item = (it: (typeof NAV_ITEMS)[number]) => {
    const active = isActive(path, it.href, "exact" in it ? it.exact : false);
    const badge = it.href === "/mercado" ? unreadLabel(unread) : null;
    return (
      <li className="flex-1">
        <Link
          href={it.href}
          aria-current={active ? "page" : undefined}
          className={cn("flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors", active ? "text-gold-strong" : "text-faint hover:text-muted")}
        >
          <span className="relative">
            <it.icon size={23} strokeWidth={active ? 2.4 : 2} className={active ? "text-gold" : undefined} aria-hidden />
            {badge && <span className="absolute -top-1.5 -right-2.5 min-w-4 rounded-full bg-gold px-1 text-center text-[10px] leading-4 font-bold text-bg">{badge}</span>}
          </span>
          {it.label}
          {badge && <span className="sr-only">, {badge} mensagens não lidas</span>}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Principal" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-gold-line/50 bg-bg/90 backdrop-blur-xl lg:hidden">
      <ul className="mx-auto flex max-w-lg items-end px-2">
        {item(home)}
        {item(arena)}
        <li className="flex flex-1 justify-center">
          <PublishMenu isAdmin={isAdmin} isStore={isStore} variant="fab" />
        </li>
        {item(market)}
        {item(profile)}
      </ul>
    </nav>
  );
}
