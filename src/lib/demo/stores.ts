// Lojas fictícias do modo demonstração e os eventos que elas cadastraram.
// Ficam fora do seed: o seed.sql não tem lojas.

import { USERS, type DemoEvent } from "./fixtures";

const s = (n: number) => `00000000-0000-4000-8000-b000000000${String(n).padStart(2, "0")}`;
const e = (n: number) => `00000000-0000-4000-8000-b100000000${String(n).padStart(2, "0")}`;

export const STORES = { toca: s(1) };

export type DemoStore = {
  id: string; ownerId: string; name: string; address: string | null; instagram: string | null; description: string | null;
};

export const demoStores: DemoStore[] = [
  { id: STORES.toca, ownerId: USERS.kaue, name: "Toca do Rift", address: "Rua das Cartas, 123", instagram: "tocadorift", description: "Mesas livres todo dia, torneio toda quarta." },
];

export type DemoStoreEvent = DemoEvent & { storeId: string; seriesId: string | null };

const WEEKLY = s(90);
const weekly = (n: number, days: number): DemoStoreEvent => ({
  id: e(n), storeId: STORES.toca, seriesId: WEEKLY, name: "Semanal de Riftbound", description: "Suíço de 3 rodadas. Inscrição na hora.",
  format: "Constructed Bo1", startsAt: { days, at: "19:30" }, location: "Rua das Cartas, 123", maxPlayers: 16, status: "scheduled",
  imagePath: null, signupUrl: null, playerCount: null, resultsImagePath: null, resultsNotes: null,
});

export const demoStoreEvents: DemoStoreEvent[] = [
  weekly(1, 3), weekly(2, 10), weekly(3, 17), weekly(4, 24),
  {
    id: e(10), storeId: STORES.toca, seriesId: null, name: "Skirmish da Toca", description: "Premiação em boosters para o top 4.",
    format: "Constructed Bo3", startsAt: { days: 5, at: "14:00" }, location: "Rua das Cartas, 123", maxPlayers: 24, status: "scheduled",
    imagePath: null, signupUrl: null, playerCount: null, resultsImagePath: null, resultsNotes: null,
  },
];
