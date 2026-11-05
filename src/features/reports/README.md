# reports (Phase B)

Sections: `fertrecord`, `chemrecord`, `plantrecord`.
Legacy line numbers refer to `legacy/index.html`.

| What | Lines |
|---|---|
| HTML `fertrecord` / `chemrecord` / `plantrecord` | 2696–2742 / 2743–2789 / 2790–2834 |
| Fertilizer Application Record (`renderFertRecord`, `_getFertRecordPivotData`, clear/export/print) | 12452–12919 (print template with its own `<style>` 12881–12899) |
| Chemical Application Record (render/clear/export/print) | 12920–13217 (print `<style>` 13187–13198) |
| Field Planting Record (render/clear/export/print) | 13218–13503 (print `<style>` 13473–13484) |
| Record table CSS | `src/styles/sections.css` |

Print windows were built as HTML strings; rebuild them as React components
rendered into a print window/iframe (no innerHTML string building).
