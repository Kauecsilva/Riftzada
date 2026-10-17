// Datas de eventos que se repetem toda semana (o "semanal" das lojas).

import { time, weekday } from "@/lib/format";

/**
 * As datas (valor de datetime-local, horário de São Paulo) de um evento semanal:
 * a primeira e mais uma a cada 7 dias, sempre no mesmo horário.
 */
export function weeklyDates(first: string, weeks: number): string[] {
  const [date, hour] = first.split("T");
  const base = new Date(`${date}T00:00:00Z`);
  return Array.from({ length: weeks }, (_, i) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + 7 * i);
    return `${d.toISOString().slice(0, 10)}T${hour}`;
  });
}

/** "Toda quarta · 19:30", "Todo sábado · 14:00" */
export function weeklyLabel(iso: string): string {
  const day = weekday(iso).replace("-feira", "");
  const every = day === "sábado" || day === "domingo" ? "Todo" : "Toda";
  return `${every} ${day} · ${time(iso)}`;
}

/** Mantém só a próxima data de cada evento semanal (a lista já vem em ordem de data). */
export function nextOfEachSeries<T extends { seriesId: string | null }>(events: T[]): T[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    if (!e.seriesId) return true;
    if (seen.has(e.seriesId)) return false;
    seen.add(e.seriesId);
    return true;
  });
}
