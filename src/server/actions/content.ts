"use server";

// Ações de quem usa o app: perfil, mural, "Vou jogar", mercado e decks.
// Toda ação valida com Zod, confere a sessão e deixa a RLS ter a palavra final.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseDecklist } from "@/lib/domain/decklist";
import { isOwnMediaPath } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";
import { formToObject, zodErrorState, type ActionState } from "@/lib/validation/common";
import {
  deckSchema, listingSchema, listingStatusSchema, offerResponseSchema, offerSchema, postSchema, profileSchema,
} from "@/lib/validation/schemas";
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
  // Base do preço, Liga e ofertas só fazem sentido em venda
  const sell = v.kind === "sell";
  const base = sell && v.priceBase && v.priceBaseCents != null ? { base: v.priceBase, cents: v.priceBaseCents } : null;
  return {
    kind: v.kind,
    card_id: v.cardId,
    collection_item_id: v.collectionItemId,
    card_name: v.cardName,
    set_name: v.setName,
    variant: v.variant,
    condition: v.condition,
    quantity: v.quantity,
    price_cents: v.price,
    accepts_trade: v.kind === "trade" ? true : v.acceptsTrade,
    price_base: base?.base ?? null,
    price_base_cents: base?.cents ?? null,
    discount_pct: base ? (v.discountPct ?? 0) : null,
    liga_price_cents: sell ? v.ligaPrice : null,
    liga_language: sell && v.ligaPrice != null ? v.ligaLanguage : null,
    liga_condition: sell && v.ligaPrice != null ? v.ligaCondition : null,
    accepts_offers: sell && v.acceptsOffers,
    min_offer_cents: sell && v.acceptsOffers ? v.minOffer : null,
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
  if (parsed.data.collectionItemId) revalidatePath("/colecao");
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

// Ofertas: toda regra (abaixo do preço, mínimo, quem responde o quê) mora nas funções do banco.
function offerError(error: { message: string; code?: string }): ActionState {
  if (error.message.includes("below the price")) return { ok: false, message: "A oferta tem que ficar abaixo do preço pedido." };
  if (error.message.includes("below the minimum")) return { ok: false, message: "Essa oferta está abaixo do mínimo que o vendedor aceita." };
  if (error.message.includes("does not accept offers")) return { ok: false, message: "Esse anúncio não está aceitando ofertas agora." };
  if (error.message.includes("counter must be")) return { ok: false, message: "A contraproposta tem que ficar entre a oferta e o preço pedido." };
  if (error.message.includes("is not pending") || error.message.includes("invalid action")) return { ok: false, message: "Essa oferta já foi respondida." };
  return dbError(error);
}

export async function makeOffer(_: ActionState, form: FormData): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  await requireSession();
  const parsed = offerSchema.safeParse(formToObject(form));
  if (!parsed.success) return zodErrorState(parsed.error);
  const { listingId, amount, message } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("make_listing_offer", { target_listing: listingId, amount, note: message });
  if (error) return offerError(error);
  revalidatePath(`/mercado/${listingId}`);
  return { ok: true, message: "Oferta enviada! Agora é com o vendedor." };
}

const OFFER_DONE: Record<string, string> = {
  accepted: "Oferta aceita! Combinem a entrega.",
  declined: "Oferta recusada.",
  countered: "Contraproposta enviada.",
  withdrawn: "Oferta retirada.",
};

export async function respondOffer(listingId: string, offerId: string, action: string, counter?: string): Promise<ActionState> {
  const blocked = demoBlocked();
  if (blocked) return blocked;
  await requireSession();
  const parsed = offerResponseSchema.safeParse({ offerId, action, counter });
  if (!parsed.success) return zodErrorState(parsed.error);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("respond_listing_offer", {
    target_offer: parsed.data.offerId, action: parsed.data.action, counter: parsed.data.counter,
  });
  if (error) return offerError(error);
  revalidatePath("/mercado");
  revalidatePath(`/mercado/${listingId}`);
  return { ok: true, message: OFFER_DONE[data as string] ?? "Pronto." };
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
