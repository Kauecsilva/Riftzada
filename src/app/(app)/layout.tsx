import { BottomNav } from "@/components/layout/BottomNav";
import { RiftboundCredit } from "@/components/layout/RiftboundCredit";
import { SideNav } from "@/components/layout/SideNav";
import { getUnreadCount } from "@/server/queries/notifications";
import { requireSession } from "@/server/session";
import { ServiceWorker } from "@/components/layout/ServiceWorker";

// Tudo aqui depende do usuário logado: nunca pré-renderizar
export const dynamic = "force-dynamic";

/** Casca do app logado: masthead horizontal e barra inferior no celular. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const isAdmin = session.role === "admin";
  const isStore = session.profile.accountKind === "store";
  const unread = await getUnreadCount(session.userId);
  return (
    <div className="app-shell min-h-dvh bg-bg text-ink">
      <SideNav me={session.profile} isAdmin={isAdmin} isStore={isStore} unread={unread} />
      <main id="conteudo" className="mx-auto min-h-[calc(100dvh-180px)] w-full max-w-[1280px] px-4 pt-6 pb-10 sm:px-6 lg:px-10 lg:pt-9 lg:pb-14">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-[1280px] border-t border-line px-4 pt-5 pb-nav sm:px-6 lg:px-10 lg:pb-8">
        <RiftboundCredit className="max-w-lg" />
      </footer>
      <BottomNav isAdmin={isAdmin} isStore={isStore} unread={unread} />
      <ServiceWorker />
    </div>
  );
}
