"use server";

// Coleção: cada um registra as cartas que tem. A RLS só deixa o dono ler e escrever.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formToObject, zodErrorState, type ActionState } from "@/lib/validation/common";
import { collectionItemSchema, collectionQuantitySchema } from "@/lib/validation/schemas";
import { requireSession } from "../session";
import { dbError, demoBlocked } from "./helpers";

/** Adiciona uma carta. Se já tem a mesma carta, condição e variante, soma a quantidade. */
export async function addCollectionItem(_: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireSession();
  const parsed = collectionItemSchema.safeParse(formToObject(form));
  if (!parsed.success) return zodErrorState(parsed.error);
  const v = parsed.data;

  const supabase = await createClient();
  let existing = supabase
    .from("collection_items")
    .select("id, quantity")
    .eq("user_id", session.userId)
    .eq("card_id", v.cardId)
    .eq("condition", v.condition);
  existing = v.variant ? existing.eq("variant", v.variant) : existing.is("variant", null);
  const { data: found } = await existing.maybeSingle();

  const { error } = found
    ? await supabase
        .from("collection_items")
        .update({ quantity: Math.min(999, found.quantity + v.quantity), ...(v.notes ? { notes: v.notes } : {}) })
        .eq("id", found.id)
    : await supabase
        .from("collection_items")
        .insert({ user_id: session.userId, card_id: v.cardId, quantity: v.quantity, condition: v.condition, variant: v.variant, notes: v.notes });
  if (error) return dbError(error);

  revalidatePath("/colecao");
  return { ok: true, message: found ? "Quantidade somada na coleção." : "Carta adicionada à coleção!" };
}

/** Muda a quantidade; zero tira a carta da coleção. */
export async function setCollectionQuantity(id: string, quantity: number): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  await requireSession();
  const parsed = collectionQuantitySchema.safeParse({ id, quantity });
  if (!parsed.success) return zodErrorState(parsed.error);

  const supabase = await createClient();
  const { error, count } = parsed.data.quantity === 0
    ? await supabase.from("collection_items").delete({ count: "exact" }).eq("id", id)
    : await supabase.from("collection_items").update({ quantity: parsed.data.quantity }, { count: "exact" }).eq("id", id);
  if (error) return dbError(error);
  if (!count) return { ok: false, message: "Essa carta não está na tua coleção." };

  revalidatePath("/colecao");
  return { ok: true, message: parsed.data.quantity === 0 ? "Carta removida da coleção." : undefined };
}
