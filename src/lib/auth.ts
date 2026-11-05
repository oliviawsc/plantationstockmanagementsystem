// Sign-in, sign-out, profile refresh and password change.
//  - Super Admin: Supabase Auth (signInWithPassword), as in the legacy app.
//  - HQ users: the stock-auth Edge Function checks password_hash on the
//    server and returns a Supabase Auth session; the browser never sees hashes.
//  - Estate workers are sent to the Worker Portal.
import { ACTIVE_SECTION_KEY, AUTH_FUNCTION, SUPER_ADMIN_EMAIL, SUPER_ADMIN_NAME, WORKER_PORTAL_URL } from './config';
import { ALL_SECTIONS } from './permissions';
import { clearSession, loadSession, saveSession, sessionFromProfile } from './session';
import { removeKey } from './storage';
import { callFunction, supabase } from './supabase';
import type { Profile, Session } from './types';

interface SignInResult {
  session: { access_token: string; refresh_token: string };
  profile: Profile;
}

function superAdminSession(id: number | undefined, prev: Session | null): Session {
  return {
    id,
    email: SUPER_ADMIN_EMAIL,
    name: SUPER_ADMIN_NAME,
    estate: prev?.email === SUPER_ADMIN_EMAIL ? prev.estate ?? '' : '',
    role: 'superadmin',
    permissions: ALL_SECTIONS.map((s) => s.id),
  };
}

/** opp_users id of the Super Admin (for last_active), if the row exists. */
async function superAdminId(): Promise<number | undefined> {
  try {
    const { data } = await supabase.from('opp_users').select('id').eq('email', SUPER_ADMIN_EMAIL).maybeSingle();
    return (data as { id?: number } | null)?.id;
  } catch { return undefined; }
}

export function touchLastActive(id: number | undefined) {
  if (!id) return;
  void supabase.from('opp_users').update({ last_active: new Date().toISOString() }).eq('id', id)
    .then(() => {}, () => {});
}

export function goToWorkerPortal() {
  window.location.replace(WORKER_PORTAL_URL);
}

/** Signs in; returns the new session. Throws Error(err_* code). */
export async function signIn(rawId: string, password: string): Promise<Session> {
  const id = rawId.trim().toLowerCase();
  if (!id) throw new Error('err_empty_id');
  if (!password) throw new Error('err_empty_pw');

  if (id === SUPER_ADMIN_EMAIL) {
    const { error } = await supabase.auth.signInWithPassword({ email: id, password });
    if (error) throw new Error(/fetch|network/i.test(error.message) ? 'err_network' : 'err_wrong');
    const s = superAdminSession(await superAdminId(), null);
    touchLastActive(s.id);
    saveSession(s);
    return s;
  }

  const r = await callFunction<SignInResult>(AUTH_FUNCTION, { action: 'sign_in', userId: id, password });
  const { error } = await supabase.auth.setSession(r.session);
  if (error) throw new Error('err_network');
  const s = sessionFromProfile(r.profile, null);
  saveSession(s);
  return s;
}

/**
 * Session to boot with on page load, or null when the user must sign in.
 * A cached session also needs a matching Supabase Auth session; legacy
 * HQ-user sessions (no Auth session) therefore sign in once more.
 */
export async function restoreSession(): Promise<Session | 'worker' | null> {
  const local = loadSession();
  if (!local) return null;
  if (local.role === 'estate_user') return 'worker';
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user.email?.toLowerCase();
  if (!email || email !== local.email.toLowerCase()) {
    clearSession();
    return null;
  }
  return local;
}

/**
 * Re-reads the signed-in user's profile (access, estates, status may have
 * changed). Returns the updated session, 'inactive' when the account was
 * deactivated or removed, or the unchanged session when offline.
 */
export async function refreshProfile(): Promise<Session | 'inactive' | 'worker' | null> {
  const prev = loadSession();
  if (!prev) return null;
  if (prev.role === 'superadmin') {
    if (prev.id) return prev;
    const id = await superAdminId();
    if (!id) return prev;
    const s = { ...prev, id };
    saveSession(s);
    return s;
  }
  try {
    const r = await callFunction<{ profile: Profile }>(AUTH_FUNCTION, { action: 'me' });
    if (r.profile.role === 'estate_user') return 'worker';
    const s = sessionFromProfile(r.profile, prev);
    saveSession(s);
    return s;
  } catch (e) {
    const code = e instanceof Error ? e.message : '';
    if (code === 'err_inactive' || code === 'err_forbidden') return 'inactive';
    return prev; // offline or server hiccup: keep the cached session
  }
}

/** Clears the session (legacy logoutUser without the confirm dialog). */
export async function signOut() {
  clearSession();
  removeKey(ACTIVE_SECTION_KEY, sessionStorage);
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
}

/** Throws Error(cp_err_* | err_*). */
export async function changePassword(current: string, next: string): Promise<void> {
  const s = loadSession();
  if (!s) throw new Error('cp_err_session');
  if (s.role === 'superadmin') {
    const verify = await supabase.auth.signInWithPassword({ email: s.email, password: current });
    if (verify.error) throw new Error('cp_err_wrong');
    const upd = await supabase.auth.updateUser({ password: next });
    if (upd.error) throw new Error('cp_err_network');
    return;
  }
  try {
    await callFunction(AUTH_FUNCTION, { action: 'change_password', current, next });
  } catch (e) {
    const code = e instanceof Error ? e.message : '';
    if (code === 'err_wrong') throw new Error('cp_err_wrong');
    if (code === 'err_locked' || code === 'err_inactive') throw e;
    throw new Error('cp_err_network');
  }
}
