import { beforeEach, describe, expect, it } from 'vitest';
import { enqueue, loadQueue, migrateLegacyQueue, saveQueue, type RowOp } from '../queue';

const T = 'opp_items' as const;
const base = { table: T, estate: 'E' };

describe('enqueue coalescing', () => {
  it('update after a queued upsert merges into the upsert', () => {
    let q: RowOp[] = enqueue([], { ...base, kind: 'upsert', rows: [{ id: 1, name: 'a', qty: 1 }] });
    q = enqueue(q, { ...base, kind: 'update', id: 1, patch: { qty: 5 } });
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ kind: 'upsert', rows: [{ id: 1, name: 'a', qty: 5 }] });
  });
  it('updates of the same row merge', () => {
    let q = enqueue([], { ...base, kind: 'update', id: 1, patch: { a: 1 } });
    q = enqueue(q, { ...base, kind: 'update', id: '1', patch: { b: 2 } });
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ kind: 'update', patch: { a: 1, b: 2 } });
  });
  it('upsert replaces a queued copy of the row and drops its updates', () => {
    let q = enqueue([], { ...base, kind: 'upsert', rows: [{ id: 1, v: 1 }, { id: 2, v: 1 }] });
    q = enqueue(q, { ...base, kind: 'update', id: 3, patch: { v: 9 } });
    q = enqueue(q, { ...base, kind: 'upsert', rows: [{ id: 2, v: 2 }, { id: 3, v: 3 }] });
    expect(q.map((o) => o.kind)).toEqual(['upsert', 'upsert']);
    expect((q[0] as { rows: unknown[] }).rows).toEqual([{ id: 1, v: 1 }, { id: 2, v: 2 }]);
    expect((q[1] as { rows: unknown[] }).rows).toEqual([{ id: 3, v: 3 }]);
  });
  it('delete removes the row from queued writes but is still queued', () => {
    let q = enqueue([], { ...base, kind: 'upsert', rows: [{ id: 1 }] });
    q = enqueue(q, { ...base, kind: 'update', id: 2, patch: {} });
    q = enqueue(q, { ...base, kind: 'delete', ids: [1, 2] });
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ kind: 'delete', ids: [1, 2] });
  });
  it('an update after a queued delete is not folded into an earlier upsert', () => {
    let q = enqueue([], { ...base, kind: 'upsert', rows: [{ id: 1, v: 1 }] });
    q = [...q, { qid: 'd', ...base, kind: 'delete', ids: [1] }];
    q = enqueue(q, { ...base, kind: 'update', id: 1, patch: { v: 2 } });
    expect(q.map((o) => o.kind)).toEqual(['upsert', 'delete', 'update']);
  });
  it('different estates and tables never coalesce', () => {
    let q = enqueue([], { ...base, kind: 'upsert', rows: [{ id: 1 }] });
    q = enqueue(q, { table: T, estate: 'F', kind: 'update', id: 1, patch: { a: 1 } });
    q = enqueue(q, { table: 'opp_locations', estate: 'E', kind: 'update', id: 1, patch: { a: 1 } });
    expect(q).toHaveLength(3);
  });
  it('does not mutate the input queue', () => {
    const q0 = enqueue([], { ...base, kind: 'upsert', rows: [{ id: 1, v: 1 }] });
    const snap = JSON.stringify(q0);
    enqueue(q0, { ...base, kind: 'update', id: 1, patch: { v: 2 } });
    expect(JSON.stringify(q0)).toBe(snap);
  });
});

describe('persistence and legacy migration', () => {
  beforeEach(() => localStorage.clear());
  it('round-trips through opp_row_queue and removes the key when empty', () => {
    const q = enqueue([], { ...base, kind: 'delete', ids: [1] });
    saveQueue(q);
    expect(loadQueue()).toEqual(q);
    saveQueue([]);
    expect(localStorage.getItem('opp_row_queue')).toBeNull();
  });
  it('turns legacy {key, estate} entries into an upsert of the cached snapshot, once', () => {
    localStorage.setItem('opp_sync_queue', JSON.stringify([{ key: 'opp_items', estate: 'Ulu Niah Estate' }, { key: 'opp_locations', estate: 'X' }]));
    localStorage.setItem('opp_items::Ulu Niah Estate', JSON.stringify([{ id: 1, name: 'NPK' }, { id: 2, name: 'Urea' }]));
    const { queue, migrated } = migrateLegacyQueue([]);
    expect(migrated).toBe(2);
    expect(queue).toHaveLength(1); // empty snapshot for opp_locations::X adds nothing
    expect(queue[0]).toMatchObject({ kind: 'upsert', table: 'opp_items', estate: 'Ulu Niah Estate', rows: [{ id: 1, name: 'NPK', estate: 'Ulu Niah Estate' }, { id: 2, name: 'Urea', estate: 'Ulu Niah Estate' }] });
    expect(localStorage.getItem('opp_sync_queue')).toBeNull();
    expect(migrateLegacyQueue([]).migrated).toBe(0);
  });
});
