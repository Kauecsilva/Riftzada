import type { Metadata } from "next";
import { Store as StoreIcon } from "lucide-react";
import { StoreRequestRow } from "@/components/admin/StoreRequestRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getPendingStores } from "@/server/queries/stores";

export const metadata: Metadata = { title: "Lojas" };

export default async function StoreRequestsPage() {
  const stores = await getPendingStores();
  return (
    <div>
      <PageHeader title="Pedidos de loja" subtitle="Só loja aprovada cria eventos (semanais, campeonatos…). Confira se a loja existe antes de aprovar." />
      {stores.length ? (
        <ul className="card divide-y divide-line">
          {stores.map((s) => <StoreRequestRow key={s.id} store={s} />)}
        </ul>
      ) : (
        <EmptyState icon={StoreIcon} title="Nenhum pedido esperando." text="Quando alguém cadastrar uma loja, ela aparece aqui." />
      )}
    </div>
  );
}
