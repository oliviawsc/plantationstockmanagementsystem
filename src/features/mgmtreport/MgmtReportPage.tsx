// Management Report: one place for every operation report (legacy renderMgmtReport).
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { canOpenSection } from '../../lib/permissions';
import { useSession } from '../../lib/session';
import { MGMT_REPORT_SOURCES } from './sources';

export function MgmtReportPage() {
  const { t } = useI18n();
  const session = useSession();
  const navigate = useNavigate();
  const links = MGMT_REPORT_SOURCES.filter((r) => canOpenSection(session, r.id));

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h3 className="text-lg font-bold text-green-900 mb-1">{t('mgmtreport_src_this')}</h3>
        <p className="text-xs text-gray-500 mb-4">{t('mgmtreport_src_this_sub')}</p>
        {links.length > 0 ? (
          <div id="mgmtReportLinks" className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}>
            {links.map((r) => (
              <button key={r.id} type="button" onClick={() => navigate(`/s/${r.id}`)} data-testid={`mgmt-link-${r.id}`}
                className="flex items-center gap-2.5 px-3.5 py-3 rounded-[10px] text-[13px] font-semibold cursor-pointer text-left border"
                style={{ borderColor: '#BBF7D0', background: '#F0FDF4', color: '#14532D' }}>
                <span className="text-lg">{r.icon}</span><span>{t(r.labelKey)}</span>
              </button>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400 italic">—</p>}
      </div>
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-bold text-green-900 mb-1">{t('mgmtreport_src_other')}</h3>
        <p className="text-sm text-gray-500">{t('mgmtreport_src_other_sub')}</p>
      </div>
    </>
  );
}
