import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { EntryForm, LegendForm, RulesForm } from "@/components/admin/RankingForms";
import { ActionButton } from "@/components/ui/ActionButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { timeAgo } from "@/lib/format";
import { deleteRankingEntry } from "@/server/actions/admin";
import { getMembers, getRankingEntries } from "@/server/queries/admin";
import { getLegends, getRankingRules } from "@/server/queries/arena";

export const metadata: Metadata = { title: "Ranking" };

export default async function AdminRankingPage() {
  const [rules, entries, members, legends] = await Promise.all([getRankingRules(), getRankingEntries(), getMembers(), getLegends()]);
  return (
    <div className="space-y-8">
      <PageHeader title="Ranking" subtitle="A regra vale para todos os torneios: mudou aqui, o ranking recalcula na hora." />
      <section className="card p-5">
        <h2 className="mb-4 font-display text-lg font-bold">Pontos por colocação</h2>
        <RulesForm rules={rules} />
      </section>
      <section className="card p-5">
        <h2 className="mb-1 font-display text-lg font-bold">Ajustes manuais</h2>
        <p className="mb-4 text-sm text-muted">Bônus ou correções ficam registrados com motivo, como um extrato.</p>
        <EntryForm players={members} />
        {entries.length > 0 && (
          <ul className="mt-6 divide-y divide-line border-t border-line">
            {entries.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <span className={`w-14 text-right font-display font-bold tabular-nums ${e.points > 0 ? "text-energy" : "text-danger"}`}>{e.points > 0 ? `+${e.points}` : e.points}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{e.player.displayName}</span>
                  <span className="block truncate text-xs text-muted">{e.reason} · {timeAgo(e.createdAt)}</span>
                </span>
                <ActionButton action={deleteRankingEntry.bind(null, e.id)} confirm="Remover este ajuste?" variant="ghost" label="Remover ajuste">
                  <Trash2 size={15} aria-hidden />
                </ActionButton>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card p-5">
        <h2 className="mb-1 font-display text-lg font-bold">Lendas cadastradas</h2>
        <p className="mb-4 text-sm text-muted">Usadas no resultado, nos decks e no perfil. Alimentam o futuro “Meta da Riftzada”.</p>
        <p className="mb-4 text-sm">{legends.map((l) => l.name.split(",")[0]).join(" · ") || "Nenhuma ainda."}</p>
        <LegendForm />
      </section>
    </div>
  );
}
