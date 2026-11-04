// Section id → page component. Phase B replaces each placeholder with the
// feature page from src/features/<area>/.
import type { ComponentType } from 'react';
import { MgmtReportPage } from '../features/mgmtreport/MgmtReportPage';
import { MovedToSettings } from './PlaceholderPage';

export const SECTION_PAGES: Partial<Record<string, ComponentType>> = {
  mgmtreport: MgmtReportPage,
  items: MovedToSettings,
  locations: MovedToSettings,
  manuring: MovedToSettings,
  fieldmaint: MovedToSettings,
};
