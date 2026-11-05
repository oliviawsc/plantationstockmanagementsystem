# Sign-in from MJM Intranet (no second login)

When someone clicks **Stock** or **Management Report** in the MJM Intranet,
the Intranet opens this app with `?module=stock|report&gw_token=<token>`
(a 60-second, single-use token). The app sends the token to the `stock-sso`
Edge Function, which redeems it with the Intranet (`gw-check-access`, using
that module's API key), finds — or on first visit creates — the person's
`opp_users` row, and returns the normal app session. The login form never
appears; the person lands on Home (Stock) or on Management Report.

First-visit users are created as **HQ User**, status active, no estates:
- opened from *Stock*: default permissions (every section "view")
- opened from *Management Report*: only Management Report ("view")

An admin can then assign estates / permissions in User Management as usual.
Deactivated users (status `inactive`) are refused, and the Super Admin email
gets the Super Admin session. If sign-in fails the normal login form is shown
with the reason.

## Setup (no command line needed)

1. **GitHub → this repo → Settings → Secrets and variables → Actions → New
   repository secret**: name `SUPABASE_ACCESS_TOKEN`, value = the same
   Supabase access token used in the Mantap repo. Then **Actions → "Deploy
   Supabase functions" → Run workflow** (it deploys `stock-auth` and
   `stock-sso`; it also runs by itself when `supabase/functions/**` changes
   on `main`).
2. **Intranet → Admin Console → Master Manage → Module**: set *Stock* and
   *Management Report* to **level 2 (token redirect)** and **generate an API
   key for each** module (copy them — they are shown once). The module URLs are
   `https://oliviawsc.github.io/plantationstockmanagementsystem/?module=stock`
   and `...?module=report`.
3. **Supabase → project `eukvdlyzhyjohkjqbqjb` → Edge Functions → Secrets**:
   add `INTRANET_STOCK_API_KEY` (the Stock module's key) and
   `INTRANET_REPORT_API_KEY` (the Management Report module's key).
   Optional: `INTRANET_SUPABASE_URL` if the Intranet ever moves (default
   `https://briqzyxfxsvulyizzbiu.supabase.co`).
4. **Test**: in the Intranet click the Stock icon → the app opens on Home with
   no login; click the Management Report icon → it opens on Management Report.
   Try with a user who does not have the module in the Intranet → the login
   form appears with "Sign-in from MJM Intranet failed: …".

## Error codes returned by `stock-sso`

| code | meaning |
|---|---|
| `err_sso_not_set_up` | the module's API key secret is missing in Supabase |
| `err_sso_invalid` | the Intranet rejected the token (expired / already used / wrong module key) |
| `err_forbidden` | the Intranet says this person may not use the module |
| `err_inactive` | the `opp_users` row is deactivated |
