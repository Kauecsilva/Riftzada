import Link from "next/link";
import { CalendarPlus, ShieldCheck, Trophy, Users, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { eventWhen } from "@/lib/format";
import { getAllEvents, getMembers } from "@/server/queries/admin";

export default async function AdminHome() {
  const [events, members] = await Promise.all([getAllEvents(), getMembers()]);
  const pending = events.filter((e) => e.status !== "finished" && e.status !== "cancelled" && new Date(e.startsAt) < new Date());
  const shortcuts = [
    { href: "/admin/eventos/novo", label: "Criar evento", icon: CalendarPlus, tone: "text-energy" },
    { href: "/admin/eventos", label: "Registrar resultado", icon: Trophy, tone: "text-gold" },
    { href: "/admin/moderacao", label: "Moderar conteúdo", icon: ShieldCheck, tone: "text-rift-strong" },
    { href: "/admin/usuarios", label: `Usuários (${members.length})`, icon: Users, tone: "text-silver" },
    { href: "/admin/ranking", label: "Configurar ranking", icon: BarChart3, tone: "text-sell" },
  ];
  return (
    <div className="space-y-8">
      <PageHeader title="Organização" subtitle="Tudo que mantém a Riftzada redondinha." />
      {pending.length > 0 && (
        <section className="card border-gold/40 p-4">
          <h2 className="mb-3 font-display font-bold text-gold">Falta registrar resultado</h2>
          <ul className="space-y-2">
            {pending.map((e) => (
              <li key={e.id}>
                <Link href={`/admin/eventos/${e.id}/resultado`} className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3 hover:bg-surface-3">
                  <span className="font-semibold">{e.name}</span>
                  <span className="text-sm text-muted">{eventWhen(e.startsAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {shortcuts.map((s) => (
          <li key={s.href + s.label}>
            <Link href={s.href} className="card flex min-h-28 flex-col justify-between p-4 transition-colors hover:bg-surface-2">
              <s.icon size={26} className={s.tone} aria-hidden />
              <span className="font-semibold">{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Próximos e recentes</h2>
        <ul className="card divide-y divide-line">
          {events.slice(0, 6).map((e) => (
            <li key={e.id}>
              <Link href={`/admin/eventos/${e.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{e.name}</span>
                  <span className="block text-sm text-muted">{eventWhen(e.startsAt)}</span>
                </span>
                <Badge tone={e.status === "finished" ? "gold" : e.status === "cancelled" ? "danger" : "energy"}>{e.status === "finished" ? "Finalizado" : e.status === "cancelled" ? "Cancelado" : `${e.goingCount} vão`}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
