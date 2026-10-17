// Schemas Zod de cada formulário. Rodam sempre no servidor (Server Actions);
// os atributos HTML (required, maxLength) só ajudam o usuário antes do envio.

import { z } from "zod";
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
  displayName: requiredText(1, 40, "Nome"),
  username,
  email,
  password,
});

export const resetRequestSchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "As senhas não batem", path: ["confirm"] });

export const profileSchema = z.object({
  displayName: requiredText(1, 40, "Nome"),
  bio: optionalText(160),
  favoriteLegendId: optionalUuid,
  instagram: z
    .string()
    .trim()
    .transform((v) => v.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, ""))
    .pipe(z.union([z.literal(""), z.string().regex(/^[A-Za-z0-9_.]{1,30}$/, "Instagram inválido")]))
    .transform((v) => v || null),
  whatsapp: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.union([z.literal(""), z.string().regex(/^\d{10,13}$/, "WhatsApp: DDD + número")]))
    .transform((v) => v || null),
  shareWhatsapp: checkbox,
  avatarPath: optionalText(200),
});

export const postSchema = z
  .object({
    kind: z.enum(["general", "pull"]),
    body: optionalText(2000),
    images: z.array(z.string().max(200)).max(4, "No máximo 4 fotos"),
  })
  .refine((v) => v.body || v.images.length, { message: "Escreve alguma coisa ou adiciona uma foto", path: ["body"] });

export const listingSchema = z.object({
  kind: z.enum(["sell", "trade", "want"]),
  cardName: requiredText(2, 120, "Carta"),
  setName: optionalText(60),
  variant: optionalText(40),
  condition: z.enum(["nm", "lp", "mp", "hp", "damaged"]),
  quantity: z.coerce.number().int().min(1, "Quantidade mínima 1").max(99),
  price: z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      // "1.200,50" (pt-BR) ou "12.5": com vírgula, o ponto é milhar
      let clean = (v ?? "").replace(/[R$\s]/g, "");
      if (clean.includes(",")) clean = clean.replace(/\./g, "").replace(",", ".");
      if (!clean) return null;
      const value = Number(clean);
      if (!Number.isFinite(value) || value < 0 || value > 1_000_000) {
        ctx.addIssue({ code: "custom", message: "Preço inválido" });
        return z.NEVER;
      }
      return Math.round(value * 100);
    }),
  acceptsTrade: checkbox,
  description: optionalText(1000),
  imagePath: optionalText(200),
});

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
