import { BottomNav } from "@/components/layout/BottomNav";
import { RiftboundCredit } from "@/components/layout/RiftboundCredit";
import { SideNav } from "@/components/layout/SideNav";
import { getUnreadCount } from "@/server/queries/notifications";
import { getSession } from "@/server/session";
import { ServiceWorker } from "@/components/layout/ServiceWorker";

// Tudo aqui depende de quem está vendo: nunca pré-renderizar
export const dynamic = "force-dynamic";

/**
 * Casca do app: masthead horizontal e barra inferior no celular. Visitante só chega aqui pela
 * vitrine do mercado (o proxy manda o resto para /entrar) e vê a casca sem conta.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const isAdmin = session?.role === "admin";
  const isStore = session?.profile.accountKind === "store";
  const unread = session ? await getUnreadCount(session.userId) : 0;
  return (
    <div className="app-shell min-h-dvh bg-bg text-ink">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-surface focus:px-4 focus:py-3 focus:font-semibold focus:text-ink focus:shadow-lg">Pular para o conteúdo</a>
      <SideNav me={session?.profile ?? null} isAdmin={isAdmin} isStore={isStore} unread={unread} />
      <main id="conteudo" className="mx-auto w-full lg:min-h-[calc(100dvh-180px)] max-w-[1280px] px-4 pt-6 pb-10 sm:px-6 lg:px-10 lg:pt-9 lg:pb-14">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-[1280px] border-t border-line px-4 pt-5 pb-nav sm:px-6 lg:px-10 lg:pb-8">
        <RiftboundCredit className="max-w-lg" />
      </footer>
      <BottomNav isAdmin={isAdmin} isStore={isStore} visitor={!session} />
      <ServiceWorker />
    </div>
  );
}
