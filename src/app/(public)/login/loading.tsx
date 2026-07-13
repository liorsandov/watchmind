import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-md space-y-4 rounded-xl border p-6">
        <Skeleton className="size-11" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </main>
  );
}
