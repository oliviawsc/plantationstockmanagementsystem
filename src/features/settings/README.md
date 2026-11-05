# settings (Phase B, Super Admin only)

Section: `settings` (also the legacy stubs `items`, `locations`, `manuring`,
`fieldmaint`, which only say "moved to Settings").
Legacy line numbers refer to `legacy/index.html`.

| What | Lines |
|---|---|
| HTML `settings` (tabs: estates & blocks, items, manuring, maintenance, ingredients) | 3346–3762 |
| Item File (`showAddItemPanel` … `deleteItem`) | 4557–4752 |
| Locations / blocks (`startEditLocation` … `renderLocationGrid`, `deleteLocation`) | 4753–4862 |
| Manuring Program setup (`startEditRound`, panels, `saveManuringRound`, `renderMrBlocksGrid`, `mrSelectAllBlocks`, `toggleRoundTxns`, `renderManuringRounds`, `deleteRound`, `toggleRoundActive`) | 5184–5307, 5348–5371, 5379–5462 |
| Estates (`loadEstatesFromSupabase`, `refreshEstateSidebar`, `populateRegEstatesGrid`, `renderEstatesList`, edit/add/delete estate) | 9685–9872 |
| Maintenance Program (`renderFmBlocksGrid` … `renderFieldMaintRounds`) | 11649–11831 |
| Chemical ingredients (`saveChemIngredient` … `deleteChemIngredient`) | 11997–12099 |
| Settings tabs + blocks per estate (`switchSettingsTab`, `settingsManageBlocks`, `renderSettingsBlocksList`, `saveSettingsBlock`, …) | 15974–16110 |

Renames cascade to transactions (item name, location name, round name):
use `upsertRows('transactions', changedRows)`. Blocks of another estate:
pass `{ estate }` to the row functions. Estates (`opp_estates`) are not an
estate-scoped collection — write them directly (Super Admin only).
