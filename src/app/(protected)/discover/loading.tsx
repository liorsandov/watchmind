import { Skeleton } from "@/components/ui/skeleton";

export default function DiscoverLoading() {
  return (
    <div className="space-y-8" aria-label="Loading TMDB verification data">
      <Skeleton className="h-10 w-72 max-w-full" />
      <Skeleton className="h-10 w-full max-w-2xl" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton className="aspect-2/3" key={index} />
        ))}
      </div>
    </div>
  );
}
