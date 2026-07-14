# WatchMind

WatchMind is a private, personal movie and TV recommendation application. It includes responsive rating and recommendation workflows, a private Supabase data layer, server-backed authentication, a typed server-only TMDB integration, persistent watchlist/history management, and current-user JSON export.

## Stack

- Next.js App Router, React, and strict TypeScript
- Tailwind CSS v4 with owned shadcn/ui primitives
- Supabase Auth and PostgreSQL
- TMDB API (server-only integration)
- Vercel-ready Next.js deployment

## Requirements

- Node.js 20.9 or newer
- npm
- Docker Desktop or another Docker-compatible runtime for local Supabase
- A Supabase project
- A TMDB API read access token or v3 API key

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start and migrate the local Supabase stack (requires Docker):

   ```bash
   npm run db:start
   npm run db:reset
   ```

   `npm run db:start` prints the local API URL and anon key. Hosted-project
   migrations can instead be applied through the Supabase CLI linking workflow.

3. Create the local environment file:

   ```bash
   cp .env.example .env.local
   ```

4. Fill in all required values in `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   TMDB_READ_ACCESS_TOKEN=your-tmdb-read-access-token
   # Or, instead of the read access token:
   # TMDB_API_KEY=your-tmdb-api-key
   ```

   The Supabase URL and anon key are designed to be browser-visible and must still be protected by PostgreSQL Row Level Security. `TMDB_READ_ACCESS_TOKEN`, `TMDB_API_KEY`, and the legacy `TMDB_API_TOKEN` alias are private and are used only by server-only modules. Never expose a Supabase service-role key in a `NEXT_PUBLIC_` variable.

5. Start development:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

### Configure authentication

Email magic links work automatically with the local Supabase email inbox at
[http://127.0.0.1:54324](http://127.0.0.1:54324). For a hosted project, add
your production `/auth/callback` URL to **Authentication → URL Configuration →
Redirect URLs** and configure an SMTP provider before production use.

Google sign-in also requires external provider setup:

1. Create Google OAuth web credentials and add the Supabase provider callback
   URL shown in **Authentication → Providers → Google** as an authorized redirect URI.
2. Add the Google client ID and secret to that Supabase provider. The secret
   belongs in Supabase, never in this repository or a browser environment variable.
3. Add the app's `https://your-domain.example/auth/callback` URL to the Supabase
   redirect allow-list.

See [`docs/authentication.md`](docs/authentication.md) for the session, route
protection, and future account-deletion design.

## Validation commands

```bash
npm run lint
npm run typecheck
npm run build
npm run db:test
npm run db:lint
```

Environment values are validated lazily with Zod when an integration client is first used. This keeps static placeholder routes buildable before credentials are provisioned while still failing clearly at the integration boundary.

## Project structure

```text
src/
  app/                 App Router routes and route-level states
  components/
    auth/              Login forms and account menu
    content/           Shared movie and TV presentation
    feedback/          Shared loading and error presentations
    layout/            Responsive application shell
    pages/             Temporary route placeholders
    ui/                Owned shadcn/ui primitives
  config/              Validated environment access
  lib/
    auth/                 Server auth guards and safe redirects
    repositories/         Authenticated, user-scoped data access
    supabase/           Browser and server Supabase clients
    tmdb/               Server-only TMDB gateway and normalization
  styles/              Tailwind theme and global styles
  types/               Shared domain, TMDB, and database types
```

## Integration conventions

- Use `getSupabaseBrowserClient()` only from Client Components.
- Use `createSupabaseServerClient()` from Server Components, Server Actions, or Route Handlers.
- Use `getTmdbClient()` only on the server; its module is guarded with `server-only`.
- Prefer `getTmdbService()` for normalized movie and TV data. Direct client
  access is reserved for adding service endpoints.
- Keep `src/types/database.ts` aligned with migrations. After starting the local
  stack, regenerate it with `npm run db:types > src/types/database.ts`.
- Keep user-owned data in Supabase and protect every user-owned table with Row Level Security. Browser storage must never become the source of truth.

The approved product and technical plan is documented in
[`docs/architecture.md`](docs/architecture.md).

## Database and privacy

The initial migration lives in `supabase/migrations`. Every application table
has RLS enabled. User-owned policies target only the `authenticated` role and
compare ownership to `auth.uid()`. Shared `content_items` rows expose only
normalized TMDB metadata and are read-only to normal authenticated clients;
server-side repositories cache them through a restricted database function.

Current interaction state is unique per user/title. A security-definer trigger
copies creates, changes, and deletes into an append-only audit table that users
can read but cannot forge. New auth users receive a profile and preference row
through a restricted trigger.

The transactional pgTAP suite under `supabase/tests` verifies schema structure,
RLS policy coverage, automatic profile creation, immutable history, duplicate
prevention, indexes, and two-user isolation. More detail is available in
[`docs/database.md`](docs/database.md).

## Current scope

All approved MVP tasks are implemented. Private routes provide a return dashboard,
touch/keyboard rating, a transparent taste profile, three-slot recommendation
sessions, persisted recommendation feedback, watchlist and history management,
and a user-scoped JSON export. See [`docs/production-readiness.md`](docs/production-readiness.md)
for validation evidence and remaining deployment risks.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. The
approved logo and notice currently appear on the Discover verification page;
retain them in a permanent About or Credits surface before launch. Integration
details are documented in [`docs/tmdb.md`](docs/tmdb.md).
