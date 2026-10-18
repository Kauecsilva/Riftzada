import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

// Abrem sem login: autenticação, instalação do PWA, arquivos públicos e o cron (que confere o CRON_SECRET)
const PUBLIC_PATHS = ["/entrar", "/cadastro", "/esqueci-senha", "/auth", "/manifest.webmanifest", "/sw.js", "/offline", "/api/cron"];

const matches = (path: string, list: string[]) => list.some((p) => path === p || path.startsWith(`${p}/`));

/** Renova os cookies da sessão e manda quem não está logado para /entrar. */
export async function updateSession(request: NextRequest) {
  if (isDemoMode) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims valida o JWT (localmente com chaves assimétricas) e renova o token quando preciso
  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims);
  const path = request.nextUrl.pathname;

  if (!loggedIn && !matches(path, PUBLIC_PATHS)) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = path === "/" ? "" : `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  // Quem já está logado sai das telas de visitante na própria página (redirectIfSignedIn),
  // com a sessão completa; aqui só o JWT faria loop se o perfil não carregasse.
  return response;
}
