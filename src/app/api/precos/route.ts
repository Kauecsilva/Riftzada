import { NextResponse, type NextRequest } from "next/server";
import { getPriceReference } from "@/server/queries/prices";
import { getSession } from "@/server/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Referência de preço da carta para o formulário de anúncio. */
export async function GET(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const cardId = request.nextUrl.searchParams.get("carta") ?? "";
  if (!UUID.test(cardId)) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const reference = await getPriceReference(cardId);
  return NextResponse.json(reference, { headers: { "Cache-Control": "private, max-age=300" } });
}
