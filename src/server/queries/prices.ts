import "server-only";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import * as demo from "@/lib/demo/store";
import { LIGA_MAX_AGE_MS } from "@/lib/domain/pricing";
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
      .gte("updated_at", new Date(Date.now() - LIGA_MAX_AGE_MS).toISOString())
      .returns<LigaRow[]>(),
    supabase.from("exchange_rates").select("rate, updated_at").eq("base", "USD").eq("quote", "BRL").maybeSingle(),
  ]);
  if (prices.error) throw prices.error;
  if (liga.error) throw liga.error;
  return toReference(prices.data, liga.data, rate.data);
}

type RateRow = { rate: number | string; updated_at: string } | null;

function toReference(prices: PriceRow[], liga: LigaRow[], rate: RateRow): PriceReference {
  return {
    tcgplayer: prices.map((p) => ({
      finish: p.finish, lowCents: p.low_cents, marketCents: p.market_cents, productUrl: p.product_url, updatedAt: p.updated_at,
    })),
    liga: liga.map((p) => ({
      finish: p.finish, lowCents: p.low_cents, avgCents: p.avg_cents, language: p.language, condition: p.condition, url: p.url, updatedAt: p.updated_at,
    })),
    usdBrl: rate ? Number(rate.rate) : null,
    rateUpdatedAt: rate?.updated_at ?? null,
  };
}

type CollectionPriceRow = { card: { id: string; card_prices: PriceRow[]; liga_prices: LigaRow[] } };

/** Preços de todas as cartas da coleção de quem está logado, por id da carta (uma consulta só, sem lista de ids na URL). */
export async function getCollectionPrices(userId: string): Promise<Record<string, PriceReference>> {
  if (isDemoMode) return Object.fromEntries(demo.demoCollectionList(userId).map((i) => [i.card.id, demo.demoPriceReference(i.card.id)]));
  const supabase = await createClient();
  const [items, rate] = await Promise.all([
    supabase
      .from("collection_items")
      .select(`card:cards!collection_items_card_id_fkey(id,
        card_prices(finish, low_cents, market_cents, product_url, updated_at),
        liga_prices(finish, low_cents, avg_cents, language, condition, url, updated_at))`)
      .eq("user_id", userId)
      .returns<CollectionPriceRow[]>(),
    supabase.from("exchange_rates").select("rate, updated_at").eq("base", "USD").eq("quote", "BRL").maybeSingle(),
  ]);
  if (items.error) throw items.error;
  const freshSince = Date.now() - LIGA_MAX_AGE_MS;
  return Object.fromEntries(items.data.map(({ card }) => [
    card.id,
    toReference(card.card_prices, card.liga_prices.filter((p) => Date.parse(p.updated_at) >= freshSince), rate.data),
  ]));
}
