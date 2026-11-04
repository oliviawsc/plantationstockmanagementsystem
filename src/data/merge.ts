// Merge rules applied when fresh data arrives from Supabase, ported from
// legacy loadFromSupabase (legacy/index.html ~4285–4420) and extended with
// the row queue: writes still waiting in the queue are laid over the server
// data so an offline edit is never lost on reload.
import type { RowId } from '../lib/types';
import type { RowOp } from './queue';
import { sameId, type AnyRow } from './tables';

/** Apply queued ops (in order) on top of server rows. Updates for rows that
 *  no longer exist anywhere are dropped (the row was deleted elsewhere). */
export function overlayPending<T extends AnyRow>(rows: T[], pending: RowOp[]): T[] {
  let out = [...rows];
  for (const op of pending) {
    if (op.kind === 'upsert') {
      for (const r of op.rows as T[]) {
        const idx = out.findIndex((x) => sameId(x.id, r.id));
        if (idx >= 0) out[idx] = r; else out.push(r);
      }
    } else if (op.kind === 'update') {
      const idx = out.findIndex((x) => sameId(x.id, op.id));
      if (idx >= 0) out[idx] = { ...out[idx], ...op.patch };
    } else {
      const drop = new Set(op.ids.map(String));
      out = out.filter((x) => !drop.has(String(x.id)));
    }
  }
  return out;
}

/** Items, locations, rounds, claims, ingredients: the server copy replaces
 *  the cache (legacy), plus queued writes. */
export function mergeReplace<T extends AnyRow>(remote: T[], pending: RowOp[]): T[] {
  return overlayPending(remote, pending);
}

export interface TxnMergeResult<T> {
  rows: T[];
  /** Tombstoned ids still on the server with no queued delete: delete again. */
  reissueDeletes: RowId[];
}

/**
 * Transactions (legacy rules):
 *  - drop server rows whose id is tombstoned (deleted here, delete pending);
 *  - re-issue the delete for tombstoned ids still on the server;
 *  - a cached row missing from the server was deleted remotely (e.g. by the
 *    Super Admin) and is NOT re-pushed — unless it is a queued write, which
 *    is how the legacy "locally added, not yet pushed" case is now tracked.
 */
export function mergeTransactions<T extends AnyRow>(remote: T[], tombstones: Set<string>, pending: RowOp[]): TxnMergeResult<T> {
  const queuedDeletes = new Set(
    pending.flatMap((o) => (o.kind === 'delete' ? o.ids.map(String) : [])),
  );
  const rows = remote.filter((r) => !tombstones.has(String(r.id)));
  const reissueDeletes = remote
    .filter((r) => tombstones.has(String(r.id)) && !queuedDeletes.has(String(r.id)))
    .map((r) => r.id);
  return { rows: overlayPending(rows, pending), reissueDeletes };
}

export interface RainfallMergeResult<T> {
  rows: T[];
  /** Cached rows the server never received: push them. */
  toUpsert: T[];
  /** Server rows that lost the one-reading-per-date dedupe: delete them. */
  toDelete: RowId[];
}

const idValue = (id: RowId) => {
  const n = Number(id);
  return Number.isFinite(n) ? n : NaN;
};

/** a > b for ids that may be numbers or numeric strings. */
function idGreater(a: RowId, b: RowId): boolean {
  const na = idValue(a);
  const nb = idValue(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na > nb;
  return String(a) > String(b);
}

/**
 * Rainfall (legacy rules): keep cached rows the server does not have and
 * push them up; then keep one reading per date (highest id wins); newest
 * date first.
 */
export function mergeRainfall<T extends AnyRow & { date?: string }>(remote: T[], local: T[], pending: RowOp[]): RainfallMergeResult<T> {
  const remoteIds = new Set(remote.map((r) => String(r.id)));
  const unsynced = local.filter((r) => !remoteIds.has(String(r.id)));
  const merged = overlayPending([...remote, ...unsynced], pending);

  const byDate = new Map<string, T>();
  for (const r of merged) {
    const key = r.date ?? '';
    const cur = byDate.get(key);
    if (!cur || idGreater(r.id, cur.id)) byDate.set(key, r);
  }
  const kept = [...byDate.values()];
  const keptIds = new Set(kept.map((r) => String(r.id)));
  const rows = kept.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  const queuedIds = new Set(pending.flatMap((o) => (o.kind === 'upsert' ? o.rows.map((r) => String(r.id)) : [])));
  const unsyncedIds = new Set(unsynced.map((r) => String(r.id)));
  const toUpsert = rows.filter((r) => unsyncedIds.has(String(r.id)) && !queuedIds.has(String(r.id)));
  const toDelete = remote.filter((r) => !keptIds.has(String(r.id))).map((r) => r.id);
  return { rows, toUpsert, toDelete };
}
