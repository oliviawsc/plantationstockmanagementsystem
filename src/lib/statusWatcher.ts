// Force sign-out when an admin deactivates the signed-in user, and keep
// opp_users.last_active fresh (legacy startStatusWatcher ~10702).
//  - Realtime UPDATE on the user's row → instant sign-out when inactive.
//  - Fallback: check every 30 s and whenever the tab becomes visible.
//  - Any click writes last_active, at most once per 2 minutes.
import type { RealtimeChannel } from '@supabase/supabase-js';
import { LAST_ACTIVE_THROTTLE_MS, STATUS_POLL_MS } from './config';
import { supabase } from './supabase';
import type { Session } from './types';

export async function isInactive(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('opp_users').select('status').eq('email', email).maybeSingle();
    if (error) return false;
    return (data as { status?: string } | null)?.status === 'inactive';
  } catch {
    return false;
  }
}

/** Starts watching; returns a stop function. */
export function startStatusWatcher(session: Session, onInactive: () => void): () => void {
  let stopped = false;
  let channel: RealtimeChannel | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;
  const fire = () => { if (!stopped) { stop(); onInactive(); } };
  const check = async () => { if (!stopped && (await isInactive(session.email))) fire(); };

  if (session.role !== 'superadmin') {
    channel = supabase
      .channel('status-watch-' + session.email.replace(/[^a-z0-9]/gi, '_'))
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'opp_users', filter: 'email=eq.' + session.email },
        (payload) => { if ((payload.new as { status?: string })?.status === 'inactive') fire(); })
      .subscribe();
    interval = setInterval(() => void check(), STATUS_POLL_MS);
  }

  const onVisible = () => {
    if (document.visibilityState === 'visible' && session.role !== 'superadmin') void check();
  };
  document.addEventListener('visibilitychange', onVisible);

  let lastFlush = 0;
  const onClick = () => {
    const now = Date.now();
    if (now - lastFlush < LAST_ACTIVE_THROTTLE_MS) return;
    lastFlush = now;
    const q = supabase.from('opp_users').update({ last_active: new Date().toISOString() });
    void (session.id ? q.eq('id', session.id) : q.eq('email', session.email)).then(() => {}, () => {});
  };
  document.addEventListener('click', onClick);

  function stop() {
    stopped = true;
    if (channel) { void supabase.removeChannel(channel).catch(() => {}); channel = null; }
    if (interval) { clearInterval(interval); interval = null; }
    document.removeEventListener('visibilitychange', onVisible);
    document.removeEventListener('click', onClick);
  }
  return stop;
}
