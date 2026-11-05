// Shared helpers for the Plantation Stock Edge Functions (same style as
// the Worker Portal's functions in MJMElon/Mantap).
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const ALLOWED_ORIGINS = (Deno.env.get('STOCK_ALLOWED_ORIGINS') ??
  'https://oliviawsc.github.io,https://mjmelon.github.io,http://localhost:5173,http://localhost:4173,http://localhost:8000').split(',');

export const SUPER_ADMIN_EMAIL = Deno.env.get('SUPER_ADMIN_EMAIL') ?? 'hqadmin.puigroups@gmail.com';
export const USERS_TABLE = 'opp_users';
export const ATTEMPTS_TABLE = 'stock_login_attempts';
export const WORKER_ROLE = 'estate_user';

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

/** Error with an i18n code the frontend understands (err_*) and an HTTP status. */
export class ApiError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}

export function handler(fn: (req: Request, body: Record<string, unknown>) => Promise<unknown>) {
  return async (req: Request): Promise<Response> => {
    const headers = { ...corsHeaders(req), 'Content-Type': 'application/json' };
    if (req.method === 'OPTIONS') return new Response('ok', { headers });
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'err_invalid' }), { status: 405, headers });
    try {
      const body = await req.json().catch(() => ({}));
      const result = await fn(req, body && typeof body === 'object' ? body : {});
      return new Response(JSON.stringify(result), { headers });
    } catch (e) {
      if (e instanceof ApiError) return new Response(JSON.stringify({ error: e.code }), { status: e.status, headers });
      console.error(e);
      return new Response(JSON.stringify({ error: 'err_network' }), { status: 500, headers });
    }
  };
}

/** Service-role client: bypasses RLS. Only ever used inside these functions. */
export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Anon client, optionally acting as the caller (their JWT from the request). */
export function anonClient(req?: Request): SupabaseClient {
  const auth = req?.headers.get('Authorization');
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: auth ? { headers: { Authorization: auth } } : undefined,
  });
}

/** Email of the signed-in caller, or null. */
export async function callerEmail(req: Request): Promise<string | null> {
  if (!req.headers.get('Authorization')) return null;
  const { data } = await anonClient(req).auth.getUser();
  return data.user?.email?.toLowerCase() ?? null;
}

// Same password format the legacy app uses (hex SHA-256), so existing passwords keep working.
export async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time string compare: both sides are hashed first, so the
 *  loop always runs over 64 characters whatever the inputs are. */
export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256Hex(a), sha256Hex(b)]);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < ha.length; i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diff === 0;
}

export function toAuthEmail(userId: string): string {
  return userId.includes('@') ? userId : `${userId}@psms.app`;
}

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash?: string | null;
  estates: string[] | null;
  permissions: Record<string, unknown> | string[] | null;
  status: string | null;
  last_active: string | null;
}

export const roleOf = (row: UserRow): string =>
  row.permissions && typeof row.permissions === 'object' && !Array.isArray(row.permissions)
    ? String((row.permissions as { __role?: string }).__role ?? 'user')
    : 'user';

/** Profile the frontend stores as its session (never the password hash). */
export function toProfile(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    estates: row.estates ?? [],
    role: roleOf(row),
    permissions: row.permissions ?? {},
    status: row.status ?? 'active',
  };
}
