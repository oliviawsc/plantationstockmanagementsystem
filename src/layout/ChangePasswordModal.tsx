import { useState } from 'react';
import { Modal } from '../components/Modal';
import { isTextKey, useI18n } from '../i18n';
import { changePassword } from '../lib/auth';

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [conf, setConf] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setError('');
    if (!cur) return setError(t('cp_err_current'));
    if (next.length < 6) return setError(t('cp_err_short'));
    if (next !== conf) return setError(t('cp_err_match'));
    setBusy(true);
    try {
      await changePassword(cur, next);
      setDone(true);
      setTimeout(onClose, 1500);
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      setError(t(isTextKey(code) ? code : 'cp_err_network'));
    } finally {
      setBusy(false);
    }
  }

  const field = (id: string, label: string, ph: string, value: string, set: (v: string) => void) => (
    <div>
      <label htmlFor={id} className="block text-[12.5px] font-medium text-gray-700 mb-1">{label}</label>
      <input id={id} type="password" className="modal-input" placeholder={ph} value={value} onChange={(e) => set(e.target.value)} />
    </div>
  );

  return (
    <Modal title={<>🔒 {t('avatar_change_pw')}</>} onClose={onClose} testId="change-password-modal">
      <div className="flex flex-col gap-3">
        {field('cpCurrentPw', t('cp_lbl_current'), t('cp_ph_current'), cur, setCur)}
        {field('cpNewPw', t('cp_lbl_new'), t('cp_ph_new'), next, setNext)}
        {field('cpConfirmPw', t('cp_lbl_confirm'), t('cp_ph_confirm'), conf, setConf)}
        {error && <p className="text-xs text-red-600 m-0" role="alert">{error}</p>}
        {done && <p className="text-xs text-green-600 font-semibold m-0">{t('cp_success')}</p>}
      </div>
      <div className="flex gap-2 mt-4">
        <button type="button" onClick={onClose}
          className="flex-1 py-2 rounded-lg border border-slate-200 bg-slate-50 text-gray-700 text-[13px] font-semibold cursor-pointer">
          {t('btn_cancel')}
        </button>
        <button type="button" onClick={() => void save()} disabled={busy || done} className="btn btn-primary flex-1 justify-center py-2 text-[13px]">
          {busy ? <><span className="save-spinner" />{t('saving')}</> : t('btn_save')}
        </button>
      </div>
    </Modal>
  );
}
