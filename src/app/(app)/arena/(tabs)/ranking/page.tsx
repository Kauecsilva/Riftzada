import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { RankingList } from "@/components/arena/RankingList";
import { EmptyState } from "@/components/ui/EmptyState";
import { ordinal } from "@/lib/format";
import { getRanking, getRankingRules } from "@/server/queries/arena";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Ranking" };

export default async function RankingPage() {
  const [session, rows, rules] = await Promise.all([requireSession(), getRanking(), getRankingRules()]);
  return (
    <div className="space-y-4">
      {rows.length ? (
        <RankingList rows={rows} meId={session.userId} />
      ) : (
        <EmptyState icon={BarChart3} title="Ranking zerado." text="Os pontos aparecem depois do primeiro torneio registrado." />
      )}
      <details className="card p-4 text-sm text-muted">
        <summary className="cursor-pointer font-semibold text-ink">Como funcionam os pontos?</summary>
        <ul className="mt-3 space-y-1">
          {rules.pointsByPlacement.map((pts, i) => (
            <li key={i}>{ordinal(i + 1)} lugar: <strong className="text-ink">{pts} pts</strong></li>
          ))}
          <li>Cada torneio jogado: <strong className="text-ink">{rules.participationPoints} pts</strong></li>
        </ul>
        <p className="mt-2">A organização pode lançar bônus ou ajustes. Empate é desempatado por títulos e depois por top 4.</p>
      </details>
    </div>
  );
}
