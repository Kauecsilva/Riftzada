import { cn } from "@/lib/cn";

/** Monograma R: a haste dourada se separa da perna violeta como uma fenda. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={className}>
      <path d="M9 10H43L55 23L41 37L32 32L41 24H27L18 18L24 31V49L10 60L14 45V23Z" fill="#e8c77e" stroke="#211a32" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M18 28L29 32L41 49L34 52L24 40Z" fill="#e8c77e" stroke="#211a32" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M32 35L42 36L59 58L48 56Z" fill="#b98ad3" stroke="#211a32" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, size = 30, tone = "dark" }: { className?: string; size?: number; tone?: "light" | "dark" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", tone === "light" ? "text-[#faf5eb]" : "text-ink", className)}>
      <LogoMark size={size} />
      <span className="font-ceremony text-[21px] leading-none font-bold tracking-[-0.045em] sm:text-[23px]">
        RIFT<span className={tone === "light" ? "text-[#e8c77e]" : "text-rift"}>ZADA</span>
      </span>
    </span>
  );
}
