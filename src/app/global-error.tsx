"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <html lang="en" className="dark">
      <body className="grid min-h-dvh place-items-center bg-background p-6 text-foreground">
        <main className="max-w-lg space-y-5 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            Error 500
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            WatchMind needs a reset
          </h1>
          <p className="text-muted-foreground">
            An unexpected application error occurred. Your previously saved data
            is safe.
          </p>
          <Button onClick={unstable_retry}>Try again</Button>
        </main>
      </body>
    </html>
  );
}
