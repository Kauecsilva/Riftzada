import { NextResponse, type NextRequest } from "next/server";
import { syncLigaPrices } from "@/server/liga-sync";

export const maxDuration = 120;

/** Coleta diária do preço da Liga, chamada pelo cron da Vercel (vercel.json). */
export async function GET(request: NextRequest) {
  const { CRON_SECRET, FIRECRAWL_API_KEY, LIGA_SYNC_TOKEN } = process.env;
  if (!CRON_SECRET || request.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!FIRECRAWL_API_KEY || !LIGA_SYNC_TOKEN) return NextResponse.json({ error: "faltam FIRECRAWL_API_KEY ou LIGA_SYNC_TOKEN" }, { status: 500 });
  const results = await syncLigaPrices({ firecrawlKey: FIRECRAWL_API_KEY, syncToken: LIGA_SYNC_TOKEN });
  const failed = results.filter((r) => r.error);
  if (failed.length) console.error("Coleta da Liga com falha:", failed);
  return NextResponse.json({ results }, { status: failed.length === results.length ? 502 : 200 });
}
