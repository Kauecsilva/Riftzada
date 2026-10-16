import type { RelDate } from "./fixtures";

/** Converte uma data relativa ("daqui a 2 dias, 19:30" em São Paulo) para ISO. */
export function resolveRelDate(rel: RelDate, now: Date = new Date()): string {
  const today = now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const base = new Date(`${today}T${rel.at}:00-03:00`);
  base.setUTCDate(base.getUTCDate() + rel.days);
  return base.toISOString();
}
