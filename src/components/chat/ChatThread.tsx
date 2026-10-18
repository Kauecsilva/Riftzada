"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SendHorizontal } from "lucide-react";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn } from "@/lib/cn";
import { isDemoMode } from "@/lib/env";
import { shortDate, time } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { initialActionState } from "@/lib/validation/common";
import { markChatRead, sendMessage } from "@/server/actions/chat";
import type { ListingMessage } from "@/types/domain";

/**
 * Conversa de um anúncio. Mensagem nova da outra ponta chega pelo Realtime do Supabase
 * (a RLS só entrega para as duas pontas) e a página recarrega os dados do servidor.
 */
export function ChatThread({ listingId, buyerId, me, otherName, messages, hasUnread }: {
  listingId: string; buyerId: string; me: string; otherName: string; messages: ListingMessage[]; hasUnread: boolean;
}) {
  const [state, action] = useActionState(sendMessage.bind(null, listingId, buyerId), initialActionState);
  const router = useRouter();
  const end = useRef<HTMLDivElement>(null);

  // Abriu com mensagem não lida: marca como lida e atualiza o contador do menu
  useEffect(() => {
    if (!hasUnread) return;
    void markChatRead(listingId, buyerId).then(() => router.refresh());
  }, [hasUnread, listingId, buyerId, router]);

  useEffect(() => {
    if (isDemoMode) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${listingId}:${buyerId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "listing_messages", filter: `listing_id=eq.${listingId}` }, (payload) => {
        if ((payload.new as { buyer_id?: string }).buyer_id === buyerId) router.refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [listingId, buyerId, router]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <p className="card p-4 text-sm text-muted">Nenhuma mensagem ainda. Manda um oi para {otherName}.</p>
      ) : (
        <ol className="space-y-2" aria-label={`Conversa com ${otherName}`}>
          {messages.map((m, i) => {
            const mine = m.senderId === me;
            const day = shortDate(m.createdAt);
            const newDay = i === 0 || shortDate(messages[i - 1].createdAt) !== day;
            return (
              <li key={m.id}>
                {newDay && <p className="my-3 text-center text-xs text-faint">{day}</p>}
                <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2", mine ? "rounded-br-sm bg-rift text-on-rift" : "rounded-bl-sm border border-line bg-surface-2")}>
                    <span className="sr-only">{mine ? "Você" : otherName}: </span>
                    <p className="text-[15px] leading-snug whitespace-pre-line [overflow-wrap:anywhere]">{m.body}</p>
                    <time dateTime={m.createdAt} className={cn("mt-0.5 block text-right text-[11px]", mine ? "text-on-rift/75" : "text-faint")}>{time(m.createdAt)}</time>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <div ref={end} />
      <form action={action} className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] space-y-2 bg-bg/90 py-2 backdrop-blur lg:bottom-4">
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2">
          <label htmlFor="body" className="sr-only">Mensagem para {otherName}</label>
          <textarea id="body" name="body" required maxLength={1000} rows={1} placeholder="Escreve uma mensagem…"
            className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 outline-none field-sizing-content"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }} />
          <SubmitButton variant="primary" size="md" pendingLabel="" full={false} className="shrink-0">
            <SendHorizontal size={18} aria-hidden /><span className="sr-only">Enviar</span>
          </SubmitButton>
        </div>
        {state.ok === false && <FormMessage state={state} />}
      </form>
    </div>
  );
}
