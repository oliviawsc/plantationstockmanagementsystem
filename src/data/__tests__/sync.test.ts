import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addTombstones, readTombstones } from '../cache';
import { loadQueue } from '../queue';
import type { RemoteApi, RemoteResult } from '../remote';
import { SyncEngine, type SyncNotify } from '../sync';

const ok: RemoteResult = { error: null };
const fail: RemoteResult = { error: { message: 'boom' } };

function setup(opts: { online?: boolean; results?: RemoteResult[] } = {}) {
  let online = opts.online ?? true;
  const results = [...(opts.results ?? [])];
  const next = () => Promise.resolve(results.length ? results.shift()! : ok);
  const api: RemoteApi = {
    upsert: vi.fn(next), update: vi.fn(next), remove: vi.fn(next),
    fetchEstate: vi.fn(),
  };
  const notify: SyncNotify = { queued: vi.fn(), error: vi.fn(), success: vi.fn(), pendingFail: vi.fn() };
  const sleeps: number[] = [];
  const engine = new SyncEngine({
    api, notify, isOnline: () => online,
    sleep: (ms) => { sleeps.push(ms); return Promise.resolve(); },
  });
  return { api, notify, engine, sleeps, setOnline: (v: boolean) => { online = v; } };
}

const ins = { kind: 'upsert' as const, table: 'opp_items' as const, estate: 'E', rows: [{ id: 1, name: 'A' }] };

describe('SyncEngine.submit', () => {
  beforeEach(() => localStorage.clear());

  it('sends the single row, tagged with its estate', async () => {
    const { api, engine, notify } = setup();
    expect(await engine.submit(ins)).toBe('sent');
    expect(api.upsert).toHaveBeenCalledWith('opp_items', [{ id: 1, name: 'A', estate: 'E' }]);
    expect(notify.queued).not.toHaveBeenCalled();
    expect(loadQueue()).toEqual([]);
  });

  it('offline: queues without trying and shows the queued toast', async () => {
    const { api, engine, notify } = setup({ online: false });
    expect(await engine.submit(ins)).toBe('queued');
    expect(api.upsert).not.toHaveBeenCalled();
    expect(notify.queued).toHaveBeenCalledTimes(1);
    expect(loadQueue()).toHaveLength(1);
  });

  it('server error while online: sync error toast + queued', async () => {
    const { engine, notify } = setup({ results: [fail] });
    expect(await engine.submit(ins)).toBe('queued');
    expect(notify.error).toHaveBeenCalledWith('save', 'opp_items', 'boom');
    expect(notify.queued).toHaveBeenCalled();
    expect(loadQueue()).toHaveLength(1);
  });

  it('keeps order: a write behind pending writes of the same table is queued, then drained', async () => {
    const s = setup({ online: false });
    await s.engine.submit(ins);
    s.setOnline(true);
    await s.engine.submit({ kind: 'update', table: 'opp_items', estate: 'E', id: 1, patch: { name: 'B' } });
    await vi.waitFor(() => expect(loadQueue()).toEqual([]));
    // the update was folded into the queued insert → one upsert with the new name
    expect(s.api.upsert).toHaveBeenCalledWith('opp_items', [{ id: 1, name: 'B', estate: 'E' }]);
    expect(s.api.update).not.toHaveBeenCalled();
  });

  it('a confirmed transaction delete clears its tombstone', async () => {
    const { engine } = setup();
    addTombstones('E', [7]);
    await engine.submit({ kind: 'delete', table: 'opp_transactions', estate: 'E', ids: [7] });
    expect(readTombstones('E').size).toBe(0);
  });

  it('a failed transaction delete keeps its tombstone', async () => {
    const { engine, notify } = setup({ results: [fail] });
    addTombstones('E', [7]);
    await engine.submit({ kind: 'delete', table: 'opp_transactions', estate: 'E', ids: [7] });
    expect(readTombstones('E').has('7')).toBe(true);
    expect(notify.error).toHaveBeenCalledWith('delete', 'opp_transactions', 'boom');
  });
});

describe('SyncEngine.drain', () => {
  beforeEach(() => localStorage.clear());

  it('retries with the legacy delays (0, 4 s, 10 s) and reports what is left', async () => {
    const s = setup({ online: false });
    await s.engine.submit(ins);
    s.setOnline(true);
    const always = vi.fn(() => Promise.resolve(fail));
    s.api.upsert = always;
    await s.engine.drain();
    expect(s.sleeps).toEqual([4000, 10000]);
    expect(always).toHaveBeenCalledTimes(3);
    expect(s.notify.pendingFail).toHaveBeenCalledWith(1);
    expect(s.notify.success).not.toHaveBeenCalled();
    expect(loadQueue()).toHaveLength(1);
  });

  it('succeeds on a retry and shows the success toast', async () => {
    const s = setup({ online: false });
    await s.engine.submit(ins);
    s.setOnline(true);
    s.api.upsert = vi.fn().mockResolvedValueOnce(fail).mockResolvedValue(ok);
    await s.engine.drain();
    expect(s.sleeps).toEqual([4000]);
    expect(s.notify.success).toHaveBeenCalledTimes(1);
    expect(loadQueue()).toEqual([]);
  });

  it('stops when the device goes offline again', async () => {
    const s = setup({ online: false });
    await s.engine.submit(ins);
    await s.engine.drain();
    expect(s.api.upsert).not.toHaveBeenCalled();
    expect(loadQueue()).toHaveLength(1);
  });

  it('does nothing with an empty queue', async () => {
    const s = setup();
    await s.engine.drain();
    expect(s.notify.success).not.toHaveBeenCalled();
  });

  it('drains converted legacy entries with the old whole-array semantics', async () => {
    localStorage.setItem('opp_sync_queue', JSON.stringify([{ key: 'opp_rainfall_txns', estate: 'E' }]));
    localStorage.setItem('opp_rainfall_txns::E', JSON.stringify([{ id: 1, date: '2026-01-01', mm: 3 }]));
    const s = setup();
    expect(s.engine.migrateLegacy()).toBe(1);
    await s.engine.drain();
    expect(s.api.upsert).toHaveBeenCalledWith('opp_rainfall_txns', [{ id: 1, date: '2026-01-01', mm: 3, estate: 'E' }]);
    expect(loadQueue()).toEqual([]);
    expect(localStorage.getItem('opp_sync_queue')).toBeNull();
  });
});
