"use server";

// Coleção: cada um registra as cartas que tem. A RLS só deixa o dono ler e escrever.

import { revalidatePath } from "next/cache";
import {
  groupMatches, matchRows, publicCode, readCollectionCsv, type CatalogCard, type ImportFormat,
} from "@/lib/domain/collection-import";
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

// ---------- Importação por CSV ----------

export type ImportState = ActionState & {
  format?: ImportFormat;
  cards?: number;
  copies?: number;
  unmatched?: { line: number; name: string; set: string | null; number: string | null; quantity: number }[];
};

const MAX_IMPORT_BYTES = 1024 * 1024;
const chunks = <T,>(list: T[], size: number) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));

/**
 * Importa a coleção de um CSV (LigaRiftbound ou formato genérico com nome e quantidade).
 * Cada carta casada fica com a quantidade do arquivo; cartas que já estavam e não vieram no
 * arquivo continuam como estão. O que não casou volta na resposta para a pessoa conferir.
 */
export async function importCollection(_: ImportState, form: FormData): Promise<ImportState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireSession();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Escolhe o arquivo CSV." };
  if (file.size > MAX_IMPORT_BYTES) return { ok: false, message: "Arquivo grande demais (máximo 1 MB)." };

  const read = readCollectionCsv(await file.text());
  if ("error" in read) return { ok: false, message: read.error };
  if (!read.rows.length) return { ok: false, message: "Não achei nenhuma carta no arquivo." };

  const supabase = await createClient();
  const codes = [...new Set(read.rows.map(publicCode).filter((c): c is string => Boolean(c)))];
  const names = [...new Set(read.rows.map((r) => r.name))];
  const fields = "id, name, set_code, collector_no, is_alternate_art, is_overnumbered, is_signature";
  const results = await Promise.all([
    ...chunks(codes, 150).map((part) => supabase.from("cards").select(fields).eq("game", "riftbound").in("public_code", part)),
    ...chunks(names, 100).map((part) => supabase.from("cards").select(fields).eq("game", "riftbound").in("name", part)),
  ]);
  const failed = results.find((r) => r.error);
  if (failed?.error) return dbError(failed.error, "Não deu para consultar o catálogo. Tenta de novo?");
  const catalog = [...new Map(results.flatMap((r) => (r.data ?? []) as CatalogCard[]).map((c) => [c.id, c])).values()];

  const { matched, unmatched } = matchRows(read.rows, catalog);
  const groups = groupMatches(matched);

  if (groups.length) {
    const { data: existing, error } = await supabase
      .from("collection_items")
      .select("id, card_id, condition, variant")
      .eq("user_id", session.userId)
      .in("card_id", [...new Set(groups.map((g) => g.cardId))]);
    if (error) return dbError(error);
    const key = (cardId: string, condition: string, variant: string | null) => `${cardId}|${condition}|${variant ?? ""}`;
    const current = new Map(existing.map((i) => [key(i.card_id, i.condition, i.variant), i.id as string]));

    const inserts = groups.filter((g) => !current.has(key(g.cardId, g.condition, g.variant)));
    const updates = groups.filter((g) => current.has(key(g.cardId, g.condition, g.variant)));
    if (inserts.length) {
      const { error: insertError } = await supabase.from("collection_items").insert(
        inserts.map((g) => ({ user_id: session.userId, card_id: g.cardId, quantity: g.quantity, condition: g.condition, variant: g.variant })),
      );
      if (insertError) return dbError(insertError);
    }
    for (const g of updates) {
      const { error: updateError } = await supabase
        .from("collection_items")
        .update({ quantity: g.quantity })
        .eq("id", current.get(key(g.cardId, g.condition, g.variant))!);
      if (updateError) return dbError(updateError);
    }
    revalidatePath("/colecao");
  }

  const copies = groups.reduce((sum, g) => sum + g.quantity, 0);
  return {
    ok: groups.length > 0,
    format: read.format,
    cards: groups.length,
    copies,
    message: groups.length
      ? `${copies} ${copies === 1 ? "carta importada" : "cartas importadas"} (${groups.length} diferentes).${unmatched.length ? ` ${unmatched.length} ${unmatched.length === 1 ? "linha não casou" : "linhas não casaram"} com o catálogo.` : ""}`
      : "Nenhuma carta do arquivo casou com o catálogo.",
    unmatched: unmatched.map((r) => ({ line: r.line, name: r.name, set: r.setCode, number: r.number ? `${r.number}${r.suffix}` : null, quantity: r.quantity })),
  };
}
