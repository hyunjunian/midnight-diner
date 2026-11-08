/* Atomic app-shell updates, including the new portrait cinematic. */
const VERSION = 'midnight-diner-pwa-20261108-v17-guided-kitchen';
const ROOT = new URL('./', self.location.href);
const INDEX = new URL('index.html', ROOT).href;
const FILES = [
  'index.html', 'style.css', 'cooking-rules.js', 'kitchen.js', 'gestures.js', 'kitchen.css', 'catalog.js', 'stories.js', 'engine.js', 'game.js', 'scene.js', 'rain.js', 'morph.js', 'pwa.js', 'manifest.webmanifest',
  'assets/visitors-a.webp', 'assets/visitors-b.webp', 'assets/decor-real.webp', 'assets/food-clean.webp', 'assets/restaurant-counter.webp', 'assets/intro-world.webp', 'assets/interior.svg', 'assets/exterior.svg', 'assets/opening-visible-rain.mp4', 'assets/opening-portrait-poster.jpg',
  'assets/menu-1.webp', 'assets/menu-2.webp', 'assets/menu-3.webp', 'assets/menu-4.webp', 'assets/menu-5.webp', 'assets/menu-6.webp', 'assets/menu-7.webp', 'assets/menu-8.webp', 'assets/menu-9.webp', 'assets/menu-10.webp', 'assets/pantry-a.webp', 'assets/pantry-b.webp', 'assets/decor-growth.webp', 'assets/restaurant-fridge.webp',
  'assets/kitchen-room.webp', 'assets/kitchen-upgraded.webp', 'assets/fridge-upgraded.webp', 'assets/fridge-open.webp', 'assets/fridge-closed.webp', 'assets/cooking-tools.webp', 'assets/cooking-vessels.webp', 'assets/cooking-rice.webp', 'assets/restaurant-ceramics.webp',
  'assets/process-anime-1.webp', 'assets/process-anime-2.webp', 'assets/process-anime-3.webp', 'assets/process-anime-4.webp', 'assets/process-anime-5.webp', 'assets/process-anime-6.webp', 'assets/process-anime-7.webp', 'assets/process-anime-8.webp', 'assets/process-anime-9.webp', 'assets/process-anime-10.webp', 'assets/process-anime-11.webp', 'assets/process-anime-12.webp', 'assets/process-anime-13.webp', 'assets/process-anime-14.webp', 'assets/process-anime-15.webp', 'assets/process-anime-16.webp', 'assets/process-anime-17.webp', 'assets/process-anime-18.webp', 'assets/process-anime-19.webp', 'assets/process-anime-20.webp', 'assets/process-anime-21.webp', 'assets/process-anime-22.webp', 'assets/process-anime-23.webp', 'assets/process-anime-24.webp', 'assets/process-anime-25.webp', 'assets/knife-player.webp',
  'assets/prep-anime-1.webp', 'assets/prep-anime-2.webp', 'assets/prep-anime-3.webp', 'assets/prep-anime-4.webp', 'assets/prep-anime-5.webp', 'assets/prep-anime-6.webp', 'assets/prep-anime-7.webp', 'assets/stock-anime-1.webp', 'assets/stock-anime-2.webp', 'assets/stock-anime-3.webp',
  'assets/plating-1.webp', 'assets/plating-2.webp', 'assets/plating-3.webp', 'assets/plating-4.webp', 'assets/plating-5.webp', 'assets/plating-6.webp', 'assets/plating-7.webp', 'assets/plating-8.webp', 'assets/plating-9.webp', 'assets/plating-10.webp', 'assets/plating-11.webp', 'assets/plating-12.webp', 'assets/plating-13.webp', 'assets/plating-14.webp', 'assets/plating-15.webp', 'assets/plating-16.webp', 'assets/plating-17.webp', 'assets/plating-18.webp', 'assets/plating-19.webp', 'assets/plating-20.webp', 'assets/plating-21.webp', 'assets/plating-22.webp', 'assets/plating-23.webp', 'assets/plating-24.webp', 'assets/plating-25.webp',
  'assets/measure-soy.webp', 'assets/measure-dashi.webp', 'assets/measure-milk.webp', 'assets/measure-miso.webp', 'assets/measure-flour.webp', 'assets/measure-sugar.webp',
  'assets/used-menu-1.webp', 'assets/used-menu-2.webp', 'assets/used-menu-3.webp', 'assets/used-menu-4.webp', 'assets/used-menu-5.webp', 'assets/used-menu-6.webp', 'assets/used-menu-7.webp', 'assets/used-menu-8.webp', 'assets/used-menu-9.webp', 'assets/used-menu-10.webp',
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
