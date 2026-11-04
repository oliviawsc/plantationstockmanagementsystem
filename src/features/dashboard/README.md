# dashboard (Phase B)

Section: `dashboard`. Replace the placeholder in `src/pages/sectionRegistry.tsx`.
Legacy line numbers refer to `legacy/index.html`.

| What | Lines |
|---|---|
| HTML `<section id="dashboard">` | 1560–1678 |
| Loading spinner on chart cards | 4256–4284 (`_showDashLoadingSpinner`, `_hideDashLoadingSpinner`) |
| `renderDashboard` | 6323–6379 |
| `renderManuringPctChart` | 6380–6593 |
| `renderMaintPctTracker` | 6594–6824 |
| `renderChemUsageTracker` | 6825–7097 |
| `renderRainfallChart` | 7098–7207 |
| `printDashboard` + print CSS (`src/styles/sections.css`) | 7208–7234 |
| `buildCategoryChart`, `wrapName` | 7235–7435 |
| Date filters (`renderDashboardFilters`, `openDatePicker`, `updateDashDateDisplay`, `clearDashFilter`, `getDashAsAt`, …) | 7436–7498 |
| `renderLiveStockChart` | 7499–7519 |

Notes: Chart.js 4.4.0 and flatpickr are npm dependencies — load them with
dynamic `import()`. Data comes from `useEstateData()`.
