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
export type PriceBase = "liga" | "tcgplayer";
export type LigaLanguage = "en" | "zh" | "pt" | "other";
export type OfferStatus = "pending" | "countered" | "accepted" | "declined" | "withdrawn";

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
  /** Cidade e UF informadas no perfil (opcionais; cidade só vem junto com a UF). */
  city: string | null;
  state: string | null;
  createdAt: string;
  /** Escolhido no cadastro. Só conta de loja cadastra loja e cria eventos. */
  accountKind: AccountKind;
};

export type AccountKind = "player" | "store";

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
  /** Loja que organiza (null = evento da própria comunidade). */
  store: StoreRef | null;
  /** Datas do mesmo evento semanal compartilham o seriesId. */
  seriesId: string | null;
};

export type StoreRef = { id: string; name: string };

export type Store = StoreRef & {
  address: string | null;
  instagram: string | null;
  description: string | null;
  owner: MiniProfile;
  /** Loja pendente não cria eventos nem aparece na Arena até um admin aprovar. */
  approved: boolean;
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
  /** De onde veio o preço: base (Liga ou TCGplayer, em centavos de real) e o desconto aplicado. */
  priceBase: PriceBase | null;
  priceBaseCents: number | null;
  discountPct: number | null;
  /** Menor preço da LigaRiftbound informado pelo vendedor (a Liga não deixa consultar automático). */
  liga: { priceCents: number; language: LigaLanguage | null; condition: CardCondition | null } | null;
  acceptsOffers: boolean;
  minOfferCents: number | null;
  description: string | null;
  imageUrl: string | null;
  imagePath: string | null;
  status: ListingStatus;
  isHidden: boolean;
  createdAt: string;
  seller: MiniProfile;
  /** "Campinas/SP" do perfil de quem anunciou, ou null. */
  sellerRegion: string | null;
};

/** Preço do TCGplayer (em centavos de dólar) de um acabamento da carta. */
export type CardPrice = {
  finish: "normal" | "foil";
  lowCents: number | null;
  marketCents: number | null;
  productUrl: string | null;
  updatedAt: string;
};

/** Menor preço da LigaRiftbound, coletado automaticamente (idioma e condição da oferta mais barata). */
export type LigaPrice = {
  finish: "normal" | "foil";
  lowCents: number;
  avgCents: number | null;
  language: LigaLanguage | null;
  condition: CardCondition | null;
  url: string;
  updatedAt: string;
};

/** Referências de preço de uma carta para o anúncio. */
export type PriceReference = { tcgplayer: CardPrice[]; liga: LigaPrice[]; usdBrl: number | null; rateUpdatedAt: string | null };

/** Carta oferecida numa troca (`cardId` quando veio do catálogo). */
export type OfferCard = { name: string; qty: number; cardId: string | null };

export type ListingOffer = {
  id: string;
  buyer: MiniProfile;
  /** Valor em dinheiro; pode ser zero quando a oferta é só em cartas. */
  amountCents: number;
  cards: OfferCard[];
  counterCents: number | null;
  message: string | null;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
};

export type ListingMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};

/** Conversa de um anúncio entre quem anunciou e uma pessoa interessada (`buyer`). */
export type Conversation = {
  listing: { id: string; cardName: string; kind: ListingKind; imageUrl: string | null; seller: MiniProfile };
  buyer: MiniProfile;
  /** A outra ponta, do ponto de vista de quem está vendo. */
  other: MiniProfile;
  last: ListingMessage;
  unread: number;
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

export type NotificationKind =
  | "offer_received" | "offer_countered" | "offer_accepted" | "offer_declined" | "offer_withdrawn"
  | "trade_offer" | "message";

/** Aviso para o usuário logado sobre algo que outro jogador fez (oferta, contraproposta, mensagem…). */
export type AppNotification = {
  id: string;
  kind: NotificationKind;
  actor: MiniProfile | null;
  listingId: string | null;
  cardName: string | null;
  amountCents: number | null;
  body: string | null;
  readAt: string | null;
  createdAt: string;
};
