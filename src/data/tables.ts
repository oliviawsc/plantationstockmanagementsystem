// The 8 estate-scoped collections and their Supabase tables.
import type {
  ChemIngredientRow, FieldMaintRoundRow, ItemRow, LocationRow, MaintClaimRow,
  ManuringRoundRow, RainfallRow, RowId, TransactionRow,
} from '../lib/types';

export interface RowTypes {
  items: ItemRow;
  locations: LocationRow;
  transactions: TransactionRow;
  manuringRounds: ManuringRoundRow;
  fieldMaintRounds: FieldMaintRoundRow;
  maintClaims: MaintClaimRow;
  chemIngredients: ChemIngredientRow;
  rainfallTxns: RainfallRow;
}

export type CollectionKey = keyof RowTypes;
export type Collections = { [K in CollectionKey]: RowTypes[K][] };

/** Collection → table (same mapping as legacy STORAGE_KEYS). */
export const TABLES = {
  items: 'opp_items',
  locations: 'opp_locations',
  transactions: 'opp_transactions',
  manuringRounds: 'opp_manuring_rounds',
  fieldMaintRounds: 'opp_fieldmaint_rounds',
  maintClaims: 'opp_maint_claims',
  chemIngredients: 'opp_chem_ingredients',
  rainfallTxns: 'opp_rainfall_txns',
} as const satisfies Record<CollectionKey, string>;

export type TableName = (typeof TABLES)[CollectionKey];

export const COLLECTION_KEYS = Object.keys(TABLES) as CollectionKey[];

export function collectionOf(table: string): CollectionKey | null {
  return COLLECTION_KEYS.find((k) => TABLES[k] === table) ?? null;
}

export function emptyCollections(): Collections {
  return {
    items: [], locations: [], transactions: [], manuringRounds: [],
    fieldMaintRounds: [], maintClaims: [], chemIngredients: [], rainfallTxns: [],
  };
}

/** Any row: every table has an id and an estate column. */
export interface AnyRow {
  id: RowId;
  estate?: string;
  [k: string]: unknown;
}

export const sameId = (a: RowId, b: RowId) => String(a) === String(b);
