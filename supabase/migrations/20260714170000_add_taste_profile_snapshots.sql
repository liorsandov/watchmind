-- Deterministic taste profiles derived from raw user interactions.
-- Snapshots are immutable for a given source fingerprint; raw interactions
-- remain the only source of truth and can always recreate these rows.

alter table public.content_items
  add column if not exists runtime_minutes integer
  check (runtime_minutes is null or runtime_minutes between 1 and 1440);

create table if not exists public.taste_profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  algorithm_version text not null check (char_length(algorithm_version) between 1 and 80),
  source_fingerprint text not null check (char_length(source_fingerprint) between 1 and 160),
  source_interaction_count integer not null check (source_interaction_count >= 0),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  profile_snapshot jsonb not null check (jsonb_typeof(profile_snapshot) = 'object'),
  calculated_at timestamptz not null default now(),
  constraint taste_profile_snapshots_source_unique
    unique (user_id, source_fingerprint)
);

create index if not exists taste_profile_snapshots_user_latest_idx
  on public.taste_profile_snapshots (user_id, calculated_at desc);

alter table public.taste_profile_snapshots enable row level security;

drop policy if exists "Users can read their own taste snapshots"
  on public.taste_profile_snapshots;
create policy "Users can read their own taste snapshots"
on public.taste_profile_snapshots for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own taste snapshots"
  on public.taste_profile_snapshots;
create policy "Users can create their own taste snapshots"
on public.taste_profile_snapshots for insert
to authenticated
with check ((select auth.uid()) = user_id);

revoke all on table public.taste_profile_snapshots from anon, authenticated;
grant select, insert on table public.taste_profile_snapshots to authenticated;

comment on table public.taste_profile_snapshots is
  'Immutable derived taste profiles; raw user interactions remain the source of truth.';
