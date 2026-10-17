// Selects do Supabase e conversão das linhas para os tipos de domínio.
// Os relacionamentos usam o nome da FK (!tabela_coluna_fkey) para nunca ficarem ambíguos.

import { cardImageUrl } from "@/lib/cards";
import { mediaUrl } from "@/lib/images";
import type {
  CardCondition, DeckDetail, DeckSection, DeckSummary, DeckVisibility, EventResult, EventStatus, EventSummary,
  CardSummary, Legend, Listing, ListingKind, ListingStatus, MiniProfile, PlayerStats, PostKind, Profile, RankingRow, Store,
} from "@/types/domain";

export const MINI = "id, username, display_name, avatar_path";

export type MiniRow = { id: string; username: string; display_name: string; avatar_path: string | null };
export type LegendRow = { id: string; name: string } | null;

export function mapMini(row: MiniRow): MiniProfile {
  return { id: row.id, username: row.username, displayName: row.display_name, avatarUrl: mediaUrl(row.avatar_path) };
}

const mapLegend = (row: LegendRow): Legend | null => (row ? { id: row.id, name: row.name } : null);

// ---------- Perfil ----------
export const PROFILE_FIELDS = `${MINI}, bio, instagram, created_at, legend:cards!profiles_favorite_legend_id_fkey(id, name)`;
export type ProfileRow = MiniRow & { bio: string | null; instagram: string | null; created_at: string; legend: LegendRow };

export function mapProfile(row: ProfileRow): Profile {
  return { ...mapMini(row), bio: row.bio, instagram: row.instagram, createdAt: row.created_at, favoriteLegend: mapLegend(row.legend) };
}

// ---------- Estatísticas (views) ----------
export type StatsRow = {
  user_id: string; username: string; display_name: string; avatar_path: string | null;
  events_played: number; titles: number; seconds: number; top4: number;
  last_title_event_id: string | null; last_title_event_name: string | null; last_title_at: string | null;
};
export type RankingViewRow = StatsRow & { points: number; manual_points: number; position: number };

export function mapStats(row: StatsRow): PlayerStats {
  return {
    ...mapMini({ id: row.user_id, username: row.username, display_name: row.display_name, avatar_path: row.avatar_path }),
    eventsPlayed: row.events_played,
    titles: row.titles,
    seconds: row.seconds,
    top4: row.top4,
    lastTitle: row.last_title_event_id
      ? { eventId: row.last_title_event_id, name: row.last_title_event_name ?? "", at: row.last_title_at ?? "" }
      : null,
  };
}

export function mapRanking(row: RankingViewRow): RankingRow {
  return { ...mapStats(row), points: row.points, manualPoints: row.manual_points, position: row.position };
}

// ---------- Eventos ----------
export const EVENT_FIELDS =
  "id, name, description, format, starts_at, location, max_players, status, image_path, signup_url, player_count, results_image_path, results_notes, series_id, store:stores!events_store_id_fkey(id, name), event_participants(user_id, status)";
export type EventRow = {
  id: string; name: string; description: string | null; format: string | null; starts_at: string; location: string;
  max_players: number | null; status: EventStatus; image_path: string | null; signup_url: string | null;
  player_count: number | null; results_image_path: string | null; results_notes: string | null;
  series_id: string | null; store: { id: string; name: string } | null;
  event_participants: { user_id: string; status: string }[];
};

export function mapEvent(row: EventRow, viewerId: string | null): EventSummary {
  const going = row.event_participants.filter((p) => p.status === "going");
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    format: row.format,
    startsAt: row.starts_at,
    location: row.location,
    maxPlayers: row.max_players,
    status: row.status,
    imageUrl: mediaUrl(row.image_path),
    signupUrl: row.signup_url,
    goingCount: going.length,
    isGoing: Boolean(viewerId && going.some((p) => p.user_id === viewerId)),
    playerCount: row.player_count,
    store: row.store,
    seriesId: row.series_id,
  };
}

// ---------- Lojas ----------
export const STORE_FIELDS = `id, name, address, instagram, description, owner:profiles!stores_owner_id_fkey(${MINI})`;
export type StoreRow = { id: string; name: string; address: string | null; instagram: string | null; description: string | null; owner: MiniRow };

export function mapStore(row: StoreRow): Store {
  return { id: row.id, name: row.name, address: row.address, instagram: row.instagram, description: row.description, owner: mapMini(row.owner) };
}

export const RESULT_FIELDS = `id, event_id, placement, guest_name, record, notes,
  player:profiles!event_results_user_id_fkey(${MINI}),
  legend:cards!event_results_legend_id_fkey(id, name),
  deck:decks!event_results_deck_id_fkey(id, name)`;
export type ResultRow = {
  id: string; event_id: string; placement: number; guest_name: string | null; record: string | null; notes: string | null;
  player: MiniRow | null; legend: LegendRow; deck: { id: string; name: string } | null;
};

export function mapResult(row: ResultRow): EventResult {
  return {
    id: row.id,
    placement: row.placement,
    player: row.player ? { kind: "member", profile: mapMini(row.player) } : { kind: "guest", name: row.guest_name ?? "Convidado" },
    legend: mapLegend(row.legend),
    deck: row.deck,
    record: row.record,
    notes: row.notes,
  };
}

// ---------- Decks ----------
export const DECK_FIELDS = `id, name, record, placement, visibility, created_at, description,
  legend:cards!decks_legend_id_fkey(id, name),
  author:profiles!decks_author_id_fkey(${MINI}),
  event:events!decks_event_id_fkey(id, name),
  deck_cards(card_name, quantity, section, position)`;
export type DeckRow = {
  id: string; name: string; record: string | null; placement: number | null; visibility: DeckVisibility; created_at: string;
  description: string | null; legend: LegendRow; author: MiniRow; event: { id: string; name: string } | null;
  deck_cards: { card_name: string; quantity: number; section: DeckSection; position: number }[];
};

export function mapDeck(row: DeckRow): DeckDetail {
  const cards = [...row.deck_cards]
    .sort((a, b) => a.position - b.position)
    .map((c) => ({ name: c.card_name, quantity: c.quantity, section: c.section }));
  return {
    id: row.id,
    name: row.name,
    legend: mapLegend(row.legend),
    author: mapMini(row.author),
    record: row.record,
    placement: row.placement,
    event: row.event,
    cardCount: cards.filter((c) => c.section === "main").reduce((s, c) => s + c.quantity, 0),
    visibility: row.visibility,
    createdAt: row.created_at,
    description: row.description,
    cards,
  };
}

export function toDeckSummary(deck: DeckDetail): DeckSummary {
  const { id, name, legend, author, record, placement, event, cardCount, visibility, createdAt } = deck;
  return { id, name, legend, author, record, placement, event, cardCount, visibility, createdAt };
}

// ---------- Mercado ----------
// ---------- Cartas ----------
export const CARD_FIELDS = "id, name, set_name, public_code, rarity, image_url";
export type CardRow = { id: string; name: string; set_name: string | null; public_code: string | null; rarity: string | null; image_url: string | null };

export function mapCard(row: CardRow): CardSummary {
  return { id: row.id, name: row.name, setName: row.set_name, code: row.public_code, rarity: row.rarity, imageUrl: cardImageUrl(row.image_url) };
}

export const LISTING_FIELDS = `id, kind, card_name, collection_item_id, card:cards!market_listings_card_id_fkey(${CARD_FIELDS}), set_name, variant, condition, quantity, price_cents, accepts_trade,
  description, image_path, status, is_hidden, created_at, seller:profiles!market_listings_seller_id_fkey(${MINI})`;
export type ListingRow = {
  id: string; kind: ListingKind; card_name: string; collection_item_id: string | null; card: CardRow | null; set_name: string | null; variant: string | null; condition: CardCondition;
  quantity: number; price_cents: number | null; accepts_trade: boolean; description: string | null; image_path: string | null;
  status: ListingStatus; is_hidden: boolean; created_at: string; seller: MiniRow;
};

export function mapListing(row: ListingRow): Listing {
  return {
    id: row.id,
    kind: row.kind,
    card: row.card ? mapCard(row.card) : null,
    collectionItemId: row.collection_item_id,
    cardName: row.card_name,
    setName: row.set_name,
    variant: row.variant,
    condition: row.condition,
    quantity: row.quantity,
    priceCents: row.price_cents,
    acceptsTrade: row.accepts_trade,
    description: row.description,
    imageUrl: mediaUrl(row.image_path),
    imagePath: row.image_path,
    status: row.status,
    isHidden: row.is_hidden,
    createdAt: row.created_at,
    seller: mapMini(row.seller),
  };
}

// ---------- Mural ----------
export const POST_FIELDS = `id, kind, body, created_at, is_featured, is_hidden, event_id, deck_id,
  author:profiles!posts_author_id_fkey(${MINI}), post_images(path, position)`;
export type PostRow = {
  id: string; kind: PostKind; body: string | null; created_at: string; is_featured: boolean; is_hidden: boolean;
  event_id: string | null; deck_id: string | null; author: MiniRow; post_images: { path: string; position: number }[];
};
