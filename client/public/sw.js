/**
 * RecipeBox Service Worker — manual (no Workbox)
 *
 * Caching strategy summary:
 * ─────────────────────────────────────────────────────────────────────────
 * PRECACHE (on install):
 *   App shell files: /, /offline.html, /manifest.webmanifest, and key JS/CSS
 *   chunks at build time. The PRECACHE_ASSETS array below is intentionally
 *   minimal; build tooling would inject a full hashed manifest in production.
 *
 * RUNTIME — /api/categories & images:
 *   Stale-While-Revalidate — respond from cache immediately, then update.
 *   Good for stable data where a slightly stale version is acceptable.
 *
 * RUNTIME — /api/search & /api/meal/:id:
 *   Network-First with cache fallback — try network first so data is fresh,
 *   fall back to cache if offline.
 *
 * NAVIGATION requests (HTML):
 *   Try network, fall back to cached /, or serve /offline.html as last resort.
 * ─────────────────────────────────────────────────────────────────────────
 */

const CACHE_VERSION = 'v2';
const PRECACHE = `precache-${CACHE_VERSION}`;
const RUNTIME_API = `runtime-api-${CACHE_VERSION}`;
const RUNTIME_IMG = `runtime-img-${CACHE_VERSION}`;
// Dedicated cache for images we proactively save (favorites + category thumbs)
const FAVORITE_IMG = `favorite-img-${CACHE_VERSION}`;

// Files to precache on install (the app shell)
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()) // activate immediately
  );
});

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  // Delete old cache versions to avoid stale assets
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) => k !== PRECACHE && k !== RUNTIME_API && k !== RUNTIME_IMG && k !== FAVORITE_IMG
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim()) // take control of all tabs
  );
});

// ─── Message ─────────────────────────────────────────────────────────────────
// The client posts { type: 'CACHE_IMAGES', urls: string[] } to proactively
// pull images into the cache — used when saving a favorite or after a
// category filter loads so those images survive offline.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_IMAGES') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(FAVORITE_IMG).then((cache) =>
        Promise.all(
          urls.map((url) =>
            // Only fetch if not already cached to avoid redundant requests
            cache.match(url).then((hit) => {
              if (!hit) {
                return fetch(url, { mode: 'no-cors' })
                  .then((res) => cache.put(url, res))
                  .catch(() => { /* ignore individual failures */ });
              }
            })
          )
        )
      )
    );
  }
});

// ─── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests from the same origin (or our API proxy)
  if (request.method !== 'GET') return;

  // ── Navigation requests (HTML page loads) ──────────────────────────────
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // ── TheMealDB images (*.jpg from www.themealdb.com) ────────────────────
  // Check proactive favorite cache first, then fall back to stale-while-revalidate
  if (url.hostname === 'www.themealdb.com' && url.pathname.match(/\.(jpg|jpeg|png|webp)$/i)) {
    event.respondWith(
      caches.match(request).then((hit) => hit || staleWhileRevalidate(request, RUNTIME_IMG))
    );
    return;
  }

  // ── /api/categories — Stale-While-Revalidate ──────────────────────────
  if (url.pathname === '/api/categories') {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_API));
    return;
  }

  // ── /api/search & /api/meal/:id & /api/filter — Network-First ─────────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, RUNTIME_API));
    return;
  }

  // ── Static assets (JS, CSS, fonts) from precache ──────────────────────
  event.respondWith(cacheFirst(request));
});

// ─── Strategy: Cache-First (static assets) ──────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PRECACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// ─── Strategy: Network-First (API data) ─────────────────────────────────────
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ─── Strategy: Stale-While-Revalidate (categories, images) ─────────────────
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fire a background update regardless of whether we have a cached version
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  // Return cached version immediately if available, otherwise wait for network
  return cached || fetchPromise;
}

// ─── Strategy: Network-First for navigations, fallback to offline.html ───────
async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    // Try the cached shell root
    const cached = await caches.match('/');
    if (cached) return cached;
    // Last resort: the offline fallback page
    return caches.match('/offline.html');
  }
}
