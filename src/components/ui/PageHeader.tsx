import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Cabeçalho de página: voltar (opcional), título forte e subtítulo. */
export function PageHeader({ title, subtitle, back, action }: { title: string; subtitle?: string; back?: string; action?: React.ReactNode }) {
  return (
    <header className="mb-6 flex items-start gap-3">
      {back && (
        <Link href={back} aria-label="Voltar" className="-ml-2 mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
          <ArrowLeft size={22} aria-hidden />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-[28px] leading-tight font-extrabold tracking-tight md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
