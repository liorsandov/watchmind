import { Skeleton } from "@/components/ui/skeleton";

export default function ProtectedLoading() {
  return (
    <div className="space-y-5" aria-label="Loading your private account">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-10 w-2/3 max-w-md" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
