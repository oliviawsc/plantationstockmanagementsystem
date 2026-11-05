import { describe, expect, it } from 'vitest';
import { canOpenSection, firstOpenable, getSectionAccess, isViewOnly, landingSection } from '../permissions';
import type { Session } from '../types';

const s = (role: Session['role'], permissions: Session['permissions']): Session => ({ email: 'x@psms.app', name: 'X', estate: '', role, permissions });

describe('getSectionAccess', () => {
  it('superadmin edits everything', () => {
    expect(getSectionAccess(s('superadmin', []), 'rainfall')).toBe('edit');
    expect(canOpenSection(s('superadmin', []), 'useradmin')).toBe(true);
  });
  it('hq_user never configured → view everywhere', () => {
    const u = s('hq_user', { __role: 'hq_user' });
    expect(getSectionAccess(u, 'summary')).toBe('view');
    expect(isViewOnly(u, 'summary')).toBe(true);
  });
  it('hq_user configured → explicit values, missing = none', () => {
    const u = s('hq_user', { __role: 'hq_user', __configured: true, summary: 'edit', ledger: 'view' });
    expect(getSectionAccess(u, 'summary')).toBe('edit');
    expect(getSectionAccess(u, 'ledger')).toBe('view');
    expect(getSectionAccess(u, 'dashboard')).toBe('none');
    expect(firstOpenable(u, ['transactions', 'summary', 'ledger'])).toBe('summary');
    expect(landingSection(u)).toBe('summary');
  });
  it('admin-only pages stay closed even with permissions', () => {
    const u = s('hq_user', { __configured: true, settings: 'edit' });
    expect(canOpenSection(u, 'settings')).toBe(false);
    expect(canOpenSection(u, 'home')).toBe(true);
  });
  it('legacy array permissions mean edit', () => {
    expect(getSectionAccess(s('user', ['rainfall']), 'rainfall')).toBe('edit');
    expect(getSectionAccess(s('user', ['rainfall']), 'tools')).toBe('none');
  });
  it('estate_user defaults and parent sections', () => {
    const w = s('estate_user', { estate_baja: 'none' });
    expect(getSectionAccess(w, 'fertrecord')).toBe('none');
    expect(getSectionAccess(w, 'chemrecord')).toBe('edit');
    expect(getSectionAccess(w, 'dashboard')).toBe('view');
  });
});
