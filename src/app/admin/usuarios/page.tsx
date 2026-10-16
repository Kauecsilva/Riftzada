import type { Metadata } from "next";
import { MemberRow } from "@/components/admin/MemberRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { getMembers } from "@/server/queries/admin";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsersPage() {
  const [session, members] = await Promise.all([requireAdmin(), getMembers()]);
  return (
    <div>
      <PageHeader title="Usuários" subtitle={`${members.length} na comunidade. Moderador oculta posts e anúncios; admin faz tudo.`} />
      <ul className="card divide-y divide-line">
        {members.map((m) => <MemberRow key={m.id} member={m} isMe={m.id === session.userId} />)}
      </ul>
    </div>
  );
}
