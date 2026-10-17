import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EyeOff, Repeat } from "lucide-react";
import { AuthorLine } from "@/components/feed/AuthorLine";
import { InterestButton } from "@/components/market/InterestButton";
import { OwnerActions } from "@/components/market/OwnerActions";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge, KindTag } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Photo } from "@/components/ui/Photo";
import { FlashToast } from "@/components/ui/Toast";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { listingPhotos, offerVerb } from "@/lib/cards";
import { CONDITION, LISTING_STATUS } from "@/lib/domain/labels";
import { formatPrice } from "@/lib/format";
import { moderateListing } from "@/server/actions/admin";
import { getListing, getOffersFor, getSharedWhatsapp } from "@/server/queries/market";
import { canModerate, requireSession } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/mercado/[id]">): Promise<Metadata> {
  const listing = await getListing((await params).id);
  return { title: listing?.cardName ?? "Anúncio" };
}

export default async function ListingPage({ params, searchParams }: PageProps<"/mercado/[id]">) {
  const [{ id }, query, session] = await Promise.all([params, searchParams, requireSession()]);
  const listing = await getListing(id);
  if (!listing) notFound();
  const mine = listing.seller.id === session.userId;
  const [whatsapp, offers] = await Promise.all([
    mine ? null : getSharedWhatsapp(listing.seller.id),
    listing.kind === "want" && listing.status !== "done" ? getOffersFor(listing) : [],
  ]);
  const photos = listingPhotos(listing);

  const details = [
    ["Expansão", listing.setName],
    ["Código", listing.card?.code ?? null],
    ["Raridade", listing.card?.rarity ?? null],
    ["Variante", listing.variant],
    ["Condição", CONDITION[listing.condition].label],
    ["Quantidade", String(listing.quantity)],
  ].filter((d): d is [string, string] => Boolean(d[1]));

  return (
    <div className="mx-auto max-w-4xl">
      {query.salvo && <FlashToast text="Anúncio salvo!" />}
      <PageHeader title={listing.cardName} back="/mercado" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          {photos.length === 0 && <Photo src={null} alt={listing.cardName} ratio="3/4" className="rounded-[28px] border border-line" />}
          {photos.map((photo, i) => (
            <figure key={photo.url}>
              <Photo
                src={photo.url}
                alt={photo.kind === "official" ? `${listing.cardName}, imagem oficial` : `${listing.cardName}, foto de ${listing.seller.displayName}`}
                ratio="3/4"
                priority={i === 0}
                className="rounded-[28px] border border-line"
                sizes="(min-width: 768px) 440px, 100vw"
              />
              {photos.length > 1 && (
                <figcaption className="mt-2 text-center text-xs text-muted">
                  {photo.kind === "official" ? "Imagem oficial da carta" : `Foto de ${listing.seller.displayName}`}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <KindTag kind={listing.kind} />
            <Badge tone={listing.status === "available" ? "energy" : listing.status === "reserved" ? "gold" : "neutral"}>{LISTING_STATUS[listing.status]}</Badge>
            {listing.acceptsTrade && <Badge tone="energy"><Repeat size={12} aria-hidden /> Aceita troca</Badge>}
            {listing.isHidden && <Badge tone="danger"><EyeOff size={12} aria-hidden /> Oculto pela moderação</Badge>}
          </div>
          <p className="font-display text-4xl font-extrabold">
            {listing.priceCents != null ? formatPrice(listing.priceCents) : listing.kind === "want" ? "A combinar" : "Só troca"}
          </p>
          {listing.kind === "want" && listing.status !== "done" && (offers.length > 0 || mine) && (
            <section aria-labelledby="ofertas" className="card p-4">
              <h2 id="ofertas" className="font-semibold">Quem tem essa carta</h2>
              {offers.length === 0 ? (
                <p className="mt-1 text-sm text-muted">Ninguém está vendendo ou trocando essa carta agora.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {offers.map((offer) => (
                    <li key={offer.id}>
                      <Link href={`/mercado/${offer.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2">
                        <Avatar name={offer.seller.displayName} src={offer.seller.avatarUrl} size={28} />
                        <span className="min-w-0 flex-1 text-sm">
                          <strong>{offer.seller.displayName}</strong> {offerVerb(offer)} essa carta
                        </span>
                        {offer.priceCents != null && <span className="font-display font-bold">{formatPrice(offer.priceCents)}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          <dl className="card divide-y divide-line">
            {details.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted">{label}</dt>
                <dd className="text-right font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          {listing.description && <p className="leading-relaxed whitespace-pre-line">{listing.description}</p>}
          <div className="card p-4"><AuthorLine author={listing.seller} at={listing.createdAt}>anunciou</AuthorLine></div>
          {mine ? (
            <OwnerActions id={listing.id} status={listing.status} />
          ) : (
            listing.status !== "done" && <InterestButton listing={listing} whatsapp={whatsapp} />
          )}
          {!mine && canModerate(session) && (
            <ActionButton action={moderateListing.bind(null, listing.id, !listing.isHidden)} confirm={listing.isHidden ? undefined : "Ocultar este anúncio da comunidade?"}>
              <EyeOff size={15} aria-hidden /> {listing.isHidden ? "Mostrar de novo" : "Ocultar anúncio"}
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
}
