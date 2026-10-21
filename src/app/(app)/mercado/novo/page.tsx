import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ListingForm } from "@/components/market/ListingForm";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { FlashToast } from "@/components/ui/Toast";
import { listingQueueHref } from "@/lib/domain/listing-queue";
import { discountLabel } from "@/lib/domain/pricing";
import { listingQueue, queuePrice } from "@/lib/validation/schemas";
import { getCollectionItem } from "@/server/queries/collection";
import { getOwnContact } from "@/server/queries/profiles";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Anunciar carta" };

export default async function NewListingPage({ searchParams }: PageProps<"/mercado/novo">) {
  const [session, params] = await Promise.all([requireSession(), searchParams]);
  // Vindo da coleção (?colecao=id), o formulário já chega preenchido com a carta.
  // Na fila do cadastro rápido (?fila=id,id…), os próximos itens vêm depois deste.
  const queue = listingQueue.parse(typeof params.fila === "string" ? params.fila : undefined);
  // Base e desconto escolhidos para a fila inteira (?base=liga&desconto=15)
  const price = typeof params.base === "string" ? queuePrice.parse({ base: params.base, discountPct: params.desconto ?? 0 }) : null;
  const [fromCollection, contact] = await Promise.all([
    typeof params.colecao === "string" ? getCollectionItem(session.userId, params.colecao) : null,
    getOwnContact(session.userId),
  ]);
  // Item da fila que sumiu da coleção ou já foi anunciado: pula para o próximo
  if (queue.length && (!fromCollection || fromCollection.listing)) redirect(listingQueueHref(queue, price));
  const inQueue = Boolean(fromCollection) && typeof params.fila === "string";
  return (
    <div className="mx-auto max-w-xl">
      {params.anunciado && <FlashToast text="Anúncio publicado! Próxima carta." param="anunciado" />}
      <PageHeader
        title="Tá vendendo?"
        subtitle={
          inQueue
            ? queue.length
              ? `Cadastro rápido${price ? ` (${discountLabel(price.base, price.discountPct)})` : ""}: depois desta ${queue.length === 1 ? "falta mais 1 carta" : `faltam mais ${queue.length} cartas`}. Confere o preço e manda.`
              : `Cadastro rápido${price ? ` (${discountLabel(price.base, price.discountPct)})` : ""}: esta é a última carta da fila.`
            : fromCollection ? "Direto da tua coleção. Confere o preço e manda." : "Anuncia rapidinho. Sem pagamento por aqui: vocês combinam direto."
        }
        back={fromCollection ? "/colecao" : "/mercado"}
        action={inQueue && queue.length ? <Link href={listingQueueHref(queue, price)} className={buttonClass("ghost", "sm")}>Pular esta</Link> : undefined}
      />
      <ListingForm key={fromCollection?.id} userId={session.userId} fromCollection={fromCollection ?? undefined} queue={queue} queuePrice={inQueue ? price : null} sharesWhatsapp={contact.shareWhatsapp} />
    </div>
  );
}
