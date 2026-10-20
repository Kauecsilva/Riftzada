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

/** Abre as opções de publicação. "Registrar resultado" só aparece para admin. */
export function PublishMenu({ isAdmin, isStore, variant }: { isAdmin: boolean; isStore: boolean; variant: "fab" | "header" }) {
  const [open, setOpen] = useState(false);
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
          className="inline-flex size-12 items-center justify-center rounded-full border-2 border-[#d9bfe2] bg-[#6a3b83] text-white shadow-[0_4px_12px_rgb(87_48_112/0.25)] transition-transform hover:bg-[#754490] active:scale-95"
        >
          <Plus size={25} strokeWidth={2.3} aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#dfc4e7] px-4 text-sm font-bold text-[#2a1938] transition-colors hover:bg-[#edd5f4]"
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
