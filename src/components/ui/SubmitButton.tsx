"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./button";

/** Botão de envio que mostra "Salvando…" enquanto a Server Action roda. */
export function SubmitButton({
  children, pendingLabel = "Salvando…", variant = "primary", size = "lg", className, full = true,
}: {
  children: React.ReactNode; pendingLabel?: string; variant?: ButtonVariant; size?: ButtonSize; className?: string; full?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass(variant, size, `${full ? "w-full" : ""} ${className ?? ""}`)}>
      {pending ? (
        <>
          <Loader2 size={18} className="animate-spin" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
