import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { dismissToast, subscribeToasts, type Toast, type ToastTone } from './toast';

const BG: Record<ToastTone, string> = {
  error: '#dc2626',
  queued: '#b45309',
  success: '#166534',
  info: '#1E1E2E',
};

/** Top-right toasts, click to dismiss (legacy _showToast). */
export function Toaster() {
  const { t } = useI18n();
  const [list, setList] = useState<Toast[]>([]);
  useEffect(() => subscribeToasts(setList), []);
  if (list.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2" role="status" aria-live="polite">
      {list.map((toast) => (
        <button
          key={toast.id}
          type="button"
          title={t('toast_dismiss')}
          onClick={() => dismissToast(toast.id)}
          className="text-left text-white text-[13px] font-semibold leading-snug px-4 py-2.5 rounded-lg shadow-lg max-w-[360px] cursor-pointer"
          style={{ background: BG[toast.tone] }}
          data-testid={`toast-${toast.tone}`}
        >
          {toast.text}
        </button>
      ))}
    </div>
  );
}
