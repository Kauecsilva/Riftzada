import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "./button";

/** Estado vazio com frase leve e, quando faz sentido, uma ação. */
export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: { href: string; label: string } }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-rift-soft text-rift-strong">
        <Icon size={26} aria-hidden />
      </span>
      <p className="font-display text-lg font-bold">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-muted">{text}</p>}
      {action && (
        <Link href={action.href} className={buttonClass("primary", "md", "mt-5")}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
