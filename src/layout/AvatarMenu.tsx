import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { displayUserId, initialsOf } from '../lib/session';
import type { Session } from '../lib/types';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ProfileModal } from './ProfileModal';
import { roleKey } from './roleLabel';

export function AvatarMenu({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<'profile' | 'password' | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const name = session.name || session.email;
  const pick = (fn: () => void) => () => { setOpen(false); fn(); };

  return (
    <div ref={box} className="relative">
      <button id="avatarBtn" type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}
        className="flex items-center gap-2.5 py-1 pr-2.5 pl-1.5 rounded-full border cursor-pointer transition-colors hover:bg-[#D1FAE5]"
        style={{ borderColor: '#D1FAE5', background: open ? '#D1FAE5' : '#F0FDF4' }}>
        <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg,#2E7D32,#43A047)' }}>{initialsOf(session)}</div>
        <div className="avatar-text text-left leading-tight">
          <div className="text-[12.5px] font-semibold text-slate-900 whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis" data-testid="avatar-name">{name}</div>
          <div className="text-[10.5px] font-medium" style={{ color: '#2E7D32' }}>{t(roleKey(session.role))}</div>
        </div>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-slate-400 shrink-0">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 min-w-[192px] bg-white border border-slate-200 rounded-xl overflow-hidden z-[999]"
          style={{ top: 'calc(100% + 8px)', boxShadow: '0 8px 24px rgba(0,0,0,.10)' }}>
          <div className="px-3.5 py-3 border-b border-slate-100 bg-slate-50">
            <div className="text-[13px] font-bold text-slate-900">{name}</div>
            <div className="text-[11px] text-slate-500 mt-px whitespace-nowrap overflow-hidden text-ellipsis">{displayUserId(session.email)}</div>
          </div>
          <div className="p-1.5">
            <button type="button" role="menuitem" className="avatar-menu-item" onClick={pick(() => setModal('profile'))}>
              <span>👤</span> <span>{t('avatar_my_profile')}</span>
            </button>
            <button type="button" role="menuitem" className="avatar-menu-item" onClick={pick(() => setModal('password'))}>
              <span>🔒</span> <span>{t('avatar_change_pw')}</span>
            </button>
            <div className="h-px bg-slate-100 my-1" />
            <button type="button" role="menuitem" className="avatar-menu-item" style={{ color: '#DC2626' }} onClick={pick(onSignOut)}>
              <span>🚪</span> <span>{t('avatar_log_out')}</span>
            </button>
          </div>
        </div>
      )}
      {modal === 'profile' && <ProfileModal session={session} onClose={() => setModal(null)} />}
      {modal === 'password' && <ChangePasswordModal onClose={() => setModal(null)} />}
    </div>
  );
}
