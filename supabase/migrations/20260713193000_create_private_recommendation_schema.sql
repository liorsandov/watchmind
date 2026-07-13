-- WatchMind private recommendation schema.
-- User-owned rows are protected with RLS and always derive ownership from auth.uid().

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  create type public.media_type as enum ('movie', 'tv');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.interaction_type as enum (
    'watched_liked',
    'watched_disliked',
    'watched_neutral',
    'interested',
    'not_interested',
    'skipped',
    'unsure'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.interaction_source as enum (
    'onboarding',
    'rate',
    'discover',
    'recommendation',
    'watchlist',
    'history',
    'import'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.interaction_event_action as enum (
    'created',
    'changed',
    'deleted'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.recommendation_session_status as enum (
    'generating',
    'ready',
    'failed'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.recommendation_event_type as enum (
    'impression',
    'opened',
    'saved',
    'dismissed',
    'rated'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 80),
  onboarding_step integer not null default 0 check (onboarding_step >= 0),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  tmdb_id bigint not null check (tmdb_id > 0),
  media_type public.media_type not null,
  title text not null check (char_length(title) between 1 and 500),
  original_title text check (original_title is null or char_length(original_title) <= 500),
  overview text,
  poster_path text check (poster_path is null or poster_path ~ '^/[A-Za-z0-9._/-]+$'),
  backdrop_path text check (backdrop_path is null or backdrop_path ~ '^/[A-Za-z0-9._/-]+$'),
  release_date date,
  original_language text check (original_language is null or char_length(original_language) between 2 and 10),
  genre_ids integer[] not null default '{}',
  popularity numeric(12, 4) check (popularity is null or popularity >= 0),
  vote_average numeric(4, 2) check (vote_average is null or vote_average between 0 and 10),
  vote_count integer check (vote_count is null or vote_count >= 0),
  metadata_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_items_tmdb_media_unique unique (tmdb_id, media_type)
);

create table if not exists public.user_content_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  content_id uuid not null references public.content_items (id) on delete restrict,
  interaction_type public.interaction_type not null,
  rating smallint check (rating is null or rating between 1 and 10),
  source public.interaction_source not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_content_interactions_active_unique unique (user_id, content_id),
  constraint user_content_interactions_rating_requires_watched check (
    rating is null
    or interaction_type in ('watched_liked', 'watched_disliked', 'watched_neutral')
  )
);

-- Append-only audit records preserve raw interaction history while the table above
-- remains an efficient projection of the user's current state.
create table if not exists public.user_content_interaction_events (
  id uuid primary key default gen_random_uuid(),
  interaction_id uuid references public.user_content_interactions (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  content_id uuid not null references public.content_items (id) on delete restrict,
  action public.interaction_event_action not null,
  interaction_type public.interaction_type not null,
  rating smallint check (rating is null or rating between 1 and 10),
  source public.interaction_source not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_watch_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  content_id uuid not null references public.content_items (id) on delete restrict,
  progress_percent numeric(5, 2) not null default 0 check (progress_percent between 0 and 100),
  last_season_number integer check (last_season_number is null or last_season_number >= 0),
  last_episode_number integer check (last_episode_number is null or last_episode_number >= 0),
  completed boolean not null default false,
  last_watched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_watch_progress_active_unique unique (user_id, content_id),
  constraint user_watch_progress_episode_pair check (
    (last_season_number is null and last_episode_number is null)
    or (last_season_number is not null and last_episode_number is not null)
  )
);

create table if not exists public.user_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  preferred_media_types public.media_type[] not null default array['movie', 'tv']::public.media_type[],
  preferred_languages text[] not null default '{}',
  preferred_genre_ids integer[] not null default '{}',
  excluded_genre_ids integer[] not null default '{}',
  include_adult boolean not null default false,
  minimum_release_year smallint check (
    minimum_release_year is null
    or minimum_release_year between 1870 and 2200
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_media_types_not_empty check (
    cardinality(preferred_media_types) > 0
  )
);

create table if not exists public.recommendation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  algorithm_version text not null check (char_length(algorithm_version) between 1 and 80),
  status public.recommendation_session_status not null default 'generating',
  input_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(input_snapshot) = 'object'),
  result_snapshot jsonb not null default '[]'::jsonb check (jsonb_typeof(result_snapshot) = 'array'),
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recommendation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recommendation_session_id uuid references public.recommendation_sessions (id) on delete set null,
  content_id uuid not null references public.content_items (id) on delete restrict,
  event_type public.recommendation_event_type not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_items_media_popularity_idx
  on public.content_items (media_type, popularity desc nulls last);
create index if not exists content_items_genre_ids_idx
  on public.content_items using gin (genre_ids);
create index if not exists content_items_metadata_updated_idx
  on public.content_items (metadata_updated_at);

create index if not exists user_content_interactions_user_history_idx
  on public.user_content_interactions (user_id, updated_at desc);
create index if not exists user_content_interactions_user_type_idx
  on public.user_content_interactions (user_id, interaction_type, updated_at desc);
create index if not exists user_content_interactions_content_idx
  on public.user_content_interactions (content_id);

create index if not exists user_interaction_events_user_history_idx
  on public.user_content_interaction_events (user_id, created_at desc);
create index if not exists user_interaction_events_user_content_idx
  on public.user_content_interaction_events (user_id, content_id, created_at desc);

create index if not exists user_watch_progress_user_recent_idx
  on public.user_watch_progress (user_id, last_watched_at desc nulls last);
create index if not exists user_watch_progress_user_completed_idx
  on public.user_watch_progress (user_id, completed, updated_at desc);

create index if not exists recommendation_sessions_user_generated_idx
  on public.recommendation_sessions (user_id, created_at desc);
create index if not exists recommendation_events_user_history_idx
  on public.recommendation_events (user_id, created_at desc);
create index if not exists recommendation_events_session_idx
  on public.recommendation_events (recommendation_session_id, created_at);
create index if not exists recommendation_events_user_content_idx
  on public.recommendation_events (user_id, content_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

create or replace function public.record_interaction_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_row public.user_content_interactions;
  event_action public.interaction_event_action;
begin
  if tg_op = 'UPDATE' and (
    old.interaction_type,
    old.rating,
    old.source
  ) is not distinct from (
    new.interaction_type,
    new.rating,
    new.source
  ) then
    return new;
  end if;

  if tg_op = 'DELETE' then
    source_row := old;
    event_action := 'deleted';
  else
    source_row := new;
    event_action := case when tg_op = 'INSERT' then 'created' else 'changed' end;
  end if;

  insert into public.user_content_interaction_events (
    interaction_id,
    user_id,
    content_id,
    action,
    interaction_type,
    rating,
    source
  ) values (
    case when tg_op = 'DELETE' then null else source_row.id end,
    source_row.user_id,
    source_row.content_id,
    event_action,
    source_row.interaction_type,
    source_row.rating,
    source_row.source
  );

  return source_row;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.record_interaction_event() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists content_items_set_updated_at on public.content_items;
create trigger content_items_set_updated_at
before update on public.content_items
for each row execute function public.set_updated_at();

drop trigger if exists user_content_interactions_set_updated_at on public.user_content_interactions;
create trigger user_content_interactions_set_updated_at
before update on public.user_content_interactions
for each row execute function public.set_updated_at();

drop trigger if exists user_content_interactions_record_event on public.user_content_interactions;
create trigger user_content_interactions_record_event
after insert or update or delete on public.user_content_interactions
for each row execute function public.record_interaction_event();

drop trigger if exists user_watch_progress_set_updated_at on public.user_watch_progress;
create trigger user_watch_progress_set_updated_at
before update on public.user_watch_progress
for each row execute function public.set_updated_at();

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

drop trigger if exists recommendation_sessions_set_updated_at on public.recommendation_sessions;
create trigger recommendation_sessions_set_updated_at
before update on public.recommendation_sessions
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.content_items enable row level security;
alter table public.user_content_interactions enable row level security;
alter table public.user_content_interaction_events enable row level security;
alter table public.user_watch_progress enable row level security;
alter table public.user_preferences enable row level security;
alter table public.recommendation_sessions enable row level security;
alter table public.recommendation_events enable row level security;

drop policy if exists "Authenticated users can read content metadata" on public.content_items;
create policy "Authenticated users can read content metadata"
on public.content_items for select
to authenticated
using (true);

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
on public.profiles for delete
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can read their own interactions" on public.user_content_interactions;
create policy "Users can read their own interactions"
on public.user_content_interactions for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own interactions" on public.user_content_interactions;
create policy "Users can create their own interactions"
on public.user_content_interactions for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own interactions" on public.user_content_interactions;
create policy "Users can update their own interactions"
on public.user_content_interactions for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own interactions" on public.user_content_interactions;
create policy "Users can delete their own interactions"
on public.user_content_interactions for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own interaction history" on public.user_content_interaction_events;
create policy "Users can read their own interaction history"
on public.user_content_interaction_events for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own watch progress" on public.user_watch_progress;
create policy "Users can read their own watch progress"
on public.user_watch_progress for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own watch progress" on public.user_watch_progress;
create policy "Users can create their own watch progress"
on public.user_watch_progress for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own watch progress" on public.user_watch_progress;
create policy "Users can update their own watch progress"
on public.user_watch_progress for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own watch progress" on public.user_watch_progress;
create policy "Users can delete their own watch progress"
on public.user_watch_progress for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own preferences" on public.user_preferences;
create policy "Users can read their own preferences"
on public.user_preferences for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own preferences" on public.user_preferences;
create policy "Users can create their own preferences"
on public.user_preferences for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own preferences" on public.user_preferences;
create policy "Users can update their own preferences"
on public.user_preferences for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own preferences" on public.user_preferences;
create policy "Users can delete their own preferences"
on public.user_preferences for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own recommendation sessions" on public.recommendation_sessions;
create policy "Users can read their own recommendation sessions"
on public.recommendation_sessions for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own recommendation sessions" on public.recommendation_sessions;
create policy "Users can create their own recommendation sessions"
on public.recommendation_sessions for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own recommendation sessions" on public.recommendation_sessions;
create policy "Users can update their own recommendation sessions"
on public.recommendation_sessions for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own recommendation events" on public.recommendation_events;
create policy "Users can read their own recommendation events"
on public.recommendation_events for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own recommendation events" on public.recommendation_events;
create policy "Users can create their own recommendation events"
on public.recommendation_events for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    recommendation_session_id is null
    or exists (
      select 1
      from public.recommendation_sessions as sessions
      where sessions.id = recommendation_session_id
        and sessions.user_id = (select auth.uid())
    )
  )
);

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.content_items from anon, authenticated;
revoke all on table public.user_content_interactions from anon, authenticated;
revoke all on table public.user_content_interaction_events from anon, authenticated;
revoke all on table public.user_watch_progress from anon, authenticated;
revoke all on table public.user_preferences from anon, authenticated;
revoke all on table public.recommendation_sessions from anon, authenticated;
revoke all on table public.recommendation_events from anon, authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select on table public.content_items to authenticated;
grant select, insert, update, delete on table public.user_content_interactions to authenticated;
grant select on table public.user_content_interaction_events to authenticated;
grant select, insert, update, delete on table public.user_watch_progress to authenticated;
grant select, insert, update, delete on table public.user_preferences to authenticated;
grant select, insert, update on table public.recommendation_sessions to authenticated;
grant select, insert on table public.recommendation_events to authenticated;

comment on table public.content_items is
  'Minimal normalized TMDB metadata shared by authenticated users; contains no user data.';
comment on table public.user_content_interaction_events is
  'Append-only audit history populated by the interaction trigger.';
comment on table public.recommendation_events is
  'Append-only recommendation feedback and impression history.';
