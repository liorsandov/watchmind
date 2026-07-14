-- Complete the recommendation and history workflows.

alter table public.recommendation_sessions
  drop constraint if exists recommendation_sessions_result_snapshot_check;

alter table public.recommendation_sessions
  add constraint recommendation_sessions_result_snapshot_check
  check (jsonb_typeof(result_snapshot) in ('array', 'object'));

alter type public.recommendation_event_type add value if not exists 'replaced';
alter type public.recommendation_event_type add value if not exists 'similar_requested';

create index if not exists recommendation_events_user_type_created_idx
  on public.recommendation_events (user_id, event_type, created_at desc);

comment on column public.recommendation_sessions.result_snapshot is
  'Immutable recommendation output or a structured failure payload.';
