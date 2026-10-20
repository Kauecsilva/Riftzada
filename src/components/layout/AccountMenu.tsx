"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Library, Lightbulb, LogOut, Shield, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import type { MiniProfile } from "@/types/domain";
import { ThemeToggle } from "./ThemeToggle";

const ROW = "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold hover:bg-surface-2";

/** Opções da conta, iguais no menu do desktop e na folha do celular. */
export function AccountLinks({ me, isAdmin, onNavigate }: { me: MiniProfile; isAdmin: boolean; onNavigate: () => void }) {
  return (
    <div className="space-y-1">
      <Link href={`/jogador/${me.username}`} onClick={onNavigate} className={ROW}><UserRound size={19} aria-hidden /> Meu perfil</Link>
      <Link href="/colecao" onClick={onNavigate} className={ROW}><Library size={19} aria-hidden /> Minha coleção</Link>
      <Link href="/sugestao" onClick={onNavigate} className={ROW}><Lightbulb size={19} aria-hidden /> Sugerir melhoria</Link>
      <ThemeToggle />
      {isAdmin && <Link href="/admin" onClick={onNavigate} className={ROW}><Shield size={19} aria-hidden /> Painel admin</Link>}
      <form action="/auth/sair" method="post" className="border-t border-line pt-2">
        <button type="submit" className={ROW}><LogOut size={19} aria-hidden /> Sair</button>
      </form>
    </div>
  );
}

/** Desktop: abre ao passar o mouse e também ao clicar ou tocar (telas de toque não têm hover). */
export function AccountMenu({ me, isAdmin }: { me: MiniProfile; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const openedByHover = useRef(false);
  const panelId = useId();

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Só o mouse abre por hover; no toque o pointerenter viria antes do clique e o menu fecharia na hora.
  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(closeTimer.current);
    if (!open) openedByHover.current = true;
    setOpen(true);
  };
  const onPointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    closeTimer.current = setTimeout(() => {
      openedByHover.current = false;
      setOpen(false);
    }, 200);
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          // O clique logo depois do hover mantém o menu aberto em vez de fechá-lo.
          if (openedByHover.current) openedByHover.current = false;
          else setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Menu da conta de ${me.displayName}`}
        className={cn("inline-flex min-h-11 items-center gap-2 rounded-lg px-1.5 hover:bg-white/10", open && "bg-white/10")}
      >
        <Avatar name={me.displayName} src={me.avatarUrl} size={32} />
        <span className="hidden max-w-24 truncate text-sm font-semibold xl:block">{me.displayName}</span>
        <ChevronDown size={16} aria-hidden className={cn("text-[#d5c9da] transition-transform", open && "rotate-180")} />
      </button>
      {/* O pt-2 cobre o vão entre botão e painel para o hover não cair no caminho. */}
      <div id={panelId} hidden={!open} className="absolute top-full right-0 z-50 w-64 pt-2">
        <div className="rounded-xl border border-line bg-surface p-2 text-ink shadow-[0_18px_40px_rgb(28_17_43/0.28)]">
          <p className="truncate border-b border-line px-3 pt-1 pb-2.5 text-sm font-bold">{me.displayName}</p>
          <div className="pt-1">
            <AccountLinks me={me} isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  );
}
