// MJM Intranet Supabase project. Management Report DATA will live here
// (not in the stock project). Only src/features/mgmtreport/reportData.ts
// may use this. No tables or functions exist there for this app yet.
export const INTRANET_SUPABASE_URL =
  import.meta.env.VITE_INTRANET_SUPABASE_URL ?? 'https://briqzyxfxsvulyizzbiu.supabase.co';

/** Public anon key of the Intranet project. Placeholder until it is set at
 *  build time (VITE_INTRANET_SUPABASE_ANON_KEY); empty means "not connected". */
export const INTRANET_SUPABASE_ANON_KEY: string = import.meta.env.VITE_INTRANET_SUPABASE_ANON_KEY ?? '';

export const intranetConfigured = () => INTRANET_SUPABASE_ANON_KEY.length > 0;
