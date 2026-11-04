// Row types for every Supabase table, derived from how the legacy app reads
// and writes them (legacy/index.html). Column names are camelCase in the
// database because the legacy app upserts its in-memory objects as-is.
// Every data row carries `estate` (added on upsert). Ids are Date.now()
// numbers; some old rows store them as strings, so compare with String(id).

export type RowId = number | string;

interface EstateRow {
  id: RowId;
  estate?: string;
}

/** opp_items — Item File (Settings → Item Files). */
export interface ItemRow extends EstateRow {
  itemCode?: string;
  name: string;
  /** 'Fertilizer' | 'Chemical' | 'Oil Palm Seedling' | 'Tools' | free text */
  category: string;
  /** Legacy alias of baseUnit, kept in sync on save. */
  unit: string;
  baseUnit?: string;
  packageUnit?: string;
  qtyPerUnit?: number;
  threshold?: number;
  defaultQtyUnit?: 'base' | 'package';
  active?: boolean;
}

/** opp_locations — blocks (Settings → Estates & Blocks). */
export interface LocationRow extends EstateRow {
  name: string;
  area?: number;
  numPalms?: number;
}

export type TxnType = 'In' | 'Out' | 'Adj' | 'Adjustment' | string;

/** opp_transactions — stock and tools movements. */
export interface TransactionRow extends EstateRow {
  /** yyyy-mm-dd */
  date: string;
  itemId: RowId | '';
  itemName: string;
  category: string;
  unit: string;
  type: TxnType;
  /** Quantity in base unit. */
  qty: number;
  inputQty?: number;
  inputUnit?: string;
  /** Block name, 'Storage', or the estate name for tools. */
  location?: string;
  remarks?: string;
  manuringRoundId?: RowId | null | '';
  manuringRoundName?: string | null;
  maintRoundId?: RowId | null | '';
  maintRoundName?: string | null;
  /** Data URL (compressed JPEG) or null. */
  picture?: string | null;
  /** Display name of the user who recorded it. */
  user?: string;
}

/** opp_manuring_rounds — Manuring Program. */
export interface ManuringRoundRow extends EstateRow {
  name: string;
  fertilizerItemId: RowId;
  fertilizerName: string;
  unit?: string;
  kgPerUnit?: number;
  kgPerPalm?: number;
  blocks: string[];
  notes?: string;
  /** yyyy-mm; some old rows use the lowercase column `targetperiod`. */
  targetPeriod?: string;
  targetperiod?: string;
  active?: boolean;
}

/** opp_fieldmaint_rounds — Maintenance Program. */
export interface FieldMaintRoundRow extends EstateRow {
  name: string;
  blocks: string[];
  notes?: string;
  targetPeriod?: string;
  targetperiod?: string;
  maintType?: string;
  createdAt?: string;
  active?: boolean;
}

/** opp_maint_claims — claimed maintenance area per round/block/month. */
export interface MaintClaimRow extends EstateRow {
  roundId: RowId;
  roundName: string;
  blockName: string;
  claimedArea: number;
  /** yyyy-mm */
  month: string;
}

/** opp_chem_ingredients — active ingredient definitions. */
export interface ChemIngredientRow extends EstateRow {
  name: string;
  itemId: RowId;
  itemName: string;
  unit: string;
  maxDosage?: number;
  density?: number | null;
}

/** opp_rainfall_txns — one reading per date. */
export interface RainfallRow extends EstateRow {
  date: string;
  mm: number;
  picture?: string | null;
  createdAt?: string;
}

/** opp_estates */
export interface EstateNameRow {
  name: string;
}

export type Role = 'superadmin' | 'hq_user' | 'estate_user' | 'user';
export type Access = 'none' | 'view' | 'edit';

/** permissions JSON on opp_users: section id → access, plus flags.
 *  Very old rows store an array of section ids (all 'edit'). */
export type Permissions =
  | (Record<string, Access | string | boolean | undefined> & { __role?: Role; __configured?: boolean })
  | string[];

/** opp_users — profile columns (password_hash is never sent to the browser). */
export interface UserRow {
  id: number;
  name: string;
  email: string;
  estates: string[] | null;
  permissions: Permissions | null;
  status: 'active' | 'inactive' | string | null;
  last_active: string | null;
}

/** The signed-in user, stored in localStorage `opp_auth_session`
 *  (same shape as the legacy app). */
export interface Session {
  id?: number;
  email: string;
  name: string;
  estates?: string[];
  /** Last estate the user picked; restored on reload if still allowed. */
  estate: string;
  role: Role;
  permissions: Permissions;
}

/** Profile returned by the stock-auth Edge Function. */
export interface Profile {
  id: number;
  email: string;
  name: string;
  estates: string[];
  role: Role;
  permissions: Permissions;
  status: string;
}
