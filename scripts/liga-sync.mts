// Coleta o menor preço das cartas na LigaRiftbound e grava no Supabase.
// Roda num computador com internet de casa: a Liga (Cloudflare) bloqueia acesso vindo de servidor.
//
// Uso:  npm run liga:sync                 próximas 300 cartas da fila (anunciadas primeiro)
//       npm run liga:sync -- --limit 50   menos cartas
//       npm run liga:sync -- --dry-run    só mostra o que leu, sem gravar
// Precisa no .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e LIGA_SYNC_TOKEN.
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { isChallenge, ligaPrices, parseLigaPage, type LigaPriceItem, type LigaTarget } from "../src/lib/domain/liga.ts";
import { ligaCardUrl } from "../src/lib/domain/pricing.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const { values: args } = parseArgs({ options: { limit: { type: "string", default: "300" }, "dry-run": { type: "boolean", default: false } } });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const token = process.env.LIGA_SYNC_TOKEN;
if (!url || !key || !token) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY ou LIGA_SYNC_TOKEN no .env.local");
  process.exit(1);
}

async function rpc<T>(name: string, body: object): Promise<T> {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: key!, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const targets = await rpc<{ name: string; cards: LigaTarget[] }[]>("liga_sync_targets", { sync_token: token, max_names: Number(args.limit) });
console.log(`${targets.length} cartas na fila`);

let names: string[] = [];
let items: LigaPriceItem[] = [];
let saved = 0;
const flush = async () => {
  if (!names.length) return;
  if (!args["dry-run"]) saved += await rpc<number>("upsert_liga_prices", { sync_token: token, names, items });
  names = [];
  items = [];
};

for (const [i, target] of targets.entries()) {
  let res: Response;
  let html: string;
  try {
    res = await fetch(ligaCardUrl(target.name), { headers: HEADERS });
    html = await res.text();
  } catch (error) {
    console.error(`Não consegui abrir a Liga (${(error as Error).cause ?? error}). Parei aqui.`);
    break;
  }
  if (isChallenge(html) || res.status === 403) {
    console.error(`A Liga pediu verificação (HTTP ${res.status}). Parei aqui; tente de novo mais tarde.`);
    break;
  }
  const page = parseLigaPage(html);
  const found = page ? ligaPrices(page, target.cards) : [];
  // Mesmo sem achar a carta (nome diferente na Liga) ela vai para o fim da fila
  names.push(target.name);
  items.push(...found);
  const prices = found.map((f) => `${f.finish} R$ ${(f.low_cents / 100).toFixed(2)}${f.language ? ` ${f.language}/${f.condition}` : ""}`);
  console.log(`[${i + 1}/${targets.length}] ${target.name}: ${page ? prices.join(", ") || "sem oferta" : "não achei a página"}`);
  if (names.length >= 25) await flush();
  await sleep(2000 + Math.random() * 2000);
}
await flush();
console.log(args["dry-run"] ? "Simulação: nada gravado." : `${saved} preços gravados.`);
