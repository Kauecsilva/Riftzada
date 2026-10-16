"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";

export function CopyListButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  return (
    <button
      type="button"
      className={buttonClass("primary", "md", "flex-1")}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast("Lista copiada!");
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast("Não deu para copiar. Seleciona a lista na mão.", "error");
        }
      }}
    >
      {copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />} Copiar lista
    </button>
  );
}

export function ShareButton({ title }: { title: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      className={buttonClass("secondary", "md", "flex-1")}
      onClick={async () => {
        const url = window.location.href;
        try {
          if (navigator.share) await navigator.share({ title, url });
          else {
            await navigator.clipboard.writeText(url);
            toast("Link copiado!");
          }
        } catch {
          // cancelou o compartilhamento
        }
      }}
    >
      <Share2 size={18} aria-hidden /> Compartilhar
    </button>
  );
}
