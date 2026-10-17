import Image from "next/image";
import { cn } from "@/lib/cn";
import type { CardSummary } from "@/types/domain";

/** Miniatura da carta do catálogo (proporção de carta), com moldura vazia quando não há imagem. */
export function CardThumb({ card, width, className }: { card: Pick<CardSummary, "name" | "imageUrl">; width: number; className?: string }) {
  return (
    <span className={cn("relative block shrink-0 overflow-hidden rounded-md bg-surface-3", className)} style={{ width, aspectRatio: "744/1039" }}>
      {card.imageUrl && <Image src={card.imageUrl} alt="" fill sizes={`${width * 2}px`} className="object-cover" />}
    </span>
  );
}
