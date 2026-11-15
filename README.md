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
