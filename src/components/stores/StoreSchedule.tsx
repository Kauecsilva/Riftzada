import Link from "next/link";
import { CalendarDays, CalendarPlus, Pencil, Repeat } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/button";
import { EVENT_STATUS } from "@/lib/domain/labels";
import { weeklyLabel } from "@/lib/domain/schedule";
import { eventWhen, plural, shortDate } from "@/lib/format";
import { extendSeries } from "@/server/actions/stores";
import type { EventSummary } from "@/types/domain";

type Row = { next: EventSummary; dates: EventSummary[] };

/** Junta as datas do mesmo semanal numa linha só; avulsos ficam cada um na sua. */
function groupBySeries(events: EventSummary[]): Row[] {
  const rows: Row[] = [];
  for (const event of events) {
    const row = event.seriesId ? rows.find((r) => r.next.seriesId === event.seriesId) : undefined;
    if (row) row.dates.push(event);
    else rows.push({ next: event, dates: [event] });
  }
  return rows;
}

/** Agenda de uma loja. Com manage, cada linha ganha editar e o semanal ganha "mais semanas". */
export function StoreSchedule({ events, manage, storeId }: { events: EventSummary[]; manage?: boolean; storeId?: string }) {
  const rows = groupBySeries(events);
  if (!rows.length) return <p className="text-sm text-muted">Nenhum evento na agenda.</p>;
  return (
    <ul className="divide-y divide-line">
      {rows.map(({ next, dates }) => {
        const weekly = Boolean(next.seriesId);
        const last = dates[dates.length - 1];
        return (
          <li key={next.id} className="flex flex-wrap items-center gap-3 py-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rift-soft text-rift-strong">
              {weekly ? <Repeat size={18} aria-hidden /> : <CalendarDays size={18} aria-hidden />}
            </span>
            <Link href={`/arena/eventos/${next.id}`} className="min-w-0 flex-1 basis-48 hover:underline">
              <span className="block truncate font-semibold">{next.name}</span>
              <span className="block text-sm text-muted">
                {weekly ? `${weeklyLabel(next.startsAt)} · próxima ${shortDate(next.startsAt)}` : eventWhen(next.startsAt)}
              </span>
              {manage && weekly && <span className="block text-xs text-faint">{plural(dates.length, "data", "datas")} na agenda, até {shortDate(last.startsAt)}</span>}
            </Link>
            {next.status !== "scheduled" && <Badge tone={next.status === "cancelled" ? "danger" : "sell"}>{EVENT_STATUS[next.status]}</Badge>}
            {manage && storeId && (
              <div className="flex gap-2">
                <Link href={`/loja/${storeId}/eventos/${next.id}`} className={buttonClass("secondary", "sm")}><Pencil size={14} aria-hidden /> Editar</Link>
                {weekly && dates.length <= 4 && (
                  <ActionButton action={extendSeries.bind(null, next.seriesId!)}><CalendarPlus size={14} aria-hidden /> Mais semanas</ActionButton>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
