// Estate list (opp_estates) and the estates a user may open.
import { DEFAULT_ESTATES } from './config';
import { supabase } from './supabase';
import type { Session } from './types';

/** All estate names, sorted; falls back to the built-in list. */
export async function fetchEstateNames(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from('opp_estates').select('name').order('name');
    if (error) throw error;
    const names = (data ?? []).map((r: { name: string }) => r.name).filter(Boolean);
    return names.length > 0 ? names.sort((a, b) => a.localeCompare(b)) : DEFAULT_ESTATES;
  } catch (e) {
    console.warn('Could not load estates from Supabase, using defaults:', e);
    return DEFAULT_ESTATES;
  }
}

/** Super Admin: every estate; others: their assigned estates only. */
export function allowedEstates(session: Session | null, all: string[]): string[] {
  if (!session) return [];
  if (session.role === 'superadmin') return all;
  return session.estates && session.estates.length > 0 ? session.estates : [];
}

/** The remembered estate if still allowed, else the first allowed one. */
export function defaultEstate(session: Session | null, allowed: string[]): string {
  if (session?.estate && allowed.includes(session.estate)) return session.estate;
  return allowed[0] ?? '';
}
