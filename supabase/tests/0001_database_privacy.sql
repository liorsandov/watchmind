begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(23);

select is(
  (
    select count(*)::bigint
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'profiles',
        'content_items',
        'user_content_interactions',
        'user_content_interaction_events',
        'user_watch_progress',
        'user_preferences',
        'taste_profile_snapshots',
        'recommendation_sessions',
        'recommendation_events'
      )
  ),
  9::bigint,
  'all private recommendation tables exist'
);

select is(
  (
    select count(*)::bigint
    from pg_class
    join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public'
      and pg_class.relname in (
        'profiles',
        'content_items',
        'user_content_interactions',
        'user_content_interaction_events',
        'user_watch_progress',
        'user_preferences',
        'taste_profile_snapshots',
        'recommendation_sessions',
        'recommendation_events'
      )
      and pg_class.relrowsecurity
  ),
  9::bigint,
  'RLS is enabled on every application table'
);

select is(
  (
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'content_items',
        'user_content_interactions',
        'user_content_interaction_events',
        'user_watch_progress',
        'user_preferences',
        'taste_profile_snapshots',
        'recommendation_sessions',
        'recommendation_events'
      )
  ),
  25::bigint,
  'the expected explicit policies exist'
);

select is(
  (
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'content_items',
        'user_content_interactions',
        'user_content_interaction_events',
        'user_watch_progress',
        'user_preferences',
        'taste_profile_snapshots',
        'recommendation_sessions',
        'recommendation_events'
      )
      and roles <> array['authenticated'::name]
  ),
  0::bigint,
  'every application policy explicitly targets authenticated users'
);

select has_trigger(
  'auth',
  'users',
  'on_auth_user_created',
  'new auth users receive a private profile and preferences'
);

select has_trigger(
  'public',
  'user_content_interactions',
  'user_content_interactions_record_event',
  'interaction changes are copied to append-only history'
);

select has_index(
  'public',
  'user_content_interactions',
  'user_content_interactions_active_unique',
  'duplicate current interaction state is prevented'
);

select has_index(
  'public',
  'user_watch_progress',
  'user_watch_progress_active_unique',
  'duplicate watch-progress state is prevented'
);

select has_column(
  'public',
  'content_items',
  'runtime_minutes',
  'content metadata supports runtime preference signals'
);

select isnt(
  (
    select oid
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'upsert_content_item'
  ),
  null,
  'content metadata has a privileged cache upsert function'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'watchmind-user-a@example.invalid',
    '{"full_name":"User A"}'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'watchmind-user-b@example.invalid',
    '{"full_name":"User B"}'::jsonb
  );

insert into public.content_items (id, tmdb_id, media_type, title)
values
  (
    '30000000-0000-0000-0000-000000000003',
    900001,
    'movie',
    'Privacy Test Movie'
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    900002,
    'tv',
    'Privacy Test Series'
  );

select is(
  (
    select count(*)::bigint
    from public.profiles
    where id in (
      '10000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000002'
    )
  ),
  2::bigint,
  'the auth trigger created both profiles'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);

select is(
  (select count(*)::bigint from public.profiles),
  1::bigint,
  'user A can read only their own profile'
);

select throws_ok(
  $$
    insert into public.content_items (tmdb_id, media_type, title)
    values (900003, 'movie', 'Direct Metadata Write')
  $$,
  '42501',
  null,
  'authenticated users cannot directly insert shared content metadata'
);

select is(
  (
    select title
    from public.upsert_content_item(
      p_tmdb_id := 900003,
      p_media_type := 'movie',
      p_title := 'RPC Metadata Write'
    )
  ),
  'RPC Metadata Write',
  'authenticated users can cache validated content metadata through the function'
);

insert into public.user_content_interactions (
  id,
  user_id,
  content_id,
  interaction_type,
  rating,
  source
) values (
  '50000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000003',
  'watched_liked',
  9,
  'onboarding'
);

update public.user_content_interactions
set interaction_type = 'watched_neutral',
    rating = 6,
    source = 'history'
where id = '50000000-0000-0000-0000-000000000005';

insert into public.taste_profile_snapshots (
  user_id,
  algorithm_version,
  source_fingerprint,
  source_interaction_count,
  confidence,
  profile_snapshot
) values (
  '10000000-0000-0000-0000-000000000001',
  'deterministic-v1',
  'deterministic-v1:test',
  1,
  'low',
  '{"interactionCount":1}'::jsonb
);

select is(
  (
    select count(*)::bigint
    from public.user_content_interaction_events
    where interaction_id = '50000000-0000-0000-0000-000000000005'
  ),
  2::bigint,
  'create and change operations both preserve raw interaction history'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000002',
  true
);

select is(
  (select count(*)::bigint from public.user_content_interactions),
  0::bigint,
  'user B cannot read user A interactions'
);

select is(
  (select count(*)::bigint from public.user_content_interaction_events),
  0::bigint,
  'user B cannot read user A interaction history'
);

select is(
  (select count(*)::bigint from public.taste_profile_snapshots),
  0::bigint,
  'user B cannot read user A taste snapshots'
);

select throws_ok(
  $$
    insert into public.user_content_interactions (
      user_id,
      content_id,
      interaction_type,
      source
    ) values (
      '10000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000004',
      'interested',
      'discover'
    )
  $$,
  '42501',
  null,
  'user B cannot create state owned by user A'
);

select throws_ok(
  $$
    insert into public.user_content_interaction_events (
      user_id,
      content_id,
      action,
      interaction_type,
      source
    ) values (
      '20000000-0000-0000-0000-000000000002',
      '40000000-0000-0000-0000-000000000004',
      'created',
      'interested',
      'discover'
    )
  $$,
  '42501',
  null,
  'users cannot forge append-only interaction history'
);

update public.user_content_interactions
set rating = 1
where id = '50000000-0000-0000-0000-000000000005';

reset role;
set local search_path = public, extensions;

select is(
  (
    select rating
    from public.user_content_interactions
    where id = '50000000-0000-0000-0000-000000000005'
  ),
  6::smallint,
  'user B cannot update user A interaction state'
);

select has_index(
  'public',
  'content_items',
  'content_items_genre_ids_idx',
  'content metadata supports genre candidate queries'
);

select has_index(
  'public',
  'recommendation_sessions',
  'recommendation_sessions_user_generated_idx',
  'recommendation sessions support per-user recency queries'
);

select * from finish();
rollback;
