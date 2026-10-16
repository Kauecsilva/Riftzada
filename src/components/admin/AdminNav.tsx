"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { href: "/admin/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/admin/moderacao", label: "Moderação", icon: ShieldCheck },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/ranking", label: "Ranking", icon: BarChart3 },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Painel" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
      <ul className="flex w-max gap-1">
        {LINKS.map((l) => {
          const active = l.exact ? path === l.href : path.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link href={l.href} aria-current={active ? "page" : undefined}
                className={cn("inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-sm font-semibold", active ? "bg-gold text-[#1d1606]" : "text-muted hover:bg-surface-2 hover:text-ink")}>
                <l.icon size={16} aria-hidden /> {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
