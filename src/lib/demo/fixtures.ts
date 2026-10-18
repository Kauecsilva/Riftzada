// Dados fictícios de desenvolvimento.
// Uma única fonte para o modo demonstração (app sem Supabase) e para o supabase/seed.sql
// (gerado por `npm run seed:sql`). Datas são relativas a "hoje" para o seed nunca envelhecer.

import type {
  CardCondition, DeckSection, DeckVisibility, EventStatus, LigaLanguage, ListingKind, ListingStatus, MemberRole, OfferStatus, PostKind,
  PriceBase,
} from "@/types/domain";

/** Dias a partir de hoje (negativo = passado) e horário em São Paulo. */
export type RelDate = { days: number; at: string };

export const COMMUNITY_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_PASSWORD = "riftzada123";

const u = (n: number) => `00000000-0000-4000-8000-1000000000${String(n).padStart(2, "0")}`;
const c = (n: number) => `00000000-0000-4000-8000-2000000000${String(n).padStart(2, "0")}`;
const e = (n: number) => `00000000-0000-4000-8000-3000000000${String(n).padStart(2, "0")}`;
const d = (n: number) => `00000000-0000-4000-8000-4000000000${String(n).padStart(2, "0")}`;
const l = (n: number) => `00000000-0000-4000-8000-5000000000${String(n).padStart(2, "0")}`;
const p = (n: number) => `00000000-0000-4000-8000-6000000000${String(n).padStart(2, "0")}`;

export const USERS = {
  kaue: u(1), joao: u(2), rafael: u(3), pedro: u(4), bia: u(5), lucas: u(6), marina: u(7), thiago: u(8),
};

export const LEGENDS = {
  jinx: c(1), kaisa: c(2), ahri: c(3), yasuo: c(4), viktor: c(5), leesin: c(6), volibear: c(7), darius: c(8),
  missfortune: c(9), garen: c(10), annie: c(11), masteryi: c(12),
};

export type DemoUser = {
  id: string; email: string; username: string; displayName: string; bio: string | null;
  favoriteLegendId: string | null; instagram: string | null; city: string | null; state: string | null; role: MemberRole; avatarPath: string | null;
  whatsapp: string | null; shareWhatsapp: boolean; joined: RelDate;
};

export const demoUsers: DemoUser[] = [
  { id: USERS.kaue, email: "kaue@riftzada.dev", username: "kaue", displayName: "Kauê", bio: "Jinx até o fim. Organizo a resenha de sexta.", favoriteLegendId: LEGENDS.jinx, instagram: "kaue.rift", city: "São Paulo", state: "SP", role: "admin", avatarPath: "demo/avatar-kaue.svg", whatsapp: "11987654321", shareWhatsapp: true, joined: { days: -120, at: "10:00" } },
  { id: USERS.joao, email: "joao@riftzada.dev", username: "joao", displayName: "João", bio: "Kai'Sa main. Atual bicampeão consecutivo.", favoriteLegendId: LEGENDS.kaisa, instagram: null, city: "São Paulo", state: "SP", role: "user", avatarPath: "demo/avatar-joao.svg", whatsapp: null, shareWhatsapp: false, joined: { days: -118, at: "10:00" } },
  { id: USERS.rafael, email: "rafael@riftzada.dev", username: "rafael", displayName: "Rafael", bio: "Ahri control, café e paciência.", favoriteLegendId: LEGENDS.ahri, instagram: "rafa.tcg", city: "Campinas", state: "SP", role: "user", avatarPath: "demo/avatar-rafael.svg", whatsapp: "11912345678", shareWhatsapp: true, joined: { days: -110, at: "10:00" } },
  { id: USERS.pedro, email: "pedro@riftzada.dev", username: "pedro", displayName: "Pedro", bio: "Abro booster demais. Às vezes sai coisa boa.", favoriteLegendId: LEGENDS.yasuo, instagram: null, city: "Santo André", state: "SP", role: "user", avatarPath: null, whatsapp: null, shareWhatsapp: false, joined: { days: -95, at: "10:00" } },
  { id: USERS.bia, email: "bia@riftzada.dev", username: "bia", displayName: "Bia", bio: "Viktor e matemática.", favoriteLegendId: LEGENDS.viktor, instagram: "bia.plays", city: null, state: "RJ", role: "user", avatarPath: "demo/avatar-bia.svg", whatsapp: null, shareWhatsapp: false, joined: { days: -80, at: "10:00" } },
  { id: USERS.lucas, email: "lucas@riftzada.dev", username: "lucas", displayName: "Lucas", bio: null, favoriteLegendId: LEGENDS.darius, instagram: null, city: "Curitiba", state: "PR", role: "user", avatarPath: null, whatsapp: null, shareWhatsapp: false, joined: { days: -60, at: "10:00" } },
  { id: USERS.marina, email: "marina@riftzada.dev", username: "marina", displayName: "Marina", bio: "Volibear na cara do gol.", favoriteLegendId: LEGENDS.volibear, instagram: null, city: null, state: null, role: "user", avatarPath: null, whatsapp: null, shareWhatsapp: false, joined: { days: -45, at: "10:00" } },
  { id: USERS.thiago, email: "thiago@riftzada.dev", username: "thiago", displayName: "Thiago", bio: "Novo na Rift, aprendendo com a galera.", favoriteLegendId: null, instagram: null, city: null, state: null, role: "user", avatarPath: null, whatsapp: null, shareWhatsapp: false, joined: { days: -12, at: "10:00" } },
];

export type DemoCard = { id: string; name: string; setName: string; setCode: string; type: "legend" };

export const demoCards: DemoCard[] = [
  { id: LEGENDS.jinx, name: "Jinx, Loose Cannon", setName: "Origins", setCode: "OGN", type: "legend" },
  { id: LEGENDS.kaisa, name: "Kai'Sa, Daughter of the Void", setName: "Origins", setCode: "OGN", type: "legend" },
  { id: LEGENDS.ahri, name: "Ahri, Nine-Tailed Fox", setName: "Origins", setCode: "OGN", type: "legend" },
  { id: LEGENDS.yasuo, name: "Yasuo, Unforgiven", setName: "Origins", setCode: "OGN", type: "legend" },
  { id: LEGENDS.viktor, name: "Viktor, Herald of the Arcane", setName: "Origins", setCode: "OGN", type: "legend" },
  { id: LEGENDS.leesin, name: "Lee Sin, Blind Monk", setName: "Origins", setCode: "OGN", type: "legend" },
  { id: LEGENDS.volibear, name: "Volibear, Relentless Storm", setName: "Origins", setCode: "OGN", type: "legend" },
  { id: LEGENDS.darius, name: "Darius, Hand of Noxus", setName: "Origins", setCode: "OGN", type: "legend" },
  { id: LEGENDS.missfortune, name: "Miss Fortune, Bounty Hunter", setName: "Origins", setCode: "OGN", type: "legend" },
  { id: LEGENDS.garen, name: "Garen, Might of Demacia", setName: "Origins", setCode: "OGN", type: "legend" },
  { id: LEGENDS.annie, name: "Annie, Dark Child", setName: "Origins", setCode: "OGN", type: "legend" },
  { id: LEGENDS.masteryi, name: "Master Yi, Wuju Bladesman", setName: "Origins", setCode: "OGN", type: "legend" },
];

export const EVENTS = { w19: e(1), w20: e(2), w21: e(3), w22: e(4), league: e(5) };

export type DemoEvent = {
  id: string; name: string; description: string | null; format: string | null; startsAt: RelDate; location: string;
  maxPlayers: number | null; status: EventStatus; imagePath: string | null; signupUrl: string | null;
  playerCount: number | null; resultsImagePath: string | null; resultsNotes: string | null;
};

const LOCATION = "X1 Arena Cards";

export const demoEvents: DemoEvent[] = [
  { id: EVENTS.w19, name: "Riftbound Weekly #19", description: "Suíço de 4 rodadas, melhor de 1.", format: "Constructed Bo1", startsAt: { days: -21, at: "19:30" }, location: LOCATION, maxPlayers: 16, status: "finished", imagePath: "demo/event-weekly.svg", signupUrl: null, playerCount: 10, resultsImagePath: "demo/champion-19.svg", resultsNotes: "Mesa cheia e muita Jinx no top 8." },
  { id: EVENTS.w20, name: "Riftbound Weekly #20", description: "Suíço de 4 rodadas, melhor de 1.", format: "Constructed Bo1", startsAt: { days: -14, at: "19:30" }, location: LOCATION, maxPlayers: 16, status: "finished", imagePath: "demo/event-weekly.svg", signupUrl: null, playerCount: 12, resultsImagePath: "demo/champion-20.svg", resultsNotes: null },
  { id: EVENTS.w21, name: "Riftbound Weekly #21", description: "Suíço de 4 rodadas + top 4.", format: "Constructed Bo1", startsAt: { days: -7, at: "19:30" }, location: LOCATION, maxPlayers: 16, status: "finished", imagePath: "demo/event-weekly.svg", signupUrl: null, playerCount: 14, resultsImagePath: null, resultsNotes: "Final Kai'Sa x Jinx decidida no último ponto." },
  { id: EVENTS.w22, name: "Riftbound Weekly #22", description: "Suíço de 4 rodadas + top 4. Chega 15 minutos antes para o check-in.", format: "Constructed Bo1", startsAt: { days: 2, at: "19:30" }, location: LOCATION, maxPlayers: 16, status: "scheduled", imagePath: null, signupUrl: null, playerCount: null, resultsImagePath: null, resultsNotes: null },
  { id: EVENTS.league, name: "Liga da Riftzada — Etapa 1", description: "Melhor de 3, 5 rodadas. Premiação em boosters para o top 4.", format: "Constructed Bo3", startsAt: { days: 16, at: "14:00" }, location: LOCATION, maxPlayers: 24, status: "scheduled", imagePath: null, signupUrl: "https://forms.gle/exemplo", playerCount: null, resultsImagePath: null, resultsNotes: null },
];

export type DemoParticipant = { eventId: string; userId: string; status: "going" | "played" | "no_show" };

const allPlayed = (eventId: string, ids: string[]): DemoParticipant[] => ids.map((userId) => ({ eventId, userId, status: "played" }));

export const demoParticipants: DemoParticipant[] = [
  ...allPlayed(EVENTS.w19, [USERS.kaue, USERS.joao, USERS.rafael, USERS.pedro, USERS.bia, USERS.lucas]),
  ...allPlayed(EVENTS.w20, [USERS.kaue, USERS.joao, USERS.rafael, USERS.pedro, USERS.bia, USERS.lucas, USERS.marina]),
  ...allPlayed(EVENTS.w21, [USERS.kaue, USERS.joao, USERS.rafael, USERS.pedro, USERS.bia, USERS.lucas, USERS.marina, USERS.thiago]),
  ...[USERS.joao, USERS.rafael, USERS.pedro, USERS.bia, USERS.marina].map((userId) => ({ eventId: EVENTS.w22, userId, status: "going" as const })),
  ...[USERS.kaue, USERS.joao].map((userId) => ({ eventId: EVENTS.league, userId, status: "going" as const })),
];

export const DECKS = { jinx: d(1), kaisa: d(2), ahri: d(3) };

export type DemoResult = {
  id: string; eventId: string; placement: number; userId: string | null; guestName: string | null;
  legendId: string | null; deckId: string | null; record: string | null; notes: string | null;
};

let resultSeq = 0;
const r = (eventId: string, placement: number, userId: string | null, legendId: string, record: string, extra: Partial<DemoResult> = {}): DemoResult => ({
  id: `00000000-0000-4000-8000-7000000000${String(++resultSeq).padStart(2, "0")}`,
  eventId, placement, userId, guestName: null, legendId, deckId: null, record, notes: null, ...extra,
});

export const demoResults: DemoResult[] = [
  r(EVENTS.w19, 1, USERS.kaue, LEGENDS.jinx, "4-0", { deckId: DECKS.jinx }),
  r(EVENTS.w19, 2, USERS.rafael, LEGENDS.ahri, "3-1", { deckId: DECKS.ahri }),
  r(EVENTS.w19, 3, USERS.bia, LEGENDS.viktor, "3-1"),
  r(EVENTS.w19, 4, null, LEGENDS.darius, "2-2", { guestName: "Gustavo (convidado)" }),

  r(EVENTS.w20, 1, USERS.joao, LEGENDS.kaisa, "4-0", { deckId: DECKS.kaisa }),
  r(EVENTS.w20, 2, USERS.kaue, LEGENDS.jinx, "3-1", { deckId: DECKS.jinx }),
  r(EVENTS.w20, 3, USERS.marina, LEGENDS.volibear, "3-1"),
  r(EVENTS.w20, 4, USERS.rafael, LEGENDS.ahri, "2-2"),

  r(EVENTS.w21, 1, USERS.joao, LEGENDS.kaisa, "5-1", { deckId: DECKS.kaisa, notes: "Bicampeão!" }),
  r(EVENTS.w21, 2, USERS.kaue, LEGENDS.jinx, "4-2", { deckId: DECKS.jinx }),
  r(EVENTS.w21, 3, USERS.rafael, LEGENDS.ahri, "4-1"),
  r(EVENTS.w21, 4, USERS.pedro, LEGENDS.yasuo, "3-2"),
];

export type DemoDeck = {
  id: string; authorId: string; name: string; legendId: string; description: string | null; visibility: DeckVisibility;
  eventId: string | null; record: string | null; placement: number | null; createdAt: RelDate;
  cards: { name: string; quantity: number; section: DeckSection }[];
};

export const demoDecks: DemoDeck[] = [
  {
    id: DECKS.jinx, authorId: USERS.kaue, name: "Jinx Aggro", legendId: LEGENDS.jinx, visibility: "public",
    description: "Curva baixa, pressão desde o turno 1. Se o oponente respirar, já era. Mulligan agressivo atrás de 2-drops.",
    eventId: EVENTS.w21, record: "4-2", placement: 2, createdAt: { days: -6, at: "11:20" },
    cards: [
      { name: "Jinx, Rebel", quantity: 1, section: "main" },
      { name: "Get Excited!", quantity: 3, section: "main" },
      { name: "Flame Chompers", quantity: 3, section: "main" },
      { name: "Noxus Hopeful", quantity: 3, section: "main" },
      { name: "Brazen Buccaneer", quantity: 3, section: "main" },
      { name: "Fury Rune", quantity: 6, section: "runes" },
      { name: "Chaos Rune", quantity: 6, section: "runes" },
      { name: "Zaun Warrens", quantity: 1, section: "battlefields" },
    ],
  },
  {
    id: DECKS.kaisa, authorId: USERS.joao, name: "Kai'Sa Tempo", legendId: LEGENDS.kaisa, visibility: "public",
    description: "A lista que levou o bi. Segura o early e vira no meio do jogo.",
    eventId: EVENTS.w21, record: "5-1", placement: 1, createdAt: { days: -5, at: "21:05" },
    cards: [
      { name: "Kai'Sa, Survivor", quantity: 1, section: "main" },
      { name: "Void Seeker", quantity: 3, section: "main" },
      { name: "Hextech Ray", quantity: 3, section: "main" },
      { name: "Mind Rune", quantity: 6, section: "runes" },
      { name: "Fury Rune", quantity: 6, section: "runes" },
    ],
  },
  {
    id: DECKS.ahri, authorId: USERS.rafael, name: "Ahri Control", legendId: LEGENDS.ahri, visibility: "public",
    description: null, eventId: EVENTS.w19, record: "3-1", placement: 2, createdAt: { days: -18, at: "09:40" },
    cards: [
      { name: "Ahri, Alluring", quantity: 1, section: "main" },
      { name: "Charm", quantity: 3, section: "main" },
      { name: "Calm Rune", quantity: 6, section: "runes" },
      { name: "Mind Rune", quantity: 6, section: "runes" },
    ],
  },
];

export type DemoListing = {
  id: string; sellerId: string; kind: ListingKind; cardName: string; setName: string | null; variant: string | null;
  condition: CardCondition; quantity: number; priceCents: number | null; acceptsTrade: boolean; description: string | null;
  imagePath: string | null; status: ListingStatus; createdAt: RelDate;
  /** Preço sugerido (base + desconto), Liga informada pelo vendedor e ofertas */
  pricing?: { base: PriceBase; baseCents: number; discountPct: number; liga?: { priceCents: number; language: LigaLanguage; condition: CardCondition } };
  minOfferCents?: number | null;
};

export const demoListings: DemoListing[] = [
  { id: l(1), sellerId: USERS.rafael, kind: "sell", cardName: "Kai'Sa, Survivor", setName: "Origins", variant: "Foil", condition: "nm", quantity: 1, priceCents: 9000, acceptsTrade: true, description: "Saiu no booster de ontem, direto pro sleeve.", imagePath: "demo/card-kaisa.svg", status: "available", createdAt: { days: -1, at: "18:10" },
    pricing: { base: "liga", baseCents: 10000, discountPct: 10, liga: { priceCents: 10000, language: "en", condition: "nm" } }, minOfferCents: 6000 },
  { id: l(2), sellerId: USERS.pedro, kind: "sell", cardName: "Jinx, Loose Cannon", setName: "Origins", variant: "Showcase", condition: "nm", quantity: 1, priceCents: 12000, acceptsTrade: false, description: "A famosa. Só venda, desculpa galera.", imagePath: "demo/card-jinx.svg", status: "reserved", createdAt: { days: -3, at: "20:30" } },
  { id: l(3), sellerId: USERS.bia, kind: "trade", cardName: "Viktor, Innovator", setName: "Origins", variant: null, condition: "lp", quantity: 2, priceCents: null, acceptsTrade: true, description: "Troco por Runas de Mind ou cartas da Ahri.", imagePath: null, status: "available", createdAt: { days: -2, at: "12:00" } },
  { id: l(4), sellerId: USERS.thiago, kind: "want", cardName: "Fury Rune", setName: "Origins", variant: null, condition: "nm", quantity: 6, priceCents: 1500, acceptsTrade: true, description: "Montando meu primeiro deck, alguém tem sobrando?", imagePath: null, status: "available", createdAt: { days: 0, at: "09:15" } },
  { id: l(5), sellerId: USERS.kaue, kind: "sell", cardName: "Brazen Buccaneer", setName: "Origins", variant: null, condition: "nm", quantity: 3, priceCents: 1000, acceptsTrade: true, description: null, imagePath: "demo/card-generic.svg", status: "done", createdAt: { days: -9, at: "15:00" } },
  { id: l(6), sellerId: USERS.pedro, kind: "sell", cardName: "Fury Rune", setName: "Origins", variant: null, condition: "nm", quantity: 4, priceCents: 300, acceptsTrade: true, description: "Sobrou do pré-release.", imagePath: null, status: "available", createdAt: { days: -1, at: "21:40" } },
];

export type DemoCollectionItem = {
  id: string; userId: string; cardId: string; quantity: number; condition: CardCondition; variant: string | null; notes: string | null;
};

const ci = (n: number) => `00000000-0000-4000-8000-a000000000${String(n).padStart(2, "0")}`;

/** Coleção só aparece no modo demonstração (não vai para o seed). */
export const demoCollection: DemoCollectionItem[] = [
  { id: ci(1), userId: USERS.kaue, cardId: LEGENDS.jinx, quantity: 2, condition: "nm", variant: null, notes: "Uma no deck, outra sobrando." },
  { id: ci(2), userId: USERS.kaue, cardId: LEGENDS.annie, quantity: 1, condition: "nm", variant: "Foil", notes: null },
  { id: ci(3), userId: USERS.kaue, cardId: LEGENDS.garen, quantity: 3, condition: "lp", variant: null, notes: null },
];

export type DemoPost = {
  id: string; authorId: string; kind: PostKind; body: string | null; eventId: string | null; deckId: string | null;
  isFeatured: boolean; createdAt: RelDate; images: string[];
};

export const demoPosts: DemoPost[] = [
  { id: p(1), authorId: USERS.kaue, kind: "champion", body: "Bicampeão na casa! Parabéns João, Kai'Sa tá voando.", eventId: EVENTS.w21, deckId: null, isFeatured: true, createdAt: { days: -7, at: "23:40" }, images: ["demo/champion-21.svg"] },
  { id: p(2), authorId: USERS.pedro, kind: "pull", body: "Abri só um booster pra ver qual era... e veio a Jinx Showcase. Sem palavras.", eventId: null, deckId: null, isFeatured: false, createdAt: { days: -3, at: "20:12" }, images: ["demo/card-jinx.svg"] },
  { id: p(3), authorId: USERS.kaue, kind: "deck", body: "Lista da Jinx que fez 2º no Weekly #21. Pode copiar e me xingar depois.", eventId: null, deckId: DECKS.jinx, isFeatured: false, createdAt: { days: -6, at: "11:25" }, images: [] },
  { id: p(4), authorId: USERS.rafael, kind: "general", body: "Rolou testing hoje antes do torneio. Mesa 3 virou laboratório de Ahri.", eventId: null, deckId: null, isFeatured: false, createdAt: { days: -1, at: "17:30" }, images: ["demo/testing.svg"] },
  { id: p(5), authorId: USERS.bia, kind: "general", body: "Alguém topa um testing quinta à noite? Quero testar Viktor contra aggro.", eventId: null, deckId: null, isFeatured: false, createdAt: { days: 0, at: "08:50" }, images: [] },
  { id: p(6), authorId: USERS.kaue, kind: "champion", body: "Kai'Sa chegou chegando. Parabéns João!", eventId: EVENTS.w20, deckId: null, isFeatured: false, createdAt: { days: -14, at: "23:30" }, images: ["demo/champion-20.svg"] },
  { id: p(7), authorId: USERS.joao, kind: "deck", body: "A lista do bi. Perguntas nos comentários (quando tiver comentários).", eventId: null, deckId: DECKS.kaisa, isFeatured: false, createdAt: { days: -5, at: "21:10" }, images: [] },
];

export const demoRankingRules = { pointsByPlacement: [100, 70, 50, 50], participationPoints: 10 };

export const demoRankingEntries = [
  { id: "00000000-0000-4000-8000-800000000001", userId: USERS.thiago, points: 20, reason: "Bônus de boas-vindas da Liga", createdAt: { days: -10, at: "12:00" } as RelDate },
];

export type DemoOffer = {
  id: string; listingId: string; buyerId: string; amountCents: number; cards: { name: string; qty: number }[];
  counterCents: number | null; message: string | null; status: OfferStatus; createdAt: RelDate;
};

export const demoOffers: DemoOffer[] = [
  { id: "00000000-0000-4000-8000-b00000000001", listingId: l(1), buyerId: USERS.joao, amountCents: 7500, cards: [], counterCents: null, message: "Fecha por 75 e te encontro no sábado?", status: "pending", createdAt: { days: 0, at: "10:30" } },
  { id: "00000000-0000-4000-8000-b00000000002", listingId: l(3), buyerId: USERS.kaue, amountCents: 1000, cards: [{ name: "Ahri, Alluring", qty: 1 }], counterCents: null, message: "Ahri + 10 conto pelo Viktor?", status: "pending", createdAt: { days: 0, at: "11:00" } },
];

/** Conversas do mercado: (anúncio, interessado). */
export type DemoMessage = { id: string; listingId: string; buyerId: string; senderId: string; body: string; read: boolean; createdAt: RelDate };

export const demoMessages: DemoMessage[] = [
  { id: "00000000-0000-4000-8000-c00000000001", listingId: l(3), buyerId: USERS.kaue, senderId: USERS.kaue, body: "Oi Bia! O Viktor ainda tá disponível? Te mandei uma oferta com a Ahri.", read: true, createdAt: { days: 0, at: "11:01" } },
  { id: "00000000-0000-4000-8000-c00000000002", listingId: l(3), buyerId: USERS.kaue, senderId: USERS.bia, body: "Tá sim! Leva na loja sábado que a gente fecha.", read: false, createdAt: { days: 0, at: "11:20" } },
];
