import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n';
import { canOpenSection } from '../lib/permissions';
import { NAV_GROUPS } from '../lib/sections';
import { useSession } from '../lib/session';
import { LangToggle } from './LangToggle';

const logoUrl = `${import.meta.env.BASE_URL}palm-logo.png`;

interface Props {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

/** Sidebar nav; items the user may not open are hidden (legacy applyNavPermissions).
 *  Group labels with no visible item are hidden too. */
export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: Props) {
  const { t } = useI18n();
  const session = useSession();
  const groups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => canOpenSection(session, i.id)) }))
    .filter((g) => g.items.length > 0);

  return (
    <aside id="sidebar" className={mobileOpen ? 'open' : ''} aria-label="Main navigation">
      <div className="flex items-center justify-between gap-2 px-3.5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <img id="sidebarAppTitle" src={logoUrl} width={27} height={27} alt="" className="shrink-0 object-contain" />
          <span className="sb-label text-[16.5px] font-extrabold whitespace-nowrap tracking-tight">
            <span className="text-white">Palm</span><span style={{ color: '#A5D6A7' }}>Inventory</span>
          </span>
        </div>
        {mobileOpen && (
          <button type="button" onClick={onCloseMobile} id="sidebarCloseBtn" aria-label={t('close')}
            className="w-6 h-6 shrink-0 rounded-md border-0 bg-transparent cursor-pointer text-[15px]" style={{ color: 'rgba(255,255,255,0.7)' }}>✕</button>
        )}
        <button type="button" id="sidebarCollapseBtn" onClick={onToggleCollapse}
          aria-label={collapsed ? t('expand_sidebar') : t('collapse_sidebar')} title={collapsed ? t('expand_sidebar') : t('collapse_sidebar')}
          className="hidden w-6 h-6 shrink-0 rounded-md border-0 bg-transparent cursor-pointer text-sm items-center justify-center ml-auto"
          style={{ color: 'rgba(255,255,255,0.7)' }}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>
      <nav className="p-2 flex-1 overflow-y-auto">
        {groups.map((g, gi) => (
          <div key={g.labelKey}>
            <p className="sb-section text-[11px] font-semibold uppercase tracking-wider px-2 pb-[3px]"
              style={{ color: 'rgba(255,255,255,0.42)', paddingTop: gi === 0 ? 6 : 8 }}>{t(g.labelKey)}</p>
            {g.items.map((item) => (
              <NavLink key={item.id} to={item.id === 'home' ? '/' : `/s/${item.id}`} end={item.id === 'home'}
                onClick={onCloseMobile} title={t(item.labelKey)} data-target={item.id}
                className={({ isActive }) => `nav-item no-underline${isActive ? ' active' : ''}`}>
                <span className="nav-icon">{item.icon}</span><span className="sb-label">{t(item.labelKey)}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sb-footer p-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <LangToggle variant="sidebar" />
      </div>
    </aside>
  );
}
