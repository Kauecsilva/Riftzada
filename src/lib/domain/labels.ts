// Textos curtos que aparecem em etiquetas e seletores.

import type { CardCondition, EventStatus, ListingKind, ListingStatus, MemberRole, PostKind } from "@/types/domain";

export const LISTING_KIND: Record<ListingKind, { label: string; verb: string }> = {
  sell: { label: "Vende", verb: "está vendendo" },
  trade: { label: "Troca", verb: "quer trocar" },
  want: { label: "Procura", verb: "está procurando" },
};

export const LISTING_STATUS: Record<ListingStatus, string> = {
  available: "Disponível",
  reserved: "Reservado",
  done: "Finalizado",
};

export const CONDITION: Record<CardCondition, { short: string; label: string }> = {
  nm: { short: "NM", label: "Nova (Near Mint)" },
  lp: { short: "LP", label: "Pouco jogada" },
  mp: { short: "MP", label: "Jogada" },
  hp: { short: "HP", label: "Bem jogada" },
  damaged: { short: "DMG", label: "Danificada" },
};

export const EVENT_STATUS: Record<EventStatus, string> = {
  scheduled: "Marcado",
  live: "Rolando agora",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

export const POST_KIND: Record<PostKind, string> = {
  general: "Resenha",
  pull: "Pull da semana",
  deck: "Deck",
  champion: "Campeão",
};

export const ROLE: Record<MemberRole, string> = {
  user: "Jogador",
  moderator: "Moderador",
  admin: "Admin",
};
