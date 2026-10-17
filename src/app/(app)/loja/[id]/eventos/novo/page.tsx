import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/EventForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { canManageStore, getStore } from "@/server/queries/stores";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Novo evento" };

export default async function NewStoreEventPage({ params }: PageProps<"/loja/[id]/eventos/novo">) {
  const { id } = await params;
  const [session, store, allowed] = await Promise.all([requireSession(), getStore(id), canManageStore(id)]);
  if (!store || !allowed) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Novo evento" subtitle={store.name} back="/loja" />
      <EventForm userId={session.userId} store={store} />
    </div>
  );
}
