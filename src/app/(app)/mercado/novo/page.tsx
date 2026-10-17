import type { Metadata } from "next";
import { ListingForm } from "@/components/market/ListingForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Anunciar carta" };

export default async function NewListingPage() {
  const session = await requireSession();
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Tá vendendo?" subtitle="Anuncia rapidinho. Sem pagamento por aqui: vocês combinam direto." back="/mercado" />
      <ListingForm userId={session.userId} />
    </div>
  );
}
