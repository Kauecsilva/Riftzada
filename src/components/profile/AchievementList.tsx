import { Award } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Achievement } from "@/lib/domain/achievements";

const TIER = { 1: "border-line bg-surface-2 text-muted", 2: "border-energy/30 bg-energy/10 text-energy", 3: "border-gold/40 bg-gold-soft text-gold" };

export function AchievementList({ items }: { items: Achievement[] }) {
  if (!items.length) return <p className="text-sm text-muted">Nenhuma conquista ainda. O primeiro torneio já vale uma!</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((a) => (
        <li key={a.code} title={a.description} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold", TIER[a.tier])}>
          <Award size={15} aria-hidden /> {a.name}
          <span className="sr-only">: {a.description}</span>
        </li>
      ))}
    </ul>
  );
}
