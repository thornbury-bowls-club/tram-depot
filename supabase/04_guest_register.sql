-- =====================================================================
-- Thornbury Bowls Club · Guest register
-- Adds the guest sign-in register to the existing tram-depot project.
--
-- How to run: Supabase dashboard → SQL Editor → New query → paste this
-- whole file → Run. Safe to run again. Run it after 01_setup.sql.
--
-- What it does
--   • guest_visits: one row per guest sign-in (name required; email and
--     the club-news opt-in are optional). Date and time are added here,
--     not by the phone, so they can't be faked or wrong.
--   • Anyone with the link can ADD a row. Nobody can read, change or
--     delete rows from the public page.
--   • Tram Depot moderators can read and delete rows (register page,
--     or Table Editor in this dashboard).
--   • Optional: guests who tick "keep me posted" are added to a Brevo
--     contact list automatically (set brevo_guest_list_id below).
--   • Optional: rows older than N months are deleted nightly
--     (set guest_keep_months below).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------
create table if not exists public.guest_visits (
  id          bigint generated always as identity primary key,
  visited_at  timestamptz not null default now(),
  visit_date  date not null default (now() at time zone 'Australia/Melbourne')::date,
  guest_name  text not null check (length(btrim(guest_name)) between 2 and 100),
  email       text check (email is null or (length(email) <= 254 and email like '%_@_%.__%')),
  opt_in      boolean not null default false,
  check (not opt_in or email is not null)   -- can only opt in with an email
);

create index if not exists guest_visits_date_idx on public.guest_visits (visit_date desc, visited_at desc);

comment on table public.guest_visits is
  'Guest register (Liquor Control Reform Act 1998). Filled in from the guest sign-in page.';

-- ---------------------------------------------------------------------
-- 2. Tidy and protect each new row
-- ---------------------------------------------------------------------
create or replace function public.guest_visits_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- The server decides when the visit happened
  new.visited_at := now();
  new.visit_date := (now() at time zone 'Australia/Melbourne')::date;

  new.guest_name := regexp_replace(btrim(new.guest_name), '\s+', ' ', 'g');
  new.email      := nullif(lower(btrim(coalesce(new.email, ''))), '');
  new.opt_in     := coalesce(new.opt_in, false) and new.email is not null;

  -- Simple flood guard: more than 30 sign-ins in a minute is not a real crowd
  if (select count(*) from public.guest_visits where visited_at > now() - interval '1 minute') >= 30 then
    raise exception 'Too many sign-ins right now. Please try again in a minute.';
  end if;

  return new;
end $$;

drop trigger if exists guest_visits_before_insert on public.guest_visits;
create trigger guest_visits_before_insert before insert on public.guest_visits
  for each row execute function public.guest_visits_before_insert();

-- ---------------------------------------------------------------------
-- 3. Security rules
-- ---------------------------------------------------------------------
alter table public.guest_visits enable row level security;

drop policy if exists guest_visits_insert on public.guest_visits;
create policy guest_visits_insert on public.guest_visits for insert to anon, authenticated
  with check (true);   -- the column checks and trigger above do the validating

drop policy if exists guest_visits_read on public.guest_visits;
create policy guest_visits_read on public.guest_visits for select to authenticated
  using ((select public.is_moderator()));

drop policy if exists guest_visits_delete on public.guest_visits;
create policy guest_visits_delete on public.guest_visits for delete to authenticated
  using ((select public.is_moderator()));

revoke all on public.guest_visits from anon, authenticated;
grant insert (guest_name, email, opt_in) on public.guest_visits to anon, authenticated;
grant select, delete                     on public.guest_visits to authenticated;

-- ---------------------------------------------------------------------
-- 4. Settings (blank = switched off)
--    brevo_guest_list_id: the number of a Brevo contact list, e.g. '7'
--      (Brevo → Contacts → Lists → the ID column).
--    guest_keep_months: delete register rows older than this, e.g. '24'.
-- ---------------------------------------------------------------------
insert into public.app_settings (key, value) values
  ('brevo_guest_list_id', ''),
  ('guest_keep_months',   '')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 5. Opted-in guests → Brevo contact list (uses the Brevo key in Vault)
-- ---------------------------------------------------------------------
create or replace function public.guest_visits_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  api_key text;
  list_id text := nullif(btrim(coalesce(public.setting('brevo_guest_list_id'), '')), '');
  first_name text := split_part(new.guest_name, ' ', 1);
  last_name  text := nullif(btrim(substr(new.guest_name, length(split_part(new.guest_name, ' ', 1)) + 1)), '');
begin
  if not new.opt_in or new.email is null or list_id is null or list_id !~ '^\d+$' then
    return null;
  end if;
  select decrypted_secret into api_key from vault.decrypted_secrets where name = 'brevo_api_key' limit 1;
  if api_key is null then
    return null;
  end if;

  perform net.http_post(
    url     := 'https://api.brevo.com/v3/contacts',
    headers := jsonb_build_object('api-key', api_key, 'content-type', 'application/json', 'accept', 'application/json'),
    body    := jsonb_build_object(
                 'email', new.email,
                 'listIds', jsonb_build_array(list_id::int),
                 'updateEnabled', true,
                 'attributes', jsonb_strip_nulls(jsonb_build_object('FIRSTNAME', first_name, 'LASTNAME', last_name))));
  return null;
end $$;

drop trigger if exists guest_visits_after_insert on public.guest_visits;
create trigger guest_visits_after_insert after insert on public.guest_visits
  for each row execute function public.guest_visits_after_insert();

-- ---------------------------------------------------------------------
-- 6. Optional nightly clean-up of old rows
-- ---------------------------------------------------------------------
create or replace function public.guest_register_cleanup()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  months text := nullif(btrim(coalesce(public.setting('guest_keep_months'), '')), '');
  n integer := 0;
begin
  if months is null or months !~ '^\d+$' or months::int < 1 then
    return 0;   -- switched off: keep everything
  end if;
  delete from public.guest_visits where visit_date < (current_date - make_interval(months => months::int));
  get diagnostics n = row_count;
  return n;
end $$;

select cron.schedule('guest-register-cleanup', '45 17 * * *', 'select public.guest_register_cleanup()');  -- ~4:45am

-- ---------------------------------------------------------------------
-- 7. Quick check: the five most recent sign-ins
-- ---------------------------------------------------------------------
select visit_date, to_char(visited_at at time zone 'Australia/Melbourne', 'HH12:MI am') as time,
       guest_name, email, opt_in
from public.guest_visits order by visited_at desc limit 5;
