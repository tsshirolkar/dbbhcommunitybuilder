# dBBH Community Builder

A networking page for Duke Business Behind Health members. Members create a profile, browse others ranked by shared professional interests, and choose "Let's Chat!". When two members choose each other, each sees the other's Duke email and phone number.

## Files (all in the repo's top folder)
| File | Purpose |
|---|---|
| `index.html` | Standalone page (logo bar + Community Builder) |
| `community-builder.js` / `.css` | The whole feature. Scoped to `#cb-root`, so it drops into any page |
| `cb-local.js` | Prototype backend: stores data in the visitor's browser and includes 8 fictional sample members |
| `config.js` | Switch between prototype and live (`mode`) |
| `setup.sql` | Supabase database setup, only needed when you go live |

## Publish on GitHub Pages (no database needed)
1. Upload every file above to the top folder of a GitHub repo.
2. Settings → Pages → Deploy from a branch → `main` → `/ (root)`.
3. Open `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

## Demo notes
- Each visitor's profile lives only in their own browser. Nothing is shared between devices or people.
- Sample members 1 to 4 (Maya, Jordan, Priya, Ethan) always choose "Let's Chat!" back, so you can show the match screen instantly. The other four do not, so you can show a pending request.
- "Reset demo" at the top of the page clears your profile and restores the sample data.
- Sample emails and phone numbers are fake.

## Going live with Supabase (later)
1. Supabase → SQL Editor → paste all of `setup.sql` → Run. It only creates `cb_` tables and functions, so it is safe inside the main dBBH project. The last query should list 5 functions.
2. In `config.js` set `mode: "supabase"` and fill in `url` and `key` (the publishable key). Nothing else changes, because `cb-local.js` and the database expose the same five functions.

## Merging into the main dBBH site
1. Copy `community-builder.css` and `community-builder.js` into the main site and link them.
2. Add `<div id="cb-root"></div>` where it should appear (for example a Members or Portal tab).
3. If the main site already has a Supabase client (say `sb`), run `setup.sql` in that project and call:
   `CBuilder.init({ mount: '#cb-root', client: sb, heading: false })`
   Not using Supabase on the main site? Create a project, include the supabase-js script, and call `CBuilder.init({ mount:'#cb-root', url:'...', key:'...', heading:false })`.
4. The page fonts and colors reuse the main site's CSS variables when they exist, so it should match the dBBH styling.

## Before opening it to all members
- Add sign-in (Duke email magic link or SSO). Today anyone can claim any @duke.edu address. Replace the browser token in `cb_uid` (`setup.sql`) with `auth.uid()`.
- Move the blocked-word filter into the database function.
- Add a way to report or remove a profile, and a short privacy note about how emails and phone numbers are shared.
