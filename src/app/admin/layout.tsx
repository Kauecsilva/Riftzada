import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoMark } from "@/components/layout/Logo";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: { default: "Painel", template: "%s · Painel Riftzada" } };

// Tudo aqui depende do usuário logado: nunca pré-renderizar
export const dynamic = "force-dynamic";

/** Painel administrativo: separado da experiência normal, só para admin (checado no servidor). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 md:px-8">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-display font-extrabold">
              <LogoMark size={24} /> Painel <span className="rounded-full bg-gold-soft px-2 py-0.5 text-xs text-gold">admin</span>
            </span>
            <Link href="/" className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink">
              <ArrowLeft size={16} aria-hidden /> Voltar ao app
            </Link>
          </div>
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
