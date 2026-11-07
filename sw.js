// Keeps the app opening instantly, even on a slow connection. Your data always comes fresh from Google.
const CACHE = 'mm-202611080300';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;     // Google script calls go straight to the network
  const isPage = e.request.mode === 'navigate' || /\/(index\.html)?$/.test(u.pathname) || /config\.js$/.test(u.pathname);
  if (isPage) {   // newest version when online, saved copy when offline or slow
    e.respondWith(Promise.race([
      fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }),
      new Promise(res => setTimeout(() => caches.match(e.request, { ignoreSearch: true }).then(m => m && res(m)), 2500))
    ]).catch(() => caches.match(e.request, { ignoreSearch: true }).then(m => m || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(m => m || fetch(e.request)));
});
