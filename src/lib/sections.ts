// Section ids, headings, sidebar groups and hub tab bars, from the legacy
// markup (sidebar nav ~1238, <section> headings, .htab-bar groups).
import type { TextKey } from '../i18n';

export interface SectionMeta {
  id: string;
  /** Page heading (legacy <h2 data-i18n>). */
  titleKey: TextKey;
  /** Optional sub-heading. */
  subKey?: TextKey;
}

const meta = (id: string, titleKey: TextKey, subKey?: TextKey): SectionMeta => ({ id, titleKey, subKey });

/** Every page the router knows (Home excluded). */
export const SECTION_META: SectionMeta[] = [
  meta('dashboard', 'nav_dashboard'),
  meta('transactions', 'nav_transactions'),
  meta('summary', 'nav_summary'),
  meta('ledger', 'nav_ledger'),
  meta('roundprogress', 'nav_roundprogress'),
  meta('maintprogress', 'page_maintprogress', 'page_maintprogress_sub'),
  meta('chemusage', 'page_chemusage', 'page_chemusage_sub'),
  meta('fertrecord', 'page_fertrecord', 'page_fertrecord_sub'),
  meta('chemrecord', 'page_chemrecord', 'page_chemrecord_sub'),
  meta('plantrecord', 'page_plantrecord', 'page_plantrecord_sub'),
  meta('rainfall', 'page_rainfall', 'page_rainfall_sub'),
  meta('rainfallreport', 'page_rainfallreport', 'page_rainfallreport_sub'),
  meta('rainfallsummary', 'page_rainfallsummary', 'page_rainfallsummary_sub'),
  meta('tools', 'page_tools', 'page_tools_sub'),
  meta('toolsrecord', 'page_toolsrecord', 'page_toolsrecord_sub'),
  meta('mgmtreport', 'page_mgmtreport', 'page_mgmtreport_sub'),
  meta('settings', 'sb_lbl_settings'),
  meta('useradmin', 'page_useradmin'),
  // Legacy stubs that say "moved to Settings" (Super Admin only).
  meta('items', 'nav_items'),
  meta('locations', 'nav_locations'),
  meta('manuring', 'nav_manuring'),
  meta('fieldmaint', 'nav_fieldmaint', 'page_fieldmaint_sub'),
];

export function sectionMeta(id: string): SectionMeta | undefined {
  return SECTION_META.find((s) => s.id === id);
}

export interface NavItem {
  id: string;
  icon: string;
  labelKey: TextKey;
}
export interface NavGroup {
  labelKey: TextKey;
  items: NavItem[];
}

/** Sidebar, in legacy order. */
export const NAV_GROUPS: NavGroup[] = [
  { labelKey: 'nav_group_overview', items: [
    { id: 'home', icon: '🏠', labelKey: 'nav_home' },
    { id: 'dashboard', icon: '📊', labelKey: 'sb_lbl_dashboard' },
  ] },
  { labelKey: 'nav_group_stock', items: [
    { id: 'transactions', icon: '🔄', labelKey: 'sb_lbl_transactions' },
    { id: 'summary', icon: '📑', labelKey: 'sb_lbl_summary' },
    { id: 'ledger', icon: '📒', labelKey: 'sb_lbl_ledger' },
  ] },
  { labelKey: 'nav_group_fieldops', items: [
    { id: 'manuring', icon: '🌿', labelKey: 'sb_lbl_manuring' },
    { id: 'roundprogress', icon: '📈', labelKey: 'sb_lbl_roundprogress' },
    { id: 'fieldmaint', icon: '🔧', labelKey: 'sb_lbl_fieldmaint' },
    { id: 'maintprogress', icon: '📊', labelKey: 'sb_lbl_maintprogress' },
    { id: 'chemusage', icon: '⚗️', labelKey: 'sb_lbl_chemusage' },
    { id: 'fertrecord', icon: '📋', labelKey: 'sb_lbl_fertrecord' },
    { id: 'chemrecord', icon: '⚗️', labelKey: 'sb_lbl_chemrecord' },
    { id: 'plantrecord', icon: '🌿', labelKey: 'sb_lbl_plantrecord' },
  ] },
  { labelKey: 'sb_section_rainfall', items: [
    { id: 'rainfall', icon: '🌧️', labelKey: 'sb_lbl_rainfall' },
    { id: 'rainfallreport', icon: '📈', labelKey: 'sb_lbl_rainfallreport' },
  ] },
  { labelKey: 'sb_section_tools', items: [
    { id: 'tools', icon: '🔧', labelKey: 'sb_lbl_tools' },
    { id: 'toolsrecord', icon: '📋', labelKey: 'sb_lbl_toolsrecord' },
  ] },
  { labelKey: 'sb_section_mgmtreport', items: [
    { id: 'mgmtreport', icon: '📊', labelKey: 'sb_lbl_mgmtreport' },
  ] },
  { labelKey: 'nav_group_admin', items: [
    { id: 'settings', icon: '⚙️', labelKey: 'sb_lbl_settings' },
    { id: 'useradmin', icon: '👤', labelKey: 'sb_lbl_useradmin' },
  ] },
];

export interface TabDef { id: string; labelKey: TextKey }

/** Hub tab bars shown at the top of grouped sections (legacy .htab-bar). */
export const TAB_GROUPS: TabDef[][] = [
  [
    { id: 'transactions', labelKey: 'tab_record_stock' },
    { id: 'summary', labelKey: 'tab_stock_transactions' },
    { id: 'ledger', labelKey: 'tab_stock_summary' },
  ],
  [
    { id: 'roundprogress', labelKey: 'tab_fertilizer_issuance' },
    { id: 'maintprogress', labelKey: 'tab_maintenance_progress' },
    { id: 'chemusage', labelKey: 'tab_chemical_usage' },
  ],
  [
    { id: 'fertrecord', labelKey: 'tab_fert_issuance_rec' },
    { id: 'chemrecord', labelKey: 'tab_chem_issuance_rec' },
    { id: 'plantrecord', labelKey: 'tab_planting_rec' },
  ],
  [
    { id: 'rainfall', labelKey: 'tab_rainfall_txns' },
    { id: 'rainfallreport', labelKey: 'tab_rainfall_report' },
    { id: 'rainfallsummary', labelKey: 'tab_rainfall_summary' },
  ],
  [
    { id: 'tools', labelKey: 'tab_tools_txn' },
    { id: 'toolsrecord', labelKey: 'tab_tools_rec' },
  ],
];

export function tabsFor(sectionId: string): TabDef[] | null {
  return TAB_GROUPS.find((g) => g.some((t) => t.id === sectionId)) ?? null;
}

/** Home cards → the sub-sections tried in order (legacy navigateToFirst*). */
export interface HomeCard {
  id: string;
  titleKey: TextKey;
  sections: string[];
  adminOnly?: boolean;
}
export const HOME_CARDS: HomeCard[] = [
  { id: 'dashboard', titleKey: 'home_card_dashboard', sections: ['dashboard'] },
  { id: 'stock', titleKey: 'home_card_stock_records', sections: ['transactions', 'summary', 'ledger'] },
  { id: 'fieldops', titleKey: 'home_card_field_ops', sections: ['roundprogress', 'maintprogress', 'chemusage'] },
  { id: 'reports', titleKey: 'home_card_reports', sections: ['fertrecord', 'chemrecord', 'plantrecord'] },
  { id: 'rainfall', titleKey: 'home_card_rainfall', sections: ['rainfall', 'rainfallreport', 'rainfallsummary'] },
  { id: 'tools', titleKey: 'home_card_tools', sections: ['tools', 'toolsrecord'] },
  { id: 'mgmtreport', titleKey: 'home_card_mgmtreport', sections: ['mgmtreport'] },
  { id: 'settings', titleKey: 'home_card_settings', sections: ['settings'], adminOnly: true },
  { id: 'useradmin', titleKey: 'home_card_user_mgmt', sections: ['useradmin'], adminOnly: true },
];
