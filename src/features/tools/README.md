# tools (Phase B)

Sections: `tools` (Tools Transactions), `toolsrecord` (Tools Record).
Legacy line numbers refer to `legacy/index.html`.

| What | Lines |
|---|---|
| HTML `tools` (with its txn + record tabs) / `toolsrecord` stub | 3018–3205 / 3206–3214 |
| `renderToolsPage`, `renderToolsStockSummary`, `selectToolsTxnType`, `rebuildToolsItemDropdown`, `renderToolsTxns` | 14906–15068 |
| Form (`showToolsTxnForm`, `cancelToolsTxnForm`, `saveToolsTransaction`, edit, `deleteToolsTxn`) | 15069–15273 |
| `renderToolsRecord`, balances, picture helpers, `switchToolsTab`, `_updateToolsTxnTotal` | 15274–15545 |

Tools transactions live in `opp_transactions` with `category: 'Tools'`.
In legacy, `toolsrecord` opens the `tools` page on its record tab
(`navigateToSection`, 15874); in React it is its own route.
The mobile Peralatan flow (15546–15779) is Worker Portal only — not needed.
