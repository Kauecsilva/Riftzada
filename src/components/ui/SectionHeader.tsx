import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Título de seção com link opcional "ver tudo". */
export function SectionHeader({ title, href, linkLabel = "Ver tudo", id }: { title: string; href?: string; linkLabel?: string; id?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 border-b border-line pb-3">
      <h2 id={id} className="flex items-center gap-2.5 font-display text-2xl leading-none font-bold text-ink">
        <span className="size-2.5 rotate-45 border-2 border-gold bg-gold-soft" aria-hidden />
        {title}
      </h2>
      {href && (
        <Link href={href} className="inline-flex min-h-11 items-center gap-0.5 rounded-md px-2 text-sm font-semibold text-rift hover:bg-rift-soft">
          {linkLabel}
          <ChevronRight size={16} aria-hidden />
        </Link>
      )}
    </div>
  );
}
