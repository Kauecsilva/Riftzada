import Image from "next/image";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

// Tintas estáveis e escuras mantêm as iniciais brancas legíveis nos dois temas.
const TINTS = ["from-[#603b87] to-[#a8520d]", "from-[#166d70] to-[#086f6a]", "from-[#96671f] to-[#8a6a2c]", "from-[#a73a57] to-[#b83a4c]", "from-[#3474be] to-[#2d5fb8]"];

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
