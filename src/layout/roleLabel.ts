import type { TextKey } from '../i18n';
import type { Role } from '../lib/types';

export function roleKey(role: Role | string): TextKey {
  if (role === 'superadmin') return 'role_superadmin';
  if (role === 'hq_user') return 'role_hq_user';
  if (role === 'estate_user') return 'role_estate_user';
  return 'role_user';
}
