import { LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { signInWithGoogle } from "./actions";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
}

const errorMessages: Record<string, string> = {
  callback: "That sign-in link is invalid or expired. Request a new one below.",
  google: "Google sign-in is unavailable right now. Try email instead.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/discover");

  const params = await searchParams;
  const next = getSafeNextPath(params.next);
  const error = params.error ? errorMessages[params.error] : undefined;

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden border-e bg-muted/20 p-10 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            W
          </span>
          WatchMind
        </div>
        <div className="max-w-xl space-y-7">
          <p className="text-sm font-medium text-primary">Private by design</p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance xl:text-5xl">
            Your taste, remembered wherever you watch.
          </h1>
          <p className="max-w-lg text-lg leading-8 text-muted-foreground">
            Ratings, watch history, and recommendations stay attached to your
            private account—not this browser—so you can continue on any device.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <PrivacyPoint icon={ShieldCheck} text="Viewing data stays private" />
            <PrivacyPoint icon={RefreshCw} text="Progress returns with you" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          No social profiles. No shared viewing history.
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md space-y-5">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-primary font-bold text-primary-foreground">
              W
            </span>
            <span className="font-semibold">WatchMind</span>
          </div>
          <Card className="shadow-2xl shadow-black/20">
            <CardHeader className="space-y-2">
              <div className="mb-2 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <LockKeyhole aria-hidden="true" className="size-5" />
              </div>
              <CardTitle className="text-2xl">Sign in to your account</CardTitle>
              <CardDescription>
                Use Google or a one-time email link. We never ask for a password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              {params.message === "signed-out" ? (
                <Alert>
                  <AlertDescription>You have been signed out safely.</AlertDescription>
                </Alert>
              ) : null}
              <form action={signInWithGoogle}>
                <input name="next" type="hidden" value={next} />
                <Button className="w-full" type="submit" variant="outline">
                  <span aria-hidden="true" className="font-bold">G</span>
                  Continue with Google
                </Button>
              </form>
              <div className="flex items-center gap-3" aria-hidden="true">
                <Separator className="flex-1" />
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  or
                </span>
                <Separator className="flex-1" />
              </div>
              <MagicLinkForm next={next} />
            </CardContent>
          </Card>
          <p className="px-3 text-center text-xs leading-5 text-muted-foreground">
            Your ratings and history are stored securely under your account and
            are not visible to other users.
          </p>
        </div>
      </section>
    </main>
  );
}

function PrivacyPoint({
  icon: Icon,
  text,
}: {
  icon: typeof ShieldCheck;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card/50 p-4 text-sm">
      <Icon aria-hidden="true" className="size-5 text-primary" />
      {text}
    </div>
  );
}
