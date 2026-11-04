import { useI18n } from '../i18n';
import { RichText } from '../i18n/RichText';
import { useViewOnly } from '../lib/useAccess';

/** Yellow "View Only" banner (legacy applyViewOnlyLock). Renders nothing
 *  when the user may edit `sectionId`. */
export function ViewOnlyBanner({ sectionId }: { sectionId: string }) {
  const { t } = useI18n();
  if (!useViewOnly(sectionId)) return null;
  return (
    <div className="view-only-banner" role="note" data-testid="view-only-banner">
      <RichText text={t('view_only_banner')} />
    </div>
  );
}
