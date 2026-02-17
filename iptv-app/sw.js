/**
 * Service Worker with HTTP to HTTPS Proxy
 * Automatically handles HTTP streams on HTTPS pages
 */

const CACHE_NAME = 'iptv-player-v2';
const CORS_PROXY = 'https://corsproxy.io/?';

// Install
self.addEventListener('install', (event) => {
    console.log('SW: Installing...');
    self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
    console.log('SW: Activating...');
    event.waitUntil(self.clients.claim());
});

// Fetch - proxy HTTP requests
self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    
    // Check if it's an HTTP stream request on HTTPS page
    if (self.location.protocol === 'https:' && url.startsWith('http://')) {
        console.log('SW: Proxying HTTP request:', url);
        
        event.respondWith(
            fetch(CORS_PROXY + encodeURIComponent(url), {
                method: event.request.method,
                headers: event.request.headers,
                mode: 'cors',
                credentials: 'omit',
                cache: 'no-store'
            })
            .then(response => {
                console.log('SW: Proxied successfully');
                return response;
            })
            .catch(error => {
                console.error('SW: Proxy failed:', error);
                // Try without proxy as fallback
                return fetch(event.request);
            })
        );
    }
    // Otherwise, normal fetch
    else {
        event.respondWith(fetch(event.request));
    }
});
