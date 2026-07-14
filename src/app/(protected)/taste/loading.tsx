import { Skeleton } from "@/components/ui/skeleton";

export default function TasteLoading() {
  return (
    <div aria-label="Calculating your taste profile" className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-11 w-72" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className="h-44 rounded-xl" key={index} />
        ))}
      </div>
    </div>
  );
}
