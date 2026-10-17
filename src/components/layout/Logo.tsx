import { useId } from "react";
import { cn } from "@/lib/cn";

/** Marca da Riftzada: um losango partido pela fenda (o Rift) + o nome. Identidade própria. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  // Ids únicos: com o mesmo id em dois SVGs, um escondido (display:none) apaga o degradê do outro
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={className}>
      <defs>
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b4a6ff" />
          <stop offset="0.55" stopColor="#7b61ff" />
          <stop offset="1" stopColor="#4b3bb8" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8ff5ea" />
          <stop offset="1" stopColor="#36e2d3" />
        </linearGradient>
      </defs>
      <path d="M32 4 L58 30 L36 30 L22 50 L32 60 L6 34 Z" fill={`url(#${id}a)`} />
      <path d="M38 34 L58 34 L32 60 L26 54 Z" fill={`url(#${id}b)`} />
    </svg>
  );
}

export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <span className="font-display text-xl font-extrabold tracking-tight">
        RIFT<span className="text-brand">ZADA</span>
      </span>
    </span>
  );
}
