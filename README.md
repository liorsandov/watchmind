# WatchMind

WatchMind is a private, personal movie and TV recommendation application. This repository currently contains the production-oriented application foundation and private Supabase data layer: a responsive shell, placeholder routes, validated environment access, typed integration clients, versioned migrations, explicit Row Level Security policies, and authenticated repositories. Authentication screens, rating workflows, and recommendation logic are intentionally not implemented yet.

## Stack

- Next.js App Router, React, and strict TypeScript
- Tailwind CSS v4 with owned shadcn/ui primitives
- Supabase Auth and PostgreSQL (integration clients only at this stage)
- TMDB API (server-only integration)
- Vercel-ready Next.js deployment

## Requirements

- Node.js 20.9 or newer
- npm
- Docker Desktop or another Docker-compatible runtime for local Supabase
- A Supabase project
- A TMDB API read access token

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
   TMDB_API_TOKEN=your-tmdb-read-access-token
   ```

   The Supabase URL and anon key are designed to be browser-visible and must still be protected by PostgreSQL Row Level Security. `TMDB_API_TOKEN` is private and is used only by server-only modules. Never expose a Supabase service-role key in a `NEXT_PUBLIC_` variable.

5. Start development:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

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
    feedback/          Shared loading and error presentations
    layout/            Responsive application shell
    pages/             Temporary route placeholders
    ui/                Owned shadcn/ui primitives
  config/              Validated environment access
  lib/
    repositories/         Authenticated, user-scoped data access
    supabase/           Browser and server Supabase clients
    tmdb/               Server-only TMDB gateway
  styles/              Tailwind theme and global styles
  types/               Shared domain, TMDB, and database types
```

## Integration conventions

- Use `getSupabaseBrowserClient()` only from Client Components.
- Use `createSupabaseServerClient()` from Server Components, Server Actions, or Route Handlers.
- Use `getTmdbClient()` only on the server; its module is guarded with `server-only`.
- Keep `src/types/database.ts` aligned with migrations. After starting the local
  stack, regenerate it with `npm run db:types > src/types/database.ts`.
- Keep user-owned data in Supabase and protect every user-owned table with Row Level Security. Browser storage must never become the source of truth.

The approved product and technical plan is documented in
[`docs/architecture.md`](docs/architecture.md).

## Database and privacy

The initial migration lives in `supabase/migrations`. Every application table
has RLS enabled. User-owned policies target only the `authenticated` role and
compare ownership to `auth.uid()`. Shared `content_items` rows expose only
normalized TMDB metadata and are read-only to normal authenticated clients.

Current interaction state is unique per user/title. A security-definer trigger
copies creates, changes, and deletes into an append-only audit table that users
can read but cannot forge. New auth users receive a profile and preference row
through a restricted trigger.

The transactional pgTAP suite under `supabase/tests` verifies schema structure,
RLS policy coverage, automatic profile creation, immutable history, duplicate
prevention, indexes, and two-user isolation. More detail is available in
[`docs/database.md`](docs/database.md).

## Current scope

The navigation routes render informative placeholders. The schema and typed
repositories are ready, but the app does not yet include sign-in screens, card
swiping, TMDB persistence, recommendation ranking, or watch-history UI behavior.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Before launch, add TMDB's required logo and the current attribution language to the appropriate public product surface.
