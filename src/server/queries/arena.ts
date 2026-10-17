import "server-only";
import { isDemoMode } from "@/lib/env";
import { mediaUrl } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";
import * as demo from "@/lib/demo/store";
import type { EventDetail, EventSummary, FinishedEvent, Legend, PlayerStats, RankingRow, RankingRules } from "@/types/domain";
import { getCommunityId, getSession } from "../session";
import {
  EVENT_FIELDS, mapEvent, mapMini, mapRanking, mapResult, mapStats, RESULT_FIELDS,
  type EventRow, type MiniRow, type RankingViewRow, type ResultRow, type StatsRow,
} from "./mappers";

export async function getUpcomingEvents(limit = 20): Promise<EventSummary[]> {
  if (isDemoMode) return demo.demoUpcomingEvents().slice(0, limit);
  const [supabase, communityId, session] = await Promise.all([createClient(), getCommunityId(), getSession()]);
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_FIELDS)
    .eq("community_id", communityId)
    .in("status", ["scheduled", "live"])
    .order("starts_at", { ascending: true })
    .limit(limit)
    .returns<EventRow[]>();
  if (error) throw error;
  return data.map((row) => mapEvent(row, session?.userId ?? null));
}

export async function getNextEvent(): Promise<EventSummary | null> {
  return (await getUpcomingEvents(1))[0] ?? null;
}

/** Eventos finalizados com o top 4, do mais recente para o mais antigo. */
export async function getFinishedEvents(limit = 20, ids?: string[]): Promise<FinishedEvent[]> {
  if (isDemoMode) {
    const all = demo.demoFinishedEvents();
    return (ids ? all.filter((e) => ids.includes(e.id)) : all).slice(0, limit);
  }
  if (ids && ids.length === 0) return [];
  const [supabase, communityId, session] = await Promise.all([createClient(), getCommunityId(), getSession()]);
  let query = supabase.from("events").select(EVENT_FIELDS).eq("community_id", communityId).eq("status", "finished");
  if (ids) query = query.in("id", ids);
  const { data: events, error } = await query.order("starts_at", { ascending: false }).limit(limit).returns<EventRow[]>();
  if (error) throw error;
  if (!events.length) return [];

  const { data: results, error: resultsError } = await supabase
    .from("event_results")
    .select(RESULT_FIELDS)
    .in("event_id", events.map((e) => e.id))
    .lte("placement", 4)
    .order("placement")
    .returns<ResultRow[]>();
  if (resultsError) throw resultsError;

  return events.map((row) => ({
    ...mapEvent(row, session?.userId ?? null),
    podium: results.filter((r) => r.event_id === row.id).map(mapResult),
    resultsImageUrl: mediaUrl(row.results_image_path),
  }));
}

/** Campeão do torneio mais recente (o "Campeão da semana" da Home). */
export async function getLatestChampion(): Promise<FinishedEvent | null> {
  const [latest] = await getFinishedEvents(1);
  return latest && latest.podium.length ? latest : null;
}

export async function getEvent(id: string): Promise<EventDetail | null> {
  if (isDemoMode) return demo.demoEvent(id);
  const [supabase, communityId, session] = await Promise.all([createClient(), getCommunityId(), getSession()]);
  const { data: row } = await supabase
    .from("events")
    .select(EVENT_FIELDS)
    .eq("community_id", communityId)
    .eq("id", id)
    .maybeSingle<EventRow>();
  if (!row) return null;

  const [{ data: participants }, { data: results }] = await Promise.all([
    supabase
      .from("event_participants")
      .select(`status, created_at, profile:profiles!event_participants_user_id_fkey(id, username, display_name, avatar_path)`)
      .eq("event_id", id)
      .neq("status", "no_show")
      .order("created_at")
      .returns<{ status: string; profile: MiniRow }[]>(),
    supabase.from("event_results").select(RESULT_FIELDS).eq("event_id", id).order("placement").returns<ResultRow[]>(),
  ]);

  const summary = mapEvent(row, session?.userId ?? null);
  return {
    ...summary,
    participants: (participants ?? []).map((p) => ({ ...mapMini(p.profile), played: p.status === "played" })),
    results: (results ?? []).map(mapResult),
    resultsImageUrl: mediaUrl(row.results_image_path),
    resultsNotes: row.results_notes,
  };
}

export async function getRanking(limit = 100): Promise<RankingRow[]> {
  if (isDemoMode) return demo.demoRanking().slice(0, limit);
  const [supabase, communityId] = await Promise.all([createClient(), getCommunityId()]);
  const { data, error } = await supabase
    .from("ranking")
    .select("*")
    .eq("community_id", communityId)
    .order("position")
    .limit(limit)
    .returns<RankingViewRow[]>();
  if (error) throw error;
  return data.map(mapRanking);
}

export async function getHallOfFame(): Promise<PlayerStats[]> {
  if (isDemoMode) return demo.demoHall();
  const [supabase, communityId] = await Promise.all([createClient(), getCommunityId()]);
  const { data, error } = await supabase
    .from("hall_of_fame")
    .select("*")
    .eq("community_id", communityId)
    .order("titles", { ascending: false })
    .order("top4", { ascending: false })
    .order("events_played", { ascending: false })
    .returns<StatsRow[]>();
  if (error) throw error;
  return data.map(mapStats);
}

export async function getRankingRules(): Promise<RankingRules> {
  if (isDemoMode) return demo.demoRankingRulesValue();
  const [supabase, communityId] = await Promise.all([createClient(), getCommunityId()]);
  const { data } = await supabase
    .from("ranking_rules")
    .select("points_by_placement, participation_points")
    .eq("community_id", communityId)
    .maybeSingle();
  return {
    pointsByPlacement: data?.points_by_placement ?? [100, 70, 50, 50],
    participationPoints: data?.participation_points ?? 10,
  };
}

/** Lendas do catálogo, para seletores de resultado, deck e perfil. */
export async function getLegends(): Promise<Legend[]> {
  if (isDemoMode) return demo.demoLegends();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("id, name")
    .eq("game", "riftbound")
    .eq("card_type", "legend")
    .order("name");
  if (error) throw error;
  return data;
}
