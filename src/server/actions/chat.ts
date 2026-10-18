"use server";

// Conversas do mercado. Quem pode escrever em qual conversa é regra do banco (send_listing_message).

import { revalidatePath } from "next/cache";
import { chatHref } from "@/lib/domain/chat";
import { createClient } from "@/lib/supabase/server";
import { zodErrorState, type ActionState } from "@/lib/validation/common";
import { messageSchema } from "@/lib/validation/schemas";
import { requireSession } from "../session";
import { dbError, demoBlocked } from "./helpers";

export async function sendMessage(listingId: string, buyerId: string, _: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  await requireSession();
  const parsed = messageSchema.safeParse({ listingId, buyerId, body: form.get("body") });
  if (!parsed.success) return zodErrorState(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("send_listing_message", {
    target_listing: parsed.data.listingId, target_buyer: parsed.data.buyerId, body: parsed.data.body,
  });
  if (error) return dbError(error, "Não deu para mandar. Tenta de novo?");
  revalidatePath(chatHref(parsed.data.listingId, parsed.data.buyerId));
  revalidatePath("/mensagens");
  return { ok: true };
}

/** Abriu a conversa: o que a outra ponta mandou fica lido (e some do contador do menu). */
export async function markChatRead(listingId: string, buyerId: string): Promise<void> {
  if (demoBlocked()) return;
  await requireSession();
  const parsed = messageSchema.pick({ listingId: true, buyerId: true }).safeParse({ listingId, buyerId });
  if (!parsed.success) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_listing_chat_read", { target_listing: parsed.data.listingId, target_buyer: parsed.data.buyerId });
  if (error) console.error("[db]", error.code, error.message);
}
