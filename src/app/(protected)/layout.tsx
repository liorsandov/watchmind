import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/user";
import { getCurrentProfile } from "@/lib/repositories/profiles";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const profile = await getCurrentProfile();

  return (
    <AppShell
      user={{
        displayName: profile?.display_name ?? null,
        email: user.email ?? "Account",
      }}
    >
      {children}
    </AppShell>
  );
}
