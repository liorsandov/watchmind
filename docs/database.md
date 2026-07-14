# Database and Privacy

## Schema decisions

The migration in `supabase/migrations` creates seven required product concepts
plus one append-only interaction audit table:

| Table | Purpose |
| --- | --- |
| `profiles` | One private profile and onboarding cursor per Auth user. |
| `content_items` | Minimal normalized TMDB metadata shared by authenticated users. |
| `user_content_interactions` | The unique current interaction for each user/title pair. |
| `user_content_interaction_events` | Immutable snapshots of every interaction create, change, and delete. |
| `user_watch_progress` | Unique current watch progress for each user/title pair. |
| `user_preferences` | One private taste/filter record per user. |
| `recommendation_sessions` | Versioned inputs and deterministic result snapshots. |
| `recommendation_events` | Append-only impressions and recommendation feedback. |

UUIDs are used for application identities. TMDB IDs remain positive big integers
and are unique together with media type so movie and TV namespaces cannot
collide. The cache intentionally excludes full cast, crew, video, image, and
provider payloads; later integrations can refresh the small normalized record.

Current-state tables use unique `(user_id, content_id)` constraints. This makes
upserts deterministic and prevents duplicate active ratings, watchlist state, or
watch progress. Interaction history is not overwritten: a restricted database
trigger creates an audit row whenever current state is created, changed, or
deleted.

## Privacy enforcement

Privacy has three independent layers:

1. Repository functions call `supabase.auth.getUser()` and derive `user_id` from
   the verified session rather than accepting it from application callers.
2. Every user-owned table has RLS enabled with separate operation policies that
   explicitly target `authenticated` and compare ownership to
   `(select auth.uid())`.
3. Table privileges prevent authenticated clients from directly mutating shared
   TMDB metadata or forging append-only interaction/recommendation history. A
   restricted `upsert_content_item` function is the single cache-write path for
   normalized public TMDB metadata.

The profile trigger is `security definer`, has an empty search path, uses fully
qualified object names, and is not executable by API roles. It creates the
profile and preferences after an `auth.users` insert. The interaction-history
trigger uses the same restrictions.

Deleting an Auth user cascades all private rows. Shared `content_items` remain
because they contain no user data. The application does not use a service-role
key for normal user operations.

## Validation

The pgTAP test at `supabase/tests/0001_database_privacy.sql` is transactional and
rolls back all fixtures. It checks:

- required tables, RLS enablement, policies, triggers, unique indexes, and query indexes;
- automatic profile creation for two synthetic users;
- user A can see their own profile and interaction history;
- user B cannot select or update user A's interaction;
- user B cannot insert a row owned by user A;
- authenticated users cannot insert forged audit events;
- interaction changes produce distinct raw history entries.

Run locally after Docker is available:

```bash
npm run db:start
npm run db:reset
npm run db:test
npm run db:lint
```

No seed data is installed. Real TMDB content belongs to Task 5, and test users
exist only inside the rolled-back pgTAP transaction.

## Assumptions and remaining integration work

- The Supabase project's PostgreSQL major version must match `supabase/config.toml`
  before applying migrations to a linked project.
- Task 4 will provide session refresh, protected layouts, and sign-in UI. The
  repositories already reject anonymous use, but no route calls them yet.
- Shared TMDB cache records are written through the restricted
  `upsert_content_item` function. Normal authenticated clients intentionally
  keep read-only direct table access.
- Local SQL execution requires Docker; static application verification does not.
