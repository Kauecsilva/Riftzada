"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Library, LogOut, Shield, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import type { MiniProfile } from "@/types/domain";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { isActive, NAV_ITEMS } from "./nav-items";
import { PublishMenu } from "./PublishMenu";
import { ThemeToggle } from "./ThemeToggle";

/** Masthead da comunidade: navegação completa no desktop e conta acessível no celular. */
export function SideNav({ me, isAdmin, isStore, unread }: { me: MiniProfile; isAdmin: boolean; isStore: boolean; unread: number }) {
  const path = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#4e3b5e] bg-[#211a32] text-[#f8f3e9] shadow-[0_8px_28px_rgb(28_17_43/0.13)]">
        <div className="mx-auto flex h-[68px] w-full max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6 lg:h-[76px] lg:gap-8 lg:px-10">
          <Link href="/" className="inline-flex min-h-11 shrink-0 items-center" aria-label="Riftzada, início">
            <Logo tone="light" size={30} />
          </Link>

          <nav aria-label="Principal" className="hidden min-w-0 flex-1 lg:block">
            <ul className="flex items-center justify-center gap-1">
              {NAV_ITEMS.map((it) => {
                const active = isActive(path, it.href, "exact" in it ? it.exact : false);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex min-h-11 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors",
                        active ? "bg-surface text-rift" : "text-[#d5c9da] hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <it.icon size={18} strokeWidth={active ? 2.25 : 1.9} aria-hidden />
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <PublishMenu isAdmin={isAdmin} isStore={isStore} variant="header" />
            <NotificationBell unread={unread} className="text-[#d5c9da] hover:bg-white/10 hover:text-white" />
            <ThemeToggle />
            {isAdmin && (
              <Link href="/admin" aria-label="Painel admin" title="Painel admin" className="inline-flex size-11 items-center justify-center rounded-lg text-[#d5c9da] hover:bg-white/10 hover:text-white">
                <Shield size={19} aria-hidden />
              </Link>
            )}
            <Link href={`/jogador/${me.username}`} aria-label={`Perfil de ${me.displayName}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1.5 hover:bg-white/10">
              <Avatar name={me.displayName} src={me.avatarUrl} size={32} />
              <span className="hidden max-w-24 truncate text-sm font-semibold xl:block">{me.displayName}</span>
            </Link>
            <form action="/auth/sair" method="post">
              <button type="submit" aria-label="Sair" title="Sair" className="inline-flex size-11 items-center justify-center rounded-lg text-[#d5c9da] hover:bg-white/10 hover:text-white">
                <LogOut size={19} aria-hidden />
              </button>
            </form>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <NotificationBell unread={unread} className="text-[#d5c9da] hover:bg-white/10 hover:text-white" />
            <button type="button" onClick={() => setAccountOpen(true)} aria-label="Abrir menu da conta" aria-haspopup="dialog" className="inline-flex size-11 items-center justify-center rounded-full border border-[#9e84ae] bg-[#40304f]">
              <Avatar name={me.displayName} src={me.avatarUrl} size={32} />
            </button>
          </div>
        </div>
      </header>
      <Sheet open={accountOpen} onClose={() => setAccountOpen(false)} title="Sua conta">
        <div className="space-y-1">
          <p className="mb-3 border-b border-line pb-3 text-sm font-bold">{me.displayName}</p>
          <Link href={`/jogador/${me.username}`} onClick={() => setAccountOpen(false)} className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold hover:bg-surface-2"><UserRound size={19} aria-hidden /> Meu perfil</Link>
          <Link href="/colecao" onClick={() => setAccountOpen(false)} className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold hover:bg-surface-2"><Library size={19} aria-hidden /> Minha coleção</Link>
          <ThemeToggle variant="row" />
          {isAdmin && <Link href="/admin" onClick={() => setAccountOpen(false)} className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold hover:bg-surface-2"><Shield size={19} aria-hidden /> Painel admin</Link>}
          <form action="/auth/sair" method="post" className="border-t border-line pt-2">
            <button type="submit" className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold hover:bg-surface-2"><LogOut size={19} aria-hidden /> Sair</button>
          </form>
        </div>
      </Sheet>
    </>
  );
}
