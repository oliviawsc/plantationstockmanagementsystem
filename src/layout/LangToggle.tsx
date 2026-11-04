import { useI18n, type Lang } from '../i18n';

const STYLES = {
  header: { on: { background: '#2E7D32', color: '#fff' }, off: { background: '#F0FDF4', color: '#2E7D32' }, border: '#D1FAE5' },
  sidebar: { on: { background: '#fff', color: '#1B5E20' }, off: { background: 'transparent', color: 'rgba(255,255,255,0.75)' }, border: 'rgba(255,255,255,0.25)' },
};

/** EN / BM switch (legacy #topLangToggle and the sidebar footer toggle). */
export function LangToggle({ variant = 'header' }: { variant?: keyof typeof STYLES }) {
  const { lang, setLang } = useI18n();
  const s = STYLES[variant];
  const btn = (l: Lang, label: string) => (
    <button type="button" onClick={() => setLang(l)} aria-pressed={lang === l} data-testid={`lang-${l}-${variant}`}
      className={`border-0 cursor-pointer font-bold ${variant === 'header' ? 'px-[11px] py-[5px] text-xs' : 'flex-1 p-[5px] text-[13px]'}`}
      style={lang === l ? s.on : s.off}>
      {label}
    </button>
  );
  return (
    <div className="flex items-center overflow-hidden shrink-0" style={{ border: `1px solid ${s.border}`, borderRadius: variant === 'header' ? 8 : 7 }}>
      {btn('en', variant === 'header' ? 'EN' : '🇬🇧 EN')}
      {btn('ms', variant === 'header' ? 'BM' : '🇲🇾 BM')}
    </div>
  );
}
