"use server";

// Lojas: qualquer membro pede o cadastro da sua; depois que um admin aprova, o dono cuida dos eventos dela.
// A checagem aqui é para dar uma mensagem clara; quem barra de verdade é a RLS (is_store_owner).

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { weeklyDates } from "@/lib/domain/schedule";
import { fromLocalInput, toLocalInput } from "@/lib/format";
import { isOwnMediaPath } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";
import { formToObject, zodErrorState, type ActionState } from "@/lib/validation/common";
import { storeEventSchema, storeSchema } from "@/lib/validation/schemas";
import { canEditStore, canManageStore } from "../queries/stores";
import { requireSession } from "../session";
import { dbError, demoBlocked } from "./helpers";

const EXTEND_WEEKS = 8;

function revalidateStores(eventId?: string) {
  revalidatePath("/");
  revalidatePath("/arena", "layout");
  revalidatePath("/loja", "layout");
  revalidatePath("/admin", "layout");
  if (eventId) revalidatePath(`/arena/eventos/${eventId}`);
}

export async function saveStore(_: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireSession();
  const parsed = storeSchema.safeParse(formToObject(form));
  if (!parsed.success) return zodErrorState(parsed.error);
  const { id, ...v } = parsed.data;
  if (id && !(await canEditStore(id))) return { ok: false, message: "Você não cuida dessa loja." };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("stores").update(v).eq("id", id)
    : await supabase.from("stores").insert({ ...v, community_id: session.communityId, owner_id: session.userId });
  if (error) return error.code === "23505" ? { ok: false, message: "Já existe uma loja com esse nome." } : dbError(error);

  revalidateStores();
  redirect(`/loja?${id ? "loja-salva" : "loja-criada"}=1`);
}

export async function saveStoreEvent(_: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireSession();
  const parsed = storeEventSchema.safeParse(formToObject(form));
  if (!parsed.success) return zodErrorState(parsed.error);
  const v = parsed.data;
  if (!(await canManageStore(v.storeId))) return { ok: false, message: "Você não cuida dessa loja." };
  if (v.imagePath && !isOwnMediaPath(v.imagePath, session.userId)) return { ok: false, message: "Foto inválida." };

  const row = {
    name: v.name,
    description: v.description,
    format: v.format,
    location: v.location,
    max_players: v.maxPlayers,
    status: v.status,
    signup_url: v.signupUrl,
    ...(v.imagePath ? { image_path: v.imagePath } : {}),
  };
  const supabase = await createClient();

  if (v.id) {
    const { error } = await supabase
      .from("events")
      .update({ ...row, starts_at: fromLocalInput(v.startsAt) })
      .eq("id", v.id)
      .eq("store_id", v.storeId);
    if (error) return dbError(error);
    revalidateStores(v.id);
    redirect("/loja?evento-salvo=1");
  }

  const seriesId = v.repeatWeekly ? randomUUID() : null;
  const dates = v.repeatWeekly ? weeklyDates(v.startsAt, v.weeks) : [v.startsAt];
  const { error } = await supabase.from("events").insert(
    dates.map((d) => ({
      ...row,
      starts_at: fromLocalInput(d),
      community_id: session.communityId,
      store_id: v.storeId,
      series_id: seriesId,
      created_by: session.userId,
    })),
  );
  if (error) return dbError(error);

  revalidateStores();
  redirect(`/loja?evento-criado=${dates.length}`);
}

/** Apaga uma data ou, num semanal, essa data e todas as seguintes. */
export async function deleteStoreEvent(id: string, scope: "one" | "following"): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  await requireSession();
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("id, store_id, series_id, starts_at").eq("id", id).maybeSingle();
  if (!event || !(await canManageStore(event.store_id))) return { ok: false, message: "Evento não encontrado." };

  const query = supabase.from("events").delete().eq("store_id", event.store_id);
  const { error } = scope === "following" && event.series_id
    ? await query.eq("series_id", event.series_id).gte("starts_at", event.starts_at)
    : await query.eq("id", id);
  if (error) return dbError(error);

  revalidateStores();
  redirect("/loja?evento-apagado=1");
}

/** Semanal acabando: cria mais semanas depois da última data, copiando ela. */
export async function extendSeries(seriesId: string): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("events")
    .select("community_id, store_id, name, description, format, starts_at, location, max_players, signup_url, image_path")
    .eq("series_id", seriesId)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!last || !(await canManageStore(last.store_id))) return { ok: false, message: "Evento não encontrado." };

  const { starts_at: lastStart, ...copy } = last;
  const dates = weeklyDates(toLocalInput(lastStart), EXTEND_WEEKS + 1).slice(1);
  const { error } = await supabase.from("events").insert(
    dates.map((d) => ({ ...copy, starts_at: fromLocalInput(d), series_id: seriesId, created_by: session.userId })),
  );
  if (error) return dbError(error);

  revalidateStores();
  return { ok: true, message: `Mais ${EXTEND_WEEKS} semanas na agenda.` };
}
