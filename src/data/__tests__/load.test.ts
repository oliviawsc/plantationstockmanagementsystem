import { describe, expect, it } from 'vitest';
import { mergeAll, type RemoteSnapshot } from '../load';
import type { RowOp } from '../queue';
import { emptyCollections, type Collections } from '../tables';

const remote = (patch: Partial<RemoteSnapshot>): RemoteSnapshot => ({ ...emptyCollections(), ...patch });

describe('mergeAll', () => {
  it('replaces simple tables, keeps the cache when a request failed', () => {
    const cached: Collections = { ...emptyCollections(), items: [{ id: 1, name: 'old', category: 'X', unit: 'kg' }], locations: [{ id: 5, name: 'B1' }] };
    const r = mergeAll('E', remote({ items: [{ id: 2, name: 'new', category: 'X', unit: 'kg' }], locations: null }), cached, [], new Set());
    expect(r.collections.items.map((i) => i.id)).toEqual([2]);
    expect(r.collections.locations).toEqual(cached.locations);
    expect(r.followUps).toEqual([]);
  });

  it('drops cached transactions the server no longer has (deleted remotely), keeps queued ones', () => {
    const txn = (id: number) => ({ id, date: '2026-01-01', itemId: 1, itemName: 'A', category: 'Fertilizer', unit: 'kg', type: 'In', qty: 1 });
    const cached: Collections = { ...emptyCollections(), transactions: [txn(1), txn(2), txn(3)] };
    const queue: RowOp[] = [{ qid: 'q', kind: 'upsert', table: 'opp_transactions', estate: 'E', rows: [txn(3)] }];
    const r = mergeAll('E', remote({ transactions: [txn(1), txn(4)] }), cached, queue, new Set(['4']));
    expect(r.collections.transactions.map((t) => t.id)).toEqual([1, 3]);
    expect(r.followUps).toEqual([{ kind: 'delete', table: 'opp_transactions', estate: 'E', ids: [4] }]);
  });

  it('ignores queued writes of other estates', () => {
    const queue: RowOp[] = [{ qid: 'q', kind: 'upsert', table: 'opp_items', estate: 'Other', rows: [{ id: 9 }] }];
    const r = mergeAll('E', remote({ items: [] }), emptyCollections(), queue, new Set());
    expect(r.collections.items).toEqual([]);
  });

  it('rainfall follow-ups push unsynced rows and delete duplicates', () => {
    const cached: Collections = { ...emptyCollections(), rainfallTxns: [{ id: 3, date: '2026-03-01', mm: 2 }] };
    const r = mergeAll('E', remote({ rainfallTxns: [{ id: 1, date: '2026-03-02', mm: 1 }, { id: 2, date: '2026-03-02', mm: 4 }] }), cached, [], new Set());
    expect(r.collections.rainfallTxns.map((x) => x.id)).toEqual([2, 3]);
    expect(r.followUps).toEqual([
      { kind: 'upsert', table: 'opp_rainfall_txns', estate: 'E', rows: [{ id: 3, date: '2026-03-01', mm: 2 }] },
      { kind: 'delete', table: 'opp_rainfall_txns', estate: 'E', ids: [1] },
    ]);
  });
});
