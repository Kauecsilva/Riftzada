"use client";

import Link from "next/link";
import { useState } from "react";
import { Camera, Layers, Library, Plus, Tag, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";
import { Sheet } from "@/components/ui/Sheet";

const OPTIONS = [
  { href: "/publicar", label: "Publicar no mural", text: "Foto, resenha ou o pull da semana", icon: Camera, tone: "bg-rift-soft text-[#c9bfff]" },
  { href: "/mercado/novo", label: "Anunciar carta", text: "Vende, troca ou procura", icon: Tag, tone: "bg-sell/15 text-sell" },
  { href: "/colecao", label: "Registrar na coleção", text: "Guarda o que você tem e anuncia as repetidas", icon: Library, tone: "bg-gold-soft text-gold" },
  { href: "/decks/novo", label: "Publicar deck", text: "Mostra o que você está cozinhando", icon: Layers, tone: "bg-energy/15 text-energy" },
];

/** O "+" da barra: abre as opções de publicação. "Registrar resultado" só aparece para admin. */
export function PublishMenu({ isAdmin, variant }: { isAdmin: boolean; variant: "fab" | "sidebar" }) {
  const [open, setOpen] = useState(false);
  const options = isAdmin
    ? [...OPTIONS, { href: "/admin/eventos", label: "Registrar resultado", text: "Quem levou o último torneio?", icon: Trophy, tone: "bg-gold-soft text-gold" }]
    : OPTIONS;

  return (
    <>
      {variant === "fab" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Publicar"
          aria-haspopup="dialog"
          className="-mt-7 inline-flex size-16 items-center justify-center rounded-full bg-linear-to-br from-[#9a85ff] to-rift text-white shadow-glow ring-4 ring-bg transition-transform active:scale-95"
        >
          <Plus size={30} strokeWidth={2.5} aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-rift font-semibold text-white shadow-glow transition-colors hover:bg-rift-strong"
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
