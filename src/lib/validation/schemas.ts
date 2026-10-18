// Schemas Zod de cada formulário. Rodam sempre no servidor (Server Actions);
// os atributos HTML (required, maxLength) só ajudam o usuário antes do envio.

import { z } from "zod";
import { parseBrl } from "@/lib/domain/pricing";
import { UFS } from "@/lib/domain/region";
import { checkbox, optionalInt, optionalText, optionalUuid, record, requiredText, uuid } from "./common";

const email = z.email("E-mail inválido").trim().toLowerCase();
const password = z.string().min(8, "A senha precisa de pelo menos 8 caracteres").max(72, "Senha longa demais");
export const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, "Apelido: 3 a 20 letras, números ou _ (sem espaço)");

export const signInSchema = z.object({ email, password: z.string().min(1, "Digite a senha"), next: z.string().optional() });

export const signUpSchema = z.object({
  username,
  email,
  password,
  accountKind: z.enum(["player", "store"]).default("player"),
});

export const resetRequestSchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "As senhas não batem", path: ["confirm"] });

/** "@fulano", "instagram.com/fulano" ou "fulano" viram "fulano"; vazio vira null. */
const instagram = z
  .string()
  .trim()
  .transform((v) => v.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, ""))
  .pipe(z.union([z.literal(""), z.string().regex(/^[A-Za-z0-9_.]{1,30}$/, "Instagram inválido")]))
  .transform((v) => v || null);

/** "(11) 98765-4321" vira "11987654321"; vazio vira null. */
const whatsapp = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.union([z.literal(""), z.string().regex(/^\d{10,13}$/, "WhatsApp: DDD + número")]))
  .transform((v) => v || null);

export const profileSchema = z
  .object({
    displayName: requiredText(1, 40, "Nome"),
    bio: optionalText(160),
    favoriteLegendId: optionalUuid,
    instagram,
    city: z
      .string()
      .trim()
      .pipe(z.union([z.literal(""), z.string().min(2, "Cidade: mínimo de 2 letras").max(60, "Cidade: máximo de 60 caracteres")]))
      .optional()
      .transform((v) => v || null),
    state: z
      .union([z.literal(""), z.enum(UFS, "Estado inválido")])
      .optional()
      .transform((v) => v || null),
    whatsapp,
    shareWhatsapp: checkbox,
    avatarPath: optionalText(200),
  })
  .refine((v) => !v.city || v.state, { message: "Escolhe o estado da cidade", path: ["state"] });

export const postSchema = z
  .object({
    kind: z.enum(["general", "pull"]),
    body: optionalText(2000),
    images: z.array(z.string().max(200)).max(4, "No máximo 4 fotos"),
  })
  .refine((v) => v.body || v.images.length, { message: "Escreve alguma coisa ou adiciona uma foto", path: ["body"] });

const condition = z.enum(["nm", "lp", "mp", "hp", "damaged"]);

/** Valor em reais digitado ("1.200,50" ou "12.5") → centavos; vazio vira null. */
const brl = (message: string) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      const cents = parseBrl(v);
      if (Number.isNaN(cents)) {
        ctx.addIssue({ code: "custom", message });
        return z.NEVER;
      }
      return cents;
    });

export const listingSchema = z.object({
  kind: z.enum(["sell", "trade", "want"]),
  cardId: optionalUuid,
  collectionItemId: optionalUuid,
  cardName: requiredText(2, 120, "Carta"),
  setName: optionalText(60),
  variant: optionalText(40),
  condition,
  quantity: z.coerce.number().int().min(1, "Quantidade mínima 1").max(99),
  price: brl("Preço inválido"),
  acceptsTrade: checkbox,
  priceBase: z.union([z.enum(["liga", "tcgplayer"]), z.literal("")]).optional().transform((v) => v || null),
  priceBaseCents: optionalInt(0, 100_000_000),
  discountPct: optionalInt(0, 90),
  ligaPrice: brl("Preço da Liga inválido"),
  ligaLanguage: z.union([z.enum(["en", "zh", "pt", "other"]), z.literal("")]).optional().transform((v) => v || null),
  ligaCondition: z.union([condition, z.literal("")]).optional().transform((v) => v || null),
  acceptsOffers: checkbox,
  minOffer: brl("Oferta mínima inválida"),
  description: optionalText(1000),
  imagePath: optionalText(200),
  /** Só vem quando o vendedor ainda não compartilha WhatsApp: preenchido, passa a compartilhar. */
  whatsapp: whatsapp.optional().transform((v) => v ?? null),
});

const offerCard = z.object({
  name: requiredText(1, 120, "Carta"),
  qty: z.coerce.number().int().min(1).max(99).default(1),
  cardId: z.uuid().nullable().optional().transform((v) => v ?? null),
});

/** Cartas da troca chegam como JSON num campo escondido do formulário. */
const offerCards = z
  .string()
  .optional()
  .transform((v, ctx) => {
    try {
      return JSON.parse(v || "[]") as unknown;
    } catch {
      ctx.addIssue({ code: "custom", message: "Lista de cartas inválida" });
      return z.NEVER;
    }
  })
  .pipe(z.array(offerCard).max(10, "No máximo 10 cartas"));

export const offerSchema = z
  .object({
    listingId: uuid,
    amount: brl("Valor inválido").transform((v) => v ?? 0),
    cards: offerCards,
    message: optionalText(280),
  })
  .refine((v) => v.amount > 0 || v.cards.length > 0, { message: "Diz quanto você oferece ou quais cartas", path: ["amount"] });

export const messageSchema = z.object({
  listingId: uuid,
  buyerId: uuid,
  body: requiredText(1, 1000, "Mensagem"),
});

export const offerResponseSchema = z.object({
  offerId: uuid,
  action: z.enum(["accept", "decline", "counter", "withdraw"]),
  counter: brl("Valor inválido"),
});

export const collectionItemSchema = z.object({
  cardId: z.uuid("Escolhe uma carta da lista"),
  quantity: z.coerce.number().int().min(1, "Quantidade mínima 1").max(999, "Máximo de 999"),
  condition,
  variant: optionalText(40),
  notes: optionalText(280),
});

export const collectionQuantitySchema = z.object({ id: uuid, quantity: z.coerce.number().int().min(0).max(999) });

export const listingStatusSchema = z.object({ id: uuid, status: z.enum(["available", "reserved", "done"]) });

export const deckSchema = z.object({
  name: requiredText(2, 60, "Nome do deck"),
  legendId: optionalUuid,
  description: optionalText(2000),
  decklist: z.string().trim().min(3, "Cola a lista do deck").max(6000),
  visibility: z.enum(["public", "unlisted", "private"]),
  eventId: optionalUuid,
  record,
  placement: optionalInt(1, 512),
  shareOnFeed: checkbox,
});

export const eventSchema = z.object({
  id: optionalUuid,
  name: requiredText(3, 80, "Nome"),
  description: optionalText(1000),
  format: optionalText(40),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Data e horário inválidos"),
  location: requiredText(2, 80, "Local"),
  maxPlayers: optionalInt(2, 512),
  status: z.enum(["scheduled", "live", "finished", "cancelled"]),
  signupUrl: z
    .string()
    .trim()
    .pipe(z.union([z.literal(""), z.url({ protocol: /^https$/, message: "O link precisa começar com https://" })]))
    .transform((v) => v || null),
  imagePath: optionalText(200),
});

export const storeSchema = z.object({
  id: optionalUuid,
  name: requiredText(2, 60, "Nome da loja"),
  address: optionalText(120),
  instagram,
  description: optionalText(500),
});

/** Evento cadastrado por uma loja. "Toda semana" cria uma data por semana. */
export const storeEventSchema = eventSchema.extend({
  storeId: uuid,
  status: z.enum(["scheduled", "live", "cancelled"]).default("scheduled"),
  repeatWeekly: checkbox,
  weeks: optionalInt(2, 12).transform((v) => v ?? 8),
});

const placementRow = z.object({
  placement: z.coerce.number().int().min(1).max(512),
  userId: optionalUuid,
  guestName: optionalText(40),
  legendId: optionalUuid,
  record,
});

export const resultsSchema = z.object({
  eventId: uuid,
  playerCount: optionalInt(0, 512),
  played: z.array(uuid),
  placements: z.array(placementRow).max(16),
  notes: optionalText(1000),
  imagePath: optionalText(200),
  publishChampion: checkbox,
  championMessage: optionalText(500),
});

export const rankingRulesSchema = z.object({
  points: z.array(z.coerce.number().int().min(0).max(10000)).min(1).max(16),
  participationPoints: z.coerce.number().int().min(0).max(1000),
});

export const rankingEntrySchema = z.object({
  userId: uuid,
  points: z.coerce.number().int().min(-10000).max(10000).refine((v) => v !== 0, "Ajuste não pode ser zero"),
  reason: requiredText(3, 120, "Motivo"),
});

export const legendSchema = z.object({ name: requiredText(2, 120, "Nome"), setName: optionalText(60) });

export const suggestionSchema = z.object({
  kind: z.enum(["improvement", "idea"]),
  title: requiredText(5, 100, "Título"),
  details: optionalText(3000),
});
