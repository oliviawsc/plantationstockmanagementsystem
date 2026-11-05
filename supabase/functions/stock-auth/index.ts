// Sign-in for HQ users of the Plantation Stock app.
//   { action: 'sign_in', userId, password }           → { session, profile }
//   { action: 'me' }               (caller's JWT)     → { profile }
//   { action: 'change_password', current, next } (JWT) → { ok: true }
// The password hash never leaves the server. After 5 wrong passwords the
// User ID is locked for 15 minutes. The Super Admin signs in with Supabase
// Auth directly; estate workers are told to use the Worker Portal.
import {
  anonClient, ApiError, ATTEMPTS_TABLE, callerEmail, handler, roleOf, serviceClient, sha256Hex,
  SUPER_ADMIN_EMAIL, timingSafeEqual, toAuthEmail, toProfile, USERS_TABLE, WORKER_ROLE, type UserRow,
} from '../_shared/common.ts';

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
// Compared against when the User ID does not exist, so timing is the same.
const DUMMY_HASH = '0'.repeat(64);

async function findUser(email: string): Promise<UserRow | null> {
  const { data, error } = await serviceClient().from(USERS_TABLE).select('*').eq('email', email).maybeSingle();
  if (error) throw error;
  return (data as UserRow | null) ?? null;
}

async function checkLock(email: string) {
  const { data } = await serviceClient().from(ATTEMPTS_TABLE).select('locked_until').eq('email', email).maybeSingle();
  if (data?.locked_until && new Date(data.locked_until) > new Date()) throw new ApiError('err_locked', 429);
}

async function recordAttempt(email: string, ok: boolean) {
  const db = serviceClient();
  if (ok) { await db.from(ATTEMPTS_TABLE).delete().eq('email', email); return; }
  const { data } = await db.from(ATTEMPTS_TABLE).select('fails').eq('email', email).maybeSingle();
  const fails = (data?.fails ?? 0) + 1;
  const locked_until = fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null;
  await db.from(ATTEMPTS_TABLE).upsert({ email, fails: locked_until ? 0 : fails, locked_until, updated_at: new Date().toISOString() });
}

/** Checks the password (with lockout). Returns the row on success. */
async function verifyPassword(email: string, password: string): Promise<UserRow> {
  await checkLock(email);
  const row = await findUser(email);
  const ok = (await timingSafeEqual(row?.password_hash || DUMMY_HASH, await sha256Hex(password))) && !!row?.password_hash;
  await recordAttempt(email, ok);
  if (!ok || !row) throw new ApiError('err_wrong', 401);
  return row;
}

/** Creates the user's Supabase Auth account if needed and returns a session for it. */
async function issueSession(row: UserRow) {
  const admin = serviceClient().auth.admin;
  const created = await admin.createUser({
    email: row.email, email_confirm: true, user_metadata: { opp_user_id: row.id, name: row.name },
  });
  if (created.error && !/already|exists|registered/i.test(created.error.message)) throw created.error;

  const link = await admin.generateLink({ type: 'magiclink', email: row.email });
  if (link.error) throw link.error;
  const { data, error } = await anonClient().auth.verifyOtp({ type: 'magiclink', token_hash: link.data.properties.hashed_token });
  if (error || !data.session) throw error ?? new Error('no session');
  return { access_token: data.session.access_token, refresh_token: data.session.refresh_token };
}

async function signedInRow(req: Request): Promise<UserRow> {
  const email = await callerEmail(req);
  if (!email) throw new ApiError('err_forbidden', 401);
  const row = await findUser(email);
  if (!row || row.status === 'inactive') throw new ApiError('err_inactive', 403);
  return row;
}

function userIdArg(v: unknown): string {
  const id = String(v ?? '').trim().toLowerCase();
  if (!id) throw new ApiError('err_empty_id');
  if (id.length > 200) throw new ApiError('err_invalid');
  return id;
}

Deno.serve(handler(async (req, body) => {
  if (body.action === 'sign_in') {
    const userId = userIdArg(body.userId);
    const password = String(body.password ?? '');
    if (!password) throw new ApiError('err_empty_pw');
    const email = toAuthEmail(userId);
    if (email === SUPER_ADMIN_EMAIL) throw new ApiError('err_invalid'); // Super Admin uses Supabase Auth

    const row = await verifyPassword(email, password);
    if (row.status === 'inactive') throw new ApiError('err_inactive', 403);
    if (roleOf(row) === WORKER_ROLE) throw new ApiError('err_worker_portal', 403);

    const session = await issueSession(row);
    await serviceClient().from(USERS_TABLE).update({ last_active: new Date().toISOString() }).eq('id', row.id);
    return { session, profile: toProfile(row) };
  }

  if (body.action === 'me') {
    return { profile: toProfile(await signedInRow(req)) };
  }

  if (body.action === 'change_password') {
    const row = await signedInRow(req);
    if (row.email === SUPER_ADMIN_EMAIL) throw new ApiError('err_invalid');
    const next = String(body.next ?? '');
    if (next.length < 6 || next.length > 200) throw new ApiError('err_invalid');
    await verifyPassword(row.email, String(body.current ?? ''));
    const { error } = await serviceClient().from(USERS_TABLE).update({ password_hash: await sha256Hex(next) }).eq('id', row.id);
    if (error) throw error;
    return { ok: true };
  }

  throw new ApiError('err_invalid');
}));
