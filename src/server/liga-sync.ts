import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isChallenge, ligaSetPrices, parseLigaSet, type LigaTarget } from "@/lib/domain/liga";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

// A Liga (Cloudflare) bloqueia acesso vindo de servidor, então a página passa pelo Firecrawl.
// Uma página por coleção traz o preço de todas as cartas dela: ~10 créditos por rodada.
const ligaSetUrl = (setCode: string) => `https://www.ligariftbound.com.br/?view=cards/search&card=ed=${encodeURIComponent(setCode)}`;

async function fetchViaFirecrawl(url: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["rawHtml"], proxy: "basic", maxAge: 0 }),
  });
  if (!res.ok) throw new Error(`Firecrawl ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { data?: { rawHtml?: string } };
  return body.data?.rawHtml ?? "";
}

export type LigaSyncResult = { set: string; cards: number; saved: number; error?: string };

/** Lê a página de cada coleção do catálogo na Liga e grava o menor preço das cartas. */
export async function syncLigaPrices(env: { firecrawlKey: string; syncToken: string }): Promise<LigaSyncResult[]> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("liga_sync_targets", { sync_token: env.syncToken, max_names: 2000 });
  if (error) throw new Error(`liga_sync_targets: ${error.message}`);

  const bySet = new Map<string, { names: Set<string>; cards: LigaTarget[] }>();
  type Row = { name: string; cards: (Omit<LigaTarget, "name"> & { name?: string; alternateArt?: boolean })[] };
  for (const row of data as Row[]) {
    for (const card of row.cards) {
      if (!card.setCode) continue;
      const group = bySet.get(card.setCode) ?? { names: new Set(), cards: [] };
      group.names.add(row.name);
      // Sem a migration 0016 a carta vem sem o nome completo (e sem assinadas/overnumbered)
      group.cards.push({ ...card, name: card.name ?? `${row.name}${card.alternateArt ? " (Alternate Art)" : ""}` });
      bySet.set(card.setCode, group);
    }
  }

  return Promise.all(
    [...bySet].map(async ([set, group]): Promise<LigaSyncResult> => {
      try {
        const html = await fetchViaFirecrawl(ligaSetUrl(set), env.firecrawlKey);
        if (isChallenge(html)) return { set, cards: group.cards.length, saved: 0, error: "a Liga pediu verificação" };
        const entries = parseLigaSet(html);
        if (!entries) return { set, cards: group.cards.length, saved: 0, error: "coleção não encontrada na Liga" };
        const items = ligaSetPrices(entries, group.cards);
        const saved = await supabase.rpc("upsert_liga_prices", { sync_token: env.syncToken, names: [...group.names], items });
        if (saved.error) throw new Error(saved.error.message);
        return { set, cards: group.cards.length, saved: saved.data as number };
      } catch (e) {
        return { set, cards: group.cards.length, saved: 0, error: (e as Error).message };
      }
    }),
  );
}
