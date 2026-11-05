import { useI18n } from '../i18n';

const legacyUrl = `${import.meta.env.BASE_URL}legacy/index.html`;

/** Stand-in for sections not rebuilt yet (replaced feature by feature in Phase B). */
export function PlaceholderPage({ sectionId }: { sectionId: string }) {
  const { t } = useI18n();
  return (
    <div className="bg-white p-8 rounded-xl shadow text-center" data-testid={`placeholder-${sectionId}`}>
      <div className="text-4xl mb-3" aria-hidden="true">🚧</div>
      <h3 className="text-lg font-bold text-green-900 mb-1">{t('placeholder_title')}</h3>
      <p className="text-sm text-gray-500 mb-5">{t('placeholder_sub')}</p>
      <a href={`${legacyUrl}`} target="_blank" rel="noopener" className="btn btn-ghost no-underline">
        {t('placeholder_open_legacy')} ↗
      </a>
    </div>
  );
}

/** Legacy stubs for setup pages that moved into Settings. */
export function MovedToSettings() {
  const { t } = useI18n();
  return (
    <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
      <p className="text-lg">{t('admin_moved_settings')}</p>
    </div>
  );
}
