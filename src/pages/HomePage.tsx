// Home: module cards, each shown only if the user may open one of its
// sections (legacy applyNavPermissions home-card rules).
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { firstOpenable } from '../lib/permissions';
import { HOME_CARDS } from '../lib/sections';
import { useSession } from '../lib/session';

const svg = (children: ReactNode) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

const ICONS: Record<string, ReactNode> = {
  dashboard: svg(<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>),
  stock: svg(<><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>),
  fieldops: svg(<><path d="M12 22V12" /><path d="M12 12C12 7 7 3 2 3c0 5 4 9 10 9z" /><path d="M12 12c0-5 5-9 10-9 0 5-4 9-10 9z" /></>),
  reports: svg(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></>),
  rainfall: svg(<><line x1="8" y1="19" x2="8" y2="21" /><line x1="8" y1="13" x2="8" y2="15" /><line x1="16" y1="19" x2="16" y2="21" /><line x1="16" y1="13" x2="16" y2="15" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="12" y1="15" x2="12" y2="17" /><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" /></>),
  tools: svg(<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />),
  mgmtreport: svg(<><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></>),
  settings: svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
  useradmin: svg(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
};

export function HomePage() {
  const { t } = useI18n();
  const session = useSession();
  const navigate = useNavigate();
  const isSA = session?.role === 'superadmin';

  const cards = HOME_CARDS
    .filter((c) => (c.adminOnly ? isSA : true))
    .map((c) => ({ ...c, target: firstOpenable(session, c.sections) }))
    .filter((c) => c.target !== null);

  return (
    <section id="home" data-testid="home-page">
      <div className="max-w-[960px] mx-auto px-4 pt-10 pb-[60px]">
        <div className="text-center mb-9">
          <h1 className="text-[26px] font-extrabold mb-2" style={{ color: '#1B5E20' }}>{t('home_title')}</h1>
          <p className="text-gray-500 text-sm">{t('home_subtitle')}</p>
        </div>
        <div className="home-card-grid">
          {cards.map((c) => (
            <button key={c.id} type="button" className="home-card" data-testid={`home-card-${c.id}`}
              onClick={() => navigate(`/s/${c.target}`)}>
              <div className="home-card-icon">{ICONS[c.id]}</div>
              <span className="home-card-title">{t(c.titleKey)}</span>
              {c.adminOnly && <span className="home-card-badge">{t('home_badge_superadmin')}</span>}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
