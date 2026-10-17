// Conquistas derivadas das estatísticas. No MVP são calculadas na hora (sem tabela);
// a tabela achievements/user_achievements fica pronta para a fase 2 guardar a data e o evento.

import type { PlayerStats } from "@/types/domain";

export type Achievement = { code: string; name: string; description: string; tier: 1 | 2 | 3 };

type Rule = Achievement & { earned: (s: PlayerStats, extra: { decks: number; listings: number }) => boolean };

const RULES: Rule[] = [
  { code: "first_event", name: "Primeiro torneio", description: "Jogou o primeiro torneio da Riftzada", tier: 1, earned: (s) => s.eventsPlayed >= 1 },
  { code: "first_top4", name: "Primeiro top 4", description: "Chegou ao top 4", tier: 1, earned: (s) => s.top4 >= 1 },
  { code: "first_title", name: "Primeira vitória", description: "Levou um torneio", tier: 2, earned: (s) => s.titles >= 1 },
  { code: "events_5", name: "Frequentador", description: "5 torneios jogados", tier: 1, earned: (s) => s.eventsPlayed >= 5 },
  { code: "events_10", name: "Da casa", description: "10 torneios jogados", tier: 2, earned: (s) => s.eventsPlayed >= 10 },
  { code: "titles_3", name: "Tricampeão", description: "3 títulos", tier: 3, earned: (s) => s.titles >= 3 },
  { code: "first_deck", name: "Chef", description: "Publicou o primeiro deck", tier: 1, earned: (_, e) => e.decks >= 1 },
  { code: "first_listing", name: "Negociante", description: "Fez o primeiro anúncio", tier: 1, earned: (_, e) => e.listings >= 1 },
];

export function earnedAchievements(stats: PlayerStats | null, extra: { decks: number; listings: number }): Achievement[] {
  if (!stats) return [];
  return RULES.filter((r) => r.earned(stats, extra)).map(({ code, name, description, tier }) => ({ code, name, description, tier }));
}
