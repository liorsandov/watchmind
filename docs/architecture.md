# WatchMind Product Architecture

Status: approved MVP plan for Tasks 2–10

## 1. Product scope

WatchMind is a private, single-user-per-account movie and TV discovery product. It learns from explicit title feedback, keeps the complete interaction history in Supabase, and produces deterministic recommendations that can explain which preferences contributed to a result.

The product includes:

- Email-based personal accounts and one private taste profile per account.
- A fast, one-title-at-a-time rating flow for movies and TV shows.
- Six explicit interactions: watched and liked, watched and disliked, watched and neutral, interested, not interested, and skipped/unsure.
- A private watchlist, interaction history, preference controls, and ranked recommendations.
- A normalized cache of the TMDB metadata required by the product.
- Persistent onboarding progress so a user can resume on another device or after a long absence.

The product explicitly excludes shared or household profiles, couples matching, social graphs, public ratings, comments, sharing, chat, streaming-provider playback, editorial publishing, collaborative filtering across users, and AI-owned recommendation state.

## 2. MVP definition

The MVP is complete when one authenticated user can:

1. Create an account, sign in, sign out, and recover a session.
2. Rate a varied onboarding queue and resume at the next unrated title.
3. Review and revise any saved interaction.
4. Add or remove interested titles from a private watchlist.
5. Receive a ranked list derived from their own interactions and preferences.
6. See a deterministic reason for each recommendation.
7. Return from another browser and recover the same profile, history, and recommendations.

The MVP does not require an AI API. Recommendation explanations are generated from stored scoring factors. An optional later AI layer may verbalize those factors but cannot read other users' data, change source records, or become the recommendation source of truth.

## 3. Main user journeys

### First visit and onboarding

The visitor lands on the product introduction, creates an account, confirms authentication, and enters the rating flow. WatchMind presents one unseen title at a time. Each response is persisted immediately and the server advances onboarding progress. After a minimum useful sample, the user can open initial recommendations while continuing to rate more titles.

### Returning user

The user signs in or resumes an existing session. The app loads the last server-side onboarding position, recent activity, watchlist, and recommendations. No browser-only state is required to continue.

### Rate and correct

The user responds by gesture, keyboard, or labeled buttons. The application records an immutable event and updates the current interaction projection in one transaction. From History, the user can change the current reaction without losing the earlier raw event.

### Discover and save

The user browses TMDB-backed discovery results, filters by movie or TV, and marks a title interested or not interested. Interested titles appear in the watchlist.

### Review recommendations

The user sees ranked, unseen candidates with a concise reason such as matching genres, languages, or related titles. They can save, dismiss, or rate a result. That feedback becomes an input to the next deterministic ranking.

### Manage privacy and preferences

The user adjusts content preferences, signs out, or requests account deletion/export. Settings explain that their profile is private and stored in Supabase.

## 4. Application routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Product introduction; redirects signed-in users to Discover when appropriate. |
| `/sign-in` | Public-only | Sign in and account recovery entry point. |
| `/sign-up` | Public-only | Account creation. |
| `/auth/callback` | Public | Supabase authentication callback. |
| `/discover` | Authenticated | Browse title candidates and open title details. |
| `/rate` | Authenticated | One-card rating and onboarding continuation. |
| `/recommendations` | Authenticated | Ranked recommendations and explanations. |
| `/watchlist` | Authenticated | Interested titles. |
| `/history` | Authenticated | Complete interaction history and corrections. |
| `/settings` | Authenticated | Account, content preferences, privacy, export, and deletion. |
| `/titles/[mediaType]/[tmdbId]` | Authenticated | Normalized title detail and interaction controls. |

Server Actions handle authenticated in-app mutations. Route Handlers are reserved for OAuth callbacks, external webhooks, or future public integration endpoints. Authentication is rechecked at every server data boundary; a Next.js proxy may refresh sessions or improve navigation but is never the sole authorization control.

## 5. Component architecture

```text
RootLayout (Server Component)
├── AppProviders (small Client Component boundary)
└── AppShell
    ├── PrimaryNavigation (interactive Client Component)
    └── Route page (Server Component by default)
        ├── PageHeader
        ├── Loading / Empty / Error state
        └── Feature components
            ├── TitleCard / TitlePoster / TitleMetadata
            ├── RatingDeck / ReactionControls / ProgressIndicator
            ├── RecommendationCard / RecommendationReason
            ├── WatchlistGrid
            ├── InteractionHistory
            └── PreferenceForm
```

Routes own data loading and authorization. Feature components receive typed data and expose narrow mutation callbacks. Browser-only gesture, drawer, and optimistic-interaction code is isolated in leaf Client Components. Shared primitives live under `components/ui`; feature components live under `features/<feature>` when introduced.

## 6. Backend architecture

- **Next.js server layer:** Server Components load authenticated views; Server Actions validate input, authenticate the user, and call domain services; Route Handlers support callback/webhook protocols.
- **Supabase Auth:** owns identity and browser/server sessions.
- **Supabase PostgreSQL:** source of truth for profiles, interactions, progress, preferences, recommendation sessions, and normalized content metadata.
- **Row Level Security:** enforces ownership for every user-scoped table even if application authorization has a defect.
- **TMDB gateway:** a server-only client owns authentication, retries, request shaping, caching, and normalization. The TMDB token is never sent to the browser.
- **Recommendation service:** a pure scoring module consumes a user taste snapshot and candidate metadata, returns score factors, and persists the resulting session for reproducibility.

Domain writes use validated commands and database transactions/RPCs where multiple records must remain consistent. UI code never writes arbitrary user IDs; ownership is derived from the authenticated JWT (`auth.uid()`).

## 7. Database entities

| Entity | Responsibility | Ownership |
| --- | --- | --- |
| `profiles` | Personal display settings and onboarding status keyed to `auth.users.id`. | User-owned |
| `content_items` | Shared normalized TMDB movie/TV metadata and refresh timestamps. | Shared read; service-controlled write |
| `user_content_interactions` | Current reaction for a user/title pair plus timestamps. | User-owned |
| `user_watch_progress` | Optional movie/episode progress and watched dates. | User-owned |
| `user_preferences` | Media types, languages, genres, content filters, and ranking controls. | User-owned |
| `recommendation_sessions` | Versioned scoring inputs, algorithm version, and generated candidate snapshot. | User-owned |
| `recommendation_events` | Immutable impressions, clicks, saves, dismissals, and reaction changes tied to a session. | User-owned |

Raw interaction history must be preserved. Task 3 should either add a dedicated append-only interaction event table or model immutable interaction events in `recommendation_events` with an explicit event kind; the current-state interaction row is a projection, not the audit log. Shared content rows contain no user-owned data.

Important keys and constraints include a unique `(tmdb_id, media_type)` content key, a unique `(user_id, content_item_id)` current interaction, foreign keys with deliberate delete behavior, constrained reaction/media/event enums, and indexes beginning with `user_id` for user-scoped access paths.

## 8. Authentication and privacy model

- Supabase Auth UUID is the only user identity used for ownership.
- Every user-owned row contains a non-null `user_id` referencing `auth.users(id)`.
- RLS is enabled and forced where supported. Select, insert, update, and delete policies require `user_id = auth.uid()`; insert checks use `WITH CHECK` as well as `USING` where applicable.
- Server code calls `getUser()` or equivalent verified-claims logic before sensitive reads and writes; it does not trust a request body, URL user ID, cookie value alone, or a proxy redirect.
- Service-role credentials are server-only and are not needed for ordinary user flows.
- Recommendation computations operate on one authenticated user's records. No cross-user taste vectors or collaborative filtering are part of the MVP.
- Logs and analytics avoid raw tokens, email addresses, free text, and full preference payloads. Error messages shown to clients are generic.
- Account deletion cascades or explicitly deletes all user-owned records. Shared TMDB cache records remain because they contain no personal data.

Privacy tests must cover two distinct users and verify that direct table access, guessed IDs, Server Actions, and route loaders cannot cross the ownership boundary.

## 9. TMDB integration strategy

All TMDB requests go through a typed, server-only gateway using the bearer token. The gateway will:

1. Support movie and TV endpoints while excluding people from mixed feeds.
2. Normalize differing fields (`title`/`name`, `release_date`/`first_air_date`) into one domain model.
3. Validate unexpected API payloads at the boundary before persistence.
4. Cache public discovery/configuration responses for a short, explicit interval; never mix user data into shared caches.
5. Upsert the metadata needed to reproduce interaction history even if TMDB content changes later.
6. Handle timeouts, 401/404/429/5xx responses, and bounded retry/backoff without leaking the token.
7. Record TMDB IDs, media type, metadata refresh time, and image paths rather than copying images.

The UI uses `next/image` with the configured `image.tmdb.org` allowlist. Before public launch, the product must include current TMDB attribution and logo requirements and must review TMDB's current terms.

## 10. Recommendation-system strategy

The first engine is a deterministic content-based scorer, versioned so results can be reproduced and tested.

1. Convert explicit reactions into signed weights, for example liked `+3`, interested `+1`, neutral `0`, skipped `0`, not interested `-2`, and disliked `-3`.
2. Aggregate those weights over normalized features such as genres, keywords, language, media type, release era, and selected cast/crew signals. Apply shrinkage so one interaction cannot dominate a profile.
3. Generate a sufficiently broad candidate pool from TMDB discovery and related-title endpoints.
4. Exclude already watched, disliked, dismissed, or otherwise ineligible titles; apply explicit user filters before scoring.
5. Score each candidate from weighted feature affinity, TMDB quality/confidence, freshness, and a bounded diversity/novelty term.
6. Diversify the final list to avoid near-duplicate genres or franchises.
7. Persist the algorithm version, candidate score, ordered factor contributions, and resulting rank in a recommendation session.

The same factor contributions produce explanations such as “because you liked science-fiction dramas” without an LLM. Unit tests use fixed taste vectors and fixtures to assert exclusions, ordering, tie-breaking, diversity, cold-start behavior, and stable explanations. A later AI explainer may receive only the selected title and precomputed factors and must return presentation text, not a new score.

## 11. Data persistence and backup strategy

- Every meaningful interaction is written to Supabase before the UI treats it as durable. Optimistic UI must roll back or show a retry state on failure.
- Browser storage may cache non-sensitive presentation preferences or pending UI state, but it is never authoritative.
- Immutable events preserve the original action history; current-state tables make normal reads efficient.
- Recommendation sessions store algorithm version and inputs/factors needed for audit and debugging.
- Use Supabase managed backups/PITR according to the production plan, verify retention before launch, and periodically test restoration into a non-production project.
- Database migrations are version-controlled and applied consistently across local, preview, and production environments.
- Add user export and account deletion workflows before production readiness is complete.

## 12. Risks and technical decisions

| Risk / decision | Resolution |
| --- | --- |
| Sparse cold-start data | Seed with diverse popular titles, require a modest onboarding sample, and blend a transparent popularity prior that decays as feedback grows. |
| Popularity bias and repetitive results | Cap popularity contribution and add deterministic diversity constraints. |
| Accidental cross-user access | RLS plus application-layer authorization plus two-user integration tests; never accept ownership IDs from clients. |
| TMDB limits, downtime, or metadata drift | Server-only caching, normalized persisted metadata, timeouts, bounded retries, and graceful stale data. |
| Gesture accessibility | Every swipe outcome has a labeled button and keyboard equivalent; gestures are optional. |
| Lost events during rapid rating | Idempotency keys or a transactional write, disabled duplicate submission, clear retry state, and immutable event capture. |
| Recommendation changes are hard to debug | Persist algorithm version and factor-level scores; keep scorer pure and fixture-tested. |
| Overengineering early | Use one Next.js application and one Supabase project; defer queues, vector databases, microservices, and AI APIs until measured need. |
| Framework/API drift | Follow the repository-pinned Next.js documentation and deprecation notices before each implementation phase. |

## 13. Step-by-step implementation phases

1. **Architecture:** approve scope, boundaries, routes, privacy, data, ranking, and acceptance criteria (this document).
2. **Foundation:** strict TypeScript, styling/UI primitives, responsive shell, routes, validated environment access, lazy Supabase clients, server-only TMDB gateway, shared types, route states, and setup documentation.
3. **Database and privacy:** migrations, constraints, RLS policies, generated types, seed fixtures, and two-user privacy tests.
4. **Authentication:** sign-up/in/out, callback, session refresh proxy if needed, protected route/data checks, recovery, and auth tests.
5. **TMDB integration:** schema validation, normalization, caching, search/discovery, metadata persistence, errors, and attribution.
6. **Rating flow:** accessible card deck, all six reactions, immediate durable writes, undo/correction, progress, and resume behavior.
7. **Taste profile:** pure weighted aggregation with confidence/shrinkage and inspectable user preference summaries.
8. **Recommendation engine:** candidate generation, exclusions, deterministic scoring, diversity, saved sessions, factors, and fixture tests.
9. **Recommendation experience:** ranked UI, reasons, title details, save/dismiss/rate actions, empty/loading/error states.
10. **History and persistence:** searchable history, revisions, watchlist, progress, export/deletion, and cross-device/resume tests.
11. **Production readiness:** security/privacy review, accessibility, observability, performance, backups/restore drill, TMDB compliance, CI, and Vercel deployment checks.

Each phase must finish with lint, strict type checking, relevant tests, and a production build, and should be committed independently.

## 14. MVP acceptance criteria

- A new user can create and access exactly one private profile.
- Two-user automated tests prove neither user can select, insert, update, or delete the other's personal rows.
- All six rating outcomes are available by labeled controls; core actions are keyboard accessible.
- A completed rating is stored in Supabase, reflected in history, and recovered on a second device/session.
- Reloading or returning after a long absence resumes onboarding and retains watchlist, preferences, ratings, and history without relying on `localStorage`.
- Current interaction state can be corrected while the earlier raw interaction event remains available.
- Recommendations exclude ineligible titles, are deterministically ordered for fixed inputs, include stored factor-level reasons, and require no AI API.
- TMDB credentials never enter client bundles or logs, and required attribution is present before launch.
- Invalid environment configuration fails with a clear validation error at the integration boundary.
- Core routes have responsive desktop/mobile navigation and meaningful loading, empty, and error states.
- Account deletion removes all user-owned data; an export path exists before production launch.
- Lint, strict type checking, automated tests, and the production build pass in CI.

## Existing repository audit

The repository already contains a coherent Next.js 16 App Router starter rather than the default create-next-app screen. Reusable pieces include the `src/app` route skeleton, strict TypeScript configuration, Supabase SSR dependencies, a lazy server-only TMDB client, environment schemas, shared media types, global error/loading states, and a responsive shell concept.

The foundation predates this approved plan in a few respects. It uses Ant Design and SCSS even though the task calls for Tailwind CSS and shadcn/ui, makes broad page components Client Components solely for UI-library use, and has no architecture record. Task 2 will retain the useful route and integration boundaries while replacing the conflicting UI foundation. Generated `.next`, `.vercel`, `.env.local`, and TypeScript build artifacts are local/ignored and are not product source. No legacy Pages Router, production business logic, database migration, authentication flow, or obsolete starter page needs to be preserved.
