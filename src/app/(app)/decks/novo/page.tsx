import type { Metadata } from "next";
import { DeckForm } from "@/components/decks/DeckForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getFinishedEvents, getLegends } from "@/server/queries/arena";

export const metadata: Metadata = { title: "Publicar deck" };

export default async function NewDeckPage() {
  const [legends, events] = await Promise.all([getLegends(), getFinishedEvents(15)]);
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Publicar deck" subtitle="Cola a lista e pronto." back="/decks" />
      <DeckForm legends={legends} events={events} />
    </div>
  );
}
