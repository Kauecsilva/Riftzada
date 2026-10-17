import Image from "next/image";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

// Cor estável por nome, para as iniciais não ficarem todas iguais
const TINTS = ["from-rift to-[#4b3bb8]", "from-energy to-[#1f8f86]", "from-gold to-[#c27a1c]", "from-sell to-[#b83a4c]", "from-[#5aa2ff] to-[#2d5fb8]"];

function tint(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[hash % TINTS.length];
}

export function Avatar({ name, src, size = 40, ring, className }: { name: string; src: string | null; size?: number; ring?: "gold" | "rift"; className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br font-display font-bold text-white",
        tint(name),
        ring === "gold" && "ring-2 ring-gold ring-offset-2 ring-offset-bg",
        ring === "rift" && "ring-2 ring-rift ring-offset-2 ring-offset-bg",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.38) }}
    >
      {src ? <Image src={src} alt="" fill sizes={`${size * 2}px`} className="object-cover" unoptimized={src.endsWith(".svg")} /> : <span aria-hidden>{initials(name)}</span>}
      <span className="sr-only">{name}</span>
    </span>
  );
}
