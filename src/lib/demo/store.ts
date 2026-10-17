// Monta os objetos de domínio a partir dos fixtures, para o modo demonstração.
// Mesmas regras das views SQL (via src/lib/domain/stats.ts).

import { computePlayerStats, computeRanking, hallOfFame, type StatsInput } from "@/lib/domain/stats";
import { mediaUrl } from "@/lib/images";
import type {
  DeckDetail, DeckSummary, EventDetail, EventResult, EventSummary, FeedItem, FinishedEvent, Legend, Listing, Member,
  MiniProfile, Post, Profile, RankingRow,
} from "@/types/domain";
import { resolveRelDate } from "./dates";
import {
  demoCards, demoDecks, demoEvents, demoListings, demoParticipants, demoPosts, demoRankingEntries, demoRankingRules,
  demoResults, demoUsers, USERS,
} from "./fixtures";

export const DEMO_USER_ID = USERS.kaue;

const legendById = (id: string | null): Legend | null => {
  const card = demoCards.find((c) => c.id === id);
  return card ? { id: card.id, name: card.name } : null;
};

export function demoLegends(): Legend[] {
  return demoCards.map((c) => ({ id: c.id, name: c.name }));
}

function mini(id: string): MiniProfile {
  const user = demoUsers.find((u) => u.id === id)!;
  return { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: mediaUrl(user.avatarPath) };
}

export function demoProfile(username: string): Profile | null {
  const user = demoUsers.find((u) => u.username === username);
  if (!user) return null;
  return {
    ...mini(user.id),
    bio: user.bio,
    favoriteLegend: legendById(user.favoriteLegendId),
    instagram: user.instagram,
    createdAt: resolveRelDate(user.joined),
  };
}

export function demoProfileById(id: string): Profile | null {
  const user = demoUsers.find((u) => u.id === id);
  return user ? demoProfile(user.username) : null;
}

export function demoContact(userId: string): { whatsapp: string | null; shareWhatsapp: boolean } {
  const user = demoUsers.find((u) => u.id === userId);
  return { whatsapp: user?.whatsapp ?? null, shareWhatsapp: user?.shareWhatsapp ?? false };
}

export function demoMembers(): Member[] {
  return demoUsers.map((u) => ({ ...mini(u.id), role: u.role, isBanned: false, joinedAt: resolveRelDate(u.joined) }));
}

// ---------- Arena ----------

function eventSummary(id: string): EventSummary {
  const event = demoEvents.find((e) => e.id === id)!;
  const going = demoParticipants.filter((p) => p.eventId === id && p.status === "going");
  return {
    id: event.id,
    name: event.name,
    description: event.description,
    format: event.format,
    startsAt: resolveRelDate(event.startsAt),
    location: event.location,
    maxPlayers: event.maxPlayers,
    status: event.status,
    imageUrl: mediaUrl(event.imagePath),
    signupUrl: event.signupUrl,
    goingCount: going.length,
    isGoing: going.some((p) => p.userId === DEMO_USER_ID),
    playerCount: event.playerCount,
  };
}

function eventResults(eventId: string): EventResult[] {
  return demoResults
    .filter((r) => r.eventId === eventId)
    .sort((a, b) => a.placement - b.placement)
    .map((r) => {
      const deck = demoDecks.find((d) => d.id === r.deckId);
      return {
        id: r.id,
        placement: r.placement,
        player: r.userId ? { kind: "member" as const, profile: mini(r.userId) } : { kind: "guest" as const, name: r.guestName ?? "Convidado" },
        legend: legendById(r.legendId),
        deck: deck ? { id: deck.id, name: deck.name } : null,
        record: r.record,
        notes: r.notes,
      };
    });
}

function finishedEvent(id: string): FinishedEvent {
  const event = demoEvents.find((e) => e.id === id)!;
  return { ...eventSummary(id), podium: eventResults(id).slice(0, 4), resultsImageUrl: mediaUrl(event.resultsImagePath) };
}

export function demoUpcomingEvents(): EventSummary[] {
  return demoEvents
    .filter((e) => e.status === "scheduled" || e.status === "live")
    .map((e) => eventSummary(e.id))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function demoFinishedEvents(): FinishedEvent[] {
  return demoEvents
    .filter((e) => e.status === "finished")
    .map((e) => finishedEvent(e.id))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}

export function demoAllEvents(): EventSummary[] {
  return demoEvents.map((e) => eventSummary(e.id)).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}

export function demoEvent(id: string): EventDetail | null {
  const event = demoEvents.find((e) => e.id === id);
  if (!event) return null;
  return {
    ...eventSummary(id),
    participants: demoParticipants
      .filter((p) => p.eventId === id && p.status !== "no_show")
      .map((p) => ({ ...mini(p.userId), played: p.status === "played" })),
    results: eventResults(id),
    resultsImageUrl: mediaUrl(event.resultsImagePath),
    resultsNotes: event.resultsNotes,
  };
}

function statsInput(): StatsInput {
  return {
    players: demoUsers.map((u) => mini(u.id)),
    events: demoEvents.map((e) => ({ id: e.id, name: e.name, status: e.status, startsAt: resolveRelDate(e.startsAt) })),
    participants: demoParticipants,
    results: demoResults,
  };
}

export function demoRanking(): RankingRow[] {
  return computeRanking(statsInput(), demoRankingRules, demoRankingEntries);
}

export function demoHall() {
  return hallOfFame(computePlayerStats(statsInput()));
}

export function demoPlayerStats(userId: string) {
  return computePlayerStats(statsInput()).find((s) => s.id === userId) ?? null;
}

export function demoPlayerResults(userId: string): (EventResult & { event: { id: string; name: string; startsAt: string } })[] {
  return demoResults
    .filter((r) => r.userId === userId)
    .map((r) => {
      const ev = eventSummary(r.eventId);
      const result = eventResults(r.eventId).find((x) => x.id === r.id)!;
      return { ...result, event: { id: ev.id, name: ev.name, startsAt: ev.startsAt } };
    })
    .sort((a, b) => b.event.startsAt.localeCompare(a.event.startsAt));
}

export function demoRankingRulesValue() {
  return demoRankingRules;
}

export function demoRankingEntriesList() {
  return demoRankingEntries.map((r) => ({ id: r.id, player: mini(r.userId), points: r.points, reason: r.reason, createdAt: resolveRelDate(r.createdAt) }));
}

// ---------- Decks ----------

function deckDetail(id: string): DeckDetail {
  const deck = demoDecks.find((d) => d.id === id)!;
  const event = demoEvents.find((e) => e.id === deck.eventId);
  return {
    id: deck.id,
    name: deck.name,
    legend: legendById(deck.legendId),
    author: mini(deck.authorId),
    record: deck.record,
    placement: deck.placement,
    event: event ? { id: event.id, name: event.name } : null,
    cardCount: deck.cards.filter((c) => c.section === "main").reduce((s, c) => s + c.quantity, 0),
    visibility: deck.visibility,
    createdAt: resolveRelDate(deck.createdAt),
    description: deck.description,
    cards: deck.cards,
  };
}

export function demoDecksList(authorId?: string): DeckSummary[] {
  return demoDecks
    .filter((d) => !authorId || d.authorId === authorId)
    .map((d) => deckDetail(d.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function demoDeck(id: string): DeckDetail | null {
  return demoDecks.some((d) => d.id === id) ? deckDetail(id) : null;
}

// ---------- Mercado ----------

function listing(id: string): Listing {
  const item = demoListings.find((l) => l.id === id)!;
  return {
    id: item.id,
    kind: item.kind,
    cardName: item.cardName,
    setName: item.setName,
    variant: item.variant,
    condition: item.condition,
    quantity: item.quantity,
    priceCents: item.priceCents,
    acceptsTrade: item.acceptsTrade,
    description: item.description,
    imageUrl: mediaUrl(item.imagePath),
    imagePath: item.imagePath,
    status: item.status,
    isHidden: false,
    createdAt: resolveRelDate(item.createdAt),
    seller: mini(item.sellerId),
  };
}

export function demoListingsList(): Listing[] {
  return demoListings.map((l) => listing(l.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function demoListing(id: string): Listing | null {
  return demoListings.some((l) => l.id === id) ? listing(id) : null;
}

// ---------- Mural ----------

function post(id: string): Post {
  const item = demoPosts.find((p) => p.id === id)!;
  return {
    id: item.id,
    kind: item.kind,
    body: item.body,
    createdAt: resolveRelDate(item.createdAt),
    author: mini(item.authorId),
    images: item.images.map((path) => mediaUrl(path)!).filter(Boolean),
    isFeatured: item.isFeatured,
    isHidden: false,
    event: item.eventId ? finishedEvent(item.eventId) : null,
    deck: item.deckId ? deckDetail(item.deckId) : null,
  };
}

export function demoPostList(): Post[] {
  return demoPosts.map((p) => post(p.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function demoFeed(): FeedItem[] {
  const posts: FeedItem[] = demoPostList().map((p) => ({ type: "post", at: p.createdAt, post: p }));
  const listings: FeedItem[] = demoListingsList()
    .filter((l) => l.status !== "done")
    .map((l) => ({ type: "listing", at: l.createdAt, listing: l }));
  return [...posts, ...listings].sort((a, b) => b.at.localeCompare(a.at));
}
