import "server-only";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import * as demo from "@/lib/demo/store";
import type { CardPrice, LigaPrice, PriceReference } from "@/types/domain";

type LigaRow = { finish: LigaPrice["finish"]; low_cents: number; avg_cents: number | null; language: LigaPrice["language"]; condition: LigaPrice["condition"]; url: string; updated_at: string };
type PriceRow = { finish: CardPrice["finish"]; low_cents: number | null; market_cents: number | null; product_url: string | null; updated_at: string };

/** Preços do TCGplayer e da Liga da carta (atualizados no banco) e a cotação do dólar. */
export async function getPriceReference(cardId: string): Promise<PriceReference> {
  if (isDemoMode) return demo.demoPriceReference(cardId);
  const supabase = await createClient();
  const [prices, liga, rate] = await Promise.all([
    supabase
      .from("card_prices")
      .select("finish, low_cents, market_cents, product_url, updated_at")
      .eq("card_id", cardId)
      .eq("source", "tcgplayer")
      .returns<PriceRow[]>(),
    supabase
      .from("liga_prices")
      .select("finish, low_cents, avg_cents, language, condition, url, updated_at")
      .eq("card_id", cardId)
      // Preço que a coleta não renovou numa semana (carta sem oferta na Liga) não vale mais
      .gte("updated_at", new Date(Date.now() - 7 * 86_400_000).toISOString())
      .returns<LigaRow[]>(),
    supabase.from("exchange_rates").select("rate, updated_at").eq("base", "USD").eq("quote", "BRL").maybeSingle(),
  ]);
  if (prices.error) throw prices.error;
  if (liga.error) throw liga.error;
  return {
    tcgplayer: prices.data.map((p) => ({
      finish: p.finish, lowCents: p.low_cents, marketCents: p.market_cents, productUrl: p.product_url, updatedAt: p.updated_at,
    })),
    liga: liga.data.map((p) => ({
      finish: p.finish, lowCents: p.low_cents, avgCents: p.avg_cents, language: p.language, condition: p.condition, url: p.url, updatedAt: p.updated_at,
    })),
    usdBrl: rate.data ? Number(rate.data.rate) : null,
    rateUpdatedAt: rate.data?.updated_at ?? null,
  };
}
