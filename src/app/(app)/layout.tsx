import { BottomNav } from "@/components/layout/BottomNav";
import { SideNav } from "@/components/layout/SideNav";
import { getUnreadCount } from "@/server/queries/notifications";
import { requireSession } from "@/server/session";
import { ServiceWorker } from "@/components/layout/ServiceWorker";

// Tudo aqui depende do usuário logado: nunca pré-renderizar
export const dynamic = "force-dynamic";

/** Casca do app logado: barra lateral no desktop, barra inferior no celular. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [session, unread] = await Promise.all([requireSession(), getUnreadCount()]);
  const isAdmin = session.role === "admin";
  const isStore = session.profile.accountKind === "store";
  return (
    <div className="mx-auto flex max-w-[1320px]">
      <SideNav me={session.profile} isAdmin={isAdmin} isStore={isStore} unread={unread} />
      <main id="conteudo" className="pb-nav min-w-0 flex-1 px-4 pt-5 md:px-8 lg:pt-8 lg:pb-12">
        {children}
      </main>
      <BottomNav isAdmin={isAdmin} isStore={isStore} unread={unread} />
      <ServiceWorker />
    </div>
  );
}
