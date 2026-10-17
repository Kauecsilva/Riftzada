"use client";

import { useOptimistic, useTransition } from "react";
import { Check, Loader2, Swords } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { toggleRsvp } from "@/server/actions/content";

/**
 * "Vou jogar". Atualiza na hora (otimista); se o servidor recusar, volta sozinho ao valor real.
 */
export function RsvpButton({ eventId, going: savedGoing, count: savedCount, full, size = "md" }: {
  eventId: string; going: boolean; count: number; full?: boolean; size?: "sm" | "md" | "lg";
}) {
  const [{ going, count }, setOptimistic] = useOptimistic({ going: savedGoing, count: savedCount });
  const [pending, start] = useTransition();
  const toast = useToast();

  const disabled = pending || (!going && full);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={going}
      onClick={() => {
        const next = !going;
        start(async () => {
          setOptimistic({ going: next, count: count + (next ? 1 : -1) });
          const result = await toggleRsvp(eventId, next);
          if (result.message) toast(result.message, result.ok ? "ok" : "error");
        });
      }}
      className={buttonClass(going ? "secondary" : "primary", size, going ? "border-energy/40 text-energy" : undefined)}
    >
      {pending ? <Loader2 size={18} className="animate-spin" aria-hidden /> : going ? <Check size={18} aria-hidden /> : <Swords size={18} aria-hidden />}
      {going ? "Tô dentro" : full ? "Lotado" : "Vou jogar"}
      <span className="sr-only">, {count} confirmados</span>
    </button>
  );
}
