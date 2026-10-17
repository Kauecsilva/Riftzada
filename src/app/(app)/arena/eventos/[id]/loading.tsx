import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6" role="status" aria-label="Carregando">
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="aspect-video w-full rounded-[20px]" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
