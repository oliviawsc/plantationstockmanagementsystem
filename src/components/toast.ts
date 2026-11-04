// Tiny toast store usable from non-React code (data layer, auth).
// Same look and timings as the legacy _showToast / sync toasts.
export type ToastTone = 'error' | 'queued' | 'success' | 'info';

export interface Toast {
  id: string;
  text: string;
  tone: ToastTone;
}

type Listener = (toasts: Toast[]) => void;
let toasts: Toast[] = [];
const listeners = new Set<Listener>();
let seq = 0;

function emit() { listeners.forEach((l) => l(toasts)); }

/** Show a toast. `ms` 0 keeps it until clicked. A fixed `id` replaces an
 *  existing toast with that id instead of stacking a duplicate. */
export function showToast(text: string, tone: ToastTone, ms: number, id?: string): string {
  const tid = id ?? `t${++seq}`;
  toasts = [...toasts.filter((t) => t.id !== tid), { id: tid, text, tone }];
  emit();
  if (ms > 0) setTimeout(() => dismissToast(tid), ms);
  return tid;
}

export function dismissToast(id: string) {
  const before = toasts.length;
  toasts = toasts.filter((t) => t.id !== id);
  if (toasts.length !== before) emit();
}

export function hasToast(id: string) {
  return toasts.some((t) => t.id === id);
}

export function subscribeToasts(l: Listener) {
  listeners.add(l);
  l(toasts);
  return () => { listeners.delete(l); };
}
