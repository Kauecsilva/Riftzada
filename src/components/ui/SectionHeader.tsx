import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Título de seção em caixa alta, com link opcional "ver tudo". */
export function SectionHeader({ title, href, linkLabel = "Ver tudo", id }: { title: string; href?: string; linkLabel?: string; id?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 id={id} className="font-display text-[13px] font-bold tracking-[0.14em] text-muted uppercase">
        {title}
      </h2>
      {href && (
        <Link href={href} className="inline-flex min-h-8 items-center gap-0.5 rounded-full px-2 text-sm font-semibold text-rift-strong hover:bg-rift-soft">
          {linkLabel}
          <ChevronRight size={16} aria-hidden />
        </Link>
      )}
    </div>
  );
}
