import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "gold";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-linear-to-b from-rift-strong to-rift text-on-rift border border-gold-strong/40 shadow-glow hover:brightness-110",
  secondary: "bg-surface-2 text-gold-strong border border-gold-line hover:border-gold hover:bg-surface-3",
  ghost: "text-muted hover:text-ink hover:bg-surface-2",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
  gold: "bg-linear-to-b from-gold-strong to-gold text-[#1d1606] hover:brightness-110",
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
