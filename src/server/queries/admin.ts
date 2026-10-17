import "server-only";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import * as demo from "@/lib/demo/store";
import type { EventSummary, Member, MemberRole, MiniProfile } from "@/types/domain";
import { getCommunityId, getSession } from "../session";
import { EVENT_FIELDS, mapEvent, mapMini, MINI, type EventRow, type MiniRow } from "./mappers";

/** Todos os eventos (qualquer status), para o painel. */
export async function getAllEvents(): Promise<EventSummary[]> {
  if (isDemoMode) return demo.demoAllEvents();
  const [supabase, communityId, session] = await Promise.all([createClient(), getCommunityId(), getSession()]);
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_FIELDS)
    .eq("community_id", communityId)
    .order("starts_at", { ascending: false })
    .limit(200)
    .returns<EventRow[]>();
  if (error) throw error;
  return data.map((row) => mapEvent(row, session?.userId ?? null));
}

export async function getMembers(): Promise<Member[]> {
  if (isDemoMode) return demo.demoMembers();
  const [supabase, communityId] = await Promise.all([createClient(), getCommunityId()]);
  const { data, error } = await supabase
    .from("community_members")
    .select(`role, is_banned, joined_at, profile:profiles!community_members_user_id_fkey(${MINI})`)
    .eq("community_id", communityId)
    .order("joined_at")
    .returns<{ role: MemberRole; is_banned: boolean; joined_at: string; profile: MiniRow }[]>();
  if (error) throw error;
  return data
    .map((m) => ({ ...mapMini(m.profile), role: m.role, isBanned: m.is_banned, joinedAt: m.joined_at }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"));
}

export type RankingEntry = { id: string; player: MiniProfile; points: number; reason: string; createdAt: string };

export async function getRankingEntries(): Promise<RankingEntry[]> {
  if (isDemoMode) return demo.demoRankingEntriesList();
  const [supabase, communityId] = await Promise.all([createClient(), getCommunityId()]);
  const { data, error } = await supabase
    .from("ranking_entries")
    .select(`id, points, reason, created_at, player:profiles!ranking_entries_user_id_fkey(${MINI})`)
    .eq("community_id", communityId)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<{ id: string; points: number; reason: string; created_at: string; player: MiniRow }[]>();
  if (error) throw error;
  return data.map((e) => ({ id: e.id, player: mapMini(e.player), points: e.points, reason: e.reason, createdAt: e.created_at }));
}
