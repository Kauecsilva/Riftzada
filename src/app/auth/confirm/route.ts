import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Destino dos links de e-mail (confirmação de cadastro e recuperação de senha).
 * Aceita os dois formatos do Supabase: ?code= (PKCE) e ?token_hash=&type=.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = searchParams.get("next");
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const supabase = await createClient();

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { error: new Error("link sem token") };

  if (error) {
    console.error("[auth] confirm", error.message);
    return NextResponse.redirect(new URL("/entrar?erro=link", request.url));
  }
  const target = type === "recovery" ? "/redefinir-senha" : destination;
  return NextResponse.redirect(new URL(`${target}${target === "/" ? "?bemvindo=1" : ""}`, request.url));
}
