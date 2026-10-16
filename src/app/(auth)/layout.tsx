import { LogoMark } from "@/components/layout/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <LogoMark size={64} className="drop-shadow-[0_10px_30px_rgba(123,97,255,0.45)]" />
        <p className="mt-4 font-display text-4xl font-extrabold tracking-tight">
          RIFT<span className="text-brand">ZADA</span>
        </p>
        <p className="mt-2 text-muted">Onde a galera do Rift se encontra.</p>
      </div>
      <div className="card w-full max-w-sm p-6">{children}</div>
      <p className="mt-6 max-w-sm text-center text-xs text-faint">Projeto da comunidade, feito por jogadores. Não é um app oficial de nenhuma loja.</p>
    </main>
  );
}
