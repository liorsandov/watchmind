# WatchMind

WatchMind is a private, personal movie and TV recommendation application. This repository currently contains the production-oriented application foundation: a responsive shell, placeholder routes, validated environment access, Supabase clients, and a server-only TMDB client. Authentication, database migrations, rating workflows, and recommendation logic are intentionally not implemented yet.

## Stack

- Next.js App Router, React, and strict TypeScript
- Ant Design with SCSS modules and shared design tokens
- Supabase Auth and PostgreSQL (integration clients only at this stage)
- TMDB API (server-only integration)
- Vercel-ready Next.js deployment

## Requirements

- Node.js 20.9 or newer
- npm
- A Supabase project
- A TMDB API read access token

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in all required values in `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   TMDB_API_TOKEN=your-tmdb-read-access-token
   ```

   The Supabase URL and anon key are designed to be browser-visible and must still be protected by PostgreSQL Row Level Security. `TMDB_API_TOKEN` is private and is used only by server-only modules. Never expose a Supabase service-role key in a `NEXT_PUBLIC_` variable.

4. Start development:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Validation commands

```bash
npm run lint
npm run typecheck
npm run build
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
    providers/         Ant Design and future root providers
  config/              Validated environment access
  lib/
    supabase/           Browser and server Supabase clients
    tmdb/               Server-only TMDB gateway
  styles/              Global SCSS and design tokens
  types/               Shared domain, TMDB, and database types
```

## Integration conventions

- Use `getSupabaseBrowserClient()` only from Client Components.
- Use `createSupabaseServerClient()` from Server Components, Server Actions, or Route Handlers.
- Use `getTmdbClient()` only on the server; its module is guarded with `server-only`.
- Replace `src/types/database.ts` with Supabase-generated types after database migrations are introduced.
- Keep user-owned data in Supabase and protect every user-owned table with Row Level Security. Browser storage must never become the source of truth.

## Current scope

The navigation routes render informative placeholders. This foundation does not yet include sign-in, schema migrations, card swiping, title persistence, recommendation ranking, or watch-history behavior.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Before launch, add TMDB's required logo and the current attribution language to the appropriate public product surface.
