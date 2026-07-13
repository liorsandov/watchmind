# Authentication and account lifecycle

WatchMind uses Supabase Auth with the server-side PKCE pattern. The browser and
server clients share encrypted session cookies; `src/proxy.ts` refreshes those
cookies, redirects anonymous visitors away from private routes, and redirects an
authenticated visitor away from `/login`. The protected route-group layout also
validates the user on the server, so the proxy is an early guard rather than the
only security boundary.

Google OAuth and email magic links both return through `/auth/callback`. The
callback exchanges the short-lived authorization code for a cookie-backed
session and accepts only known, internal `next` paths. Every database write still
resolves the authenticated user inside the Server Action or repository; route
protection never replaces action-level authorization. Row Level Security remains
the final data boundary.

## Provider configuration

- In Supabase Auth URL Configuration, set the production Site URL and allow
  `https://your-domain.example/auth/callback`. Keep the local callback URLs while
  developing.
- Enable Google in Supabase Auth, store the Google client secret there, and use
  the Supabase provider callback URL as the authorized redirect URI in Google
  Cloud. No Google secret is required by the browser app.
- Configure production SMTP for magic-link deliverability. The local Supabase
  stack captures test messages in Mailpit at `http://127.0.0.1:54324`.
- Keep the default profile-creation database trigger enabled. It creates the
  profile and preference rows in the same transaction as the first auth user.

## Future delete-account workflow

The settings button is deliberately disabled until a production-safe workflow
is built. That workflow must:

1. Require a fresh sign-in and an explicit typed confirmation.
2. Run in a protected server endpoint, verify the user again, and apply rate
   limiting. The browser must never receive the Supabase service-role key.
3. Cancel any active jobs and export or delete external provider data first.
4. Use a narrowly scoped server-side administrative client to delete the Auth
   user. Database foreign keys then cascade the user's private application data.
5. Revoke sessions, record a security audit event outside the deleted user data,
   and show an irreversible completion state.
6. Define a short recovery or cooling-off period before launch if product policy
   requires one, and document retention behavior in the privacy policy.

Until all six safeguards are implemented and tested, account deletion remains a
documented placeholder rather than a partially safe destructive action.
