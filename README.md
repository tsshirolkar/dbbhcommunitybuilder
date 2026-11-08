# dBBH Community Builder

A members-only networking site for Duke Business Behind Health. Members create an account with a Duke email and password, build a profile, and browse other members ranked by shared professional interests. When two members both choose "Let's Chat!", each sees the other's Duke email and phone number. There is no email verification yet.

## Files (all go in the top folder of the repo)
| File | What it is |
|---|---|
| `index.html` | The standalone page (logo bar plus the Community Builder) |
| `community-builder.js` | The whole feature, self-contained |
| `community-builder.css` | Its styles, scoped to `#cb-root` |
| `config.js` | Supabase address and key (edit here only) |
| `setup.sql` | Run once in Supabase |
| `README.md` | These notes |

## Set up (one time)
1. **Database:** Supabase → SQL Editor → paste `setup.sql` → Run. It creates `cb_` tables only, so it won't touch your main site's tables.
2. **Turn off email confirmation:** Supabase → Authentication → Sign In / Providers → Email → switch **Confirm email** off, then save. (This is what makes "no verification" work.)
3. **Upload** all the files above to your GitHub repo's top folder (replace the old `index.html`; you can delete the old `community-builder.html`).
4. **GitHub Pages:** Settings → Pages → Deploy from a branch → `main` → `/ (root)`.

Site address: `https://YOUR-USERNAME.github.io/YOUR-REPO/`

## Known limits (no verification)
- Anyone can create an account with any @duke.edu address, including someone else's. Add email verification before this holds anything sensitive.
- There is no password reset. A dBBH admin can reset a password in Supabase → Authentication → Users.
- The blocked-word filter only runs in the browser.

## Moving it into the main dBBH site later
The feature is one script plus one stylesheet that mounts into any element, so integration is three steps:
1. Copy `community-builder.css` and `community-builder.js` into the main site and link them.
2. Put `<div id="cb-root"></div>` where the feature should appear (for example, the portal's Directory tab).
3. Call `CBuilder.init({ mount: '#cb-root', client: sb, heading: false })`. Passing the main site's existing Supabase client (`sb`) means no second connection and no `config.js` is needed.

The database stays exactly as it is. Later, to add verification, only the login functions in `community-builder.js` need to change.
