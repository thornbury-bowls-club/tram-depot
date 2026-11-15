-- =====================================================================
-- The Tram Depot · add the first moderator
--
-- Change 'Your Name' below to your full name (it shows to members as
-- e.g. "Tom S."), then Run. Safe to run again.
-- =====================================================================

insert into public.members (email, full_name, role)
values ('chairperson@thornburybowls.com.au', 'Your Name', 'moderator')
on conflict (email) do update
  set full_name = excluded.full_name, role = 'moderator', active = true;

select email, full_name, display_name, role, active from public.members;
