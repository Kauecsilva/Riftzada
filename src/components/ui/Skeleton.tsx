import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

/** Esqueleto genérico de lista de cartões, para os loading.tsx. */
export function CardListSkeleton({ count = 3, tall }: { count?: number; tall?: boolean }) {
  return (
    <div className="space-y-4" role="status" aria-label="Carregando">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card space-y-3 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
          <Skeleton className={tall ? "h-52 w-full" : "h-16 w-full"} />
        </div>
      ))}
    </div>
  );
}
