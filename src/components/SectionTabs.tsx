import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n';
import { canOpenSection } from '../lib/permissions';
import { tabsFor } from '../lib/sections';
import { useSession } from '../lib/session';

/** Hub tab bar (legacy .htab-bar) linking sibling sections the user may open. */
export function SectionTabs({ sectionId }: { sectionId: string }) {
  const { t } = useI18n();
  const session = useSession();
  const tabs = tabsFor(sectionId)?.filter((tab) => canOpenSection(session, tab.id));
  if (!tabs || tabs.length === 0) return null;
  return (
    <nav className="htab-bar" aria-label="Section tabs">
      {tabs.map((tab) => (
        <NavLink
          key={tab.id}
          to={`/s/${tab.id}`}
          className={({ isActive }) => `htab-btn relative no-underline${isActive ? ' active' : ''}`}
        >
          {t(tab.labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}
