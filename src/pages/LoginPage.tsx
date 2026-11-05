// Login overlay, same look as the legacy #authOverlay.
import { useState, type FormEvent } from 'react';
import { PalmCorners } from '../components/PalmCorners';
import { useErrorText, useI18n } from '../i18n';
import { goToWorkerPortal, signIn } from '../lib/auth';
import type { Session } from '../lib/types';

const logoUrl = `${import.meta.env.BASE_URL}palm-logo.png`;

interface Props {
  onSignedIn: (s: Session) => void;
  /** Message to show on arrival (e.g. after a forced sign-out). */
  initialError?: string;
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function EyeIcon({ off }: { off: boolean }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function LoginPage({ onSignedIn, initialError }: Props) {
  const { t } = useI18n();
  const errorText = useErrorText();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError ?? '');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const s = await signIn(userId, password);
      onSignedIn(s);
    } catch (err) {
      setError(errorText(err));
      if (err instanceof Error && err.message === 'err_worker_portal') setTimeout(goToWorkerPortal, 1200);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      id="authOverlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto"
      style={{ background: 'linear-gradient(160deg,#F0FDF4 0%,#F8FAFC 45%,#EFF6FF 75%,#F8FAFC 100%)' }}
    >
      <PalmCorners />
      <div className="login-glow login-glow-1" />
      <div className="login-glow login-glow-2" />
      <div className="w-full flex items-center justify-center p-4 box-border min-h-screen">
        <form id="loginCard" onSubmit={submit} noValidate>
          <div className="text-center">
            <div className="login-logo-ring">
              <img src={logoUrl} width={54} height={54} alt="Oil palm tree" className="block object-contain" />
            </div>
          </div>
          <div className="login-brand-name"><span className="login-palm">PSMS</span></div>
          <p className="login-brand-sub">{t('login_brand_sub')}</p>
          <h2 className="login-welcome-h">{t('login_welcome')}</h2>
          <p className="login-welcome-sub">{t('login_welcome_sub')}</p>

          <div className="login-field">
            <label className="login-label" htmlFor="loginEmail">{t('login_user_id')}</label>
            <div className="login-input-wrap">
              <span className="login-icon-left"><UserIcon /></span>
              <input
                id="loginEmail" type="text" className="login-input" autoComplete="username"
                placeholder={t('login_user_id_ph')} value={userId} onChange={(e) => setUserId(e.target.value)}
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="loginPassword">{t('login_password')}</label>
            <div className="login-input-wrap">
              <span className="login-icon-left"><LockIcon /></span>
              <input
                id="loginPassword" type={showPw ? 'text' : 'password'} className="login-input" autoComplete="current-password"
                placeholder={t('login_password_ph')} value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="login-icon-right" onClick={() => setShowPw((v) => !v)} aria-label={t('login_toggle_pw')}>
                <EyeIcon off={showPw} />
              </button>
            </div>
          </div>

          {error && <p id="loginError" role="alert">{error}</p>}

          <button id="loginBtn" type="submit" disabled={busy}>
            <span id="loginBtnText">{busy ? t('signing_in') : t('sign_in')}</span>
            <div id="loginSpinner" style={{ display: busy ? 'block' : 'none' }} />
          </button>

          <p className="login-help">{t('login_help')} <strong>{t('login_help_strong')}</strong></p>
          <div className="login-footer"><span className="login-copyright">{t('login_copyright')}</span></div>
        </form>
      </div>
    </div>
  );
}
