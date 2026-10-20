"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { splitLegendName } from "@/lib/cards";
import { cn } from "@/lib/cn";
import type { SetLegends } from "@/types/domain";

/** Carrossel das lendas de cada coleção. Abre na coleção mais recente (a última da lista). */
export function LegendCarousel({ sets }: { sets: SetLegends[] }) {
  const [code, setCode] = useState(sets.at(-1)?.code);
  const [edges, setEdges] = useState({ start: true, end: false });
  const track = useRef<HTMLUListElement>(null);
  const current = sets.find((s) => s.code === code) ?? sets.at(-1);

  const updateEdges = () => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };

  useEffect(() => {
    track.current?.scrollTo({ left: 0 });
    updateEdges();
  }, [code]);

  if (!current) return null;

  const scrollBy = (direction: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section aria-labelledby="lendas-titulo" className="card min-w-0 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div>
          <h2 id="lendas-titulo" className="flex items-center gap-2.5 font-display text-2xl leading-none font-bold text-ink">
            <span className="size-2.5 rotate-45 border-2 border-gold bg-gold-soft" aria-hidden />
            Lendas por coleção
          </h2>
          <p className="mt-1.5 text-sm text-muted" aria-live="polite">
            {current.legends.length} {current.legends.length === 1 ? "lenda" : "lendas"} em {current.name}
          </p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button type="button" onClick={() => scrollBy(-1)} disabled={edges.start} aria-label="Lendas anteriores" className="inline-flex size-11 items-center justify-center rounded-md border border-line text-ink hover:bg-surface-2 disabled:opacity-40">
            <ChevronLeft size={20} aria-hidden />
          </button>
          <button type="button" onClick={() => scrollBy(1)} disabled={edges.end} aria-label="Próximas lendas" className="inline-flex size-11 items-center justify-center rounded-md border border-line text-ink hover:bg-surface-2 disabled:opacity-40">
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>
      </div>

      <div role="group" aria-label="Escolha a coleção" className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {sets.map((set) => (
          <button
            key={set.code}
            type="button"
            aria-pressed={set.code === current.code}
            onClick={() => setCode(set.code)}
            className={cn(
              "min-h-11 shrink-0 rounded-md border px-3.5 text-sm font-semibold transition-colors",
              set.code === current.code ? "border-rift bg-rift text-on-rift" : "border-line text-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            {set.name}
          </button>
        ))}
      </div>

      <ul
        ref={track}
        onScroll={updateEdges}
        aria-label={`Lendas de ${current.name}`}
        className="-mx-4 mt-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:-mx-5 md:scroll-px-5 md:px-5 [scrollbar-width:thin]"
      >
        {current.legends.map((card) => {
          const [champion, title] = splitLegendName(card.name);
          return (
            <li key={card.id} className="w-[128px] shrink-0 snap-start sm:w-[144px]">
              <Link href={`/mercado?q=${encodeURIComponent(champion)}`} className="group block rounded-md">
                <div className="relative aspect-[744/1039] overflow-hidden rounded-[5px] border border-gold-line bg-surface-2 shadow-[0_12px_20px_-12px_rgb(25_17_41/0.6)] transition-transform group-hover:-translate-y-1">
                  {card.imageUrl && <Image src={card.imageUrl} alt="" fill sizes="144px" className="object-cover" />}
                </div>
                <p className="mt-2 truncate font-display text-base leading-tight font-bold text-ink">{champion}</p>
                {title && <p className="truncate text-xs text-muted">{title}</p>}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
