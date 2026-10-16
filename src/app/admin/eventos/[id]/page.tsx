import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2, Trophy } from "lucide-react";
import { EventForm } from "@/components/admin/EventForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { deleteEvent } from "@/server/actions/admin";
import { getEvent } from "@/server/queries/arena";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Editar evento" };

export default async function EditEventPage({ params }: PageProps<"/admin/eventos/[id]">) {
  const [{ id }, session] = await Promise.all([params, requireAdmin()]);
  const event = await getEvent(id);
  if (!event) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={event.name} back="/admin/eventos" action={<Link href={`/admin/eventos/${id}/resultado`} className={buttonClass("gold", "sm")}><Trophy size={14} aria-hidden /> Resultado</Link>} />
      <EventForm userId={session.userId} event={event} />
      <div className="card border-danger/30 p-4">
        <p className="mb-3 text-sm text-muted">Apagar remove o evento, as presenças e os resultados (e o ranking recalcula).</p>
        <ActionButton action={deleteEvent.bind(null, id)} confirm={`Apagar "${event.name}" de vez?`} variant="danger" size="md">
          <Trash2 size={16} aria-hidden /> Apagar evento
        </ActionButton>
      </div>
    </div>
  );
}
