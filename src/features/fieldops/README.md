# fieldops (Phase B)

Sections: `roundprogress` (Fertilizer Issuance), `maintprogress`
(Maintenance Progress), `chemusage` (Chemical Usage).
Legacy line numbers refer to `legacy/index.html`.

| What | Lines |
|---|---|
| HTML `roundprogress` / `maintprogress` / `chemusage` | 2097–2193 / 2201–2323 / 2324–2426 |
| Manuring calculations (`getTotalPalms`, `getPalmsForBlocks`, `getKgPerUnit`, `getRoundPkgUnit`, `calcRoundBudget`, `calcRoundTotalApplied`) | 5308–5347, 5372–5388 |
| `renderManuringHistory`, `calcBlockBudget`, `calcBlockApplied`, `renderRoundProgress` | 5463–5632 |
| Maintenance claims (`renderMaintProgressDropdowns`, `updateMpBlocksByRound`, `saveMaintClaim`, edit/cancel/delete) | 11832–11996 |
| Ingredient table shown on Chemical Usage (`renderCiTable`) | 12100–12125 |
| Tables (`progressBar`, `statusBadge`, `renderMaintProgressTables`, `renderMpByRound`, `renderMpByBlock`, `renderChemByRound`, `renderChemByBlock`) | 12126–12451 |
| Table filters (`filterTableRows`, `applyFilterRp*`, `applyFilterMp*`, `applyFilterChem*`, `populate*Filters`, `repopulateSelect`) | 13567–13725 |
| Field Operations table CSS | `src/styles/sections.css` |

Writes: `maintClaims` via `insertRow` / `updateRow` / `deleteRow`.
View-only filters must stay usable (legacy `VIEW_LOCK_ALLOWED_FIELD_IDS`, 10422–10446).
