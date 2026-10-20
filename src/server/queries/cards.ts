import "server-only";
import { pickLegendPrints } from "@/lib/cards";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import * as demo from "@/lib/demo/store";
import { demoSetLegends } from "@/lib/demo/legends";
import type { CardSummary, SetLegends } from "@/types/domain";
import { CARD_FIELDS, mapCard, type CardRow } from "./mappers";

/**
 * Busca no catálogo por nome ("jinx rebel" acha "Jinx - Rebel") ou código ("OGN-007").
 * Impressões normais vêm antes das variantes (arte alternativa, assinatura…).
 */
export async function searchCards(term: string, limit = 12): Promise<CardSummary[]> {
  const words = term.trim().split(/\s+/).filter(Boolean).slice(0, 5);
  if (!words.length) return [];
  if (isDemoMode) return demo.demoSearchCards(term.trim(), limit);
  const supabase = await createClient();
  let query = supabase.from("cards").select(CARD_FIELDS).eq("game", "riftbound");
  const code = term.trim().toUpperCase();
  if (/^[A-Z0-9]{2,5}-\d{1,4}[A-Z*]?$/.test(code)) {
    query = query.eq("public_code", code);
  } else {
    // Escapa os curingas do ILIKE para a busca ser literal
    for (const word of words) query = query.ilike("name", `%${word.replace(/[%_\\]/g, (m) => `\\${m}`)}%`);
  }
  const { data, error } = await query
    .order("is_alternate_art")
    .order("is_overnumbered")
    .order("is_signature")
    .order("name")
    .limit(limit)
    .returns<CardRow[]>();
  if (error) throw error;
  return data.map(mapCard);
}

export async function getCard(id: string): Promise<CardSummary | null> {
  if (isDemoMode) return demo.demoCard(id);
  const supabase = await createClient();
  const { data } = await supabase.from("cards").select(CARD_FIELDS).eq("id", id).maybeSingle<CardRow>();
  return data ? mapCard(data) : null;
}

/** Coleções principais, da mais antiga para a atual (a última abre selecionada na Home). */
export const LEGEND_SETS = [
  { code: "OGN", name: "Origins" },
  { code: "SFD", name: "Spiritforged" },
  { code: "UNL", name: "Unleashed" },
  { code: "VEN", name: "Vendetta" },
  { code: "RAD", name: "Radiance" },
] as const;

/** Lendas de cada coleção principal, só a impressão normal (sem arte alternativa, numeração extra ou assinatura). */
export async function getSetLegends(): Promise<SetLegends[]> {
  if (isDemoMode) return demoSetLegends();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .select(`${CARD_FIELDS}, set_code`)
    .eq("game", "riftbound")
    .eq("card_type", "legend")
    .in("set_code", LEGEND_SETS.map((s) => s.code))
    .eq("is_alternate_art", false)
    .eq("is_overnumbered", false)
    .eq("is_signature", false)
    .order("public_code")
    .returns<(CardRow & { set_code: string })[]>();
  if (error) throw error;
  const rows = pickLegendPrints(data);
  return LEGEND_SETS.map((set) => ({
    ...set,
    legends: rows.filter((row) => row.set_code === set.code).map(mapCard).filter((card) => card.imageUrl),
  })).filter((set) => set.legends.length > 0);
}
