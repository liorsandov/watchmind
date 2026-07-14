-- The auth trigger only initializes users created after the application schema.
-- Backfill users who authenticated before the trigger was installed.
insert into public.profiles (id, display_name)
select
  id,
  nullif(trim(coalesce(raw_user_meta_data ->> 'full_name', '')), '')
from auth.users
on conflict (id) do nothing;

insert into public.user_preferences (user_id)
select id
from auth.users
on conflict (user_id) do nothing;
