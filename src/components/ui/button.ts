import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "gold";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-rift text-on-rift border border-rift shadow-glow hover:bg-rift-strong",
  secondary: "bg-surface text-ink border border-line hover:border-radiance-line hover:bg-rift-soft",
  ghost: "text-muted hover:text-ink hover:bg-surface-2",
  danger: "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
  gold: "bg-[#e6c680] text-[#261b2b] border border-[#b28c46] hover:bg-[#f2d697]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 text-sm gap-1.5",
  md: "min-h-11 px-5 text-[15px] gap-2",
  lg: "min-h-13 px-6 text-base gap-2",
};

/** Classes de botão para <button>, <Link> e <label>. */
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string): string {
  return cn(
    "inline-flex items-center justify-center rounded-md font-semibold whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,transform,filter] duration-150 active:scale-[0.97]",
    "disabled:opacity-50 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}
