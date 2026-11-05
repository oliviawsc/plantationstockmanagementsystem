// Per-estate localStorage cache, same keys as the legacy app
// (`opp_items::<estate>` …) so existing users' cached data is reused.
import { readArray, writeJson } from '../lib/storage';
import type { RowId } from '../lib/types';
import { COLLECTION_KEYS, TABLES, emptyCollections, type CollectionKey, type Collections } from './tables';

export const cacheKey = (table: string, estate: string) => `${table}::${estate}`;
export const tombstoneKey = (estate: string) => `opp_deleted_txn_ids::${estate}`;

export function readCollection<K extends CollectionKey>(key: K, estate: string, store: Storage = localStorage): Collections[K] {
  return readArray(cacheKey(TABLES[key], estate), store) as Collections[K];
}

export function writeCollection<K extends CollectionKey>(key: K, estate: string, rows: Collections[K], store: Storage = localStorage) {
  if (!estate) return; // never write a key scoped to an empty estate
  writeJson(cacheKey(TABLES[key], estate), rows, store);
}

export function readAllCollections(estate: string, store: Storage = localStorage): Collections {
  const c = emptyCollections();
  if (!estate) return c;
  for (const k of COLLECTION_KEYS) (c as Record<CollectionKey, unknown[]>)[k] = readCollection(k, estate, store);
  return c;
}

export function writeAllCollections(estate: string, c: Collections, store: Storage = localStorage) {
  for (const k of COLLECTION_KEYS) writeCollection(k, estate, c[k] as never, store);
}

// ── Transaction tombstones: ids deleted here that Supabase may still have ──
export function readTombstones(estate: string, store: Storage = localStorage): Set<string> {
  return new Set(readArray<RowId>(tombstoneKey(estate), store).map(String));
}

export function addTombstones(estate: string, ids: RowId[], store: Storage = localStorage) {
  const set = readTombstones(estate, store);
  ids.forEach((id) => set.add(String(id)));
  writeJson(tombstoneKey(estate), [...set], store);
}

export function removeTombstones(estate: string, ids: RowId[], store: Storage = localStorage) {
  const drop = new Set(ids.map(String));
  const left = [...readTombstones(estate, store)].filter((id) => !drop.has(id));
  writeJson(tombstoneKey(estate), left, store);
}
