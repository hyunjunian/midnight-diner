/* Atomic app-shell updates, including the new portrait cinematic. */
const VERSION = 'midnight-diner-pwa-20261107-v4-local-diner';
const ROOT = new URL('./', self.location.href);
const INDEX = new URL('index.html', ROOT).href;
const FILES = [
  'index.html', 'style.css', 'engine.js', 'game.js', 'pwa.js', 'manifest.webmanifest',
  'assets/interior.svg', 'assets/exterior.svg', 'assets/opening-portrait.mp4', 'assets/opening-portrait-poster.jpg',
  'assets/icon-192.png', 'assets/icon-512.png', 'assets/icon-maskable-512.png', 'assets/apple-touch-icon.png',
].map(path => new URL(path, ROOT).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('midnight-diner-pwa-') && key !== VERSION) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});
async function rangeResponse(request, cached) {
  const buffer = await cached.arrayBuffer();
  const size = buffer.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '');
  if (!match || (!match[1] && !match[2])) return new Response(null, {status: 416, headers: {'Content-Range': `bytes */${size}`}});
  let start, end;
  if (!match[1]) { start = Math.max(0, size - Number(match[2])); end = size - 1; }
  else { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1; }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size || end < 0) {
    return new Response(null, {status: 416, headers: {'Content-Range': `bytes */${size}`}});
  }
  return new Response(buffer.slice(start, end + 1), {status: 206, headers: {
    'Content-Type': cached.headers.get('Content-Type') || 'video/mp4',
    'Content-Range': `bytes ${start}-${end}/${size}`,
    'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes',
  }});
}
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    // A cached navigation and its scripts always belong to the same release.
    if (request.mode === 'navigate') {
      if (url.pathname === ROOT.pathname || url.pathname === new URL(INDEX).pathname) {
        return (await cache.match(INDEX)) || fetch(request);
      }
      return fetch(request);
    }
    const cached = await cache.match(request.url);
    if (cached && request.headers.has('range')) return rangeResponse(request, cached);
    return cached || fetch(request);
  })());
});
