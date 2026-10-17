"use server";

// Ações de quem usa o app: perfil, mural, "Vou jogar", mercado e decks.
// Toda ação valida com Zod, confere a sessão e deixa a RLS ter a palavra final.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseDecklist } from "@/lib/domain/decklist";
import { isOwnMediaPath } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";
import { formToObject, zodErrorState, type ActionState } from "@/lib/validation/common";
import { deckSchema, listingSchema, listingStatusSchema, postSchema, profileSchema } from "@/lib/validation/schemas";
import { requireSession } from "../session";
import { dbError, demoBlocked } from "./helpers";

const badImage: ActionState = { ok: false, message: "Foto inválida. Envia de novo." };

// ---------- Perfil ----------

export async function updateProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireSession();
  const parsed = profileSchema.safeParse(formToObject(form));
  if (!parsed.success) return zodErrorState(parsed.error);
  const v = parsed.data;
  if (v.avatarPath && !isOwnMediaPath(v.avatarPath, session.userId)) return badImage;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: v.displayName,
      bio: v.bio,
      favorite_legend_id: v.favoriteLegendId,
      instagram: v.instagram,
      ...(v.avatarPath ? { avatar_path: v.avatarPath } : {}),
    })
    .eq("id", session.userId);
  if (error) return dbError(error);

  const { error: contactError } = await supabase
    .from("profile_contacts")
    .upsert({ user_id: session.userId, whatsapp: v.whatsapp, share_whatsapp: Boolean(v.whatsapp) && v.shareWhatsapp });
  if (contactError) return dbError(contactError);

  revalidatePath("/", "layout");
  redirect(`/jogador/${session.profile.username}?salvo=1`);
}

// ---------- Mural ----------

export async function createPost(_: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireSession();
  const parsed = postSchema.safeParse(formToObject(form, ["images"]));
  if (!parsed.success) return zodErrorState(parsed.error);
  const { kind, body, images } = parsed.data;
  if (images.some((path) => !isOwnMediaPath(path, session.userId))) return badImage;

  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("posts")
    .insert({ community_id: session.communityId, author_id: session.userId, kind, body })
    .select("id")
    .single();
  if (error) return dbError(error);

  if (images.length) {
    const { error: imagesError } = await supabase
      .from("post_images")
      .insert(images.map((path, position) => ({ post_id: post.id, path, position })));
    if (imagesError) return dbError(imagesError, "O post saiu, mas as fotos não. Tenta editar depois.");
  }
  revalidatePath("/");
  redirect("/?publicado=1");
}

export async function deletePost(postId: string): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  await requireSession();
  const supabase = await createClient();
  const { error, count } = await supabase.from("posts").delete({ count: "exact" }).eq("id", postId);
  if (error) return dbError(error);
  if (!count) return { ok: false, message: "Esse post não é teu." };
  revalidatePath("/");
  return { ok: true, message: "Post apagado." };
}

// ---------- Eventos ----------

/** "Vou jogar" liga e desliga. */
export async function toggleRsvp(eventId: string, going: boolean): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireSession();
  const supabase = await createClient();

  if (going) {
    const { data: event } = await supabase
      .from("events")
      .select("status, max_players, event_participants(count)")
      .eq("id", eventId)
      .eq("event_participants.status", "going")
      .single<{ status: string; max_players: number | null; event_participants: { count: number }[] }>();
    if (!event || event.status !== "scheduled") return { ok: false, message: "As inscrições desse evento fecharam." };
    if (event.max_players && (event.event_participants[0]?.count ?? 0) >= event.max_players) {
      return { ok: false, message: "Lotou! Fala com a organização para entrar na lista de espera." };
    }
    const { error } = await supabase.from("event_participants").insert({ event_id: eventId, user_id: session.userId });
    if (error && error.code !== "23505") return dbError(error);
  } else {
    const { error } = await supabase
      .from("event_participants")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", session.userId)
      .eq("status", "going");
    if (error) return dbError(error);
  }
  revalidatePath("/");
  revalidatePath("/arena");
  revalidatePath(`/arena/eventos/${eventId}`);
  return { ok: true, message: going ? "Tá dentro! Te vejo na mesa." : "Beleza, fica pra próxima." };
}

// ---------- Mercado ----------

function listingRow(v: ReturnType<typeof listingSchema.parse>) {
  return {
    kind: v.kind,
    card_name: v.cardName,
    set_name: v.setName,
    variant: v.variant,
    condition: v.condition,
    quantity: v.quantity,
    price_cents: v.price,
    accepts_trade: v.kind === "trade" ? true : v.acceptsTrade,
    description: v.description,
  };
}

export async function saveListing(listingId: string | null, _: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireSession();
  const parsed = listingSchema.safeParse(formToObject(form));
  if (!parsed.success) return zodErrorState(parsed.error);
  if (parsed.data.imagePath && !isOwnMediaPath(parsed.data.imagePath, session.userId)) return badImage;

  const supabase = await createClient();
  const image = parsed.data.imagePath ? { image_path: parsed.data.imagePath } : {};
  let id = listingId;
  if (listingId) {
    const { error, count } = await supabase
      .from("market_listings")
      .update({ ...listingRow(parsed.data), ...image }, { count: "exact" })
      .eq("id", listingId)
      .eq("seller_id", session.userId);
    if (error) return dbError(error);
    if (!count) return { ok: false, message: "Esse anúncio não é teu." };
  } else {
    const { data, error } = await supabase
      .from("market_listings")
      .insert({ ...listingRow(parsed.data), ...image, community_id: session.communityId, seller_id: session.userId })
      .select("id")
      .single();
    if (error) return dbError(error);
    id = data.id;
  }
  revalidatePath("/mercado");
  revalidatePath("/");
  redirect(`/mercado/${id}?salvo=1`);
}

export async function setListingStatus(id: string, status: string): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireSession();
  const parsed = listingStatusSchema.safeParse({ id, status });
  if (!parsed.success) return zodErrorState(parsed.error);
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("market_listings")
    .update({ status: parsed.data.status }, { count: "exact" })
    .eq("id", id)
    .eq("seller_id", session.userId);
  if (error) return dbError(error);
  if (!count) return { ok: false, message: "Esse anúncio não é teu." };
  revalidatePath("/mercado");
  revalidatePath(`/mercado/${id}`);
  return { ok: true, message: "Status atualizado." };
}

export async function deleteListing(id: string): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  await requireSession();
  const supabase = await createClient();
  const { error, count } = await supabase.from("market_listings").delete({ count: "exact" }).eq("id", id);
  if (error) return dbError(error);
  if (!count) return { ok: false, message: "Esse anúncio não é teu." };
  revalidatePath("/mercado");
  redirect("/mercado?apagado=1");
}

// ---------- Decks ----------

export async function createDeck(_: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireSession();
  const parsed = deckSchema.safeParse(formToObject(form));
  if (!parsed.success) return zodErrorState(parsed.error);
  const v = parsed.data;

  const list = parseDecklist(v.decklist);
  if (list.errors.length) return { ok: false, message: list.errors[0], fieldErrors: { decklist: list.errors.join("\n") } };
  if (!list.cards.length) return { ok: false, message: "A lista está vazia.", fieldErrors: { decklist: "A lista está vazia." } };

  const supabase = await createClient();
  const { data: deck, error } = await supabase
    .from("decks")
    .insert({
      community_id: session.communityId,
      author_id: session.userId,
      name: v.name,
      legend_id: v.legendId,
      description: v.description,
      visibility: v.visibility,
      event_id: v.eventId,
      record: v.record,
      placement: v.placement,
    })
    .select("id")
    .single();
  if (error) return dbError(error);

  const { error: cardsError } = await supabase
    .from("deck_cards")
    .insert(list.cards.map((c, position) => ({ deck_id: deck.id, card_name: c.name, quantity: c.quantity, section: c.section, position })));
  if (cardsError) {
    await supabase.from("decks").delete().eq("id", deck.id);
    return dbError(cardsError);
  }

  if (v.shareOnFeed && v.visibility === "public") {
    await supabase.from("posts").insert({ community_id: session.communityId, author_id: session.userId, kind: "deck", deck_id: deck.id, body: v.description?.slice(0, 280) ?? null });
    revalidatePath("/");
  }
  redirect(`/decks/${deck.id}?salvo=1`);
}

export async function deleteDeck(id: string): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  const session = await requireSession();
  const supabase = await createClient();
  const { error, count } = await supabase.from("decks").delete({ count: "exact" }).eq("id", id);
  if (error) return dbError(error);
  if (!count) return { ok: false, message: "Esse deck não é teu." };
  revalidatePath("/");
  redirect(`/jogador/${session.profile.username}`);
}
