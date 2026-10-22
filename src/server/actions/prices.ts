"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/validation/common";
import { priceReviewSchema } from "@/lib/validation/schemas";
import { requireSession } from "../session";
import { dbError, demoBlocked } from "./helpers";

/**
 * Revisão de preço desatualizado: atualiza pela regra original (ex.: Liga −10% com o preço de hoje) ou mantém o
 * preço. Quem está longe e de quem é o anúncio decide o banco (reprice_listings / keep_listing_prices).
 */
export async function reviewListingPrices(mode: "update" | "keep", ids?: string[]): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  await requireSession();
  const parsed = priceReviewSchema.safeParse({ mode, ids });
  if (!parsed.success || (parsed.data.mode === "keep" && !parsed.data.ids?.length)) return { ok: false, message: "Escolhe os anúncios." };
  const supabase = await createClient();
  const { data, error } = parsed.data.mode === "update"
    ? await supabase.rpc("reprice_listings", parsed.data.ids ? { targets: parsed.data.ids } : {})
    : await supabase.rpc("keep_listing_prices", { targets: parsed.data.ids });
  if (error) return dbError(error);
  const n = data as number;
  revalidatePath("/mercado", "layout");
  revalidatePath("/");
  if (!n) return { ok: false, message: "Esse preço já está em dia." };
  if (parsed.data.mode === "keep") return { ok: true, message: n === 1 ? "Preço mantido." : `${n} preços mantidos.` };
  return { ok: true, message: n === 1 ? "Preço atualizado pela regra." : `${n} preços atualizados pela regra.` };
}
