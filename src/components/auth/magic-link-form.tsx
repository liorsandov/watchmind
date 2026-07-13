"use client";

import { useActionState } from "react";
import { LoaderCircle, Mail } from "lucide-react";
import { sendMagicLink, type MagicLinkState } from "@/app/(public)/login/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: MagicLinkState = {};

export function MagicLinkForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(
    sendMagicLink,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input name="next" type="hidden" value={next} />
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          autoComplete="email"
          disabled={pending}
          id="email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success ? (
        <Alert>
          <Mail aria-hidden="true" />
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      ) : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" />
        ) : (
          <Mail aria-hidden="true" />
        )}
        Email me a magic link
      </Button>
    </form>
  );
}
