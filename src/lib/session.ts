// The signed-in user lives in localStorage `opp_auth_session`, same key and
// shape as the legacy app (so `session.estate` carries over).
import { useSyncExternalStore } from 'react';
import { SESSION_KEY } from './config';
import { readJson, removeKey, writeJson } from './storage';
import type { Profile, Session } from './types';

type Listener = () => void;
const listeners = new Set<Listener>();
let cached: Session | null | undefined;

function emit() {
  cached = undefined;
  listeners.forEach((l) => l());
}

export function loadSession(): Session | null {
  if (cached === undefined) {
    const s = readJson<Session | null>(SESSION_KEY, null);
    cached = s && typeof s === 'object' && typeof s.email === 'string' ? s : null;
  }
  return cached;
}

export function saveSession(s: Session) {
  writeJson(SESSION_KEY, s);
  emit();
}

export function clearSession() {
  removeKey(SESSION_KEY);
  emit();
}

/** Patch the stored session (e.g. the selected estate). */
export function updateSession(patch: Partial<Session>) {
  const s = loadSession();
  if (s) saveSession({ ...s, ...patch });
}

export function subscribeSession(l: Listener) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === SESSION_KEY) emit(); };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(l); window.removeEventListener('storage', onStorage); };
}

/** React hook: the current session, re-rendering when it changes. */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribeSession, loadSession, () => null);
}

/** Session from a server profile, keeping the previously selected estate. */
export function sessionFromProfile(p: Profile, prev: Session | null): Session {
  return {
    id: p.id,
    email: p.email,
    name: p.name,
    estates: p.estates ?? [],
    estate: prev && prev.email === p.email ? prev.estate ?? '' : '',
    role: p.role,
    permissions: p.permissions ?? {},
  };
}

/** True when anything that affects navigation changed. */
export function accessChanged(a: Session, b: Session): boolean {
  return a.role !== b.role ||
    a.name !== b.name ||
    JSON.stringify(a.permissions) !== JSON.stringify(b.permissions) ||
    JSON.stringify(a.estates ?? []) !== JSON.stringify(b.estates ?? []);
}

/** "Jane Doe" → "JD"; falls back to the first letter of the email. */
export function initialsOf(s: Pick<Session, 'name' | 'email'>): string {
  const name = (s.name ?? '').trim();
  if (name) return name.split(/\s+/).map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  return (s.email[0] ?? '?').toUpperCase();
}

/** User ID as shown to people (strip the internal @psms.app suffix). */
export function displayUserId(email: string): string {
  return email.replace(/@psms\.app$/, '');
}
