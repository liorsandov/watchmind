import { Skeleton } from "@/components/ui/skeleton";

export default function RateLoading() {
  return (
    <div aria-label="Building your rating queue" className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-11 w-3/4 max-w-xl" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <Skeleton className="h-2 w-full" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="min-h-[36rem] rounded-3xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}
