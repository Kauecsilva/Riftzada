import type { Metadata } from "next";
import Link from "next/link";
import { CalendarX2, Pencil, Plus, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { FlashToast } from "@/components/ui/Toast";
import { EVENT_STATUS } from "@/lib/domain/labels";
import { eventWhen } from "@/lib/format";
import { getAllEvents } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Eventos" };

export default async function AdminEvents({ searchParams }: PageProps<"/admin/eventos">) {
  const [events, params] = await Promise.all([getAllEvents(), searchParams]);
  return (
    <div>
      {params.salvo && <FlashToast text="Evento salvo!" />}
      {params.apagado && <FlashToast text="Evento apagado." />}
      <PageHeader title="Eventos" action={<Link href="/admin/eventos/novo" className={buttonClass("primary", "md")}><Plus size={18} aria-hidden /> Novo</Link>} />
      {events.length ? (
        <ul className="card divide-y divide-line">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{e.name}</p>
                <p className="text-sm text-muted">{eventWhen(e.startsAt)} · {e.goingCount} confirmados</p>
              </div>
              <Badge tone={e.status === "finished" ? "gold" : e.status === "cancelled" ? "danger" : "energy"}>{EVENT_STATUS[e.status]}</Badge>
              <div className="flex gap-2">
                <Link href={`/admin/eventos/${e.id}`} className={buttonClass("secondary", "sm")}><Pencil size={14} aria-hidden /> Editar</Link>
                {e.status !== "cancelled" && (
                  <Link href={`/admin/eventos/${e.id}/resultado`} className={buttonClass("gold", "sm")}><Trophy size={14} aria-hidden /> Resultado</Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={CalendarX2} title="Nenhum evento ainda." text="Cria o primeiro torneio da Riftzada." action={{ href: "/admin/eventos/novo", label: "Criar evento" }} />
      )}
    </div>
  );
}
