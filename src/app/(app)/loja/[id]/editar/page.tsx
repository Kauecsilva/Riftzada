import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoreForm } from "@/components/stores/StoreForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { canEditStore, getStore } from "@/server/queries/stores";

export const metadata: Metadata = { title: "Editar loja" };

export default async function EditStorePage({ params }: PageProps<"/loja/[id]/editar">) {
  const { id } = await params;
  const [store, allowed] = await Promise.all([getStore(id), canEditStore(id)]);
  if (!store || !allowed) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={store.name} back="/loja" />
      <StoreForm store={store} />
    </div>
  );
}
