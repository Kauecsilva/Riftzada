import "server-only";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import * as demo from "@/lib/demo/store";
import type { EventSummary, Store } from "@/types/domain";
import { getCommunityId, getSession } from "../session";
import { EVENT_FIELDS, mapEvent, mapStore, STORE_FIELDS, type EventRow, type StoreRow } from "./mappers";

/** Lojas que o usuário enxerga (a RLS mostra pendente só ao dono e ao admin), em ordem alfabética. */
async function listStores(): Promise<Store[]> {
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

/** Lojas aprovadas: as que aparecem na Arena. */
export async function getStores(): Promise<Store[]> {
  return (await listStores()).filter((s) => s.approved);
}

/** Pedidos de loja esperando o admin. */
export async function getPendingStores(): Promise<Store[]> {
  return (await listStores()).filter((s) => !s.approved);
}

export async function getStore(id: string): Promise<Store | null> {
  return (await listStores()).find((s) => s.id === id) ?? null;
}

/** Lojas que o usuário logado cuida, aprovadas ou não. */
export async function getMyStores(): Promise<Store[]> {
  const session = await getSession();
  if (!session) return [];
  return (await listStores()).filter((s) => s.owner.id === session.userId);
}

async function storeAccess(storeId: string | null | undefined): Promise<"admin" | "owner" | "pending-owner" | null> {
  if (!storeId) return null;
  const session = await getSession();
  if (!session) return null;
  if (session.role === "admin") return "admin";
  if (session.profile.accountKind !== "store") return null;
  const store = await getStore(storeId);
  if (store?.owner.id !== session.userId) return null;
  return store.approved ? "owner" : "pending-owner";
}

/** Quem pede o cadastro de uma loja: conta de loja e admin. */
export async function canCreateStore(): Promise<boolean> {
  const session = await getSession();
  return session?.role === "admin" || session?.profile.accountKind === "store";
}

/** Quem edita os dados da loja: o dono (mesmo antes da aprovação) e o admin. */
export async function canEditStore(storeId: string | null | undefined): Promise<boolean> {
  return (await storeAccess(storeId)) !== null;
}

/** Quem cadastra e edita eventos da loja: o dono de loja aprovada e o admin. */
export async function canManageStore(storeId: string | null | undefined): Promise<boolean> {
  const access = await storeAccess(storeId);
  return access === "admin" || access === "owner";
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
