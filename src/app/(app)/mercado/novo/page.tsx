import type { Metadata } from "next";
import { ListingForm } from "@/components/market/ListingForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCollectionItem } from "@/server/queries/collection";
import { getOwnContact } from "@/server/queries/profiles";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Anunciar carta" };

export default async function NewListingPage({ searchParams }: PageProps<"/mercado/novo">) {
  const [session, params] = await Promise.all([requireSession(), searchParams]);
  // Vindo da coleção (?colecao=id), o formulário já chega preenchido com a carta
  const [fromCollection, contact] = await Promise.all([
    typeof params.colecao === "string" ? getCollectionItem(session.userId, params.colecao) : null,
    getOwnContact(session.userId),
  ]);
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Tá vendendo?"
        subtitle={fromCollection ? "Direto da tua coleção. Confere o preço e manda." : "Anuncia rapidinho. Sem pagamento por aqui: vocês combinam direto."}
        back={fromCollection ? "/colecao" : "/mercado"}
      />
      <ListingForm userId={session.userId} fromCollection={fromCollection ?? undefined} sharesWhatsapp={contact.shareWhatsapp} />
    </div>
  );
}
