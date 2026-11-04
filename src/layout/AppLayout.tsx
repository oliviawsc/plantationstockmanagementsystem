import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useEstateData } from '../data/EstateDataProvider';
import { useI18n } from '../i18n';
import { SIDEBAR_COLLAPSED_KEY, SIDEBAR_ENABLED } from '../lib/config';
import { readString, writeString } from '../lib/storage';
import type { Session } from '../lib/types';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

interface Props {
  session: Session;
  estates: string[];
  onSignOut: () => void;
}

function EstateBlankState() {
  const { t } = useI18n();
  return (
    <div id="estateBlankState" data-testid="estate-blank" className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3" style={{ background: '#F8FAFC', top: 56 }}>
      <div className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center text-[26px]"
        style={{ background: 'linear-gradient(135deg,#2E7D32,#43A047)', boxShadow: '0 8px 24px rgba(46,125,50,.3)' }}>🌴</div>
      <h2 className="text-lg font-bold text-slate-900">{t('blank_title')}</h2>
      <p className="text-slate-500 text-[13px] text-center max-w-[280px] leading-relaxed">{t('blank_sub')}</p>
    </div>
  );
}

export function AppLayout({ session, estates, onSignOut }: Props) {
  const { estate, setEstate } = useEstateData();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => readString(SIDEBAR_COLLAPSED_KEY) === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHome = pathname === '/' || pathname === '';

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const toggleCollapse = () => setCollapsed((c) => {
    writeString(SIDEBAR_COLLAPSED_KEY, c ? '0' : '1');
    return !c;
  });

  const cls = [
    collapsed ? 'sidebar-collapsed' : '',
    isHome ? 'home-mode' : '',
    SIDEBAR_ENABLED ? '' : 'no-sidebar',
  ].filter(Boolean).join(' ');

  return (
    <div id="appLayout" className={cls}>
      <div id="sidebarOverlay" className={mobileOpen ? 'open' : ''} onClick={() => setMobileOpen(false)} />
      <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div id="mainWrapper">
        <TopHeader session={session} estates={estates} estate={estate} onEstateChange={setEstate}
          onOpenMenu={() => setMobileOpen((o) => !o)} onSignOut={onSignOut} />
        {!estate && <EstateBlankState />}
        <main id="mainContent" style={{ visibility: estate ? 'visible' : 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
