import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import type { Session } from '../lib/types';
import { AvatarMenu } from './AvatarMenu';
import { EstateSelect } from './EstateSelect';
import { LangToggle } from './LangToggle';

interface Props {
  session: Session;
  estates: string[];
  estate: string;
  onEstateChange: (estate: string) => void;
  onOpenMenu: () => void;
  onSignOut: () => void;
}

/** Fixed top bar (legacy #topHeaderBar). */
export function TopHeader({ session, estates, estate, onEstateChange, onOpenMenu, onSignOut }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  return (
    <header id="topHeaderBar">
      <div className="flex-1 flex items-center gap-2.5 min-w-0">
        <button type="button" id="mobileMenuBtn" onClick={onOpenMenu} aria-label={t('toggle_sidebar')} title={t('toggle_sidebar')}>☰</button>
        <button type="button" id="topHomeBtn" onClick={() => navigate('/')} title={t('go_home')}
          className="flex items-center gap-1.5 px-3.5 py-[5px] rounded-lg border text-[13px] font-semibold cursor-pointer shrink-0 transition-colors bg-[#F0FDF4] hover:bg-[#D1FAE5]"
          style={{ borderColor: '#D1FAE5', color: '#1B5E20' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="max-sm:hidden">{t('top_home_btn')}</span>
        </button>
        <EstateSelect estates={estates} value={estate} onChange={onEstateChange} />
      </div>
      <div className="flex items-center justify-end gap-2.5 relative">
        <LangToggle />
        <AvatarMenu session={session} onSignOut={onSignOut} />
      </div>
    </header>
  );
}
