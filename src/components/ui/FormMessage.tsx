import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ActionState } from "@/lib/validation/common";

/** Resumo do resultado do formulário (erro geral ou sucesso). */
export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  const ok = state.ok;
  return (
    <p
      role={ok ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm",
        ok ? "border-energy/30 bg-energy/10 text-ink" : "border-danger/30 bg-danger/10 text-ink",
      )}
    >
      {ok ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-energy" aria-hidden /> : <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden />}
      {state.message}
    </p>
  );
}
