import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";

const TABS = [
  { href: "/arena", label: "Próximos", exact: true },
  { href: "/arena/lojas", label: "Lojas" },
  { href: "/arena/resultados", label: "Resultados" },
  { href: "/arena/ranking", label: "Ranking" },
  { href: "/arena/hall", label: "Hall da Fama" },
];

export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Na Arena" subtitle="Torneios, resultados e quem manda na Riftzada." />
      <Tabs items={TABS} label="Seções da Arena" />
      {children}
    </div>
  );
}
