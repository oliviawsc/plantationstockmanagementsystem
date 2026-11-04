# rainfall (Phase B)

Sections: `rainfall`, `rainfallreport`, `rainfallsummary`.
Legacy line numbers refer to `legacy/index.html`.

| What | Lines |
|---|---|
| HTML `rainfall` / `rainfallreport` / `rainfallsummary` | 2835–2959 / 2960–2996 / 2997–3017 |
| Rainfall transactions (picture helpers, `saveRainfallTxn`, `deleteRainfallTxn`, `viewRainfallPicture`, filters, `renderRainfallTxns`, add/edit/cancel panel) | 13966–14160 |
| Monthly report (`changeRainfallReportYear`, `renderRainfallReport`) | 14161–14256 |
| Shared image compression `_compressImageDataUrl` (move to `src/lib`) | 14257–14276 |
| Yearly summary `renderRainfallSummary` | 14770–14905 |

Rules: one reading per date (duplicate check on save; the merge in
`src/data/merge.ts` keeps the highest id per date). Mobile rainfall form
(14277–14375, 14637–14769) is Worker Portal only — not needed.
