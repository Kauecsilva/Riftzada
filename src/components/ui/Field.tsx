import { cn } from "@/lib/cn";

/** Label + campo + dica + erro, com os ids ligados para leitores de tela. */
export function Field({
  label, name, error, hint, children, className, optional,
}: {
  label: string; name: string; error?: string; hint?: string; children: React.ReactNode; className?: string; optional?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={name} className="flex items-baseline justify-between text-sm font-semibold">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-faint">opcional</span>}
      </label>
      {children}
      {hint && !error && <p id={`${name}-hint`} className="text-xs text-faint">{hint}</p>}
      {error && <p id={`${name}-error`} className="text-sm whitespace-pre-line text-danger">{error}</p>}
    </div>
  );
}

/** Props de acessibilidade para o input dentro de um Field. */
export function fieldProps(name: string, error?: string, hint?: string) {
  return {
    id: name,
    name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${name}-error` : hint ? `${name}-hint` : undefined,
  } as const;
}
