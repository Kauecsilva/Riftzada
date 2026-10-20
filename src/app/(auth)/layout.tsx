import { LogoMark } from "@/components/layout/Logo";
import { RiftboundCredit } from "@/components/layout/RiftboundCredit";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-bg px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-[64dvh] bg-[url('/art/rift-map.webp')] bg-cover bg-[70%_center]" aria-hidden>
        <div className="auth-map-shade absolute inset-0" />
      </div>
      <div className="relative z-10 mb-6 w-52 self-end rounded-md border border-line bg-surface/90 backdrop-blur-sm sm:absolute sm:top-4 sm:right-4 sm:mb-0"><ThemeToggle variant="row" /></div>
      <div className="relative mb-8 flex flex-col items-center text-center">
        <LogoMark size={64} className="drop-shadow-[0_10px_20px_rgba(38,23,46,0.25)]" />
        <p className="mt-4 font-ceremony text-4xl leading-none font-bold tracking-[-0.04em] text-ink">
          RIFT<span className="text-rift">ZADA</span>
        </p>
        <p className="mt-2 text-muted">Onde a galera do Rift se encontra.</p>
      </div>
      <div className="card frame-hex relative w-full max-w-sm p-6">{children}</div>
      <div className="relative mt-8 flex max-w-sm flex-col items-center text-center">
        <RiftboundCredit className="flex flex-col items-center" />
        <p className="mt-2 text-xs text-faint">Projeto da comunidade, feito por jogadores. Não é um app oficial de nenhuma loja.</p>
      </div>
    </main>
  );
}
