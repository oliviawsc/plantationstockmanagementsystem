import { useEffect, type ReactNode } from 'react';
import { useI18n } from '../i18n';

interface Props {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  testId?: string;
}

/** Centered dialog with a dimmed backdrop (legacy profile / password modals). */
export function Modal({ title, onClose, children, testId }: Props) {
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center" style={{ background: 'rgba(0,0,0,.45)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" data-testid={testId}
        className="bg-white rounded-2xl p-7 w-full max-w-[360px] m-4" style={{ boxShadow: '0 16px 48px rgba(0,0,0,.18)' }}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-bold text-slate-900 m-0">{title}</h3>
          <button type="button" onClick={onClose} aria-label={t('close')} className="bg-transparent border-0 text-lg cursor-pointer text-slate-400">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
