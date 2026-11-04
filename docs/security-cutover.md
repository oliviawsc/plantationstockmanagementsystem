# Security cutover

The legacy app (`legacy/index.html`) talks to Supabase with the anon key:
it reads `opp_users.password_hash` to check passwords in the browser and
upserts whole `opp_*` tables. The React app does not need either:

- HQ users sign in through the `stock-auth` Edge Function, which checks the
  hash on the server (timing-safe, 5 wrong tries → 15 min lock in
  `stock_login_attempts`) and returns a real Supabase Auth session.
- The Super Admin signs in with Supabase Auth (`signInWithPassword`).
- Estate workers use the Worker Portal (MJMElon/Mantap), which already signs
  them in with a Supabase Auth session.
- Data writes are row-level (`upsert`/`update`/`delete` of one row).

So once nobody uses the legacy app any more, the database can be locked down.

## What can be applied now

| Migration | When |
|---|---|
| `20261104130000_stock_login_attempts.sql` | Now — needed by `stock-auth`. Nothing else uses the table. |
| `20261201000000_cutover_rls.sql` | **Only at cutover.** It breaks the legacy app. |

Deploy the function with `supabase functions deploy stock-auth`
(`verify_jwt = false` is set in `supabase/config.toml`; the function checks
the caller's JWT itself for `me` and `change_password`).

## Policies applied at cutover (`*_cutover_rls.sql`)

**`opp_users`**
- `anon`: no access at all.
- `authenticated`: column grants only — `select (id, name, email, estates,
  permissions, status, last_active)` and `update (last_active)`.
  `password_hash` is never readable or writable from the browser.
- Row policies: a user reads their own row; the Super Admin reads all rows;
  a user may update `last_active` on their own row only.
- Realtime status watch keeps working (it needs select on the own row).

**`opp_estates`**: every signed-in user reads; only the Super Admin writes.

**`opp_items`, `opp_locations`, `opp_transactions`, `opp_manuring_rounds`,
`opp_fieldmaint_rounds`, `opp_maint_claims`, `opp_chem_ingredients`,
`opp_rainfall_txns`**: `anon` has no access; `authenticated` may read and
write rows whose `estate` is in their `opp_users.estates` (and their account
is not inactive). The Super Admin (the HQ admin email, or any `opp_users` row
with `permissions.__role = 'superadmin'`) may access every estate. Workers
match the same rule, so the Worker Portal keeps access to their estates.

Helper functions (`security definer`, fixed `search_path`):
`stock_is_superadmin()`, `stock_can_access_estate(text)`.

## Checklist before applying

1. The React app covers every section (Phase B done) and the legacy app is
   no longer linked from anywhere (Intranet, bookmarks, the `/legacy/` copy).
2. User Management in the React app creates users / resets passwords /
   changes permissions and status through an Edge Function (service role).
   After cutover the browser can no longer write `opp_users` (only
   `last_active`), and the legacy `get_auth_users` RPC should be reviewed.
3. List current policies and drop the permissive legacy ones — policies are
   OR-ed, so a leftover `using (true)` would undo the lock-down:
   ```sql
   select tablename, policyname, roles, cmd, qual
   from pg_policies where schemaname = 'public' and tablename like 'opp_%';
   ```
4. Check the type of `opp_users.estates` / `permissions` (the helpers use
   `to_jsonb`, so `text[]`, `json` and `jsonb` all work).
5. Rename the migration to the real date, apply on a branch/staging project
   first, and test: HQ user (own estates only), Super Admin (all), worker via
   the Worker Portal, inactive user (no data), anon (nothing).

## Possible later tightening

View-only access is enforced in the app, not in the database (section
permissions do not map 1:1 to tables). If needed, write policies can later
check `permissions` per table.

## Switching the live site to the React app

Until then, GitHub Pages publishes **from the `main` branch root**, so the live
site is the classic app in the root `index.html` (+ `sw.js`, `manifest.json`).
The React app's entry is `app.html`; `npm run build` turns it into
`dist/index.html` and ships the classic app at `dist/legacy/`.

At cutover:
1. Add `push: branches: [main]` to `.github/workflows/pages.yml`.
2. Repo Settings → Pages → Source: **GitHub Actions**.
3. Apply the `*_cutover_rls.sql` migration (above).
