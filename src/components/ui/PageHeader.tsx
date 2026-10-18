import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Cabeçalho de página: voltar (opcional), título forte e subtítulo.
 * Com `art`, vira um banner com a arte oficial ao fundo e moldura hextech (seções principais).
 */
export function PageHeader({ title, subtitle, back, action, art }: { title: string; subtitle?: string; back?: string; action?: React.ReactNode; art?: string }) {
  const content = (
    <>
      {back && (
        <Link href={back} aria-label="Voltar" className="-ml-2 mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
          <ArrowLeft size={22} aria-hidden />
        </Link>
      )}
      <div className={cn("min-w-0 flex-1", art && "min-w-64")}>
        <h1 className={cn("font-display leading-none font-extrabold tracking-tight uppercase", art ? "text-[40px] text-ink drop-shadow-[0_2px_12px_rgb(0_0_0/0.8)] md:text-6xl" : "text-[34px] md:text-5xl")}>{title}</h1>
        {subtitle && <p className={cn("mt-2", art ? "max-w-md text-ink/85" : "text-muted")}>{subtitle}</p>}
      </div>
      {action}
    </>
  );

  if (!art) return <header className="mb-6 flex items-start gap-3">{content}</header>;

  return (
    <header className="frame-hex relative mb-6 overflow-hidden bg-surface">
      <Image src={art} alt="" fill priority sizes="(min-width: 1024px) 960px, 100vw" className="object-cover object-[50%_30%]" />
      <div className="absolute inset-0 bg-linear-to-t from-bg from-10% via-bg/55 to-bg/0" aria-hidden />
      <div className="absolute inset-0 bg-linear-to-r from-bg/80 via-bg/20 to-transparent" aria-hidden />
      <div className="relative flex flex-wrap items-end gap-3 px-5 pt-28 pb-5 md:px-8 md:pt-40 md:pb-7">{content}</div>
    </header>
  );
}
