// Everything after sign-in: estate list, status watcher, profile refresh,
// ?module= deep links, data provider and routes.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { EstateDataProvider, useEstateData } from '../data/EstateDataProvider';
import { useI18n } from '../i18n';
import { goToWorkerPortal, refreshProfile, signOut } from '../lib/auth';
import { DEFAULT_ESTATES } from '../lib/config';
import { allowedEstates, defaultEstate, fetchEstateNames } from '../lib/estates';
import { updateSession } from '../lib/session';
import { startStatusWatcher } from '../lib/statusWatcher';
import type { Session } from '../lib/types';
import { AppLayout } from '../layout/AppLayout';
import { HomePage } from './HomePage';
import { SectionPage } from './SectionPage';

interface Props {
  session: Session;
  onForcedOut: () => void;
  onSignedOut: () => void;
}

/** Deep links from the MJM Intranet: ?module=stock opens Home, ?module=report
 *  opens Management Report. The parameter is removed after use. */
export function takeModuleParam(): string | null {
  const url = new URL(window.location.href);
  const m = url.searchParams.get('module');
  if (!m) return null;
  url.searchParams.delete('module');
  history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  if (m === 'report') return '/s/mgmtreport';
  if (m === 'stock') return '/';
  return null;
}

/** Keeps the active estate allowed and re-reads the profile on estate change. */
function EstateGuard({ allowed, session, onForcedOut }: { allowed: string[]; session: Session; onForcedOut: () => void }) {
  const { estate, setEstate } = useEstateData();
  const forced = useRef(onForcedOut);
  forced.current = onForcedOut;
  useEffect(() => {
    if (estate && allowed.includes(estate)) return;
    const next = defaultEstate(session, allowed);
    if (next !== estate) setEstate(next);
  }, [allowed, estate, session, setEstate]);

  useEffect(() => {
    let alive = true;
    void refreshProfile().then((r) => {
      if (!alive) return;
      if (r === 'inactive') forced.current();
      else if (r === 'worker') goToWorkerPortal();
    });
    return () => { alive = false; };
  }, [estate]);
  return null;
}

export function AppShell({ session, onForcedOut, onSignedOut }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [allEstates, setAllEstates] = useState<string[]>(DEFAULT_ESTATES);
  const estatesKey = JSON.stringify(session.estates ?? []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allowed = useMemo(() => allowedEstates(session, allEstates), [session.role, estatesKey, allEstates]);
  const [initialEstate] = useState(() => defaultEstate(session, allowed));

  useEffect(() => { void fetchEstateNames().then(setAllEstates); }, []);
  useEffect(() => startStatusWatcher(session, onForcedOut), [session.email, session.role, session.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const target = takeModuleParam();
    if (target) navigate(target, { replace: true });
  }, [navigate]);

  const onEstateChange = useCallback((e: string) => updateSession({ estate: e }), []);

  const onSignOut = useCallback(async () => {
    if (!window.confirm(t('sign_out_q'))) return;
    await signOut();
    onSignedOut();
    navigate('/', { replace: true });
  }, [t, navigate, onSignedOut]);

  return (
    <EstateDataProvider initialEstate={initialEstate} onEstateChange={onEstateChange}>
      <EstateGuard allowed={allowed} session={session} onForcedOut={onForcedOut} />
      <Routes>
        <Route element={<AppLayout session={session} estates={allowed} onSignOut={() => void onSignOut()} />}>
          <Route index element={<HomePage />} />
          <Route path="s/:sectionId" element={<SectionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </EstateDataProvider>
  );
}
