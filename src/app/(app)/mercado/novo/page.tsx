import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ListingForm } from "@/components/market/ListingForm";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { FlashToast } from "@/components/ui/Toast";
import { listingQueueHref } from "@/lib/domain/listing-queue";
import { listingQueue } from "@/lib/validation/schemas";
import { getCollectionItem } from "@/server/queries/collection";
import { getOwnContact } from "@/server/queries/profiles";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Anunciar carta" };

export default async function NewListingPage({ searchParams }: PageProps<"/mercado/novo">) {
  const [session, params] = await Promise.all([requireSession(), searchParams]);
  // Vindo da coleção (?colecao=id), o formulário já chega preenchido com a carta.
  // Na fila do cadastro rápido (?fila=id,id…), os próximos itens vêm depois deste.
  const queue = listingQueue.parse(typeof params.fila === "string" ? params.fila : undefined);
  const [fromCollection, contact] = await Promise.all([
    typeof params.colecao === "string" ? getCollectionItem(session.userId, params.colecao) : null,
    getOwnContact(session.userId),
  ]);
  // Item da fila que sumiu da coleção ou já foi anunciado: pula para o próximo
  if (queue.length && (!fromCollection || fromCollection.listing)) redirect(listingQueueHref(queue));
  const inQueue = Boolean(fromCollection) && typeof params.fila === "string";
  return (
    <div className="mx-auto max-w-xl">
      {params.anunciado && <FlashToast text="Anúncio publicado! Próxima carta." param="anunciado" />}
      <PageHeader
        title="Tá vendendo?"
        subtitle={
          inQueue
            ? queue.length
              ? `Cadastro rápido: depois desta ${queue.length === 1 ? "falta mais 1 carta" : `faltam mais ${queue.length} cartas`}. Confere o preço e manda.`
              : "Cadastro rápido: esta é a última carta da fila."
            : fromCollection ? "Direto da tua coleção. Confere o preço e manda." : "Anuncia rapidinho. Sem pagamento por aqui: vocês combinam direto."
        }
        back={fromCollection ? "/colecao" : "/mercado"}
        action={inQueue && queue.length ? <Link href={listingQueueHref(queue)} className={buttonClass("ghost", "sm")}>Pular esta</Link> : undefined}
      />
      <ListingForm key={fromCollection?.id} userId={session.userId} fromCollection={fromCollection ?? undefined} queue={queue} sharesWhatsapp={contact.shareWhatsapp} />
    </div>
  );
}
