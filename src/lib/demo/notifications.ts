// Avisos fictícios do Kauê no modo demonstração: uma oferta recebida (não lida) e uma contraproposta (lida).

import type { AppNotification } from "@/types/domain";
import { resolveRelDate } from "./dates";
import { demoListings, USERS } from "./fixtures";
import { demoProfileById } from "./store";

const actor = (id: string) => {
  const p = demoProfileById(id)!;
  return { id: p.id, username: p.username, displayName: p.displayName, avatarUrl: p.avatarUrl };
};

export function demoNotifications(): AppNotification[] {
  const [kaisa, , , , buccaneer] = demoListings;
  return [
    { id: "00000000-0000-4000-8000-c00000000001", kind: "offer_received", actor: actor(USERS.joao), listingId: buccaneer.id, cardName: buccaneer.cardName,
      amountCents: 800, body: "Fecho as 3 por 8 cada?", readAt: null, createdAt: resolveRelDate({ days: 0, at: "11:20" }) },
    { id: "00000000-0000-4000-8000-c00000000002", kind: "offer_countered", actor: actor(USERS.rafael), listingId: kaisa.id, cardName: kaisa.cardName,
      amountCents: 8200, body: null, readAt: resolveRelDate({ days: -1, at: "21:00" }), createdAt: resolveRelDate({ days: -1, at: "20:40" }) },
  ];
}
