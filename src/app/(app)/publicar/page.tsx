import type { Metadata } from "next";
import { NewPostForm } from "@/components/feed/NewPostForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Publicar" };

export default async function PublishPage() {
  const session = await requireSession();
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Publicar no mural" subtitle="Aparece pra galera na Home." back="/" />
      <NewPostForm userId={session.userId} />
    </div>
  );
}
