// Plantation Stock Supabase project. The anon key is public by design;
// what each caller may read or change is enforced by the database (RLS,
// applied at cutover) and the Edge Functions, not by this file.
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://eukvdlyzhyjohkjqbqjb.supabase.co';
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a3ZkbHl6aHlqb2hranFicWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2OTg5MzYsImV4cCI6MjA5NDI3NDkzNn0.czKzWGeiujgZ_VpOBZjFaxDjGCca-_-aZ41N5T0gjmk';

export const SUPER_ADMIN_EMAIL = 'hqadmin.puigroups@gmail.com';
export const SUPER_ADMIN_NAME = 'HQ Admin';

/** Estate workers use the separate Worker Portal (MJMElon/Mantap). */
export const WORKER_PORTAL_URL = 'https://mjmelon.github.io/Mantap/#/m';

/** Edge Function that checks HQ user passwords on the server. */
export const AUTH_FUNCTION = 'stock-auth';

// localStorage / sessionStorage keys shared with the legacy app, so cached
// data, language and the last estate carry over.
export const SESSION_KEY = 'opp_auth_session';
export const LANG_KEY = 'opp_lang';
export const SIDEBAR_COLLAPSED_KEY = 'opp_sidebar_collapsed';
export const ACTIVE_SECTION_KEY = 'opp_active_section'; // sessionStorage
export const LEGACY_SYNC_QUEUE_KEY = 'opp_sync_queue';
export const ROW_QUEUE_KEY = 'opp_row_queue';

/** Legacy hides the sidebar entirely (`#sidebar{display:none!important}`) and
 *  navigates with home cards + tab bars. The React layout shows it; set to
 *  false to get the legacy look back. */
export const SIDEBAR_ENABLED = true;

/** Used until opp_estates has loaded (same list as the legacy app). */
export const DEFAULT_ESTATES = [
  'Elewsun', 'Estet Seri Mawar', 'Gama Menang', 'Mega Jutamas (Suai)',
  'Meridian Palma', 'MJM Plantation 1', 'MJM Plantation 2', 'MJM Plantation 3',
  'Mono Gaya', 'Sungai Mak Plantation', 'Ulu Niah Estate',
];

/** Status watcher: poll interval and last_active write throttle. */
export const STATUS_POLL_MS = 30_000;
export const LAST_ACTIVE_THROTTLE_MS = 2 * 60_000;

/** Offline queue drain: wait after `online`, then retry with these delays. */
export const ONLINE_DRAIN_DELAY_MS = 2000;
export const DRAIN_RETRY_DELAYS_MS = [0, 4000, 10000];
