import type { TextKey } from '../../i18n';

export interface ReportSource {
  /** Section the link opens. */
  id: string;
  labelKey: TextKey;
  icon: string;
}

/** Reports inside this system (legacy MGMT_REPORT_SOURCES). Reports from
 *  other operation systems are added later. */
export const MGMT_REPORT_SOURCES: ReportSource[] = [
  { id: 'dashboard', labelKey: 'sb_lbl_dashboard', icon: '📊' },
  { id: 'ledger', labelKey: 'sb_lbl_ledger', icon: '📒' },
  { id: 'fertrecord', labelKey: 'sb_lbl_fertrecord', icon: '📋' },
  { id: 'chemrecord', labelKey: 'sb_lbl_chemrecord', icon: '⚗️' },
  { id: 'plantrecord', labelKey: 'sb_lbl_plantrecord', icon: '🌱' },
  { id: 'rainfallreport', labelKey: 'sb_lbl_rainfallreport', icon: '🌧️' },
  { id: 'toolsrecord', labelKey: 'sb_lbl_toolsrecord', icon: '🔧' },
];
