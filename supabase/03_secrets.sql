-- =====================================================================
-- The Tram Depot · save the two private keys in Supabase Vault
--
-- Paste each key between the quotes, replacing the PASTE_... text,
-- then Run. Keys are stored encrypted inside your Supabase project.
-- Never paste these keys into a chat, email or document.
--
--   1. Brevo API key   → Brevo: Settings → SMTP & API → API Keys
--   2. Supabase secret → Supabase: Project Settings → API Keys →
--                        Secret keys (starts sb_secret_) → copy
--
-- Safe to run again (e.g. to replace a key). A key left as PASTE_...
-- is skipped.
-- =====================================================================

do $$
declare
  brevo_key   text := 'PASTE_BREVO_API_KEY_HERE';
  service_key text := 'PASTE_SUPABASE_SECRET_KEY_HERE';
  sid uuid;
begin
  if brevo_key not like 'PASTE_%' then
    select id into sid from vault.secrets where name = 'brevo_api_key';
    if sid is null then
      perform vault.create_secret(brevo_key, 'brevo_api_key', 'Brevo API key for Tram Depot emails');
    else
      perform vault.update_secret(sid, brevo_key);
    end if;
    raise notice 'Brevo API key saved.';
  end if;

  sid := null;
  if service_key not like 'PASTE_%' then
    select id into sid from vault.secrets where name = 'service_key';
    if sid is null then
      perform vault.create_secret(service_key, 'service_key', 'Supabase secret key for photo clean-up');
    else
      perform vault.update_secret(sid, service_key);
    end if;
    raise notice 'Supabase secret key saved.';
  end if;
end $$;

-- Shows which keys are saved (names only, never the keys themselves)
select name, created_at, updated_at from vault.secrets
where name in ('brevo_api_key', 'service_key');
