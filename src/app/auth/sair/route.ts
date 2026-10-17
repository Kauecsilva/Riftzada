import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

// POST para o logout não ser disparado por um simples link/prefetch
export async function POST(request: NextRequest) {
  if (!isDemoMode) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/entrar", request.url), { status: 303 });
}
