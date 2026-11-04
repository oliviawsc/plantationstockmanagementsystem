# users (Phase B, Super Admin only)

Section: `useradmin` (User Management).
Legacy line numbers refer to `legacy/index.html`.

| What | Lines |
|---|---|
| HTML `useradmin` (list, register form, edit modal) | 3230–3341 |
| `ROLES`, `getRoleDef`, `buildRoleOptions` | 9311–9327, 9572–9577 |
| Users cache + CRUD (`rowToUser`, `userToRow`, `fetchUsersFromSupabase`, `fetchAuthUsers`, insert/update/delete) | 9578–9684 |
| Permission editors (`toggleRegPermissionsSection`, `toggleEditPermissionsSection`, `renderPermissionCheckboxes`) | 10783–10854 |
| Register / list / expand / kebab / filters / `renderUsersTable` / edit modal / `saveEditUser` | 10941–11476 |

Must change for security: the legacy page hashes passwords in the browser
and writes `opp_users.password_hash` with the anon key. After cutover the
browser can no longer do that (see `docs/security-cutover.md`), so create /
reset password / permissions / status must go through a Super-Admin-only
Edge Function (like Mantap's `mantap-worker-admin`). Permission sets:
`ALL_SECTIONS`, `ESTATE_SECTIONS`, `USER_MODULES`, `ESTATE_MODULES` in
`src/lib/permissions.ts`; saving must set `permissions.__configured = true`
and `permissions.__role`.
