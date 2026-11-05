// Sends row writes to Supabase and keeps the ones that fail in the
// persistent queue, draining it with the legacy retry schedule
// (immediately, then after 4 s, then after 10 s).
import { DRAIN_RETRY_DELAYS_MS } from '../lib/config';
import { removeTombstones } from './cache';
import { enqueue, loadQueue, migrateLegacyQueue, opsFor, removeOp, saveQueue, type NewRowOp, type RowOp } from './queue';
import type { RemoteApi } from './remote';
import { TABLES } from './tables';

export interface SyncNotify {
  /** A write was kept for later (legacy "Offline — data saved locally…"). */
  queued(): void;
  /** The server rejected a write while online (legacy "Sync Error: …"). */
  error(kind: 'save' | 'delete', table: string, message: string): void;
  /** The queue drained completely after having items. */
  success(): void;
  /** Items still pending after every retry. */
  pendingFail(count: number): void;
}

export interface SyncDeps {
  api: RemoteApi;
  notify: SyncNotify;
  isOnline: () => boolean;
  store?: Storage;
  sleep?: (ms: number) => Promise<void>;
  retryDelays?: number[];
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class SyncEngine {
  private draining = false;
  private readonly store: Storage;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly delays: number[];

  constructor(private readonly deps: SyncDeps) {
    this.store = deps.store ?? localStorage;
    this.sleep = deps.sleep ?? defaultSleep;
    this.delays = deps.retryDelays ?? DRAIN_RETRY_DELAYS_MS;
  }

  queue(): RowOp[] {
    return loadQueue(this.store);
  }

  pendingFor(table: string, estate: string): RowOp[] {
    return opsFor(this.queue(), table, estate);
  }

  /** Converts legacy `opp_sync_queue` entries once. Returns how many. */
  migrateLegacy(): number {
    const { queue, migrated } = migrateLegacyQueue(this.queue(), this.store);
    if (migrated > 0) saveQueue(queue, this.store);
    return migrated;
  }

  private keep(op: NewRowOp) {
    saveQueue(enqueue(this.queue(), op), this.store);
    this.deps.notify.queued();
  }

  /** Try to send one write now; queue it when offline or when it fails. */
  async submit(op: NewRowOp): Promise<'sent' | 'queued'> {
    if (!this.deps.isOnline()) { this.keep(op); return 'queued'; }
    if (this.pendingFor(op.table, op.estate).length > 0) {
      // Keep order: earlier writes to this table are still waiting.
      this.keep(op);
      void this.drain();
      return 'queued';
    }
    const ok = await this.execute(op);
    if (!ok) { this.keep(op); return 'queued'; }
    return 'sent';
  }

  /** Runs one op against Supabase. */
  private async execute(op: NewRowOp | RowOp): Promise<boolean> {
    const { api } = this.deps;
    let res;
    if (op.kind === 'upsert') res = await api.upsert(op.table, op.rows.map((r) => ({ ...r, estate: op.estate })));
    else if (op.kind === 'update') res = await api.update(op.table, op.id, op.patch);
    else res = await api.remove(op.table, op.ids);
    if (res.error) {
      if (this.deps.isOnline()) {
        console.error(`[Supabase] ${op.kind} ${op.table}`, res.error);
        this.deps.notify.error(op.kind === 'delete' ? 'delete' : 'save', op.table, res.error.message);
      }
      return false;
    }
    if (op.kind === 'delete' && op.table === TABLES.transactions) removeTombstones(op.estate, op.ids, this.store);
    return true;
  }

  /** Drain the queue (legacy drainSyncQueue). Safe to call repeatedly. */
  async drain(): Promise<void> {
    if (this.draining || this.queue().length === 0) return;
    this.draining = true;
    try {
      for (const delay of this.delays) {
        if (delay > 0) await this.sleep(delay);
        if (!this.deps.isOnline()) return; // wait for the next 'online' event
        const current = this.queue();
        if (current.length === 0) return; // cleared elsewhere (another tab)
        for (const op of current) {
          const snapshot = JSON.stringify(op);
          if (await this.execute(op)) {
            // Only drop it if nothing was folded into it meanwhile.
            const now = this.queue();
            const still = now.find((o) => o.qid === op.qid);
            if (still && JSON.stringify(still) === snapshot) saveQueue(removeOp(now, op.qid), this.store);
          }
        }
        if (this.queue().length === 0) { this.deps.notify.success(); return; }
      }
      const left = this.queue().length;
      if (left > 0) this.deps.notify.pendingFail(left);
    } finally {
      this.draining = false;
    }
  }
}
