import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { EventForm } from "@/components/admin/EventForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { deleteStoreEvent } from "@/server/actions/stores";
import { getEvent } from "@/server/queries/arena";
import { canManageStore, getStore } from "@/server/queries/stores";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Editar evento" };

export default async function EditStoreEventPage({ params }: PageProps<"/loja/[id]/eventos/[eventId]">) {
  const { id, eventId } = await params;
  const [session, store, allowed, event] = await Promise.all([requireSession(), getStore(id), canManageStore(id), getEvent(eventId)]);
  if (!store || !allowed || !event || event.store?.id !== store.id) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={event.name} subtitle={event.seriesId ? "Semanal: as mudanças valem só para esta data." : store.name} back="/loja" />
      <EventForm userId={session.userId} event={event} store={store} />
      <div className="card border-danger/30 p-4">
        <p className="mb-3 text-sm text-muted">Apagar remove o evento e a lista de quem ia jogar.</p>
        <div className="flex flex-wrap gap-2">
          <ActionButton action={deleteStoreEvent.bind(null, eventId, "one")} confirm={`Apagar "${event.name}" desta data?`} variant="danger" size="md">
            <Trash2 size={16} aria-hidden /> {event.seriesId ? "Apagar só esta data" : "Apagar evento"}
          </ActionButton>
          {event.seriesId && (
            <ActionButton action={deleteStoreEvent.bind(null, eventId, "following")} confirm="Apagar esta data e todas as seguintes do semanal?" variant="danger" size="md">
              <Trash2 size={16} aria-hidden /> Apagar esta e as próximas
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
}
