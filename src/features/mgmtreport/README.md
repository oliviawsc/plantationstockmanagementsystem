# mgmtreport (ported in Phase A)

Section: `mgmtreport` (Management Report). Deep link `?module=report`.
Legacy: HTML 3215–3229, `MGMT_REPORT_SOURCES` + `renderMgmtReport` 15848–15872.

- `MgmtReportPage.tsx` — the page (links to this app's own reports the user
  may open).
- `sources.ts` — `MGMT_REPORT_SOURCES`.
- `reportData.ts` — **the only place report data may be read from.**

## Data lives in the MJM Intranet project

Management Report data will live in the MJM Intranet Supabase project
(`briqzyxfxsvulyizzbiu`, `https://briqzyxfxsvulyizzbiu.supabase.co`), not in
the stock project. Config: `src/lib/intranetConfig.ts` (URL, plus the anon
key from `VITE_INTRANET_SUPABASE_ANON_KEY`, empty until set at build time).
`reportData.ts` creates a separate, lazily-loaded client with its own auth
storage key.

Not done yet, on purpose:
- no tables or functions in the Intranet project;
- no cross-project queries;
- no auth between the projects (do not send the stock session's JWT to the
  Intranet project). `fetchExternalReports()` returns `[]` for now.

When the Intranet side exists: implement `fetchExternalReports()` and render
its result in the "Other systems" card of `MgmtReportPage.tsx`.
