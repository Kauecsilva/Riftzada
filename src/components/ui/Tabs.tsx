"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChartNoAxesCombined, Crown, ScrollText, Store } from "lucide-react";
import { cn } from "@/lib/cn";

const arenaIcons = {
  "/arena": CalendarDays,
  "/arena/lojas": Store,
  "/arena/resultados": ScrollText,
  "/arena/ranking": ChartNoAxesCombined,
  "/arena/hall": Crown,
} as const;

/** Abas de navegação com as cinco rotas da Arena acessíveis no celular. */
export function Tabs({ items, label }: { items: { href: string; label: string; exact?: boolean }[]; label: string }) {
  const path = usePathname();
  return (
    <nav aria-label={label} className="mb-6">
      <ul className={cn("gap-1 rounded-md border border-gold-line/80 bg-surface p-1 shadow-[0_5px_16px_-12px_rgb(40_20_51/0.4)]", items.length === 5 ? "grid grid-cols-6 md:flex" : "flex flex-wrap")}>
        {items.map((item, index) => {
          const active = item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`);
          const Icon = arenaIcons[item.href as keyof typeof arenaIcons];
          return (
            <li key={item.href} className={cn("min-w-0 flex-auto", items.length === 5 && (index < 3 ? "col-span-2" : "col-span-3"))}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-[3px] px-1.5 text-[13px] font-bold transition-colors md:px-3 md:text-sm",
                  active ? "bg-rift text-on-rift shadow-[inset_0_0_0_1px_rgb(231_193_132/0.55)]" : "text-muted hover:bg-rift-soft hover:text-rift",
                )}
              >
                {Icon && <Icon size={15} strokeWidth={1.8} className="shrink-0" aria-hidden />}
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
