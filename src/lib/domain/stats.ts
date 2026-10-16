// Estatísticas e ranking calculados a partir de resultados e presenças.
// Espelha as views player_stats e ranking (supabase/migrations/0003_views.sql):
// o banco calcula em produção, e estas funções servem ao modo demonstração e aos testes.

import type { MiniProfile, PlayerStats, RankingRow, RankingRules } from "@/types/domain";

export type StatsInput = {
  players: MiniProfile[];
  events: { id: string; name: string; startsAt: string; status: string }[];
  participants: { eventId: string; userId: string; status: string }[];
  results: { eventId: string; userId: string | null; placement: number }[];
};

/** Pontos de uma colocação pela regra: posição 1 lê o primeiro item, e assim por diante. */
export function pointsForPlacement(rules: RankingRules, placement: number): number {
  return rules.pointsByPlacement[placement - 1] ?? 0;
}

/** Eventos finalizados que cada jogador disputou (presença confirmada ou no resultado). */
export function eventsPlayedBy(input: StatsInput): Map<string, Set<string>> {
  const finished = new Set(input.events.filter((e) => e.status === "finished").map((e) => e.id));
  const played = new Map<string, Set<string>>();
  const add = (userId: string, eventId: string) => {
    if (!finished.has(eventId)) return;
    if (!played.has(userId)) played.set(userId, new Set());
    played.get(userId)!.add(eventId);
  };
  for (const p of input.participants) if (p.status === "played") add(p.userId, p.eventId);
  for (const r of input.results) if (r.userId) add(r.userId, r.eventId);
  return played;
}

export function computePlayerStats(input: StatsInput): PlayerStats[] {
  const eventsById = new Map(input.events.map((e) => [e.id, e]));
  const played = eventsPlayedBy(input);

  return input.players.map((player) => {
    const mine = input.results.filter(
      (r) => r.userId === player.id && eventsById.get(r.eventId)?.status === "finished",
    );
    const titles = mine.filter((r) => r.placement === 1);
    const last = titles
      .map((r) => eventsById.get(r.eventId)!)
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))[0];

    return {
      ...player,
      eventsPlayed: played.get(player.id)?.size ?? 0,
      titles: titles.length,
      seconds: mine.filter((r) => r.placement === 2).length,
      top4: mine.filter((r) => r.placement <= 4).length,
      lastTitle: last ? { eventId: last.id, name: last.name, at: last.startsAt } : null,
    };
  });
}

export function computeRanking(
  input: StatsInput,
  rules: RankingRules,
  manualEntries: { userId: string; points: number }[] = [],
): RankingRow[] {
  const finished = new Set(input.events.filter((e) => e.status === "finished").map((e) => e.id));
  const played = eventsPlayedBy(input);

  const rows = computePlayerStats(input).map((s) => {
    const resultPoints = input.results
      .filter((r) => r.userId === s.id && finished.has(r.eventId))
      .reduce((sum, r) => sum + pointsForPlacement(rules, r.placement), 0);
    const presencePoints = (played.get(s.id)?.size ?? 0) * rules.participationPoints;
    const manualPoints = manualEntries.filter((m) => m.userId === s.id).reduce((sum, m) => sum + m.points, 0);
    return { ...s, points: resultPoints + presencePoints + manualPoints, manualPoints, position: 0 };
  });

  const ranked = rows
    .filter((r) => r.points !== 0 || r.eventsPlayed > 0)
    .sort((a, b) => b.points - a.points || b.titles - a.titles || b.top4 - a.top4);

  // rank(): empate total divide a posição, e a seguinte pula
  ranked.forEach((row, i) => {
    const prev = ranked[i - 1];
    const tied = prev && prev.points === row.points && prev.titles === row.titles && prev.top4 === row.top4;
    row.position = tied ? prev.position : i + 1;
  });
  return ranked;
}

/** Hall da Fama: quem já fez top 4, por títulos, depois top 4, depois torneios. */
export function hallOfFame(stats: PlayerStats[]): PlayerStats[] {
  return stats
    .filter((s) => s.top4 > 0)
    .sort((a, b) => b.titles - a.titles || b.top4 - a.top4 || b.eventsPlayed - a.eventsPlayed);
}
