import { NextResponse, type NextRequest } from "next/server";
import { searchCards } from "@/server/queries/cards";
import { getSession } from "@/server/session";

/** Busca no catálogo para o seletor de carta (anúncio e coleção). */
export async function GET(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 60);
  const cards = q.trim().length >= 2 ? await searchCards(q) : [];
  return NextResponse.json({ cards }, { headers: { "Cache-Control": "private, max-age=60" } });
}
