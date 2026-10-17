import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl" role="status" aria-label="Carregando">
      <Skeleton className="mb-6 h-10 w-40" />
      <Skeleton className="mb-6 h-12 w-full" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] w-full rounded-[20px]" />)}
      </div>
    </div>
  );
}
