# The Tram Depot

Thornbury Bowls Club Marketplace: a members-only site for buying, selling, giving away,
finding bowlers and sharing social events.

## How it fits together

| Part | Where | Notes |
| --- | --- | --- |
| Website | `site/` → Cloudflare Pages | Plain HTML, CSS and JavaScript. No build step. |
| Database, sign-in, photos | Supabase project `tram-depot` (Sydney) | Set up with the scripts in `supabase/` |
| Emails | Brevo (club account) | Sign-in codes via SMTP; alerts and reminders via the Brevo API |
| Keep-awake ping | `.github/workflows/keepalive.yml` | Twice a week, so the free Supabase plan never pauses |

All accounts belong to chairperson@thornburybowls.com.au.

## Putting the site online (Cloudflare Pages)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Choose the GitHub account `thornbury-bowls-club` and the repository `tram-depot`.
3. Build settings:
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: `site`
4. **Save and Deploy**. The site appears at `https://tram-depot.pages.dev` (or similar).
5. If the address differs, update `site_url` in Supabase so email links point to the right place:
   ```sql
   update public.app_settings set value = 'https://YOUR-ADDRESS.pages.dev' where key = 'site_url';
   ```
   and add the same address in Supabase → **Authentication → URL Configuration → Site URL**.

Every change merged into `main` goes live automatically within a minute or two.

## Changing things

- **Public settings** (Supabase address and public key, contact email): `site/config.js`
- **Screens and behaviour**: `site/app.js`; **talking to Supabase**: `site/db.js`; **look**: `site/styles.css`
- **Database rules**: `supabase/01_setup.sql` (safe to re-run in the Supabase SQL Editor)

## Testing locally

`test/index.html` runs the site against an in-memory stand-in database (`test/db-mock.js`),
with sample members alex@example.com, jo@example.com and mod@example.com (code `123456`).
Serve the repository folder (for example `python3 -m http.server`) and open `/test/index.html`.
`test/e2e.js` is a Playwright click-through of the main member and moderator journeys.

## Guest register (guest sign-in by QR code)

A separate small site for club guests, required by the Liquor Control Reform Act 1998 (Vic).
Guests scan the poster's QR code and enter their **name** (required) and optionally an **email**
and a "keep me posted" tick for club news. The date and time are added by the database.

| Part | Where | Notes |
| --- | --- | --- |
| Guest page | `guest/` → its own Cloudflare Pages project, `thornbury-guests` | `index.html` for guests; `register.html` for moderators to view, print, download or delete sign-ins |
| Database | Same Supabase project, table `guest_visits` | Set up with `supabase/04_guest_register.sql` |
| Poster | `poster/guest-signin-poster.pdf` | A4. Rebuild with `python3 poster/build_poster.py <address>` if the address changes |

Who can do what: anyone with the link can **add** a sign-in; nobody can read sign-ins from the
public page. Tram Depot **moderators** can read and delete them on `register.html` (same emailed
6-digit code as the Depot) or in Supabase → Table Editor → `guest_visits`.

### Setting it up

1. **Database.** Supabase → SQL Editor → New query → paste `supabase/04_guest_register.sql` → Run.
2. **Website.** Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** →
   `thornbury-bowls-club` / `tram-depot`. Project name **`thornbury-guests`**, production branch `main`,
   framework preset **None**, build command *(empty)*, build output directory **`guest`** → Save and Deploy.
3. **Check the address** is `https://thornbury-guests.pages.dev`. If Cloudflare gave a different one,
   rebuild the poster with that address before printing.
4. **Test** on a phone: scan the poster, sign in as a guest, then open `/register.html`, sign in as a
   moderator and check the entry appears (delete it afterwards).
5. **Print** `poster/guest-signin-poster.pdf` (A4, or enlarge to A3) and keep the paper register at the
   bar for guests without a phone.

### Optional extras (all off until switched on)

- **Club-news sign-ups straight into Brevo.** In Brevo create a contact list (e.g. "Guests – club news")
  and note its ID. Then run:
  `update public.app_settings set value = 'LIST_ID' where key = 'brevo_guest_list_id';`
  Guests who tick the box are added to that list as they sign in. Until then, use
  **Download news sign-ups** on the register page and import the CSV into Brevo.
- **Automatic clean-up.** To delete sign-ins older than, say, 24 months:
  `update public.app_settings set value = '24' where key = 'guest_keep_months';`
