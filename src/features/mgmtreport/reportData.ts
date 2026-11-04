// The ONLY place Management Report data is read from. Report data will live
// in the MJM Intranet Supabase project (lib/intranetConfig.ts), separate from
// the stock project used by everything else in this app.
//
// Today the page lists this app's own reports (MGMT_REPORT_SOURCES) and makes
// no Intranet calls. When the Intranet side exists, add the fetch here (with
// its own client, created lazily) and keep the page unaware of where data
// comes from. Cross-project auth is not designed yet: do not reuse the stock
// session's JWT against the Intranet project.
import type { SupabaseClient } from '@supabase/supabase-js';
import { INTRANET_SUPABASE_ANON_KEY, INTRANET_SUPABASE_URL, intranetConfigured } from '../../lib/intranetConfig';

export interface ExternalReport {
  id: string;
  title: string;
  /** Opens in a new tab. */
  url: string;
  system: string;
}

let client: SupabaseClient | null = null;

/** Lazily created Intranet client (separate auth storage key), or null when not configured. */
export async function intranetClient(): Promise<SupabaseClient | null> {
  if (!intranetConfigured()) return null;
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js');
    client = createClient(INTRANET_SUPABASE_URL, INTRANET_SUPABASE_ANON_KEY, {
      auth: { storageKey: 'mjm-intranet-auth', persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** Reports from other operation systems. Not connected yet: always []. */
export async function fetchExternalReports(): Promise<ExternalReport[]> {
  return [];
}
