import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingForm } from "@/components/market/ListingForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getListing } from "@/server/queries/market";
import { getOwnContact } from "@/server/queries/profiles";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Editar anúncio" };

export default async function EditListingPage({ params }: PageProps<"/mercado/[id]/editar">) {
  const [{ id }, session] = await Promise.all([params, requireSession()]);
  const [listing, contact] = await Promise.all([getListing(id), getOwnContact(session.userId)]);
  if (!listing || listing.seller.id !== session.userId) notFound();
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Editar anúncio" back={`/mercado/${id}`} />
      <ListingForm userId={session.userId} listing={listing} sharesWhatsapp={contact.shareWhatsapp} />
    </div>
  );
}
