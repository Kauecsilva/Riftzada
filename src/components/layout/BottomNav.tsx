"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isActive, NAV_ITEMS } from "./nav-items";
import { PublishMenu } from "./PublishMenu";

/** Barra inferior do celular: Home, Arena, +, Mercado, Perfil. */
export function BottomNav({ isAdmin, isStore }: { isAdmin: boolean; isStore: boolean }) {
  const path = usePathname();
  const [home, arena, market, profile] = NAV_ITEMS;

  const item = (it: (typeof NAV_ITEMS)[number]) => {
    const active = isActive(path, it.href, "exact" in it ? it.exact : false);
    return (
      <li className="flex-1">
        <Link
          href={it.href}
          aria-current={active ? "page" : undefined}
          className={cn("flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors", active ? "text-gold-strong" : "text-faint hover:text-muted")}
        >
          <it.icon size={23} strokeWidth={active ? 2.4 : 2} className={active ? "text-gold" : undefined} aria-hidden />
          {it.label}
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
