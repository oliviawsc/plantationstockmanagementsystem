import { useCallback, useEffect, useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { Toaster } from './components/Toaster';
import { useI18n } from './i18n';
import { goToWorkerPortal, restoreSession, signOut } from './lib/auth';
import { useSession } from './lib/session';
import { AppShell } from './pages/AppShell';
import { LoginPage } from './pages/LoginPage';

type Boot = 'booting' | 'ready';

/** Restores the session on load, then shows the login page or the app. */
export function App() {
  const { t } = useI18n();
  const session = useSession();
  const [boot, setBoot] = useState<Boot>('booting');
  const [loginMessage, setLoginMessage] = useState('');

  useEffect(() => {
    let alive = true;
    restoreSession().then((r) => {
      if (!alive) return;
      if (r === 'worker') { goToWorkerPortal(); return; }
      setBoot('ready');
    }, () => alive && setBoot('ready'));
    return () => { alive = false; };
  }, []);

  /** Sign out without asking (account deactivated) and say why. */
  const forceOut = useCallback(() => {
    void signOut().then(() => setLoginMessage(t('err_inactive')));
  }, [t]);
  const clearMessage = useCallback(() => setLoginMessage(''), []);

  if (boot === 'booting') return <div className="min-h-screen" style={{ background: '#F8FAFC' }} />;

  return (
    <HashRouter>
      <Toaster />
      {session && session.role !== 'estate_user' ? (
        <AppShell key={session.email} session={session} onForcedOut={forceOut} onSignedOut={clearMessage} />
      ) : (
        <LoginPage key={loginMessage} initialError={loginMessage} onSignedIn={clearMessage} />
      )}
    </HashRouter>
  );
}
