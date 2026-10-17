// Tipos do domínio: o formato que as telas recebem (já montado pelas queries),
// não o formato cru das tabelas.

export type MemberRole = "user" | "moderator" | "admin";
export type PostKind = "general" | "pull" | "deck" | "champion";
export type EventStatus = "scheduled" | "live" | "finished" | "cancelled";
export type ListingKind = "sell" | "trade" | "want";
export type ListingStatus = "available" | "reserved" | "done";
export type CardCondition = "nm" | "lp" | "mp" | "hp" | "damaged";
export type DeckVisibility = "public" | "unlisted" | "private";
export type DeckSection = "main" | "runes" | "battlefields" | "side";

export type MiniProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type Legend = { id: string; name: string };

export type Profile = MiniProfile & {
  bio: string | null;
  favoriteLegend: Legend | null;
  instagram: string | null;
  createdAt: string;
};

export type PlayerStats = MiniProfile & {
  eventsPlayed: number;
  titles: number;
  seconds: number;
  top4: number;
  lastTitle: { eventId: string; name: string; at: string } | null;
};

export type RankingRow = PlayerStats & {
  points: number;
  manualPoints: number;
  position: number;
};

export type RankingRules = {
  pointsByPlacement: number[];
  participationPoints: number;
};

export type EventSummary = {
  id: string;
  name: string;
  description: string | null;
  format: string | null;
  startsAt: string;
  location: string;
  maxPlayers: number | null;
  status: EventStatus;
  imageUrl: string | null;
  signupUrl: string | null;
  goingCount: number;
  isGoing: boolean;
  playerCount: number | null;
};

export type ResultPlayer =
  | { kind: "member"; profile: MiniProfile }
  | { kind: "guest"; name: string };

export type EventResult = {
  id: string;
  placement: number;
  player: ResultPlayer;
  legend: Legend | null;
  deck: { id: string; name: string } | null;
  record: string | null;
  notes: string | null;
};

export type EventDetail = EventSummary & {
  participants: (MiniProfile & { played: boolean })[];
  results: EventResult[];
  resultsImageUrl: string | null;
  resultsNotes: string | null;
};

/** Evento finalizado com o pódio, para "Quem levou essa?" e o campeão da semana. */
export type FinishedEvent = EventSummary & { podium: EventResult[]; resultsImageUrl: string | null };

export type DeckSummary = {
  id: string;
  name: string;
  legend: Legend | null;
  author: MiniProfile;
  record: string | null;
  placement: number | null;
  event: { id: string; name: string } | null;
  cardCount: number;
  visibility: DeckVisibility;
  createdAt: string;
};

export type DeckCardLine = { name: string; quantity: number; section: DeckSection };

export type DeckDetail = DeckSummary & { description: string | null; cards: DeckCardLine[] };

/** Carta do catálogo (importado do Riftcodex), resumida para busca, anúncio e coleção. */
export type CardSummary = {
  id: string;
  name: string;
  setName: string | null;
  code: string | null;
  rarity: string | null;
  imageUrl: string | null;
};

export type Listing = {
  id: string;
  kind: ListingKind;
  card: CardSummary | null;
  collectionItemId: string | null;
  cardName: string;
  setName: string | null;
  variant: string | null;
  condition: CardCondition;
  quantity: number;
  priceCents: number | null;
  acceptsTrade: boolean;
  description: string | null;
  imageUrl: string | null;
  imagePath: string | null;
  status: ListingStatus;
  isHidden: boolean;
  createdAt: string;
  seller: MiniProfile;
};

export type CollectionItem = {
  id: string;
  card: CardSummary;
  quantity: number;
  condition: CardCondition;
  variant: string | null;
  notes: string | null;
  /** Anúncio ainda aberto (não finalizado) feito a partir deste item. */
  listing: { id: string; status: ListingStatus } | null;
};

export type Post = {
  id: string;
  kind: PostKind;
  body: string | null;
  createdAt: string;
  author: MiniProfile;
  images: string[];
  isFeatured: boolean;
  isHidden: boolean;
  event: FinishedEvent | null;
  deck: DeckSummary | null;
};

export type FeedItem =
  | { type: "post"; at: string; post: Post }
  | { type: "listing"; at: string; listing: Listing };

export type Member = MiniProfile & { role: MemberRole; isBanned: boolean; joinedAt: string };

export type Session = {
  userId: string;
  profile: Profile;
  role: MemberRole;
  communityId: string;
};
