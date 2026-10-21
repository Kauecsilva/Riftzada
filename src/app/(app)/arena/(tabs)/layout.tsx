import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { requireSession } from "@/server/session";

const TABS = [
  { href: "/arena", label: "Próximos", exact: true },
  { href: "/arena/lojas", label: "Lojas" },
  { href: "/arena/resultados", label: "Resultados" },
  { href: "/arena/ranking", label: "Ranking" },
  { href: "/arena/hall", label: "Hall da Fama" },
];

export default async function ArenaLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Na Arena" subtitle="Torneios, resultados e quem manda na Riftzada." art="/art/rift-map.webp" />
      <Tabs items={TABS} label="Seções da Arena" />
      {children}
    </div>
  );
}
