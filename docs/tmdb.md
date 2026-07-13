# TMDB integration

WatchMind fetches TMDB metadata only from server-only modules. The API read
access token is validated through `getServerEnv()` and is sent as a bearer token
from `src/lib/tmdb/client.ts`; it is never serialized into Client Component
props or exposed through a `NEXT_PUBLIC_` environment variable.

## Service behavior

`TmdbService` supports weekly trending movies and TV shows, popular movies and
TV shows, multi-search, movie details, TV details, and both genre lists. External
responses are validated before being normalized into the shared `ContentItem`
model. Movies and TV shows therefore use the same UI contract while retaining
their `(tmdbId, mediaType)` identity.

The model handles absent titles, dates, overviews, poster/backdrop paths,
languages, votes, runtimes, and episode runtimes. TMDB image paths must match a
restricted path pattern before the official image CDN URL is constructed.

Next.js fetch caching is configured by data volatility:

| Data | Revalidation |
| --- | ---: |
| Search | 15 minutes |
| Trending and popular lists | 30 minutes |
| Title details | 6 hours |
| Genres | 24 hours |

All requests are tagged with `tmdb` plus a resource-specific tag for later
on-demand invalidation. Requests time out after 10 seconds and return a safe,
typed error without leaking response internals or credentials.

## Selective persistence

Discovery, trending, popular, details, genres, and search are read-through API
operations and never copy catalog results into Supabase. `toContentItemInsert()`
defines the minimal cache row for later interaction and recommendation
transactions. Those later workflows are the only places allowed to persist a
title.

The database has a unique `(tmdb_id, media_type)` constraint. Future persistence
must use that external identity for conflict-safe upserts, so repeated
interactions cannot create duplicate shared metadata rows. Runtime and generated
image URLs are intentionally not copied into the current database cache.

## Attribution

The temporary Discover integration lab includes an approved TMDB logo linking
to The Movie Database and the required notice:

> This product uses the TMDB API but is not endorsed or certified by TMDB.

The attribution should remain in an About or Credits surface when the temporary
verification page is replaced by the production discovery experience.
