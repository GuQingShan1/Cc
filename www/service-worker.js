const CACHE_NAME = 'cultivation-v4';
const FILES_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './assets/manifest.json',
    './css/tokens.css',
    './css/base.css',
    './css/components.css',
    './css/views.css',
    './css/fx.css',
    './js/icons.js',
    './js/game.js',
    './js/art.js',
    './js/fx.js',
    './js/sheet.js',
    './js/views.js',
    './js/app.js',
    './assets/ui/mountains.svg',
    './assets/ui/brush-frame.svg',
    './assets/fonts/zcool-xiaowei-latin-400-normal.woff2',
    './assets/fonts/cinzel-latin-400-normal.woff2',
    './assets/fonts/cinzel-latin-700-normal.woff2',
    './assets/fonts/noto-sans-latin-400-normal.woff2',
    './assets/fonts/noto-sans-latin-600-normal.woff2',
    './assets/fonts/noto-sans-latin-700-normal.woff2',
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
        )
    );
    self.clients.claim();
});

// Network first so updates are picked up immediately; cache is the offline fallback.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                }
                return response;
            })
            .catch(() =>
                caches.match(event.request).then((cached) => {
                    if (cached) return cached;
                    if (event.request.mode === 'navigate') return caches.match('./index.html');
                    return new Response('', { status: 504, statusText: 'offline' });
                })
            )
    );
});
