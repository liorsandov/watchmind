import { CircleAlert, LockKeyhole, Save, Trash2 } from "lucide-react";
import { updateProfileAction } from "./actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth/user";
import { getCurrentProfile } from "@/lib/repositories/profiles";

interface SettingsPageProps {
  searchParams: Promise<{ error?: string; saved?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const [user, profile, params] = await Promise.all([
    requireUser(),
    getCurrentProfile(),
    searchParams,
  ]);
  const provider =
    typeof user.app_metadata.provider === "string"
      ? user.app_metadata.provider
      : "email";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Account & privacy</p>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Your viewing activity is private and saved to this account, so it
          follows you to every device.
        </p>
      </header>

      {params.saved ? (
        <Alert>
          <Save aria-hidden="true" />
          <AlertDescription>Your account details were saved.</AlertDescription>
        </Alert>
      ) : null}
      {params.error ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>
            Enter a display name between 1 and 80 characters.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Basic details for your private WatchMind account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfileAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                defaultValue={profile?.display_name ?? ""}
                id="displayName"
                maxLength={80}
                name="displayName"
                placeholder="How should we address you?"
                required
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Email</p>
              <div className="flex min-h-10 items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                <span className="truncate">{user.email}</span>
                <Badge variant="secondary">{provider}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Managed by your sign-in provider.
              </p>
            </div>
            <Button type="submit">
              <Save aria-hidden="true" />
              Save profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockKeyhole aria-hidden="true" className="size-4" />
            Data & privacy
          </CardTitle>
          <CardDescription>
            Ratings, history, watchlist items, and taste preferences are isolated
            to your authenticated user ID by database policies.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 aria-hidden="true" className="size-4" />
            Delete account
          </CardTitle>
          <CardDescription>
            Account deletion is intentionally unavailable until re-authentication,
            confirmation, and recovery safeguards are implemented.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled variant="destructive">
            Delete my account
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            The future server-only workflow is documented for a later production
            phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
