import { Modal } from '../components/Modal';
import { useI18n } from '../i18n';
import { displayUserId, initialsOf } from '../lib/session';
import type { Session } from '../lib/types';
import { roleKey } from './roleLabel';

export function ProfileModal({ session, onClose }: { session: Session; onClose: () => void }) {
  const { t } = useI18n();
  const role = t(roleKey(session.role));
  return (
    <Modal title={<>👤 {t('avatar_my_profile')}</>} onClose={onClose} testId="profile-modal">
      <div className="flex flex-col items-center mb-5">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-2.5"
          style={{ background: 'linear-gradient(135deg,#2E7D32,#43A047)' }}>{initialsOf(session)}</div>
        <div className="text-base font-bold text-slate-900">{session.name}</div>
        <div className="text-xs font-semibold mt-0.5" style={{ color: '#2E7D32' }}>{role}</div>
      </div>
      <div className="rounded-[10px] px-4 py-3.5 border border-slate-200 bg-slate-50">
        <div className="mb-2.5">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{t('profile_lbl_userid')}</div>
          <div className="text-[13.5px] font-medium text-slate-900" data-testid="profile-userid">{displayUserId(session.email)}</div>
        </div>
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{t('profile_lbl_role')}</div>
          <div className="text-[13.5px] font-medium text-slate-900">{role}</div>
        </div>
      </div>
      <button type="button" onClick={onClose}
        className="w-full mt-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-gray-700 text-[13px] font-semibold cursor-pointer">
        {t('btn_close')}
      </button>
    </Modal>
  );
}
