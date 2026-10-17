import "server-only";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import * as demo from "@/lib/demo/store";
import type { CardPrice, PriceReference } from "@/types/domain";

type PriceRow = { finish: CardPrice["finish"]; low_cents: number | null; market_cents: number | null; product_url: string | null; updated_at: string };

/** Preços do TCGplayer da carta (atualizados todo dia no banco) e a cotação do dólar. */
export async function getPriceReference(cardId: string): Promise<PriceReference> {
  if (isDemoMode) return demo.demoPriceReference(cardId);
  const supabase = await createClient();
  const [prices, rate] = await Promise.all([
    supabase
      .from("card_prices")
      .select("finish, low_cents, market_cents, product_url, updated_at")
      .eq("card_id", cardId)
      .eq("source", "tcgplayer")
      .returns<PriceRow[]>(),
    supabase.from("exchange_rates").select("rate, updated_at").eq("base", "USD").eq("quote", "BRL").maybeSingle(),
  ]);
  if (prices.error) throw prices.error;
  return {
    tcgplayer: prices.data.map((p) => ({
      finish: p.finish, lowCents: p.low_cents, marketCents: p.market_cents, productUrl: p.product_url, updatedAt: p.updated_at,
    })),
    usdBrl: rate.data ? Number(rate.data.rate) : null,
    rateUpdatedAt: rate.data?.updated_at ?? null,
  };
}
