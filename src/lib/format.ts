// Formatação para a interface (pt-BR, fuso de São Paulo).

const TZ = "America/Sao_Paulo";

export function formatPrice(cents: number | null): string | null {
  if (cents == null) return null;
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: cents % 100 ? 2 : 0 });
}

/** "sexta-feira" */
export function weekday(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { weekday: "long", timeZone: TZ });
}

/** "19:30" */
export function time(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

/** "17 out" */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: TZ }).replace(".", "");
}

/** "17 de outubro de 2026" */
export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
}

/** "Sexta, 17 out · 19:30" */
export function eventWhen(iso: string): string {
  const day = weekday(iso).replace("-feira", "");
  return `${day[0].toUpperCase()}${day.slice(1)}, ${shortDate(iso)} · ${time(iso)}`;
}

/** "agora", "há 5 min", "há 3 h", "ontem", "há 4 dias", "12 set" */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const diff = (now.getTime() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  return shortDate(iso);
}

/** "Faltam 2 dias", "É hoje!", "É amanhã" */
export function countdown(iso: string, now: Date = new Date()): string | null {
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });
  const target = new Date(day(new Date(iso)));
  const today = new Date(day(now));
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (days < 0) return null;
  if (days === 0) return "É hoje!";
  if (days === 1) return "É amanhã";
  return `Faltam ${days} dias`;
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function ordinal(placement: number): string {
  return `${placement}º`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Valor de <input type="datetime-local"> no fuso de São Paulo. */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`;
}

/** Converte o valor do datetime-local (horário de São Paulo, UTC-3) para ISO. */
export function fromLocalInput(value: string): string {
  return new Date(`${value}:00-03:00`).toISOString();
}
