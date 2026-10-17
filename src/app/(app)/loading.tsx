import { CardListSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl">
      <CardListSkeleton count={3} tall />
    </div>
  );
}
