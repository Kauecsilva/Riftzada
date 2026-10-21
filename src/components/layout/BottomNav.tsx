"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";
import { cn } from "@/lib/cn";
import { isActive, NAV_ITEMS, signInHref } from "./nav-items";
import { PublishMenu } from "./PublishMenu";

/** Navegação principal do celular, sempre visível acima da área segura. Visitante tem Entrar no lugar de Publicar. */
export function BottomNav({ isAdmin, isStore, visitor = false }: { isAdmin: boolean; isStore: boolean; visitor?: boolean }) {
  const path = usePathname();
  const [home, arena, market, profile] = NAV_ITEMS;

  const item = (it: (typeof NAV_ITEMS)[number]) => {
    const active = isActive(path, it.href, "exact" in it ? it.exact : false);
    return (
      <li key={it.href} className="min-w-0 flex-1">
        <Link
          href={it.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "relative flex min-h-[62px] flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-semibold transition-colors",
            active ? "text-rift" : "text-muted hover:text-rift-strong",
          )}
        >
          {active && <span className="absolute top-0 h-0.5 w-7 rounded-full bg-rift" aria-hidden />}
          <it.icon size={21} strokeWidth={active ? 2.25 : 1.8} aria-hidden />
          {it.label}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Principal" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 shadow-[0_-8px_24px_rgb(47_29_56/0.10)] backdrop-blur-xl lg:hidden">
      <ul className="mx-auto flex max-w-lg items-center px-2">
        {item(home)}
        {item(arena)}
        {visitor ? (
          <li className="min-w-0 flex-1">
            <Link href={signInHref(path)} className="flex min-h-[62px] flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-semibold text-rift hover:text-rift-strong">
              <LogIn size={21} strokeWidth={2.25} aria-hidden />
              Entrar
            </Link>
          </li>
        ) : (
          <li className="flex min-w-0 flex-1 justify-center"><PublishMenu isAdmin={isAdmin} isStore={isStore} variant="fab" /></li>
        )}
        {item(market)}
        {item(profile)}
      </ul>
    </nav>
  );
}
