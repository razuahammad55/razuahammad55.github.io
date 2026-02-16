/**
 * Service Worker for Caching Playlists
 */

const CACHE_NAME = 'iptv-player-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/components.css',
    '/js/app.js',
    '/js/player.js',
    '/js/playlist-parser.js',
    '/js/playlist-manager.js',
    '/js/storage-manager.js',
    '/js/ui.js',
    '/js/modal.js'
];

self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .catch(err => console.log('Cache error:', err))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    
    if (event.request.url.includes('.m3u8') || 
        event.request.url.includes('.ts') ||
        event.request.url.includes('stream')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request)
                    .then((fetchResponse) => {
                        if (fetchResponse && fetchResponse.status === 200) {
                            const responseClone = fetchResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseClone);
                                });
                        }
                        return fetchResponse;
                    });
            })
    );
});