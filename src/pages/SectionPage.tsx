import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { SectionTabs } from '../components/SectionTabs';
import { showToast } from '../components/toast';
import { ViewOnlyBanner } from '../components/ViewOnlyBanner';
import { useI18n } from '../i18n';
import { canOpenSection } from '../lib/permissions';
import { sectionMeta } from '../lib/sections';
import { useSession } from '../lib/session';
import { PlaceholderPage } from './PlaceholderPage';
import { SECTION_PAGES } from './sectionRegistry';

/** /s/:sectionId — permission guard, heading, tabs, view-only banner, page. */
export function SectionPage() {
  const { sectionId = '' } = useParams();
  const { t } = useI18n();
  const session = useSession();
  const meta = sectionMeta(sectionId);
  const allowed = !!meta && canOpenSection(session, sectionId);

  useEffect(() => {
    if (meta && !allowed) showToast(t('alert_no_permission'), 'error', 6000, 'no-permission');
  }, [meta, allowed, t]);

  if (!meta || !allowed) return <Navigate to="/" replace />;
  const Page = SECTION_PAGES[sectionId];

  return (
    <section id={sectionId} className="page-section active" data-testid={`section-${sectionId}`}>
      <ViewOnlyBanner sectionId={sectionId} />
      <SectionTabs sectionId={sectionId} />
      <h2 className="text-3xl font-bold mb-2">{t(meta.titleKey)}</h2>
      {meta.subKey ? <p className="text-sm text-green-700 mb-6">{t(meta.subKey)}</p> : <div className="mb-6" />}
      {Page ? <Page /> : <PlaceholderPage sectionId={sectionId} />}
    </section>
  );
}
