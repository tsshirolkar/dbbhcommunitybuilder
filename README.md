# dBBH Community Builder

Members-only networking page for Duke Business Behind Health. Members log in with a Duke email code, browse profiles ranked by shared professional interests, and choose "Let's Chat!". When two people choose each other, both see each other's Duke email and phone number.

## Files
- `community-builder.html` – the page (upload next to your site's `index.html`)
- `setup.sql` – run once in Supabase → SQL Editor
- `email-templates.txt` – text to paste into two Supabase email templates

## One-time Supabase setup (all four steps are required)
1. **Database:** run `setup.sql`. It creates `cb_` tables, so it will not touch your main site's tables.
2. **Email code:** paste the text from `email-templates.txt` into the "Confirm signup" and "Magic Link" templates. Without this the email has only a link and no code.
3. **URLs:** Authentication → URL Configuration → Site URL: `https://tsshirolkar.github.io/dbbhcommunitybuilder/` and add `https://tsshirolkar.github.io/dbbhcommunitybuilder/community-builder.html` under Redirect URLs.
4. **Email sending:** the built-in sender allows only a few emails per hour, so add your own SMTP (Authentication → SMTP Settings) before members use it.

Optional: turn on CAPTCHA under Authentication → Attack Protection.

## Security notes
- The Supabase URL and publishable key in the page are meant to be public. Privacy comes from the row-level security rules and functions in `setup.sql`.
- Never put a `service_role` key or any password in this repository.
