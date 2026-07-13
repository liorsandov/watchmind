import { Skeleton } from "@/components/ui/skeleton";

export function PageLoading() {
  return (
    <div aria-label="Loading page" className="mx-auto max-w-4xl space-y-6" role="status">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-6 w-28" />
      <div className="space-y-3">
        <Skeleton className="h-12 w-3/5" />
        <Skeleton className="h-5 w-full max-w-2xl" />
        <Skeleton className="h-5 w-4/5 max-w-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
