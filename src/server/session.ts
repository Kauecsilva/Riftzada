import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { COMMUNITY_SLUG, isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { DEMO_USER_ID, demoProfileById } from "@/lib/demo/store";
import { COMMUNITY_ID } from "@/lib/demo/fixtures";
import type { MemberRole, Session } from "@/types/domain";
import { mapProfile, PROFILE_FIELDS, type ProfileRow } from "./queries/mappers";

/** Id da comunidade exibida (resolvido pelo slug, uma vez por requisição). */
export const getCommunityId = cache(async (): Promise<string> => {
  if (isDemoMode) return COMMUNITY_ID;
  const supabase = await createClient();
  const { data, error } = await supabase.from("communities").select("id").eq("slug", COMMUNITY_SLUG).single();
  if (error || !data) throw new Error(`Comunidade "${COMMUNITY_SLUG}" não encontrada.`);
  return data.id as string;
});

/**
 * Usuário logado, perfil e papel na comunidade. O papel vem sempre do banco.
 * Retorna null para visitante ou para quem foi banido.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  if (isDemoMode) {
    return { userId: DEMO_USER_ID, profile: demoProfileById(DEMO_USER_ID)!, role: "admin", communityId: COMMUNITY_ID };
  }
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const communityId = await getCommunityId();
  const [{ data: profile }, { data: member }] = await Promise.all([
    supabase.from("profiles").select(PROFILE_FIELDS).eq("id", auth.user.id).single<ProfileRow>(),
    supabase.from("community_members").select("role, is_banned").eq("community_id", communityId).eq("user_id", auth.user.id).maybeSingle(),
  ]);
  if (!profile || !member || member.is_banned) return null;

  return { userId: auth.user.id, profile: mapProfile(profile), role: member.role as MemberRole, communityId };
});

/** Para páginas e ações que exigem login. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/entrar");
  return session;
}

/**
 * Para as telas de visitante (entrar, cadastro, esqueci a senha). Usa a mesma sessão que
 * requireSession: decidir isso no proxy só pelo JWT criava loop com /entrar quando o
 * usuário tinha token mas o perfil não carregava.
 */
export async function redirectIfSignedIn(): Promise<void> {
  if (isDemoMode) return;
  if (await getSession()) redirect("/");
}

/** Para o painel e as ações administrativas. */
export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (session.role !== "admin") redirect("/");
  return session;
}

export function canModerate(session: Session | null): boolean {
  return session?.role === "admin" || session?.role === "moderator";
}
