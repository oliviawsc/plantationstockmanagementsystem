// Holds the active estate and its 8 collections. Loads cache-first (legacy
// localStorage keys), then fresh from Supabase with the legacy merge rules.
// Writes are row-level: state + cache update at once, the single row change
// goes to Supabase, and failures wait in the persistent row queue.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ONLINE_DRAIN_DELAY_MS } from '../lib/config';
import type { RowId } from '../lib/types';
import { addTombstones, readAllCollections, readCollection, readTombstones, writeAllCollections, writeCollection } from './cache';
import { mergeAll } from './load';
import { supabaseRemote, type RemoteApi } from './remote';
import { SyncEngine, type SyncNotify } from './sync';
import { syncToasts } from './syncToasts';
import { TABLES, emptyCollections, sameId, type AnyRow, type CollectionKey, type Collections, type RowTypes } from './tables';

export type NewRow<K extends CollectionKey> = Omit<RowTypes[K], 'estate'>;
export interface RowOptions {
  /** Write to another estate than the active one (e.g. Settings → Blocks). */
  estate?: string;
}
type WriteResult = Promise<'sent' | 'queued'>;

export interface EstateDataValue {
  estate: string;
  setEstate: (estate: string) => void;
  data: Collections;
  /** True while the Supabase fetch for the active estate runs. */
  loading: boolean;
  reload: () => Promise<void>;
  insertRow: <K extends CollectionKey>(key: K, row: NewRow<K>, opts?: RowOptions) => WriteResult;
  updateRow: <K extends CollectionKey>(key: K, id: RowId, patch: Partial<RowTypes[K]>, opts?: RowOptions) => WriteResult;
  deleteRow: <K extends CollectionKey>(key: K, id: RowId, opts?: RowOptions) => WriteResult;
  /** Insert or replace several rows at once (e.g. renames cascading to transactions). */
  upsertRows: <K extends CollectionKey>(key: K, rows: NewRow<K>[], opts?: RowOptions) => WriteResult;
}

const Ctx = createContext<EstateDataValue | null>(null);

interface Props {
  /** Estate to open first (already checked against the allowed list). */
  initialEstate: string;
  /** Called when the user picks another estate (persist it in the session). */
  onEstateChange?: (estate: string) => void;
  api?: RemoteApi;
  notify?: SyncNotify;
  children: ReactNode;
}

export function EstateDataProvider({ initialEstate, onEstateChange, api = supabaseRemote, notify = syncToasts, children }: Props) {
  const [estate, setEstateState] = useState(initialEstate);
  const [data, setData] = useState<Collections>(() => readAllCollections(initialEstate));
  const [loading, setLoading] = useState(false);
  const estateRef = useRef(estate);
  const dataRef = useRef(data);
  const engine = useMemo(() => new SyncEngine({ api, notify, isOnline: () => navigator.onLine }), [api, notify]);

  const commit = useCallback((next: Collections) => {
    dataRef.current = next;
    setData(next);
  }, []);

  const reload = useCallback(async () => {
    const e = estateRef.current;
    if (!e) return;
    setLoading(true);
    try {
      const remote = await api.fetchEstate(e);
      if (estateRef.current !== e) return; // estate switched meanwhile
      const { collections, followUps } = mergeAll(e, remote, dataRef.current, engine.queue(), readTombstones(e));
      writeAllCollections(e, collections);
      commit(collections);
      for (const op of followUps) void engine.submit(op);
    } catch (err) {
      console.error('[Supabase] loadFromSupabase failed', err);
    } finally {
      if (estateRef.current === e) setLoading(false);
    }
  }, [api, engine, commit]);

  // Cache first, then fresh data, whenever the active estate changes.
  useEffect(() => {
    estateRef.current = estate;
    commit(estate ? readAllCollections(estate) : emptyCollections());
    void reload();
  }, [estate, reload, commit]);

  // Legacy queue migration + drain on start, and on every 'online' event.
  useEffect(() => {
    engine.migrateLegacy();
    if (navigator.onLine) void engine.drain();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onOnline = () => { timer = setTimeout(() => void engine.drain(), ONLINE_DRAIN_DELAY_MS); };
    window.addEventListener('online', onOnline);
    return () => { window.removeEventListener('online', onOnline); if (timer) clearTimeout(timer); };
  }, [engine]);

  const setEstate = useCallback((next: string) => {
    if (next === estateRef.current) return;
    onEstateChange?.(next);
    setEstateState(next);
  }, [onEstateChange]);

  /** Apply a change to one collection of `target` estate (state when active, cache always). */
  const mutate = useCallback(<K extends CollectionKey>(key: K, target: string, fn: (rows: AnyRow[]) => AnyRow[]) => {
    if (target === estateRef.current) {
      const next = { ...dataRef.current, [key]: fn(dataRef.current[key] as unknown as AnyRow[]) } as Collections;
      writeCollection(key, target, next[key]);
      commit(next);
    } else {
      const rows = fn(readCollection(key, target) as unknown as AnyRow[]);
      writeCollection(key, target, rows as unknown as Collections[K]);
    }
  }, [commit]);

  const targetOf = (opts?: RowOptions) => {
    const target = opts?.estate ?? estateRef.current;
    if (!target) throw new Error('alert_select_estate');
    return target;
  };

  const upsertRows = useCallback(<K extends CollectionKey>(key: K, rows: NewRow<K>[], opts?: RowOptions) => {
    const target = targetOf(opts);
    const tagged = rows.map((r) => ({ ...(r as object), estate: target }) as AnyRow);
    mutate(key, target, (cur) => {
      const out = [...cur];
      for (const r of tagged) {
        const idx = out.findIndex((x) => sameId(x.id, r.id));
        if (idx >= 0) out[idx] = r; else out.push(r);
      }
      return out;
    });
    return engine.submit({ kind: 'upsert', table: TABLES[key], estate: target, rows: tagged });
  }, [engine, mutate]);

  const insertRow = useCallback(<K extends CollectionKey>(key: K, row: NewRow<K>, opts?: RowOptions) =>
    upsertRows(key, [row], opts), [upsertRows]);

  const updateRow = useCallback(<K extends CollectionKey>(key: K, id: RowId, patch: Partial<RowTypes[K]>, opts?: RowOptions) => {
    const target = targetOf(opts);
    const p = { ...(patch as Record<string, unknown>) };
    delete p.id;
    mutate(key, target, (cur) => cur.map((x) => (sameId(x.id, id) ? { ...x, ...p } : x)));
    return engine.submit({ kind: 'update', table: TABLES[key], estate: target, id, patch: p });
  }, [engine, mutate]);

  const deleteRow = useCallback(<K extends CollectionKey>(key: K, id: RowId, opts?: RowOptions) => {
    const target = targetOf(opts);
    // Tombstone first so the delete survives a reload before Supabase confirms it.
    if (key === 'transactions') addTombstones(target, [id]);
    mutate(key, target, (cur) => cur.filter((x) => !sameId(x.id, id)));
    return engine.submit({ kind: 'delete', table: TABLES[key], estate: target, ids: [id] });
  }, [engine, mutate]);

  const value = useMemo<EstateDataValue>(() => ({
    estate, setEstate, data, loading, reload, insertRow, updateRow, deleteRow, upsertRows,
  }), [estate, setEstate, data, loading, reload, insertRow, updateRow, deleteRow, upsertRows]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEstateData(): EstateDataValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useEstateData outside EstateDataProvider');
  return v;
}
