// Sign-in from MJM Intranet (Intranet "level 2: token redirect").
//   { token, module: 'stock' | 'report' } → { session, auth, module }
// The Intranet opens the app with ?gw_token=<60-second single-use token>.
// We redeem it once with the Intranet's gw-check-access (server to server,
// with that module's API key), then look the person up in opp_users — and
// create an HQ User row for them if this is their first visit. The browser
// gets the same session object the classic login builds, plus a Supabase
// Auth session (so the Super Admin / React paths work too).
import {
  ApiError, anonClient, handler, roleOf, serviceClient, SUPER_ADMIN_EMAIL, toAuthEmail, USERS_TABLE, type UserRow,
} from '../_shared/common.ts';

const INTRANET_URL = Deno.env.get('INTRANET_SUPABASE_URL') ?? 'https://briqzyxfxsvulyizzbiu.supabase.co';

type Module = 'stock' | 'report';

// Must match ALL_SECTIONS in the classic app (root index.html) — the Super
// Admin's session carries every section id as an array.
export const ALL_SECTION_IDS = [
  'dashboard',
  'transactions', 'summary', 'ledger',
  'roundprogress', 'maintprogress', 'chemusage',
  'fertrecord', 'chemrecord', 'plantrecord',
  'rainfall', 'rainfallreport', 'rainfallsummary',
  'tools', 'toolsrecord',
  'mgmtreport',
];

interface CheckResult {
  allowed: boolean;
  module_code?: string;
  user?: { id: string; email: string; full_name?: string | null };
  error?: string;
}

/** One API key per Intranet module (the token's audience is the module code). */
function apiKeyFor(module: Module): string {
  const key = module === 'report'
    ? Deno.env.get('INTRANET_REPORT_API_KEY')
    : Deno.env.get('INTRANET_STOCK_API_KEY') || Deno.env.get('INTRANET_MODULE_API_KEY');
  if (!key) throw new ApiError('err_sso_not_set_up', 500);
  return key;
}

async function redeem(token: string, module: Module): Promise<CheckResult> {
  const res = await fetch(`${INTRANET_URL}/functions/v1/gw-check-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-gw-api-key': apiKeyFor(module) },
    body: JSON.stringify({ token }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError('err_sso_invalid', 401);
  return body as CheckResult;
}

/** Case-insensitive lookup; also tries the legacy "<local part>@psms.app" User ID form. */
async function findUser(email: string): Promise<UserRow | null> {
  const db = serviceClient();
  const candidates = [email];
  const legacy = toAuthEmail(email.split('@')[0]);
  if (legacy !== email) candidates.push(legacy);
  for (const candidate of candidates) {
    const { data, error } = await db.from(USERS_TABLE).select('*').ilike('email', candidate);
    if (error) throw error;
    const row = ((data ?? []) as UserRow[]).find((r) => (r.email ?? '').toLowerCase() === candidate);
    if (row) return row;
  }
  return null;
}

/** First visit: create an HQ User row that can open the module they came from.
 *  - stock:  no __configured flag → the app defaults every section to 'view'
 *  - report: only Management Report ('view'); everything else 'none'
 *  Estates are left empty — an admin assigns them in User Management. */
async function createUser(email: string, name: string, module: Module): Promise<UserRow> {
  const permissions: Record<string, unknown> = module === 'report'
    ? { __role: 'hq_user', __configured: true, mgmtreport: 'view' }
    : { __role: 'hq_user' };
  const row = {
    id: Date.now(), // same id scheme as the app / mantap-worker-admin
    name, email, password_hash: '', estates: [], permissions, status: 'active',
  };
  const { data, error } = await serviceClient().from(USERS_TABLE).insert(row).select('*').single();
  if (error) throw error;
  return (data ?? { ...row, last_active: null }) as UserRow;
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

/** The session object exactly as the classic app's attemptLogin builds it. */
function toSession(row: UserRow) {
  const role = row.email.toLowerCase() === SUPER_ADMIN_EMAIL ? 'superadmin' : roleOf(row);
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    estates: row.estates ?? [],
    estate: '',
    role,
    permissions: role === 'superadmin' ? ALL_SECTION_IDS : (row.permissions ?? {}),
  };
}

Deno.serve(handler(async (_req, body) => {
  const token = String(body.token ?? '');
  if (!token || token.length > 4000) throw new ApiError('err_sso_invalid', 400);
  const module: Module = body.module === 'report' ? 'report' : 'stock';

  const check = await redeem(token, module);
  if (!check.allowed || !check.user?.email) throw new ApiError('err_forbidden', 403);
  const email = check.user.email.toLowerCase();
  const fullName = (check.user.full_name ?? '').trim() || email.split('@')[0];

  let row = await findUser(email);
  if (!row) row = await createUser(email, fullName, module);
  if (row.status === 'inactive') throw new ApiError('err_inactive', 403);

  const auth = await issueSession(row);
  await serviceClient().from(USERS_TABLE).update({ last_active: new Date().toISOString() }).eq('id', row.id);
  return { session: toSession(row), auth, module };
}));
