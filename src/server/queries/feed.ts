import "server-only";
import { isDemoMode } from "@/lib/env";
import { mediaUrl } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";
import * as demo from "@/lib/demo/store";
import type { FeedItem, Post } from "@/types/domain";
import { getCommunityId } from "../session";
import { getFinishedEvents } from "./arena";
import { getDecks } from "./decks";
import { getListings } from "./market";
import { mapMini, POST_FIELDS, type PostRow } from "./mappers";

export type PostFilter = { authorId?: string; limit?: number; before?: string; includeHidden?: boolean };

/** Posts do mural já com o evento (pódio) ou o deck que eles citam. */
export async function getPosts(filter: PostFilter = {}): Promise<Post[]> {
  const limit = filter.limit ?? 20;
  if (isDemoMode) {
    return demo
      .demoPostList()
      .filter((p) => (!filter.authorId || p.author.id === filter.authorId) && (!filter.before || p.createdAt < filter.before))
      .slice(0, limit);
  }
  const [supabase, communityId] = await Promise.all([createClient(), getCommunityId()]);
  let query = supabase.from("posts").select(POST_FIELDS).eq("community_id", communityId);
  if (!filter.includeHidden) query = query.eq("is_hidden", false);
  if (filter.authorId) query = query.eq("author_id", filter.authorId);
  if (filter.before) query = query.lt("created_at", filter.before);
  const { data: rows, error } = await query.order("created_at", { ascending: false }).limit(limit).returns<PostRow[]>();
  if (error) throw error;

  const eventIds = [...new Set(rows.flatMap((r) => (r.kind === "champion" && r.event_id ? [r.event_id] : [])))];
  const deckIds = [...new Set(rows.flatMap((r) => (r.deck_id ? [r.deck_id] : [])))];
  const [events, decks] = await Promise.all([getFinishedEvents(eventIds.length, eventIds), getDecks({ ids: deckIds })]);

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    body: row.body,
    createdAt: row.created_at,
    author: mapMini(row.author),
    images: [...row.post_images].sort((a, b) => a.position - b.position).map((i) => mediaUrl(i.path)!).filter(Boolean),
    isFeatured: row.is_featured,
    isHidden: row.is_hidden,
    event: events.find((e) => e.id === row.event_id) ?? null,
    deck: decks.find((d) => d.id === row.deck_id) ?? null,
  }));
}

/**
 * Feed "Na Riftzada": posts + anúncios recentes, intercalados por data.
 * `before` pagina pelo created_at ("Carregar mais"); as páginas seguintes trazem só posts.
 */
export async function getFeed(opts: { limit?: number; before?: string } = {}): Promise<FeedItem[]> {
  const limit = opts.limit ?? 20;
  if (isDemoMode) return demo.demoFeed().filter((i) => !opts.before || i.at < opts.before).slice(0, limit);

  const posts = await getPosts({ limit, before: opts.before });
  const items: FeedItem[] = posts.map((post) => ({ type: "post", at: post.createdAt, post }));
  if (!opts.before) {
    const oldest = posts.length === limit ? posts.at(-1)!.createdAt : "";
    const listings = await getListings({ limit: 10 });
    items.push(...listings.filter((l) => l.createdAt >= oldest).map((listing) => ({ type: "listing" as const, at: listing.createdAt, listing })));
  }
  return items.sort((a, b) => b.at.localeCompare(a.at));
}
