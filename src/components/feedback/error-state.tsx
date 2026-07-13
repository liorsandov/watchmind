"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert className="mx-auto max-w-xl" variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>
          We could not load this part of WatchMind. Your previously saved data
          is safe.
        </p>
        <Button onClick={onRetry} size="sm" variant="outline">
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
