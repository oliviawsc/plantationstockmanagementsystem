const CACHE = 'opp-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const { request } = e;
    const url = new URL(request.url);

    // Pass Supabase API calls straight through — never cache live data requests.
    if (url.hostname.endsWith('supabase.co')) return;

    // Only intercept GET requests.
    if (request.method !== 'GET') return;

    // Network-first with cache fallback:
    // — Online  : fetch from network, store a fresh copy in cache, return response.
    // — Offline : network fails, return whatever we have cached.
    e.respondWith(
        fetch(request)
            .then(res => {
                if (res && res.ok) {
                    caches.open(CACHE).then(c => c.put(request, res.clone()));
                }
                return res;
            })
            .catch(() =>
                caches.match(request).then(hit => {
                    if (hit) return hit;
                    // For page navigations with no specific cache entry,
                    // fall back to the app shell (index.html).
                    if (request.mode === 'navigate') {
                        return caches.match(new URL('./index.html', self.location.href))
                            || caches.match(new URL('./', self.location.href));
                    }
                })
            )
    );
});
