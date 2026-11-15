# Supabase set-up for The Tram Depot

Project: `tram-depot` (Sydney) · `https://voaezublshumlcszutgo.supabase.co`

Run these in order. Each SQL file is pasted into **SQL Editor → New query → Run**,
and every one is safe to run again.

## 1. Database (`01_setup.sql`)

Creates the tables, security rules, photo storage, email functions and the
daily jobs. Expect "Success. No rows returned" (or a small table of results).

## 2. First moderator (`02_first_moderator.sql`)

Change `'Your Name'` to your full name, then run. This adds
chairperson@thornburybowls.com.au as the first moderator. Everyone else is
added later from the Moderation page or a member CSV.

## 3. Sign-in settings (dashboard, no SQL)

**Only members can get a code**
Authentication → **Hooks** → add a **Before User Created** hook →
type **Postgres** → schema `public` → function `hook_before_user_created` → save / enable.

**Send a 6-digit code instead of a link**
Authentication → **Emails** → **Templates**. Replace both the **Magic link**
and **Confirm signup** templates with the text below (Supabase uses
"Confirm signup" the first time a member signs in).

Subject: `Your Tram Depot sign-in code`

```html
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#16203a">
  <div style="background:#0f1f47;color:#ffffff;padding:16px 20px;font-size:20px;font-weight:bold;letter-spacing:1px">THE TRAM DEPOT</div>
  <div style="padding:20px;font-size:16px;line-height:1.5">
    <p>Your sign-in code is:</p>
    <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:16px 0">{{ .Token }}</p>
    <p>Enter it on the sign-in page. It works for 10 minutes.</p>
    <p style="font-size:14px;color:#5a6379">If you didn't ask for this, you can ignore this email.</p>
  </div>
  <div style="padding:0 20px 20px;font-size:13px;color:#5a6379">Thornbury Bowls Club Marketplace · for members only</div>
</div>
```

**Code length and expiry**
Authentication → **Sign In / Providers** → **Email**: Email OTP length **6**,
Email OTP expiration **600** seconds (10 minutes). Leave "Confirm email" on.

**Emails sent through Brevo**
Authentication → **Emails** → **SMTP Settings** (see the set-up guide, step 3).
Then Authentication → **Rate Limits**: set emails per hour to **60**.

## 4. Private keys (`03_secrets.sql`)

Paste the Brevo API key and the Supabase **secret** key into the file in the
SQL editor (not in chat), then run. Question alerts, expiry reminders and
photo clean-up stay switched off until these are saved.

## What runs automatically

| Job | When (Melbourne time) | What it does |
| --- | --- | --- |
| `tram-depot-reminders` | about 9 to 10am daily | Emails sellers 3 days before a Marketplace listing ends |
| `tram-depot-cleanup` | about 3:30 to 4:30am daily | Deletes listings 30 days after they expire or are marked sold |
| `tram-depot-trash` | hourly | Removes deleted photos' files from storage |
