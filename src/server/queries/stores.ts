import "server-only";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import * as demo from "@/lib/demo/store";
import type { EventSummary, Store } from "@/types/domain";
import { getCommunityId, getSession } from "../session";
import { EVENT_FIELDS, mapEvent, mapStore, STORE_FIELDS, type EventRow, type StoreRow } from "./mappers";

/** Lojas da comunidade, em ordem alfabética. */
export async function getStores(): Promise<Store[]> {
  if (isDemoMode) return demo.demoStoreList();
  const [supabase, communityId] = await Promise.all([createClient(), getCommunityId()]);
  const { data, error } = await supabase
    .from("stores")
    .select(STORE_FIELDS)
    .eq("community_id", communityId)
    .order("name")
    .returns<StoreRow[]>();
  if (error) throw error;
  return data.map(mapStore);
}

export async function getStore(id: string): Promise<Store | null> {
  return (await getStores()).find((s) => s.id === id) ?? null;
}

/** Lojas que o usuário logado cuida. */
export async function getMyStores(): Promise<Store[]> {
  const session = await getSession();
  if (!session) return [];
  return (await getStores()).filter((s) => s.owner.id === session.userId);
}

/** Quem pode cadastrar e editar eventos da loja: o dono e o admin. */
export async function canManageStore(storeId: string | null | undefined): Promise<boolean> {
  if (!storeId) return false;
  const session = await getSession();
  if (!session) return false;
  if (session.role === "admin") return true;
  const store = await getStore(storeId);
  return store?.owner.id === session.userId;
}

/** Eventos da loja que ainda vão acontecer (ou estão rolando), do mais próximo ao mais distante. */
export async function getStoreEvents(storeId: string): Promise<EventSummary[]> {
  if (isDemoMode) return demo.demoStoreEventList(storeId);
  const [supabase, session] = await Promise.all([createClient(), getSession()]);
  const since = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_FIELDS)
    .eq("store_id", storeId)
    .neq("status", "finished")
    .gte("starts_at", since)
    .order("starts_at")
    .limit(100)
    .returns<EventRow[]>();
  if (error) throw error;
  return data.map((row) => mapEvent(row, session?.userId ?? null));
}
