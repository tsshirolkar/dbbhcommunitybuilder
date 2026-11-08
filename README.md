# dBBH Community Builder (test version)

A networking site for Duke Business Behind Health. Members create a profile, browse other members ranked by shared professional interests, and choose "Let's Chat!". When two members both choose each other, each sees the other's Duke email and phone number.

**This test version has no login, no passwords and no email of any kind.** Creating a profile is the sign-up. The profile is tied to the browser it was created in.

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
1. **Database:** Supabase → SQL Editor → paste all of `setup.sql` → Run. It only creates `cb_` tables and functions, so it won't touch your main site's tables.
2. **Upload** all files above to your GitHub repo's top folder (replace the old `index.html`).
3. **GitHub Pages:** Settings → Pages → Deploy from a branch → `main` → `/ (root)`.

Site address: `https://YOUR-USERNAME.github.io/YOUR-REPO/`

## Running a test
- Each tester opens the site on their own device and creates a profile. To test several people from one computer, use separate browsers or private windows.
- Matching test: person A and person B each choose "Let's Chat!" on each other. Both then see each other's email and phone under Matches.
- Clean up afterwards: testers can press "Delete my profile", or run this in Supabase's SQL Editor to clear everything: `delete from public.cb_people;`

## What this test version does not have (add later)
- **No identity check.** Anyone can create a profile using any @duke.edu address, including someone else's.
- **No sign-in from other devices.** If someone clears their browser data or switches devices, they create a new profile. A profile whose email is already taken cannot be recreated until an admin deletes the old one: `delete from public.cb_people where duke_email = 'netid@duke.edu';`
- The blocked-word filter only runs in the browser.

## Moving it into the main dBBH site later
The feature is one script plus one stylesheet that mounts into any element:
1. Copy `community-builder.css` and `community-builder.js` into the main site and link them.
2. Put `<div id="cb-root"></div>` where the feature should appear (for example, the portal's Directory tab).
3. Call `CBuilder.init({ mount: '#cb-root', client: sb, heading: false })`. Passing the main site's existing Supabase client (`sb`) means no second connection and no `config.js` is needed.

When you add authentication, the sign-in step replaces the private key kept in the browser (the `token` in `community-builder.js` and the `cb_uid` function in `setup.sql`). The profile, matching and directory code stays the same.
