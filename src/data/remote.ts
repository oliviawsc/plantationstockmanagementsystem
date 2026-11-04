// Supabase access for the data layer, behind a small interface so the sync
// engine and provider can be tested with a fake.
import { supabase } from '../lib/supabase';
import type { RowId } from '../lib/types';
import { COLLECTION_KEYS, TABLES, type AnyRow, type CollectionKey, type Collections } from './tables';

export interface RemoteResult { error: { message: string } | null }

export interface RemoteApi {
  upsert(table: string, rows: AnyRow[]): Promise<RemoteResult>;
  update(table: string, id: RowId, patch: Record<string, unknown>): Promise<RemoteResult>;
  remove(table: string, ids: RowId[]): Promise<RemoteResult>;
  /** Every table for one estate; a table whose request failed is null. */
  fetchEstate(estate: string): Promise<{ [K in CollectionKey]: Collections[K] | null }>;
}

const toResult = (r: { error: { message: string } | null }): RemoteResult => ({ error: r.error ? { message: r.error.message } : null });

async function safe(p: PromiseLike<{ error: { message: string } | null }>): Promise<RemoteResult> {
  try { return toResult(await p); } catch (e) {
    return { error: { message: e instanceof Error ? e.message : String(e) } };
  }
}

export const supabaseRemote: RemoteApi = {
  upsert: (table, rows) => safe(supabase.from(table).upsert(rows, { onConflict: 'id' })),
  update: (table, id, patch) => safe(supabase.from(table).update(patch).eq('id', id)),
  remove: (table, ids) => safe(
    ids.length === 1 ? supabase.from(table).delete().eq('id', ids[0]) : supabase.from(table).delete().in('id', ids),
  ),
  async fetchEstate(estate) {
    const results = await Promise.all(COLLECTION_KEYS.map(async (k) => {
      try {
        const { data, error } = await supabase.from(TABLES[k]).select('*').eq('estate', estate);
        if (error) { console.error(`[Supabase] load ${TABLES[k]}`, error); return null; }
        return (data ?? null) as unknown[] | null;
      } catch (e) {
        console.error(`[Supabase] load ${TABLES[k]}`, e);
        return null;
      }
    }));
    const out = {} as { [K in CollectionKey]: Collections[K] | null };
    COLLECTION_KEYS.forEach((k, i) => { (out as Record<string, unknown>)[k] = results[i]; });
    return out;
  },
};
