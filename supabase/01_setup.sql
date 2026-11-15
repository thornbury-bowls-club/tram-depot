-- =====================================================================
-- The Tram Depot  ·  Thornbury Bowls Club Marketplace
-- Database set-up script for Supabase
--
-- How to run: Supabase dashboard → SQL Editor → New query → paste this
-- whole file → Run. It is safe to run again; it updates what exists.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensions (scheduled jobs, outbound web requests for email)
-- ---------------------------------------------------------------------
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- ---------------------------------------------------------------------
-- 1. Settings
-- ---------------------------------------------------------------------
create table if not exists public.app_settings (
  key   text primary key,
  value text not null
);

insert into public.app_settings (key, value) values
  ('site_url',     'https://tram-depot.pages.dev'),
  ('project_url',  'https://voaezublshumlcszutgo.supabase.co'),
  ('sender_email', 'depot@thornburybowls.com.au'),
  ('sender_name',  'The Tram Depot')
on conflict (key) do nothing;

create or replace function public.setting(p_key text)
returns text language sql stable security definer set search_path = '' as $$
  select value from public.app_settings where key = p_key
$$;

-- ---------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------

-- "Jo Sutherland" -> "Jo S."
create or replace function public.short_name(full_name text)
returns text language plpgsql immutable set search_path = '' as $$
declare parts text[] := regexp_split_to_array(btrim(coalesce(full_name, '')), '\s+');
begin
  if coalesce(array_length(parts, 1), 0) = 0 or parts[1] = '' then return 'Member'; end if;
  if array_length(parts, 1) = 1 then return parts[1]; end if;
  return parts[1] || ' ' || upper(left(parts[array_length(parts, 1)], 1)) || '.';
end $$;

create or replace function public.html_escape(t text)
returns text language sql immutable set search_path = '' as $$
  select replace(replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;')
$$;

-- ---------------------------------------------------------------------
-- 3. Members
-- ---------------------------------------------------------------------
create table if not exists public.members (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique check (email = lower(btrim(email)) and email like '%_@_%.__%'),
  full_name    text not null check (length(btrim(full_name)) between 1 and 100),
  display_name text generated always as (public.short_name(full_name)) stored,
  role         text not null default 'member' check (role in ('member', 'moderator')),
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Current signed-in member (null if not signed in, not a member, or removed)
create or replace function public.me()
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.members
  where email = lower(coalesce(auth.jwt() ->> 'email', '')) and active
$$;

create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.members
                 where email = lower(coalesce(auth.jwt() ->> 'email', '')) and active)
$$;

create or replace function public.is_moderator()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.members
                 where email = lower(coalesce(auth.jwt() ->> 'email', '')) and active and role = 'moderator')
$$;

create or replace function public.members_before_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.email := lower(btrim(new.email));
  new.full_name := btrim(new.full_name);
  new.updated_at := now();
  if tg_op = 'UPDATE'
     and old.role = 'moderator' and old.active
     and (new.role <> 'moderator' or not new.active)
     and not exists (select 1 from public.members m
                     where m.role = 'moderator' and m.active and m.id <> old.id) then
    raise exception 'The Depot needs at least one active moderator.';
  end if;
  return new;
end $$;

drop trigger if exists members_before_write on public.members;
create trigger members_before_write before insert or update on public.members
  for each row execute function public.members_before_write();

-- ---------------------------------------------------------------------
-- 4. Listings
-- ---------------------------------------------------------------------
create table if not exists public.listings (
  id               uuid primary key default gen_random_uuid(),
  seller_id        uuid not null default public.me() references public.members (id) on delete restrict,
  seller_name      text not null default '',
  section          text not null check (section in ('market', 'bowlers', 'social')),
  category         text not null,
  type             text not null default 'sale' check (type in ('sale', 'wanted')),
  price_type       text check (price_type in ('amount', 'free', 'offers')),
  price            numeric(10, 2),
  title            text not null check (length(btrim(title)) between 1 and 80),
  description      text not null check (length(btrim(description)) between 1 and 1500),
  event_at         timestamptz,
  spots            smallint check (spots between 1 and 12),
  position         text check (position in ('Any', 'Lead', 'Second', 'Third', 'Skip')),
  location         text check (length(location) <= 100),
  status           text not null default 'active' check (status in ('active', 'sold', 'hidden')),
  sold_at          timestamptz,
  expires_at       timestamptz not null default now() + interval '30 days',
  reminder_sent_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint listing_category check (
       (section = 'market'  and category in ('bowls', 'food', 'furniture', 'craft', 'services', 'other'))
    or (section = 'bowlers' and category in ('socialbowls', 'tournament'))
    or (section = 'social'  and category = 'social')),
  constraint listing_market_fields check (
    section <> 'market' or (
      event_at is null and price_type is not null
      and ((price_type = 'amount') = (price is not null and price > 0 and price < 100000))
      and (price_type = 'amount' or price is null))),
  constraint listing_event_fields check (
    section = 'market' or (event_at is not null and type = 'sale' and price_type is null and price is null)),
  constraint listing_bowlers_fields check (
    section = 'bowlers' or (spots is null and position is null))
);

create index if not exists listings_browse_idx on public.listings (section, status, expires_at);
create index if not exists listings_seller_idx on public.listings (seller_id);

create or replace function public.listings_before_write()
returns trigger language plpgsql set search_path = '' as $$
declare
  is_mod boolean := public.is_moderator();
  from_api boolean := current_user in ('authenticated', 'anon');
begin
  new.updated_at := now();

  if tg_op = 'INSERT' then
    new.seller_name := coalesce((select display_name from public.members where id = new.seller_id), 'Member');
    new.created_at := now();
    if from_api then
      new.status := 'active';
      new.sold_at := null;
      new.reminder_sent_at := null;
    end if;
  else
    if from_api then
      new.seller_id := old.seller_id;
      new.seller_name := old.seller_name;
      new.created_at := old.created_at;
      new.section := old.section;
      new.reminder_sent_at := case when new.expires_at is distinct from old.expires_at then null else old.reminder_sent_at end;
      if not is_mod and (new.status = 'hidden') <> (old.status = 'hidden') then
        raise exception 'Only a moderator can hide or restore a listing.';
      end if;
    end if;
  end if;

  -- Sold / found bookkeeping
  if new.status = 'sold' and (tg_op = 'INSERT' or old.status <> 'sold') then
    new.sold_at := now();
  elsif new.status <> 'sold' then
    new.sold_at := null;
  end if;

  -- Expiry rules
  if new.section = 'market' then
    if from_api and (tg_op = 'INSERT' or new.expires_at is distinct from old.expires_at) then
      if new.expires_at > now() + interval '366 days' then
        raise exception 'A listing can run for at most 12 months.';
      elsif new.expires_at < now() + interval '1 hour' then
        raise exception 'Choose an expiry date in the future.';
      end if;
    end if;
  else
    -- Event posts come down at the end of the day after the event (Melbourne time)
    new.expires_at := (((new.event_at at time zone 'Australia/Melbourne')::date + 2)::timestamp)
                      at time zone 'Australia/Melbourne';
    if from_api and (tg_op = 'INSERT' or new.event_at is distinct from old.event_at)
       and new.event_at < now() - interval '12 hours' then
      raise exception 'Choose an event date that hasn''t passed.';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists listings_before_write on public.listings;
create trigger listings_before_write before insert or update on public.listings
  for each row execute function public.listings_before_write();

-- ---------------------------------------------------------------------
-- 5. Photos (files live in the private "photos" storage bucket)
-- ---------------------------------------------------------------------
create table if not exists public.photos (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  path       text not null,          -- full-size image
  thumb_path text not null,          -- small image for the browse grid
  position   smallint not null check (position between 0 and 3),
  created_at timestamptz not null default now(),
  unique (listing_id, position)
);
create index if not exists photos_listing_idx on public.photos (listing_id);

-- Files of deleted photos are queued here and removed from storage hourly
create table if not exists public.storage_trash (
  path      text primary key,
  queued_at timestamptz not null default now()
);

create or replace function public.photos_after_delete()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.storage_trash (path) values (old.path), (old.thumb_path) on conflict do nothing;
  return old;
end $$;

drop trigger if exists photos_after_delete on public.photos;
create trigger photos_after_delete after delete on public.photos
  for each row execute function public.photos_after_delete();

-- ---------------------------------------------------------------------
-- 6. Questions (public Q&A)
-- ---------------------------------------------------------------------
create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings (id) on delete cascade,
  asker_id    uuid not null default public.me() references public.members (id) on delete restrict,
  asker_name  text not null default '',
  body        text not null check (length(btrim(body)) between 1 and 300),
  answer      text check (length(btrim(answer)) between 1 and 1000),
  answered_at timestamptz,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists questions_listing_idx on public.questions (listing_id);

create or replace function public.questions_before_write()
returns trigger language plpgsql set search_path = '' as $$
declare
  from_api boolean := current_user in ('authenticated', 'anon');
  is_mod boolean := public.is_moderator();
  is_owner boolean;
begin
  if tg_op = 'INSERT' then
    new.asker_name := coalesce((select display_name from public.members where id = new.asker_id), 'Member');
    new.created_at := now();
    if from_api then
      new.answer := null;
      new.answered_at := null;
      new.hidden := false;
    end if;
    return new;
  end if;

  if from_api then
    select l.seller_id = public.me() into is_owner from public.listings l where l.id = old.listing_id;
    new.listing_id := old.listing_id;
    new.asker_id := old.asker_id;
    new.asker_name := old.asker_name;
    new.body := old.body;
    new.created_at := old.created_at;
    if not coalesce(is_owner, false) then
      new.answer := old.answer;
    end if;
    if not is_mod then
      new.hidden := old.hidden;
    end if;
  end if;

  if new.answer is distinct from old.answer then
    new.answered_at := case when new.answer is null then null else now() end;
  end if;
  return new;
end $$;

drop trigger if exists questions_before_write on public.questions;
create trigger questions_before_write before insert or update on public.questions
  for each row execute function public.questions_before_write();

-- ---------------------------------------------------------------------
-- 7. Reports (members flag a listing for the moderators)
-- ---------------------------------------------------------------------
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings (id) on delete cascade,
  reporter_id uuid not null default public.me() references public.members (id) on delete restrict,
  reason      text not null default 'No reason given' check (length(reason) <= 300),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists reports_listing_idx on public.reports (listing_id);

-- ---------------------------------------------------------------------
-- 8. Security rules (row level security)
-- ---------------------------------------------------------------------
alter table public.app_settings  enable row level security;
alter table public.members       enable row level security;
alter table public.listings      enable row level security;
alter table public.photos        enable row level security;
alter table public.questions     enable row level security;
alter table public.reports       enable row level security;
alter table public.storage_trash enable row level security;   -- no policies: not reachable from the website

-- Settings: readable by members
drop policy if exists settings_read on public.app_settings;
create policy settings_read on public.app_settings for select to authenticated
  using ((select public.is_member()));

-- Members: you see your own record; moderators see and manage everyone
drop policy if exists members_read on public.members;
create policy members_read on public.members for select to authenticated
  using (email = lower(coalesce((select auth.jwt() ->> 'email'), '')) or (select public.is_moderator()));

drop policy if exists members_insert on public.members;
create policy members_insert on public.members for insert to authenticated
  with check ((select public.is_moderator()));

drop policy if exists members_update on public.members;
create policy members_update on public.members for update to authenticated
  using ((select public.is_moderator())) with check ((select public.is_moderator()));

-- Listings
drop policy if exists listings_read on public.listings;
create policy listings_read on public.listings for select to authenticated
  using (
    (select public.is_member()) and (
         seller_id = (select public.me())
      or (select public.is_moderator())
      or (status = 'active' and expires_at > now())
      or (status = 'sold' and sold_at > now() - interval '3 days')
    ));

drop policy if exists listings_insert on public.listings;
create policy listings_insert on public.listings for insert to authenticated
  with check ((select public.is_member()) and seller_id = (select public.me()));

drop policy if exists listings_update on public.listings;
create policy listings_update on public.listings for update to authenticated
  using (seller_id = (select public.me()) or (select public.is_moderator()))
  with check (seller_id = (select public.me()) or (select public.is_moderator()));

drop policy if exists listings_delete on public.listings;
create policy listings_delete on public.listings for delete to authenticated
  using (seller_id = (select public.me()) or (select public.is_moderator()));

-- Photos: visible when the listing is visible; managed by the listing's owner (or a moderator)
drop policy if exists photos_read on public.photos;
create policy photos_read on public.photos for select to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id));

drop policy if exists photos_insert on public.photos;
create policy photos_insert on public.photos for insert to authenticated
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = (select public.me()))
              and split_part(path, '/', 1) = (select public.me())::text
              and split_part(thumb_path, '/', 1) = (select public.me())::text);

drop policy if exists photos_update on public.photos;
create policy photos_update on public.photos for update to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = (select public.me())));

drop policy if exists photos_delete on public.photos;
create policy photos_delete on public.photos for delete to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id
                 and (l.seller_id = (select public.me()) or (select public.is_moderator()))));

-- Questions
drop policy if exists questions_read on public.questions;
create policy questions_read on public.questions for select to authenticated
  using (
    exists (select 1 from public.listings l where l.id = listing_id)
    and (not hidden
         or (select public.is_moderator())
         or exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = (select public.me()))));

drop policy if exists questions_insert on public.questions;
create policy questions_insert on public.questions for insert to authenticated
  with check (
    asker_id = (select public.me())
    and exists (select 1 from public.listings l
                where l.id = listing_id and l.status = 'active' and l.expires_at > now()
                  and l.seller_id <> (select public.me())));

drop policy if exists questions_update on public.questions;
create policy questions_update on public.questions for update to authenticated
  using ((select public.is_moderator())
         or exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = (select public.me())));

drop policy if exists questions_delete on public.questions;
create policy questions_delete on public.questions for delete to authenticated
  using ((select public.is_moderator()));

-- Reports: any member can report a listing they can see; only moderators read them
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = (select public.me())
              and exists (select 1 from public.listings l where l.id = listing_id));

drop policy if exists reports_moderate on public.reports;
create policy reports_moderate on public.reports for all to authenticated
  using ((select public.is_moderator())) with check ((select public.is_moderator()));

-- ---------------------------------------------------------------------
-- 9. Table access for the website (new tables are not exposed automatically)
-- ---------------------------------------------------------------------
revoke all on public.app_settings, public.members, public.listings, public.photos,
              public.questions, public.reports, public.storage_trash from anon, authenticated;

grant select                         on public.app_settings to authenticated;
grant select, insert, update         on public.members      to authenticated;
grant select, insert, update, delete on public.listings     to authenticated;
grant select, insert, update, delete on public.photos       to authenticated;
grant select, insert, update, delete on public.questions    to authenticated;
grant select, insert, update, delete on public.reports      to authenticated;

-- ---------------------------------------------------------------------
-- 10. Moderator tools: bulk member update from a CSV
--     p_rows = [{"name": "...", "email": "..."}, ...]
--     p_apply = false → preview only; true → make the changes
-- ---------------------------------------------------------------------
create or replace function public.member_import(p_rows jsonb, p_apply boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  result jsonb;
begin
  if not public.is_moderator() then
    raise exception 'Only a moderator can update the member list.';
  end if;

  create temporary table if not exists _incoming (email text primary key, full_name text) on commit drop;
  truncate _incoming;

  insert into _incoming (email, full_name)
  select distinct on (lower(btrim(r ->> 'email')))
         lower(btrim(r ->> 'email')), btrim(r ->> 'name')
  from jsonb_array_elements(p_rows) r
  where lower(btrim(r ->> 'email')) like '%_@_%.__%'
    and length(btrim(coalesce(r ->> 'name', ''))) between 1 and 100;

  select jsonb_build_object(
    'valid_rows',  (select count(*) from _incoming),
    'skipped_rows', jsonb_array_length(p_rows) - (select count(*) from _incoming),
    'new',         (select count(*) from _incoming i where not exists (select 1 from public.members m where m.email = i.email)),
    'restored',    (select count(*) from _incoming i join public.members m using (email) where not m.active),
    'renamed',     (select count(*) from _incoming i join public.members m using (email) where m.full_name <> i.full_name),
    'removed',     (select count(*) from public.members m where m.active and m.role <> 'moderator'
                      and not exists (select 1 from _incoming i where i.email = m.email)),
    'removed_names', coalesce((select jsonb_agg(m.full_name order by m.full_name) from public.members m
                      where m.active and m.role <> 'moderator'
                        and not exists (select 1 from _incoming i where i.email = m.email)), '[]'::jsonb),
    'applied',     p_apply
  ) into result;

  if p_apply then
    if (select count(*) from _incoming) = 0 then
      raise exception 'No valid rows found, so nothing was changed.';
    end if;
    insert into public.members (email, full_name)
    select email, full_name from _incoming
    on conflict (email) do update set full_name = excluded.full_name, active = true;

    update public.members m set active = false
    where m.active and m.role <> 'moderator'
      and not exists (select 1 from _incoming i where i.email = m.email);
  end if;

  return result;
end $$;

-- ---------------------------------------------------------------------
-- 11. Sign-in gate: only active members can be sent a sign-in code.
--     Turn it on in Authentication → Hooks → "Before User Created".
-- ---------------------------------------------------------------------
create or replace function public.hook_before_user_created(event jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.members
             where email = lower(btrim(coalesce(event -> 'user' ->> 'email', ''))) and active) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'message', 'That email isn''t on the member list. Check the spelling, or ask the club to update your details.',
    'http_code', 403));
end $$;

-- ---------------------------------------------------------------------
-- 12. Emails via Brevo (question alerts, expiry reminders)
--     Needs the Brevo API key saved in Vault (see 02_secrets.sql).
-- ---------------------------------------------------------------------
create or replace function public.send_email(p_to text, p_to_name text, p_subject text, p_body_html text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  api_key text;
  html text;
begin
  select decrypted_secret into api_key from vault.decrypted_secrets where name = 'brevo_api_key' limit 1;
  if api_key is null or p_to is null then
    return;   -- email not set up yet: skip quietly
  end if;

  html := '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#16203a">'
       || '<div style="background:#0f1f47;color:#ffffff;padding:16px 20px;font-size:20px;font-weight:bold;letter-spacing:1px">THE TRAM DEPOT</div>'
       || '<div style="padding:20px;font-size:16px;line-height:1.5">' || p_body_html || '</div>'
       || '<div style="padding:0 20px 20px;font-size:13px;color:#5a6379">Thornbury Bowls Club Marketplace · for members only</div></div>';

  perform net.http_post(
    url     := 'https://api.brevo.com/v3/smtp/email',
    headers := jsonb_build_object('api-key', api_key, 'content-type', 'application/json', 'accept', 'application/json'),
    body    := jsonb_build_object(
                 'sender', jsonb_build_object('email', public.setting('sender_email'), 'name', public.setting('sender_name')),
                 'to', jsonb_build_array(jsonb_build_object('email', p_to, 'name', coalesce(p_to_name, p_to))),
                 'subject', p_subject,
                 'htmlContent', html));
end $$;

create or replace function public.button_html(p_url text, p_label text)
returns text language sql immutable set search_path = '' as $$
  select '<p style="margin:24px 0"><a href="' || public.html_escape(p_url)
      || '" style="background:#ef7d1a;color:#1b1205;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">'
      || public.html_escape(p_label) || '</a></p>'
$$;

-- New question → email the seller
create or replace function public.questions_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  l record;
begin
  select li.id, li.title, m.email, m.full_name
    into l
    from public.listings li join public.members m on m.id = li.seller_id
   where li.id = new.listing_id and m.active;
  if not found then return new; end if;

  perform public.send_email(
    l.email, l.full_name,
    'New question about "' || l.title || '"',
    '<p>' || public.html_escape(new.asker_name) || ' asked about your listing <b>'
      || public.html_escape(l.title) || '</b>:</p>'
      || '<blockquote style="margin:0;padding:12px 16px;background:#eef0f6;border-radius:8px">'
      || public.html_escape(new.body) || '</blockquote>'
      || public.button_html(public.setting('site_url') || '/#listing-' || l.id, 'Answer it')
      || '<p style="font-size:14px;color:#5a6379">Questions and answers are visible to all members.</p>');
  return new;
end $$;

drop trigger if exists questions_after_insert on public.questions;
create trigger questions_after_insert after insert on public.questions
  for each row execute function public.questions_after_insert();

-- Daily: remind sellers 3 days before a Marketplace listing expires
create or replace function public.send_expiry_reminders()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  r record;
  n integer := 0;
begin
  for r in
    select li.id, li.title, li.expires_at, m.email, m.full_name
      from public.listings li join public.members m on m.id = li.seller_id
     where li.section = 'market' and li.status = 'active' and m.active
       and li.reminder_sent_at is null
       and li.expires_at between now() + interval '2 days' and now() + interval '3 days'
       and li.expires_at > li.created_at + interval '6 days'
  loop
    perform public.send_email(
      r.email, r.full_name,
      'Your listing "' || r.title || '" ends soon',
      '<p>Your listing <b>' || public.html_escape(r.title) || '</b> comes down on '
        || to_char(r.expires_at at time zone 'Australia/Melbourne', 'FMDay FMDD FMMonth') || '.</p>'
        || '<p>Still available? Extend it from My listings. Sold? Mark it as sold so members know.</p>'
        || public.button_html(public.setting('site_url') || '/#mine', 'Open My listings'));
    update public.listings set reminder_sent_at = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;

-- ---------------------------------------------------------------------
-- 13. Clean-up jobs
-- ---------------------------------------------------------------------

-- Delete listings 30 days after they expire or are marked sold
create or replace function public.daily_cleanup()
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  delete from public.listings
   where expires_at < now() - interval '30 days'
      or (status = 'sold' and sold_at < now() - interval '30 days');
  get diagnostics n = row_count;
  return n;
end $$;

-- Remove deleted photos' files from storage (needs the service key in Vault)
create or replace function public.empty_storage_trash()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  k text;
  base text := public.setting('project_url');
  t record;
  n integer := 0;
begin
  select decrypted_secret into k from vault.decrypted_secrets where name = 'service_key' limit 1;
  if k is null or base is null then return 0; end if;

  for t in select path from public.storage_trash order by queued_at limit 500 loop
    perform net.http_delete(
      url     := base || '/storage/v1/object/photos/' || t.path,
      headers := jsonb_build_object('apikey', k)
                 || case when k like 'eyJ%' then jsonb_build_object('Authorization', 'Bearer ' || k) else '{}'::jsonb end);
    delete from public.storage_trash where path = t.path;
    n := n + 1;
  end loop;
  return n;
end $$;

-- Schedules (times in UTC; Melbourne is UTC+10/+11)
select cron.schedule('tram-depot-reminders', '0 23 * * *',  'select public.send_expiry_reminders()');  -- ~9–10am
select cron.schedule('tram-depot-cleanup',   '30 17 * * *', 'select public.daily_cleanup()');          -- ~3:30–4:30am
select cron.schedule('tram-depot-trash',     '15 * * * *',  'select public.empty_storage_trash()');    -- hourly

-- ---------------------------------------------------------------------
-- 14. Function access
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.me()            to authenticated;
grant execute on function public.is_member()     to authenticated;
grant execute on function public.is_moderator()  to authenticated;
grant execute on function public.short_name(text) to authenticated;
grant execute on function public.member_import(jsonb, boolean) to authenticated;

grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;

-- ---------------------------------------------------------------------
-- 15. Photo storage: a private bucket, members only
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 1048576, array['image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = 1048576, allowed_mime_types = array['image/jpeg', 'image/webp'];

drop policy if exists "tram_depot_photos_read" on storage.objects;
create policy "tram_depot_photos_read" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (select public.is_member()));

drop policy if exists "tram_depot_photos_upload" on storage.objects;
create policy "tram_depot_photos_upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select public.me())::text);

drop policy if exists "tram_depot_photos_delete" on storage.objects;
create policy "tram_depot_photos_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos'
         and ((storage.foldername(name))[1] = (select public.me())::text or (select public.is_moderator())));

-- =====================================================================
-- Done. Next: run 02_first_moderator.sql, then turn on the sign-in hook.
-- =====================================================================
