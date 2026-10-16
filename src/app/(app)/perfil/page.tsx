import { redirect } from "next/navigation";
import { requireSession } from "@/server/session";

export default async function MyProfile() {
  const session = await requireSession();
  redirect(`/jogador/${session.profile.username}`);
}
