import { describe, expect, it } from 'vitest';
import { mergeRainfall, mergeReplace, mergeTransactions, overlayPending } from '../merge';
import type { RowOp } from '../queue';

const T = 'opp_transactions';
const up = (rows: { id: number | string; [k: string]: unknown }[], table = T): RowOp => ({ qid: 'q' + Math.random(), kind: 'upsert', table: table as never, estate: 'E', rows });
const upd = (id: number, patch: Record<string, unknown>): RowOp => ({ qid: 'u' + id, kind: 'update', table: T, estate: 'E', id, patch });
const del = (ids: (number | string)[]): RowOp => ({ qid: 'd' + ids.join(), kind: 'delete', table: T, estate: 'E', ids });

describe('overlayPending', () => {
  it('applies upserts, updates and deletes in order', () => {
    const rows = [{ id: 1, qty: 1 }, { id: 2, qty: 2 }];
    const out = overlayPending(rows, [up([{ id: 3, qty: 3 }]), upd(1, { qty: 10 }), del([2]), upd(99, { qty: 1 })]);
    expect(out).toEqual([{ id: 1, qty: 10 }, { id: 3, qty: 3 }]);
  });
  it('compares ids as strings', () => {
    expect(overlayPending([{ id: '5', a: 1 }], [upd(5, { a: 2 })])).toEqual([{ id: '5', a: 2 }]);
  });
});

describe('mergeReplace', () => {
  it('server copy replaces the cache, pending writes stay on top', () => {
    expect(mergeReplace([{ id: 1, name: 'A' }], [up([{ id: 2, name: 'B' }], 'opp_items')])).toEqual([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
  });
});

describe('mergeTransactions', () => {
  it('drops tombstoned server rows and re-issues their delete', () => {
    const r = mergeTransactions([{ id: 1 }, { id: 2 }], new Set(['2']), []);
    expect(r.rows).toEqual([{ id: 1 }]);
    expect(r.reissueDeletes).toEqual([2]);
  });
  it('does not re-issue a delete that is already queued', () => {
    const r = mergeTransactions([{ id: 1 }, { id: 2 }], new Set(['2']), [del([2])]);
    expect(r.reissueDeletes).toEqual([]);
    expect(r.rows).toEqual([{ id: 1 }]);
  });
  it('keeps locally added rows that are still queued, after server rows', () => {
    const r = mergeTransactions([{ id: 1 }], new Set(), [up([{ id: 9, qty: 4 }])]);
    expect(r.rows).toEqual([{ id: 1 }, { id: 9, qty: 4 }]);
  });
  it('keeps a queued local edit over the server version', () => {
    const r = mergeTransactions([{ id: 1, qty: 1 }], new Set(), [upd(1, { qty: 7 })]);
    expect(r.rows).toEqual([{ id: 1, qty: 7 }]);
  });
});

describe('mergeRainfall', () => {
  const R = 'opp_rainfall_txns';
  it('keeps and pushes cached rows the server never got', () => {
    const r = mergeRainfall([{ id: 1, date: '2026-01-01', mm: 1 }], [{ id: 2, date: '2026-01-02', mm: 5 }], []);
    expect(r.rows.map((x) => x.id)).toEqual([2, 1]); // newest date first
    expect(r.toUpsert.map((x) => x.id)).toEqual([2]);
    expect(r.toDelete).toEqual([]);
  });
  it('one reading per date: highest id wins, the loser is deleted on the server', () => {
    const r = mergeRainfall(
      [{ id: 10, date: '2026-02-01', mm: 1 }, { id: 20, date: '2026-02-01', mm: 2 }],
      [], [],
    );
    expect(r.rows).toEqual([{ id: 20, date: '2026-02-01', mm: 2 }]);
    expect(r.toDelete).toEqual([10]);
  });
  it('a local duplicate with a higher id replaces the server row', () => {
    const r = mergeRainfall([{ id: 10, date: '2026-02-01', mm: 1 }], [{ id: 30, date: '2026-02-01', mm: 9 }], []);
    expect(r.rows.map((x) => x.id)).toEqual([30]);
    expect(r.toUpsert.map((x) => x.id)).toEqual([30]);
    expect(r.toDelete).toEqual([10]);
  });
  it('compares numeric-string ids numerically', () => {
    const r = mergeRainfall([{ id: '9', date: 'd' }, { id: 10, date: 'd' }], [], []);
    expect(r.rows.map((x) => x.id)).toEqual([10]);
  });
  it('does not push rows that are already queued', () => {
    const q: RowOp = { qid: 'x', kind: 'upsert', table: R, estate: 'E', rows: [{ id: 2, date: '2026-01-02', mm: 5 }] };
    const r = mergeRainfall([], [{ id: 2, date: '2026-01-02', mm: 5 }], [q]);
    expect(r.rows).toHaveLength(1);
    expect(r.toUpsert).toEqual([]);
  });
});
