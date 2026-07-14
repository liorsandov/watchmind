-- Allow the application to cache normalized public TMDB metadata without
-- granting direct table mutation privileges to browser clients.

create or replace function public.upsert_content_item(
  p_tmdb_id bigint,
  p_media_type public.media_type,
  p_title text,
  p_original_title text default null,
  p_overview text default null,
  p_poster_path text default null,
  p_backdrop_path text default null,
  p_release_date date default null,
  p_original_language text default null,
  p_genre_ids integer[] default '{}',
  p_popularity numeric default null,
  p_vote_average numeric default null,
  p_vote_count integer default null,
  p_runtime_minutes integer default null
)
returns public.content_items
language sql
security definer
set search_path = ''
as $$
  insert into public.content_items (
    tmdb_id,
    media_type,
    title,
    original_title,
    overview,
    poster_path,
    backdrop_path,
    release_date,
    original_language,
    genre_ids,
    popularity,
    vote_average,
    vote_count,
    runtime_minutes,
    metadata_updated_at
  )
  values (
    p_tmdb_id,
    p_media_type,
    p_title,
    p_original_title,
    p_overview,
    p_poster_path,
    p_backdrop_path,
    p_release_date,
    p_original_language,
    coalesce(p_genre_ids, '{}'),
    p_popularity,
    p_vote_average,
    p_vote_count,
    p_runtime_minutes,
    statement_timestamp()
  )
  on conflict (tmdb_id, media_type) do update
  set
    title = excluded.title,
    original_title = excluded.original_title,
    overview = excluded.overview,
    poster_path = excluded.poster_path,
    backdrop_path = excluded.backdrop_path,
    release_date = excluded.release_date,
    original_language = excluded.original_language,
    genre_ids = excluded.genre_ids,
    popularity = excluded.popularity,
    vote_average = excluded.vote_average,
    vote_count = excluded.vote_count,
    runtime_minutes = excluded.runtime_minutes,
    metadata_updated_at = excluded.metadata_updated_at
  returning *;
$$;

revoke all on function public.upsert_content_item(
  bigint,
  public.media_type,
  text,
  text,
  text,
  text,
  text,
  date,
  text,
  integer[],
  numeric,
  numeric,
  integer,
  integer
) from public, anon, authenticated;

grant execute on function public.upsert_content_item(
  bigint,
  public.media_type,
  text,
  text,
  text,
  text,
  text,
  date,
  text,
  integer[],
  numeric,
  numeric,
  integer,
  integer
) to authenticated;

comment on function public.upsert_content_item(
  bigint,
  public.media_type,
  text,
  text,
  text,
  text,
  text,
  date,
  text,
  integer[],
  numeric,
  numeric,
  integer,
  integer
) is
  'Privileged path for caching normalized public TMDB metadata used by user interactions.';
