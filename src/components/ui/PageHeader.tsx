import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { isDemoMode } from "@/lib/env";

/** Cabeçalho editorial; com arte, vira um panorama escuro da seção. */
export function PageHeader({ title, subtitle, back, action, art }: { title: string; subtitle?: string; back?: string; action?: React.ReactNode; art?: string }) {
  const content = (
    <>
      {back && (
        <Link
          href={back}
          aria-label="Voltar"
          className={cn(
            "inline-flex size-11 shrink-0 items-center justify-center rounded-md transition-colors",
            art ? "border border-white/25 bg-black/25 text-white hover:bg-white/15" : "text-muted hover:bg-surface-2 hover:text-ink",
          )}
        >
          <ArrowLeft size={21} aria-hidden />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className={cn(
          "font-ceremony font-semibold leading-[1.04] tracking-[-0.035em]",
          art ? "text-[clamp(2.45rem,8vw,4rem)] text-[#fff9ed] drop-shadow-[0_2px_12px_rgb(0_0_0/0.6)]" : "text-[clamp(2.1rem,7vw,3.25rem)] text-ink",
        )}>{title}</h1>
        {subtitle && <p className={cn("mt-2 max-w-[52ch] text-sm leading-relaxed md:text-base", art ? "text-[#f5ecdf]/90" : "text-muted")}>{subtitle}</p>}
      </div>
      {action && <div className="w-full self-start sm:w-auto sm:shrink-0 sm:self-center">{action}</div>}
    </>
  );

  if (!art) return <header className="mb-7 flex flex-wrap items-start gap-3 border-b border-line/80 pb-5">{content}</header>;

  return (
    <header className="art-banner relative isolate mb-6 overflow-hidden">
      {(!isDemoMode || art.startsWith("/")) && (
        <Image src={art} alt="" fill priority sizes="(min-width: 1024px) 960px, 100vw" className="object-cover object-[center_38%]" />
      )}
      <div className="absolute inset-0 bg-linear-to-r from-[#171323]/92 via-[#171323]/55 to-[#171323]/15" aria-hidden />
      <div className="absolute inset-0 bg-linear-to-t from-[#171323]/50 via-transparent to-transparent" aria-hidden />
      <div className="relative flex min-h-48 flex-col justify-end gap-4 px-5 py-6 md:min-h-56 md:px-8 md:py-8">
        <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] text-[#e8c98e] uppercase">
          Riftbound <span className="diamond border-[#e8c98e]" aria-hidden /> Radiance
        </p>
        <div className="flex flex-wrap items-end gap-3">{content}</div>
      </div>
    </header>
  );
}
