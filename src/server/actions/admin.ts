"use server";

// Ações do painel. Cada uma exige admin no servidor (requireAdmin) e a RLS confere de novo no banco.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fromLocalInput } from "@/lib/format";
import { isOwnMediaPath } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";
import { formToObject, zodErrorState, type ActionState } from "@/lib/validation/common";
import { eventSchema, legendSchema, rankingEntrySchema, rankingRulesSchema, resultsSchema } from "@/lib/validation/schemas";
import type { MemberRole } from "@/types/domain";
import { requireAdmin, requireSession, canModerate } from "../session";
import { dbError, demoBlocked } from "./helpers";

function revalidateArena(eventId?: string) {
  revalidatePath("/");
  revalidatePath("/arena", "layout");
  revalidatePath("/admin", "layout");
  if (eventId) revalidatePath(`/arena/eventos/${eventId}`);
}

// ---------- Eventos ----------

export async function saveEvent(_: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireAdmin();
  const parsed = eventSchema.safeParse(formToObject(form));
  if (!parsed.success) return zodErrorState(parsed.error);
  const v = parsed.data;
  if (v.imagePath && !isOwnMediaPath(v.imagePath, session.userId)) return { ok: false, message: "Foto inválida." };

  const row = {
    name: v.name,
    description: v.description,
    format: v.format,
    starts_at: fromLocalInput(v.startsAt),
    location: v.location,
    max_players: v.maxPlayers,
    status: v.status,
    signup_url: v.signupUrl,
    ...(v.imagePath ? { image_path: v.imagePath } : {}),
  };
  const supabase = await createClient();
  const { data, error } = v.id
    ? await supabase.from("events").update(row).eq("id", v.id).select("id").single()
    : await supabase.from("events").insert({ ...row, community_id: session.communityId, created_by: session.userId }).select("id").single();
  if (error) return dbError(error);

  revalidateArena(data.id);
  redirect(`/admin/eventos?salvo=${data.id}`);
}

export async function deleteEvent(id: string): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return dbError(error);
  revalidateArena();
  redirect("/admin/eventos?apagado=1");
}

// ---------- Resultados ----------

export async function saveResults(_: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireAdmin();

  // As colocações chegam como placement_N, user_N, guest_N, legend_N, record_N
  const raw = formToObject(form, ["played"]);
  const placements = Array.from({ length: Number(raw.slots ?? 4) }, (_, i) => ({
    placement: raw[`placement_${i}`] ?? i + 1,
    userId: raw[`user_${i}`] ?? "",
    guestName: raw[`guest_${i}`] ?? "",
    legendId: raw[`legend_${i}`] ?? "",
    record: raw[`record_${i}`] ?? "",
  }));
  const parsed = resultsSchema.safeParse({ ...raw, placements });
  if (!parsed.success) return zodErrorState(parsed.error);
  const v = parsed.data;
  if (v.imagePath && !isOwnMediaPath(v.imagePath, session.userId)) return { ok: false, message: "Foto inválida." };

  const filled = v.placements
    .filter((p) => p.userId || p.guestName)
    .map((p) => (p.userId ? { ...p, guestName: null } : p));
  const userIds = filled.flatMap((p) => (p.userId ? [p.userId] : []));
  if (new Set(userIds).size !== userIds.length) return { ok: false, message: "Um jogador aparece em duas colocações." };

  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("id, name, community_id").eq("id", v.eventId).single();
  if (!event || event.community_id !== session.communityId) return { ok: false, message: "Evento não encontrado." };

  // Resultado é refeito inteiro: apaga e grava de novo (edição simples e sem sobras)
  const { error: delError } = await supabase.from("event_results").delete().eq("event_id", v.eventId);
  if (delError) return dbError(delError);
  if (filled.length) {
    const { error } = await supabase.from("event_results").insert(
      filled.map((p) => ({
        event_id: v.eventId, placement: p.placement, user_id: p.userId, guest_name: p.guestName, legend_id: p.legendId, record: p.record,
      })),
    );
    if (error) return dbError(error);
  }

  // Presenças: quem foi marcado jogou; quem disse "vou" e não foi marcado vira falta
  const played = new Set([...v.played, ...userIds]);
  if (played.size) {
    const { error } = await supabase
      .from("event_participants")
      .upsert([...played].map((user_id) => ({ event_id: v.eventId, user_id, status: "played" })), { onConflict: "event_id,user_id" });
    if (error) return dbError(error);
  }
  await supabase
    .from("event_participants")
    .update({ status: "no_show" })
    .eq("event_id", v.eventId)
    .eq("status", "going");

  const guests = filled.filter((p) => !p.userId).length;
  const { error: eventError } = await supabase
    .from("events")
    .update({
      status: "finished",
      player_count: v.playerCount ?? played.size + guests,
      results_notes: v.notes,
      ...(v.imagePath ? { results_image_path: v.imagePath } : {}),
    })
    .eq("id", v.eventId);
  if (eventError) return dbError(eventError);

  if (v.publishChampion && filled.some((p) => p.placement === 1)) {
    const { data: existing } = await supabase.from("posts").select("id").eq("event_id", v.eventId).eq("kind", "champion").maybeSingle();
    if (existing) {
      await supabase.from("posts").update({ body: v.championMessage }).eq("id", existing.id);
    } else {
      const { data: post } = await supabase
        .from("posts")
        .insert({ community_id: session.communityId, author_id: session.userId, kind: "champion", event_id: v.eventId, body: v.championMessage, is_featured: true })
        .select("id")
        .single();
      if (post && v.imagePath) await supabase.from("post_images").insert({ post_id: post.id, path: v.imagePath, position: 0 });
    }
  }

  revalidateArena(v.eventId);
  revalidatePath("/jogador", "layout");
  redirect(`/arena/eventos/${v.eventId}?resultado=1`);
}

// ---------- Moderação ----------

export async function moderatePost(id: string, change: { hidden?: boolean; featured?: boolean }): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireSession();
  if (!canModerate(session)) return { ok: false, message: "Só a moderação pode fazer isso." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ ...(change.hidden !== undefined ? { is_hidden: change.hidden } : {}), ...(change.featured !== undefined ? { is_featured: change.featured } : {}) })
    .eq("id", id);
  if (error) return dbError(error);
  revalidatePath("/");
  revalidatePath("/admin/moderacao");
  return { ok: true, message: change.hidden ? "Post ocultado." : change.featured ? "Post em destaque." : "Feito." };
}

export async function moderateListing(id: string, hidden: boolean): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireSession();
  if (!canModerate(session)) return { ok: false, message: "Só a moderação pode fazer isso." };
  const supabase = await createClient();
  const { error } = await supabase.from("market_listings").update({ is_hidden: hidden }).eq("id", id);
  if (error) return dbError(error);
  revalidatePath("/mercado");
  revalidatePath("/admin/moderacao");
  return { ok: true, message: hidden ? "Anúncio ocultado." : "Anúncio visível de novo." };
}

// ---------- Usuários ----------

export async function updateMember(userId: string, change: { role?: MemberRole; banned?: boolean }): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireAdmin();
  if (userId === session.userId) return { ok: false, message: "Você não pode mudar o próprio acesso." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("community_members")
    .update({ ...(change.role ? { role: change.role } : {}), ...(change.banned !== undefined ? { is_banned: change.banned } : {}) })
    .eq("community_id", session.communityId)
    .eq("user_id", userId);
  if (error) return dbError(error);
  revalidatePath("/admin/usuarios");
  return { ok: true, message: "Acesso atualizado." };
}

// ---------- Ranking ----------

export async function saveRankingRules(_: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireAdmin();
  const raw = formToObject(form, ["points"]);
  const parsed = rankingRulesSchema.safeParse(raw);
  if (!parsed.success) return zodErrorState(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase
    .from("ranking_rules")
    .update({ points_by_placement: parsed.data.points, participation_points: parsed.data.participationPoints })
    .eq("community_id", session.communityId);
  if (error) return dbError(error);
  revalidateArena();
  return { ok: true, message: "Regra salva. O ranking já foi recalculado." };
}

export async function addRankingEntry(_: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireAdmin();
  const parsed = rankingEntrySchema.safeParse(formToObject(form));
  if (!parsed.success) return zodErrorState(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("ranking_entries").insert({
    community_id: session.communityId, user_id: parsed.data.userId, points: parsed.data.points, reason: parsed.data.reason, created_by: session.userId,
  });
  if (error) return dbError(error);
  revalidateArena();
  return { ok: true, message: "Ajuste lançado." };
}

export async function deleteRankingEntry(id: string): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("ranking_entries").delete().eq("id", id);
  if (error) return dbError(error);
  revalidateArena();
  return { ok: true, message: "Ajuste removido." };
}

// ---------- Catálogo ----------

export async function addLegend(_: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireAdmin();
  const parsed = legendSchema.safeParse(formToObject(form));
  if (!parsed.success) return zodErrorState(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase
    .from("cards")
    .insert({ name: parsed.data.name, set_name: parsed.data.setName, card_type: "legend", created_by: session.userId });
  if (error) return dbError(error);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Lenda cadastrada." };
}
