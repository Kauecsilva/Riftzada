import "server-only";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import * as demo from "@/lib/demo/store";
import type { EventResult, PlayerStats, Profile } from "@/types/domain";
import { getCommunityId } from "../session";
import { mapProfile, mapResult, mapStats, PROFILE_FIELDS, RESULT_FIELDS, type ProfileRow, type ResultRow, type StatsRow } from "./mappers";

export type PlayerResult = EventResult & { event: { id: string; name: string; startsAt: string } };

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  if (isDemoMode) return demo.demoProfile(username);
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select(PROFILE_FIELDS).eq("username", username.toLowerCase()).maybeSingle<ProfileRow>();
  return data ? mapProfile(data) : null;
}

export async function getPlayerStats(userId: string): Promise<PlayerStats | null> {
  if (isDemoMode) return demo.demoPlayerStats(userId);
  const [supabase, communityId] = await Promise.all([createClient(), getCommunityId()]);
  const { data } = await supabase
    .from("player_stats")
    .select("*")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle<StatsRow>();
  return data ? mapStats(data) : null;
}

/** Histórico de colocações do jogador, do mais recente para o mais antigo. */
export async function getPlayerResults(userId: string, limit = 20): Promise<PlayerResult[]> {
  if (isDemoMode) return demo.demoPlayerResults(userId).slice(0, limit);
  const [supabase, communityId] = await Promise.all([createClient(), getCommunityId()]);
  const { data, error } = await supabase
    .from("event_results")
    .select(`${RESULT_FIELDS}, event:events!event_results_event_id_fkey!inner(id, name, starts_at, community_id, status)`)
    .eq("user_id", userId)
    .eq("event.community_id", communityId)
    .eq("event.status", "finished")
    .limit(limit)
    .returns<(ResultRow & { event: { id: string; name: string; starts_at: string } })[]>();
  if (error) throw error;
  return data
    .map((row) => ({ ...mapResult(row), event: { id: row.event.id, name: row.event.name, startsAt: row.event.starts_at } }))
    .sort((a, b) => b.event.startsAt.localeCompare(a.event.startsAt));
}

/** Contato do próprio usuário, para o formulário de edição de perfil. */
export async function getOwnContact(userId: string): Promise<{ whatsapp: string | null; shareWhatsapp: boolean }> {
  if (isDemoMode) return demo.demoContact(userId);
  const supabase = await createClient();
  const { data } = await supabase.from("profile_contacts").select("whatsapp, share_whatsapp").eq("user_id", userId).maybeSingle();
  return { whatsapp: data?.whatsapp ?? null, shareWhatsapp: data?.share_whatsapp ?? false };
}
