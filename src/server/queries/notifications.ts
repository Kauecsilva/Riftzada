import "server-only";
import { cache } from "react";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { demoNotifications } from "@/lib/demo/notifications";
import { getUnreadCount as getUnreadMessages } from "./chat";
import type { AppNotification, NotificationKind } from "@/types/domain";
import { mapMini, MINI, type MiniRow } from "./mappers";

const FIELDS = `id, kind, listing_id, amount_cents, body, read_at, created_at,
  actor:profiles!notifications_actor_id_fkey(${MINI}), listing:market_listings!notifications_listing_id_fkey(card_name)`;
type Row = {
  id: string; kind: NotificationKind; listing_id: string | null; amount_cents: number | null; body: string | null;
  read_at: string | null; created_at: string; actor: MiniRow | null; listing: { card_name: string } | null;
};

/** Avisos do usuário logado (a RLS só devolve os dele), mais novos primeiro. */
export async function getNotifications(limit = 50): Promise<AppNotification[]> {
  if (isDemoMode) return demoNotifications();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(FIELDS)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<Row[]>();
  if (error) throw error;
  return data.map((r) => ({
    id: r.id,
    kind: r.kind,
    actor: r.actor ? mapMini(r.actor) : null,
    listingId: r.listing_id,
    cardName: r.listing?.card_name ?? null,
    amountCents: r.amount_cents,
    body: r.body,
    readAt: r.read_at,
    createdAt: r.created_at,
  }));
}

/**
 * O número do sininho: avisos não lidos + mensagens de chat não lidas (um contador só no app).
 * Falha vira 0: o contador nunca derruba a página.
 */
export const getUnreadCount = cache(async (userId: string): Promise<number> => {
  const messages = getUnreadMessages(userId);
  if (isDemoMode) return demoNotifications().filter((n) => !n.readAt).length + (await messages);
  const supabase = await createClient();
  const { count, error } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  if (error) console.error("[db]", error.code, error.message);
  return (count ?? 0) + (await messages);
});
