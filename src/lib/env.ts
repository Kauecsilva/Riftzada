// Variáveis públicas e o modo demonstração.
// Sem URL/chave do Supabase o app roda com os dados fictícios de src/lib/demo (só leitura).

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const COMMUNITY_SLUG = process.env.NEXT_PUBLIC_COMMUNITY_SLUG || "riftzada-x1";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const isDemoMode = !SUPABASE_URL || !SUPABASE_ANON_KEY;

export const DEMO_MESSAGE = "Modo demonstração: configure o Supabase para salvar de verdade.";
