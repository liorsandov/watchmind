import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-5 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <SearchX aria-hidden="true" className="size-6" />
      </span>
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Error 404
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground">
          The page you requested does not exist.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Back to WatchMind</Link>
      </Button>
    </section>
  );
}
