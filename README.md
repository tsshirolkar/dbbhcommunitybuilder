# dBBH Community Builder

Members-only networking page for Duke Business Behind Health. Members log in with a Duke email, browse profiles ranked by shared professional interests, and choose "Let's Chat!". When two people choose each other, both see each other's Duke email and phone number.

## Files
- `community-builder.html` – the page (upload next to your site's `index.html`)
- `setup.sql` – run once in Supabase → SQL Editor

## Setup
1. Run `setup.sql` in Supabase.
2. Supabase → Authentication → URL Configuration: set Site URL to your GitHub Pages address and add `https://YOUR-USERNAME.github.io/YOUR-REPO/community-builder.html` as a Redirect URL.
3. (Optional) add `{{ .Token }}` to the Magic Link email template so members can type a code.
4. Set up custom email sending (SMTP) in Supabase before launch. The built-in sender is rate limited.
5. Turn on CAPTCHA (Authentication → Attack Protection) if you see spam sign-ups.

## Security notes
- The Supabase URL and publishable key in the page are meant to be public. Privacy comes from the row-level security rules in `setup.sql`.
- Never put a `service_role` key or any password in this repository.
