"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Bottom sheet no celular, modal centralizado no desktop. Usa <dialog> nativo:
 * foco preso, Esc fecha e o fundo fica inerte sem código extra.
 */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className="m-0 mt-auto w-full max-w-none bg-transparent p-0 text-ink backdrop:bg-black/60 backdrop:backdrop-blur-sm open:animate-sheet-in md:m-auto md:max-w-md"
    >
      <div className="safe-bottom rounded-t-xl border border-line bg-surface p-5 md:rounded-xl">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-surface-3 md:hidden" aria-hidden />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
            <X size={20} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
