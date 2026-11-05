// Combines a fresh Supabase fetch with the cache and the queue for one
// estate (the legacy loadFromSupabase merge), as a pure function.
import type { RowId } from '../lib/types';
import { mergeRainfall, mergeReplace, mergeTransactions } from './merge';
import { opsFor, type NewRowOp, type RowOp } from './queue';
import { COLLECTION_KEYS, TABLES, type AnyRow, type CollectionKey, type Collections } from './tables';

export type RemoteSnapshot = { [K in CollectionKey]: Collections[K] | null };

export interface MergeAllResult {
  collections: Collections;
  /** Writes the merge decided on (re-issued deletes, rainfall pushes). */
  followUps: NewRowOp[];
}

export function mergeAll(
  estate: string,
  remote: RemoteSnapshot,
  cached: Collections,
  queue: RowOp[],
  tombstones: Set<string>,
): MergeAllResult {
  const out = { ...cached } as unknown as Record<CollectionKey, AnyRow[]>;
  const followUps: NewRowOp[] = [];

  for (const key of COLLECTION_KEYS) {
    const rows = remote[key] as AnyRow[] | null;
    if (rows === null) continue; // request failed: keep the cache for this table
    const table = TABLES[key];
    const pending = opsFor(queue, table, estate);

    if (key === 'transactions') {
      const r = mergeTransactions(rows, tombstones, pending);
      out[key] = r.rows;
      if (r.reissueDeletes.length > 0) followUps.push({ kind: 'delete', table, estate, ids: r.reissueDeletes });
    } else if (key === 'rainfallTxns') {
      const r = mergeRainfall(rows as (AnyRow & { date?: string })[], cached.rainfallTxns as unknown as (AnyRow & { date?: string })[], pending);
      out[key] = r.rows;
      if (r.toUpsert.length > 0) followUps.push({ kind: 'upsert', table, estate, rows: r.toUpsert });
      if (r.toDelete.length > 0) followUps.push({ kind: 'delete', table, estate, ids: r.toDelete as RowId[] });
    } else {
      out[key] = mergeReplace(rows, pending);
    }
  }
  return { collections: out as unknown as Collections, followUps };
}
