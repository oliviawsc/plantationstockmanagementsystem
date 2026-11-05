// Legacy sync toasts (showSyncError / showSyncQueued / showSyncSuccess).
import { dismissToast, hasToast, showToast } from '../components/toast';
import { readLang, translate } from '../i18n';
import type { SyncNotify } from './sync';

const QUEUED_ID = 'syncQueuedToast';

export const syncToasts: SyncNotify = {
  queued() {
    if (hasToast(QUEUED_ID)) return; // avoid stacking identical toasts
    showToast(translate(readLang(), 'sync_queued'), 'queued', 0, QUEUED_ID);
  },
  error(kind, table, message) {
    const lang = readLang();
    const msg = translate(lang, kind === 'delete' ? 'sync_delete_failed' : 'sync_save_failed', { table, msg: message });
    showToast(translate(lang, 'sync_error', { msg }), 'error', 8000);
  },
  success() {
    dismissToast(QUEUED_ID);
    showToast(translate(readLang(), 'sync_success'), 'success', 6000);
  },
  pendingFail(count) {
    const lang = readLang();
    showToast(translate(lang, 'sync_error', { msg: translate(lang, 'sync_pending_fail', { n: count }) }), 'error', 8000);
  },
};
