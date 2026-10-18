"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isActive, NAV_ITEMS } from "./nav-items";
import { PublishMenu } from "./PublishMenu";

/** Barra inferior do celular: Home, Arena, +, Mercado, Perfil. */
export function BottomNav({ isAdmin, isStore, unread }: { isAdmin: boolean; isStore: boolean; unread: number }) {
  const path = usePathname();
  const [home, arena, market, profile] = NAV_ITEMS;

  // O sininho fica no topo da Home; aqui só um ponto avisando que tem novidade
  const item = (it: (typeof NAV_ITEMS)[number], dot = false) => {
    const active = isActive(path, it.href, "exact" in it ? it.exact : false);
    return (
      <li className="flex-1">
        <Link
          href={it.href}
          aria-current={active ? "page" : undefined}
          className={cn("flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors", active ? "text-gold-strong" : "text-faint hover:text-muted")}
        >
          <span className="relative">
            <it.icon size={23} strokeWidth={active ? 2.4 : 2} className={active ? "text-gold" : undefined} aria-hidden />
            {dot && <span className="absolute -top-0.5 -right-1 size-2.5 rounded-full bg-rift ring-2 ring-bg" aria-hidden />}
          </span>
          {it.label}
          {dot && <span className="sr-only">(notificações novas)</span>}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Principal" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-gold-line/50 bg-bg/90 backdrop-blur-xl lg:hidden">
      <ul className="mx-auto flex max-w-lg items-end px-2">
        {item(home, unread > 0)}
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
