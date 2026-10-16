import type { Metadata } from "next";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getLegends } from "@/server/queries/arena";
import { getOwnContact } from "@/server/queries/profiles";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Editar perfil" };

export default async function EditProfilePage() {
  const session = await requireSession();
  const [legends, contact] = await Promise.all([getLegends(), getOwnContact(session.userId)]);
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Editar perfil" back={`/jogador/${session.profile.username}`} />
      <ProfileForm profile={session.profile} legends={legends} contact={contact} />
    </div>
  );
}
