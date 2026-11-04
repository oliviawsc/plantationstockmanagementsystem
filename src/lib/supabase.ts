import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

/** One client for the whole app. It uses Supabase's default auth storage
 *  key, the same one the legacy app uses for the Super Admin sign-in. */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Call an Edge Function; throws Error(code) where code is an i18n err_* key. */
export async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let code = 'err_network';
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') code = (await ctx.json()).error ?? code;
    } catch { /* keep default */ }
    throw new Error(code);
  }
  return data as T;
}
