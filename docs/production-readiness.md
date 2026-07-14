# Production readiness review

Review completed on 2026-07-14 against Tasks 9–11.

## Issues discovered and fixed

- Recommendation result persistence contradicted the database constraint: the engine stored a structured object while the column accepted arrays only. The final migration now accepts the documented object and failure shapes.
- The product routes for recommendations, watchlist, and history were placeholders. They now provide persisted sessions, impressions, feedback, editing, filtering, sorting, pagination, and return-state summaries.
- Replacement feedback could not be distinguished from a dislike. Dedicated `replaced` and `similar_requested` events now preserve that intent without changing taste classifications.
- History repositories truncated long-lived collections. The export and history loader now page through every user-owned interaction, event, recommendation session, and watch-progress row.
- The data export endpoint was not part of the proxy's protected path set. It is now denied to anonymous requests before route execution and still re-authenticates in the repository layer.
- The Discover integration lab was no longer an appropriate return experience. It is now a private welcome-back dashboard with saved/rated counts, profile confidence, preserved onboarding progress, and direct next actions.

## Validation evidence

- Strict TypeScript and ESLint pass.
- Twenty-one unit tests pass, including deterministic large-history scoring and watched, rejected, not-interested, duplicate, and incomplete-title exclusions.
- Supabase schema lint passes and all 23 pgTAP integration tests pass. The suite covers authenticated-role grants, RLS, anonymous denial, two-user isolation, duplicate prevention, immutable audit history, trigger behavior, and snapshot isolation.
- The Next.js 16.2.10 production build succeeds for all routes.
- Browser verification exercised account creation, authenticated navigation, recommendation generation, three recommendation slots, watchlist persistence, recommendation history, and current-user JSON export.
- Desktop (1280 px) and mobile (390 px) checks showed no horizontal overflow or framework error overlay. The mobile navigation, labeled controls, live status text, focus styles, image alternative text, and 24 px minimum visible interaction targets were reviewed.
- Export verification returned one user identity only and contained neither `access_token` nor `refresh_token` fields.

## Remaining risks

- TMDB availability and daily API quotas remain external dependencies. The UI degrades safely, but production should add request-level telemetry and quota alerts.
- Recommendation candidate collection performs several TMDB requests per generated session. A shared server-side candidate cache is the next performance improvement once real traffic patterns are known.
- The current genre filters use stable TMDB numeric identifiers when a live genre name is unavailable. Persisting the TMDB genre dictionary would improve offline labels.
- Accessibility was reviewed with automated DOM checks and keyboard-visible semantics, not a formal screen-reader study. Complete VoiceOver and NVDA passes before a broad public launch.
- The JSON export is assembled in memory. This is acceptable for MVP-sized private libraries; very large accounts should move to a streamed export job.
- No production observability vendor is configured yet. Add error reporting, Core Web Vitals, and database/API latency dashboards before inviting external users.

## Recommended next steps

1. Configure production Supabase redirect URLs, SMTP, Google OAuth, and deployment environment variables.
2. Add error and performance telemetry, including TMDB quota and latency monitoring.
3. Run a manual VoiceOver/NVDA pass and a production Lighthouse run using representative account data.
4. Add scheduled metadata refresh and a streamed export path when real library sizes justify them.

## Final MVP acceptance

The approved MVP scope is implemented. Authentication, private persistence, rating and undo, deterministic taste profiles, recommendation sessions and actions, watchlist/history management, return experience, and current-user export are present and validated. The remaining items above are deployment and scale hardening rather than blockers for the private MVP.
