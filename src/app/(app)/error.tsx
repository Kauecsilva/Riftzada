"use client";

import { RotateCcw } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center py-20 text-center" role="alert">
      <h1 className="font-display text-2xl font-bold">Deu ruim por aqui</h1>
      <p className="mt-1 text-muted">Algo falhou ao carregar. Tenta de novo?</p>
      <button type="button" onClick={reset} className={buttonClass("primary", "md", "mt-6")}>
        <RotateCcw size={17} aria-hidden /> Tentar de novo
      </button>
    </div>
  );
}
