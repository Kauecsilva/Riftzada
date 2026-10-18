"use client";

import Link from "next/link";
import { useState } from "react";
import { Camera, CalendarPlus, Library, Lightbulb, Plus, Tag, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";
import { Sheet } from "@/components/ui/Sheet";

const OPTIONS = [
  { href: "/publicar", label: "Publicar no mural", text: "Foto, resenha ou o pull da semana", icon: Camera, tone: "bg-rift-soft text-rift-strong" },
  { href: "/mercado/novo", label: "Anunciar carta", text: "Vende, troca ou procura", icon: Tag, tone: "bg-sell/15 text-sell" },
  { href: "/colecao", label: "Registrar na coleção", text: "Guarda o que você tem e anuncia as repetidas", icon: Library, tone: "bg-gold-soft text-gold" },
  { href: "/loja", label: "Cadastrar evento da loja", text: "Semanal, skirmish, pré-release…", icon: CalendarPlus, tone: "bg-energy/15 text-energy" },
  { href: "/sugestao", label: "Sugerir melhoria", text: "Ideia ou ajuste para o app", icon: Lightbulb, tone: "bg-surface-3 text-ink" },
];

/** O "+" da barra: abre as opções de publicação. "Registrar resultado" só aparece para admin. */
export function PublishMenu({ isAdmin, isStore, variant }: { isAdmin: boolean; isStore: boolean; variant: "fab" | "sidebar" }) {
  const [open, setOpen] = useState(false);
  // Evento de loja só para conta de loja (e admin)
  const base = isAdmin || isStore ? OPTIONS : OPTIONS.filter((o) => o.href !== "/loja");
  const options = isAdmin
    ? [...base, { href: "/admin/eventos", label: "Registrar resultado", text: "Quem levou o último torneio?", icon: Trophy, tone: "bg-gold-soft text-gold" }]
    : base;

  return (
    <>
      {variant === "fab" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Publicar"
          aria-haspopup="dialog"
          className="-mt-5 inline-flex size-12 items-center justify-center rotate-45 rounded-[14px] border border-gold-strong/60 bg-linear-to-br from-rift-strong to-rift text-on-rift shadow-glow ring-4 ring-bg transition-transform active:scale-95"
        >
          <Plus size={26} strokeWidth={2.5} className="-rotate-45" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-gold-strong/40 bg-linear-to-b from-rift-strong to-rift font-display text-lg font-bold tracking-wide text-on-rift uppercase shadow-glow transition-[filter] hover:brightness-110"
        >
          <Plus size={20} aria-hidden /> Publicar
        </button>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title="O que vai rolar?">
        <ul className="space-y-2">
          {options.map((o) => (
            <li key={o.href}>
              <Link
                href={o.href}
                onClick={() => setOpen(false)}
                className="flex min-h-16 items-center gap-4 rounded-2xl border border-line bg-surface-2 p-3 transition-colors hover:border-rift/50 hover:bg-surface-3"
              >
                <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", o.tone)}>
                  <o.icon size={22} aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold">{o.label}</span>
                  <span className="block text-sm text-muted">{o.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
