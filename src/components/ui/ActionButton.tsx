"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { ActionState } from "@/lib/validation/common";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./button";
import { useToast } from "./Toast";

/**
 * Botão que chama uma Server Action sem formulário (ocultar, destacar, apagar…),
 * com confirmação opcional e toast com o resultado.
 */
export function ActionButton({
  action, children, confirm, variant = "secondary", size = "sm", className, label,
}: {
  action: () => Promise<ActionState | void>; children: React.ReactNode; confirm?: string;
  variant?: ButtonVariant; size?: ButtonSize; className?: string; label?: string;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();

  return (
    <button
      type="button"
      aria-label={label}
      disabled={pending}
      aria-busy={pending}
      className={buttonClass(variant, size, className)}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const result = await action();
          if (result?.message) toast(result.message, result.ok ? "ok" : "error");
        });
      }}
    >
      {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
