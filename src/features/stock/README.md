# stock (Phase B)

Sections: `transactions` (Record Stock), `summary` (Stock Transactions),
`ledger` (Stock Summary). Legacy line numbers refer to `legacy/index.html`.

| What | Lines |
|---|---|
| HTML `transactions` / `summary` / `ledger` | 1750–1915 / 1916–2003 / 2004–2073 |
| Edit-transaction modal HTML | 3772–3883 |
| Photo select menu HTML | 3884–3911 |
| Txn rows, `saveTransaction` | 4863–5096 |
| `updateManuringVisibility` (round picker on the form) | 5097–5183 |
| Dropdowns (`rebuildCategoryDropdowns`, `populateItemDropdowns`, `filterTxnItemsByCategory`, `populateLocationDropdowns`) | 5633–5727 |
| Balances (`calcOnHand`, `calcOnHandFiltered`, `renderLiveStock`, `getFilteredTransactions`, `calcBalanceUpTo`) | 5728–5847 |
| `renderSummary`, `formatQty`, `deleteSummaryTransaction`, summary filters | 5848–6039 |
| Ledger (`refreshLedgerItemDropdown` … `renderLedger`) | 6040–6322 |
| `refreshAll` (shared refresh — becomes React state) | 7520–7553 |
| Unit conversion (`convertToBase`, `convertFromBase`, `convertChemQtyToCiUnit`, `classify`, `groupChemIngredientsByName`) | 7554–7697 |
| Qty labels / conversion on the form | 7698–7809 |
| Edit transaction modal JS | 7810–8100 |
| Form helpers (`resetTxnFormForNewEntry`, `stepTxnQty`, type buttons, photo menu, `updateTxnItemBalance`, `updateTxnRowTotal`, success banner, edit stepper) | 9334–9571 |
| Transaction picture helpers + viewer | 13504–13566 |
| Date picker (`_setTxnDateToday`, `_initTxnDateFlatpickr`) | 14594–14616 |
| Ledger CSS (`#ledgerTable`) | `src/styles/sections.css` |

Writes: `insertRow('transactions', …)`, `updateRow`, `deleteRow` (keeps the
tombstone), `upsertRows` for multi-row Out entries. Excel export: `xlsx`
0.18.5 via dynamic import. "Adj" type only for superadmin / hq_user.
The estate-mobile parts (`body.estate-mobile`, frozen category, bottom bar)
are not needed.
