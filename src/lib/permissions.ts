// Section access rules, ported from legacy/index.html
// (ALL_SECTIONS ~9196, USER_MODULES, getSectionAccess ~10903, navigateToSection ~15874).
import type { Access, Permissions, Session } from './types';

export interface SectionDef {
  id: string;
  label: string;
  group: string;
}

/** All permission-controlled sections (useradmin/settings are Super Admin only). */
export const ALL_SECTIONS: SectionDef[] = [
  { id: 'dashboard', label: '📊 Dashboard', group: 'Overview' },
  { id: 'transactions', label: '🔄 Record Stock', group: 'Stock' },
  { id: 'summary', label: '📑 Stock Transactions', group: 'Stock' },
  { id: 'ledger', label: '📒 Stock Summary', group: 'Stock' },
  { id: 'roundprogress', label: '📈 Fertilizer Issuance', group: 'Field Operations' },
  { id: 'maintprogress', label: '📊 Maintenance Progress', group: 'Field Operations' },
  { id: 'chemusage', label: '⚗️ Chemical Usage', group: 'Field Operations' },
  { id: 'fertrecord', label: '📋 Fertilizer Issuance Record', group: 'Reports' },
  { id: 'chemrecord', label: '⚗️ Chemical Issuance Record', group: 'Reports' },
  { id: 'plantrecord', label: '🌱 Field Planting Record', group: 'Reports' },
  { id: 'rainfall', label: '🌧️ Rainfall Transactions', group: 'Rainfall' },
  { id: 'rainfallreport', label: '📊 Monthly Rainfall Record', group: 'Rainfall' },
  { id: 'rainfallsummary', label: '📅 Yearly Rainfall Record', group: 'Rainfall' },
  { id: 'tools', label: '🔧 Tools Transactions', group: 'Tools' },
  { id: 'toolsrecord', label: '📋 Tools Record', group: 'Tools' },
  { id: 'mgmtreport', label: '📊 Management Report', group: 'Management Report' },
];

/** Sections shown in User Management for Estate Users (Worker Portal modules). */
export const ESTATE_SECTIONS: SectionDef[] = [
  { id: 'estate_baja', label: '🌿 Baja (Fertilizer)', group: 'Mobile Modules' },
  { id: 'estate_racun', label: '⚗️ Racun (Chemical)', group: 'Mobile Modules' },
  { id: 'estate_anak', label: '🌱 Anak Sawit (Oil Palm Seedling)', group: 'Mobile Modules' },
  { id: 'mobile_rainfall', label: '🌧️ Hujan (Rainfall)', group: 'Mobile Modules' },
  { id: 'tools_mobile_cat', label: '🔧 Peralatan (Tools)', group: 'Mobile Modules' },
];

export interface ModuleDef {
  name: string;
  icon: string;
  iconBg: string;
  sections: string[];
}

/** Module groupings for HQ users (User Management layout). */
export const USER_MODULES: ModuleDef[] = [
  { name: 'Dashboard', icon: '🏠', iconBg: '#16a34a', sections: ['dashboard'] },
  { name: 'Stock Record', icon: '📦', iconBg: '#0284c7', sections: ['transactions', 'summary', 'ledger'] },
  { name: 'Field Operations', icon: '🌿', iconBg: '#9333ea', sections: ['roundprogress', 'maintprogress', 'chemusage'] },
  { name: 'Reports', icon: '📄', iconBg: '#3b82f6', sections: ['fertrecord', 'chemrecord', 'plantrecord'] },
  { name: 'Rainfall', icon: '🌧️', iconBg: '#f59e0b', sections: ['rainfall', 'rainfallreport', 'rainfallsummary'] },
  { name: 'Tools', icon: '🔧', iconBg: '#f97316', sections: ['tools', 'toolsrecord'] },
  { name: 'Management Report', icon: '📊', iconBg: '#0f766e', sections: ['mgmtreport'] },
];

/** Module groupings for estate users (Worker Portal). */
export const ESTATE_MODULES: ModuleDef[] = [
  { name: 'Fertilizer', icon: '🌿', iconBg: '#16a34a', sections: ['estate_baja'] },
  { name: 'Chemical', icon: '⚗️', iconBg: '#8b5cf6', sections: ['estate_racun'] },
  { name: 'Oil Palm', icon: '🌱', iconBg: '#22c55e', sections: ['estate_anak'] },
  { name: 'Rainfall', icon: '🌧️', iconBg: '#f59e0b', sections: ['mobile_rainfall'] },
  { name: 'Tools', icon: '🔧', iconBg: '#f97316', sections: ['tools_mobile_cat'] },
];

/** Setup pages only the Super Admin may open (navigateToSection guard). */
export const ADMIN_ONLY_SECTIONS = ['useradmin', 'settings', 'items', 'locations', 'manuring', 'fieldmaint'];

const ESTATE_MOBILE_DEFAULTS: Record<string, Access> = {
  transactions: 'edit', summary: 'view', ledger: 'view', dashboard: 'view',
  fertrecord: 'view', chemrecord: 'view', plantrecord: 'view',
  rainfall: 'edit', rainfallreport: 'view', rainfallsummary: 'none',
  mobile_rainfall: 'edit', estate_category: 'edit', tools_mobile_cat: 'edit',
  estate_baja: 'edit', estate_racun: 'edit', estate_anak: 'edit',
};

const ESTATE_SECTION_PARENT: Record<string, string | null> = {
  tools: 'tools_mobile_cat', toolsrecord: 'tools_mobile_cat',
  fertrecord: 'estate_baja', chemrecord: 'estate_racun', plantrecord: 'estate_anak',
  rainfallreport: 'mobile_rainfall', rainfallsummary: 'mobile_rainfall',
  mobile_viewrecord: null,
};

const has = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/** Section → access map without the __role / __configured flags. */
export function normalisePermissions(perms: Permissions | null | undefined): Record<string, string> {
  if (!perms) return {};
  if (Array.isArray(perms)) {
    const obj: Record<string, string> = {};
    perms.forEach((p) => { obj[p] = 'edit'; });
    return obj;
  }
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(perms)) {
    if (k !== '__role' && k !== '__configured' && typeof v === 'string') result[k] = v;
  }
  return result;
}

function asAccess(v: string | undefined): Access {
  return v === 'view' || v === 'edit' ? v : 'none';
}

export function getSectionAccess(session: Session | null | undefined, sectionId: string): Access {
  if (!session || session.role === 'superadmin') return 'edit';
  if (sectionId === 'home') return 'edit';
  let id = sectionId;
  if (session.role === 'estate_user') {
    if (has(ESTATE_SECTION_PARENT, id)) {
      const parent = ESTATE_SECTION_PARENT[id];
      if (parent === null) return 'edit';
      id = parent;
    }
    const perms = normalisePermissions(session.permissions);
    if (has(ESTATE_MOBILE_DEFAULTS, id)) {
      return has(perms, id) ? asAccess(perms[id]) : ESTATE_MOBILE_DEFAULTS[id];
    }
  }
  // hq_user whose permissions were never saved by an admin sees everything read-only.
  if (session.role === 'hq_user') {
    const raw = session.permissions;
    if (!raw || Array.isArray(raw) || !raw.__configured) return 'view';
  }
  return asAccess(normalisePermissions(session.permissions)[id]);
}

export function isEditAllowed(session: Session | null | undefined, sectionId: string): boolean {
  return getSectionAccess(session, sectionId) === 'edit';
}

/** True when the section must be shown read-only (legacy applyViewOnlyLock). */
export function isViewOnly(session: Session | null | undefined, sectionId: string): boolean {
  if (!session || session.role === 'superadmin') return false;
  const a = getSectionAccess(session, sectionId);
  return a === 'view' || a === 'none';
}

/** Whether the user may open a section at all (sidebar, home cards, routes). */
export function canOpenSection(session: Session | null | undefined, sectionId: string): boolean {
  if (!session) return false;
  if (sectionId === 'home') return true;
  if (session.role === 'superadmin') return true;
  if (ADMIN_ONLY_SECTIONS.includes(sectionId)) return false;
  return getSectionAccess(session, sectionId) !== 'none';
}

/** First section in `order` the user may open, or null. */
export function firstOpenable(session: Session | null | undefined, order: string[]): string | null {
  return order.find((id) => canOpenSection(session, id)) ?? null;
}

/** First accessible section overall (legacy bootApp fallback), else 'home'. */
export function landingSection(session: Session | null | undefined): string {
  return firstOpenable(session, ALL_SECTIONS.map((s) => s.id)) ?? 'home';
}
