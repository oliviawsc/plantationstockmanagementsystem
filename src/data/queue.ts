// Persistent queue of row-level writes that could not reach Supabase
// (offline or failed). Stored in localStorage `opp_row_queue`.
//
// The legacy app queued whole tables ({key, estate} in `opp_sync_queue`) and
// re-pushed the cached array. `migrateLegacyQueue` turns those entries into
// one bulk upsert of that cached snapshot (the old semantics) exactly once.
import { LEGACY_SYNC_QUEUE_KEY, ROW_QUEUE_KEY } from '../lib/config';
import { readArray, removeKey, writeJson } from '../lib/storage';
import type { RowId } from '../lib/types';
import { cacheKey } from './cache';
import { sameId, type AnyRow, type TableName } from './tables';

interface OpBase {
  /** Unique id of this queue entry. */
  qid: string;
  table: TableName;
  estate: string;
}
export interface UpsertOp extends OpBase { kind: 'upsert'; rows: AnyRow[] }
export interface UpdateOp extends OpBase { kind: 'update'; id: RowId; patch: Record<string, unknown> }
export interface DeleteOp extends OpBase { kind: 'delete'; ids: RowId[] }
export type RowOp = UpsertOp | UpdateOp | DeleteOp;
export type NewRowOp =
  | Omit<UpsertOp, 'qid'>
  | Omit<UpdateOp, 'qid'>
  | Omit<DeleteOp, 'qid'>;

let counter = 0;
export function newQid(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadQueue(store: Storage = localStorage): RowOp[] {
  return readArray<RowOp>(ROW_QUEUE_KEY, store).filter((o) => o && typeof o === 'object' && 'kind' in o);
}

export function saveQueue(q: RowOp[], store: Storage = localStorage) {
  if (q.length === 0) removeKey(ROW_QUEUE_KEY, store);
  else writeJson(ROW_QUEUE_KEY, q, store);
}

const sameScope = (o: RowOp, table: string, estate: string) => o.table === table && o.estate === estate;

export function opsFor(q: RowOp[], table: string, estate: string): RowOp[] {
  return q.filter((o) => sameScope(o, table, estate));
}

/** Ids an op touches. */
export function opIds(o: RowOp): RowId[] {
  if (o.kind === 'upsert') return o.rows.map((r) => r.id);
  if (o.kind === 'update') return [o.id];
  return o.ids;
}

/**
 * Add an op, folding it into earlier queued ops for the same rows so the
 * queue stays small and the server ends in the same state:
 *  - upsert replaces queued copies of the same row and drops their updates;
 *  - update merges into a queued upsert or update of that row;
 *  - delete removes the row from queued upserts/updates, then is queued
 *    itself (the row may already exist on the server).
 */
export function enqueue(q: RowOp[], op: NewRowOp): RowOp[] {
  const out = q.map((o) => (o.kind === 'upsert' ? { ...o, rows: [...o.rows] } : o)) as RowOp[];
  const scope = out.filter((o) => sameScope(o, op.table, op.estate));

  if (op.kind === 'update') {
    for (let i = scope.length - 1; i >= 0; i--) {
      const o = scope[i];
      if (o.kind === 'delete' && o.ids.some((id) => sameId(id, op.id))) break;
      if (o.kind === 'upsert') {
        const idx = o.rows.findIndex((r) => sameId(r.id, op.id));
        if (idx >= 0) { o.rows[idx] = { ...o.rows[idx], ...op.patch }; return out; }
      }
      if (o.kind === 'update' && sameId(o.id, op.id)) {
        const merged: UpdateOp = { ...o, patch: { ...o.patch, ...op.patch } };
        out[out.indexOf(o)] = merged;
        return out;
      }
    }
    return [...out, { ...op, qid: newQid() }];
  }

  if (op.kind === 'upsert') {
    const rows = [...op.rows];
    const ids = new Set(rows.map((r) => String(r.id)));
    let result = out.filter((o) => !(sameScope(o, op.table, op.estate) && o.kind === 'update' && ids.has(String(o.id))));
    for (const o of result) {
      if (!sameScope(o, op.table, op.estate) || o.kind !== 'upsert') continue;
      for (let i = rows.length - 1; i >= 0; i--) {
        const idx = o.rows.findIndex((r) => sameId(r.id, rows[i].id));
        if (idx >= 0) { o.rows[idx] = rows[i]; rows.splice(i, 1); }
      }
    }
    if (rows.length > 0) result = [...result, { ...op, rows, qid: newQid() }];
    return result;
  }

  // delete
  const drop = new Set(op.ids.map(String));
  const result: RowOp[] = [];
  for (const o of out) {
    if (!sameScope(o, op.table, op.estate)) { result.push(o); continue; }
    if (o.kind === 'update' && drop.has(String(o.id))) continue;
    if (o.kind === 'upsert') {
      const rows = o.rows.filter((r) => !drop.has(String(r.id)));
      if (rows.length > 0) result.push({ ...o, rows });
      continue;
    }
    result.push(o);
  }
  return [...result, { ...op, qid: newQid() }];
}

export function removeOp(q: RowOp[], qid: string): RowOp[] {
  return q.filter((o) => o.qid !== qid);
}

interface LegacyEntry { key: string; estate: string }

/**
 * One-time conversion of the legacy whole-table queue into row ops:
 * each {key, estate} becomes an upsert of the cached `key::estate` array
 * (what the legacy drain pushed). The legacy key is removed afterwards.
 */
export function migrateLegacyQueue(q: RowOp[], store: Storage = localStorage): { queue: RowOp[]; migrated: number } {
  const legacy = readArray<LegacyEntry>(LEGACY_SYNC_QUEUE_KEY, store)
    .filter((e) => e && typeof e.key === 'string' && typeof e.estate === 'string' && e.estate);
  if (legacy.length === 0) {
    removeKey(LEGACY_SYNC_QUEUE_KEY, store);
    return { queue: q, migrated: 0 };
  }
  let queue = q;
  for (const e of legacy) {
    const rows = readArray<AnyRow>(cacheKey(e.key, e.estate), store)
      .filter((r) => r && r.id !== undefined && r.id !== null)
      .map((r) => ({ ...r, estate: e.estate }));
    if (rows.length > 0) queue = enqueue(queue, { kind: 'upsert', table: e.key as TableName, estate: e.estate, rows });
  }
  removeKey(LEGACY_SYNC_QUEUE_KEY, store);
  return { queue, migrated: legacy.length };
}
