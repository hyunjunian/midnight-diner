/* Atomic app-shell updates, including the new portrait cinematic. */
const RELEASE = '20261108-v32-auto-update';
const CACHE_PREFIX = 'midnight-diner-pwa-';
const VERSION = CACHE_PREFIX + RELEASE;
const ROOT = new URL('./', self.location.href);
const INDEX = new URL('index.html', ROOT).href;
const FILES = [
  'assets/core-beat-night-v24.webp',
  'assets/core-broth-night-v24.webp',
  'assets/core-lid-night-v24.webp',
  'assets/core-pour-night-v24.webp',
  'assets/core-wrap-burnt-v24.webp',
  'assets/core-wrap-raw-v24.webp',
  'assets/core-wrap-v20-night-v24.webp',
  'assets/heat-burnt-2-night-v24.webp',
  'assets/heat-burnt-3-night-v24.webp',
  'assets/heat-hi-2-night-v24.webp',
  'assets/heat-hi-3-night-v24.webp',
  'assets/measure-dashi-night-v24.webp',
  'assets/plating-burnt-v24.webp',
  'assets/plating-negi-burnt-v24.webp',
  'assets/plating-negi-raw-v24.webp',
  'assets/plating-raw-v24.webp',
  'assets/prep-night-v24-egg.webp',
  'assets/prep-night-v24-nori.webp',
  'assets/prep-night-v24-pork.webp',
  'assets/prep-night-v24-rice.webp',
  'assets/prep-night-v24-salmon.webp',
  'index.html',
  'style.css',
  'customer.css',
  'motion.css',
  'analog.css',
  'frames.css',
  'tactile-controls.css',
  'physical-icons.css',
  'polish.css',
  'analog-feedback-v25.css',
  'location-nav-v25.css',
  'assets/fonts/nanum-myeongjo.woff2',
  'assets/fonts/OFL-NanumMyeongjo.txt',
  'assets/prep-night-v22-scallion.webp',
  'assets/prep-night-v22-vegetables.webp',
  'assets/sfx/paste-v23.wav',
  'assets/sfx/whisk-v24.wav',
  'assets/core-portion-v27.webp',
  'assets/stove-front-v25.webp',
  'assets/gas-knob-v24.webp',
  'assets/sfx/rice-utensil-v24.wav',
  'assets/sfx/cut-v24.wav',
  'assets/sfx/wash-v24.wav',
  'assets/sfx/fry-v24.wav',
  'assets/measure-miso-v23.webp',
  'assets/sfx/pour-v22.wav',
  'assets/sfx/boil-v22.wav',
  'assets/sfx/CC0.txt',
  'assets/ui-objects-v21.webp',
  'assets/ui-frame-walnut-v21.webp',
  'atmosphere.js',
  'daylight.js',
  'assets/ui-washi-v21.webp',
  'assets/ui-walnut-v21.webp',
  'assets/fonts/nanum-brush-script.woff2',
  'assets/fonts/OFL-NanumBrushScript.txt',
  'cooking-rules.js',
  'kitchen.js',
  'audio.js',
  'music.js',
  'assets/music-minamo-v29.mp3',
  'assets/music-Minamo-LICENSE.txt',
  'furnishings.js',
  'gestures.js',
  'kitchen.css',
  'catalog.js',
  'stories.js',
  'engine.js',
  'game.js',
  'scene.js',
  'rain.js',
  'morph.js',
  'pwa.js',
  'manifest.webmanifest',
  'assets/visitors-a.webp',
  'assets/visitors-b.webp',
  'assets/decor-real.webp',
  'assets/food-clean.webp',
  'assets/restaurant-counter.webp',
  'assets/intro-world.webp',
  'assets/interior.svg',
  'assets/exterior.svg',
  'assets/opening-visible-rain.mp4',
  'assets/opening-portrait-poster.jpg',
  'assets/menu-1.webp',
  'assets/menu-2.webp',
  'assets/menu-3.webp',
  'assets/menu-4.webp',
  'assets/menu-5.webp',
  'assets/menu-6.webp',
  'assets/menu-7.webp',
  'assets/menu-8.webp',
  'assets/menu-9.webp',
  'assets/menu-10.webp',
  'assets/pantry-a.webp',
  'assets/pantry-b.webp',
  'assets/decor-growth.webp',
  'assets/restaurant-fridge.webp',
  'assets/kitchen-room.webp',
  'assets/kitchen-upgraded.webp',
  'assets/fridge-upgraded.webp',
  'assets/fridge-open.webp',
  'assets/fridge-closed.webp',
  'assets/cooking-tools.webp',
  'assets/cooking-vessels.webp',
  'assets/cooking-rice.webp',
  'assets/restaurant-ceramics.webp',
  'assets/knife-player.webp',
  'assets/stock-anime-1.webp',
  'assets/stock-anime-2.webp',
  'assets/stock-anime-3.webp',
  'assets/plating-1.webp',
  'assets/plating-2.webp',
  'assets/plating-3.webp',
  'assets/plating-4.webp',
  'assets/plating-5.webp',
  'assets/plating-6.webp',
  'assets/plating-7.webp',
  'assets/plating-8.webp',
  'assets/plating-9.webp',
  'assets/plating-10.webp',
  'assets/plating-11.webp',
  'assets/plating-12.webp',
  'assets/plating-13.webp',
  'assets/plating-14.webp',
  'assets/plating-15.webp',
  'assets/plating-16.webp',
  'assets/plating-17.webp',
  'assets/plating-18.webp',
  'assets/plating-19.webp',
  'assets/plating-20.webp',
  'assets/plating-21.webp',
  'assets/plating-22.webp',
  'assets/plating-23.webp',
  'assets/plating-24.webp',
  'assets/plating-25.webp',
  'assets/measure-soy.webp',
  'assets/measure-dashi.webp',
  'assets/measure-milk.webp',
  'assets/measure-miso.webp',
  'assets/measure-flour.webp',
  'assets/measure-sugar.webp',
  'assets/used-menu-1.webp',
  'assets/used-menu-2.webp',
  'assets/used-menu-3.webp',
  'assets/used-menu-4.webp',
  'assets/used-menu-5.webp',
  'assets/used-menu-6.webp',
  'assets/used-menu-7.webp',
  'assets/used-menu-8.webp',
  'assets/used-menu-9.webp',
  'assets/used-menu-10.webp',
  'assets/heat-hi-1.webp',
  'assets/heat-hi-2.webp',
  'assets/heat-hi-3.webp',
  'assets/heat-hi-4.webp',
  'assets/heat-hi-5.webp',
  'assets/heat-hi-6.webp',
  'assets/heat-hi-7.webp',
  'assets/heat-hi-8.webp',
  'assets/heat-hi-9.webp',
  'assets/heat-hi-10.webp',
  'assets/heat-hi-11.webp',
  'assets/heat-hi-12.webp',
  'assets/heat-hi-13.webp',
  'assets/heat-hi-14.webp',
  'assets/heat-hi-15.webp',
  'assets/heat-hi-16.webp',
  'assets/heat-hi-17.webp',
  'assets/heat-hi-18.webp',
  'assets/heat-hi-19.webp',
  'assets/heat-hi-20.webp',
  'assets/heat-hi-21.webp',
  'assets/heat-hi-22.webp',
  'assets/heat-hi-23.webp',
  'assets/heat-hi-24.webp',
  'assets/heat-hi-25.webp',
  'assets/heat-hi-26.webp',
  'assets/heat-hi-27.webp',
  'assets/heat-hi-28.webp',
  'assets/heat-hi-29.webp',
  'assets/heat-hi-30.webp',
  'assets/heat-hi-31.webp',
  'assets/heat-hi-32.webp',
  'assets/heat-hi-33.webp',
  'assets/heat-hi-34.webp',
  'assets/heat-hi-35.webp',
  'assets/heat-hi-36.webp',
  'assets/heat-hi-37.webp',
  'assets/heat-hi-38.webp',
  'assets/heat-hi-39.webp',
  'assets/heat-hi-40.webp',
  'assets/heat-hi-41.webp',
  'assets/heat-hi-42.webp',
  'assets/heat-hi-43.webp',
  'assets/heat-hi-44.webp',
  'assets/heat-hi-45.webp',
  'assets/heat-hi-46.webp',
  'assets/core-lid.webp',
  'assets/core-portion-v19.webp',
  'assets/core-shape.webp',
  'assets/core-wrap-v20.webp',
  'assets/core-wrap.webp',
  'assets/core-beat.webp',
  'assets/core-pour.webp',
  'assets/core-drain.webp',
  'assets/core-broth.webp',
  'assets/prep-hi-rice.webp',
  'assets/prep-hi-nori.webp',
  'assets/prep-hi-egg.webp',
  'assets/prep-hi-pork.webp',
  'assets/prep-hi-salmon.webp',
  'assets/prep-hi-tofu.webp',
  'assets/prep-hi-vegetables.webp',
  'assets/prep-hi-mushroom.webp',
  'assets/prep-hi-noodles.webp',
  'assets/prep-hi-shrimp.webp',
  'assets/prep-hi-chicken.webp',
  'assets/prep-hi-beef.webp',
  'assets/prep-hi-tuna.webp',
  'assets/prep-hi-butter.webp',
  'assets/prep-hi-potato.webp',
  'assets/prep-hi-cheese.webp',
  'assets/prep-hi-clam.webp',
  'assets/prep-hi-scallops.webp',
  'assets/prep-hi-oyster.webp',
  'assets/prep-hi-crab.webp',
  'assets/prep-hi-fish.webp',
  'assets/prep-hi-scallion.webp',
  'assets/restaurant-closed.webp',
  'assets/exterior-closed.webp',
  'assets/room-bare-v19.webp',
  'assets/exterior-bare-v19.webp',
  'assets/room-furnished-v19.webp',
  'assets/exterior-furnished-v19.webp',
  'assets/room-closed-v19.webp',
  'assets/exterior-closed-v19.webp',
  'assets/room-furnished-closed-v19.webp',
  'assets/exterior-furnished-closed-v19.webp',
  'assets/furnishings-1.webp',
  'assets/furnishings-2.webp',
  'assets/heat-burnt-1.webp',
  'assets/heat-burnt-2.webp',
  'assets/heat-burnt-3.webp',
  'assets/burnt-menu-1.webp',
  'assets/burnt-menu-2.webp',
  'assets/raw-menu-1.webp',
  'assets/raw-menu-2.webp',
  'assets/room-collection-0.webp',
  'assets/room-collection-0-closed.webp',
  'assets/room-collection-1.webp',
  'assets/room-collection-1-closed.webp',
  'assets/room-collection-2.webp',
  'assets/room-collection-2-closed.webp',
  'assets/room-collection-3.webp',
  'assets/room-collection-3-closed.webp',
  'assets/exterior-collection-1.webp',
  'assets/exterior-collection-1-closed.webp',
  'assets/exterior-collection-2.webp',
  'assets/exterior-collection-2-closed.webp',
  'assets/exterior-collection-3.webp',
  'assets/exterior-collection-3-closed.webp',
  'assets/icon-diner-v31-192.png',
  'assets/icon-diner-v31-512.png',
  'assets/icon-diner-v31-maskable-512.png',
  'assets/apple-touch-icon-v31.png',
  'scene-assets-v28.js',
  'assets/portrait-v28-prep-rice.webp',
  'assets/portrait-v28-prep-nori.webp',
  'assets/portrait-v28-prep-egg.webp',
  'assets/portrait-v28-prep-pork.webp',
  'assets/portrait-v28-prep-salmon.webp',
  'assets/portrait-v28-prep-vegetables.webp',
  'assets/portrait-v28-prep-scallion.webp',
  'assets/portrait-v28-prep-tofu.webp',
  'assets/portrait-v28-prep-potato.webp',
  'assets/portrait-v28-prep-noodles.webp',
  'assets/portrait-v28-measure-dashi.webp',
  'assets/portrait-v28-measure-miso.webp',
  'assets/portrait-v28-measure-soy.webp',
  'assets/portrait-v28-measure-sugar.webp',
  'assets/portrait-v28-core-portion.webp',
  'assets/portrait-v28-core-shape.webp',
  'assets/portrait-v28-core-beat.webp',
  'assets/portrait-v29-core-pour.webp',
  'assets/portrait-v28-core-broth.webp',
  'assets/portrait-v28-core-drain.webp',
  'assets/portrait-v28-core-wrap.webp',
  'assets/portrait-v28-core-wrap-raw.webp',
  'assets/portrait-v28-core-wrap-burnt.webp',
  'assets/portrait-v28-plate-onigiri.webp',
  'assets/stove-v28-onigiri.webp',
  'assets/onigiri-final-v28.webp',
  'assets/portrait-v28-plate-tamago.webp',
  'assets/stove-v28-tamago.webp',
  'assets/final-v28-tamago.webp',
  'assets/portrait-v28-plate-tonjiru.webp',
  'assets/stove-v28-tonjiru.webp',
  'assets/final-v28-tonjiru.webp',
  'assets/portrait-v28-plate-ochazuke.webp',
  'assets/stove-v28-ochazuke.webp',
  'assets/final-v28-ochazuke.webp',
  'assets/portrait-v28-plate-negi_omelette.webp',
  'assets/stove-v28-negi_omelette.webp',
  'assets/final-v28-negi_omelette.webp',
  'assets/portrait-v28-plate-hiyayakko.webp',
  'assets/portrait-v28-plate-butadon.webp',
  'assets/stove-v28-butadon.webp',
  'assets/final-v28-butadon.webp',
  'assets/portrait-v28-plate-misoshiru.webp',
  'assets/stove-v28-misoshiru.webp',
  'assets/final-v28-misoshiru.webp',
  'assets/portrait-v28-plate-cabbage_stir.webp',
  'assets/stove-v28-cabbage_stir.webp',
  'assets/final-v28-cabbage_stir.webp',
  'assets/portrait-v28-plate-salmonbowl.webp',
  'assets/stove-v28-salmonbowl.webp',
  'assets/final-v28-salmonbowl.webp',
  'assets/portrait-v28-plate-potato_soup.webp',
  'assets/stove-v28-potato_soup.webp',
  'assets/final-v28-potato_soup.webp',
  'assets/portrait-v28-plate-salmon_teriyaki.webp',
  'assets/stove-v28-salmon_teriyaki.webp',
  'assets/final-v28-salmon_teriyaki.webp',
  'assets/portrait-v28-plate-midnight.webp',
  'assets/stove-v28-midnight.webp',
  'assets/final-v28-midnight.webp',
  'assets/portrait-v28-plate-soba.webp',
  'assets/stove-v28-soba.webp',
  'assets/final-v28-soba.webp',
  'assets/portrait-v28-plate-udon.webp',
  'assets/stove-v28-udon.webp',
  'assets/final-v28-udon.webp',
].map(path => new URL(path, ROOT).href);
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    try {
      await cache.addAll(FILES.map(url => new Request(url, {cache: 'no-store'})));
    } catch (error) {
      await caches.delete(VERSION);
      throw error;
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Keep the previous shell for pages that are still finishing a cooking session.
    const previous = (await caches.keys()).filter(key => key.startsWith(CACHE_PREFIX) && key !== VERSION);
    for (const key of previous.slice(0, -1)) await caches.delete(key);
    await self.clients.claim();
    for (const client of await self.clients.matchAll({type: 'window'})) {
      client.postMessage({type: 'APP_UPDATED', release: RELEASE});
    }
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'GET_RELEASE') event.ports?.[0]?.postMessage({type: 'APP_UPDATED', release: RELEASE});
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
    // Every normal navigation checks the server; offline still uses an atomic cached shell.
    if (request.mode === 'navigate') {
      if (url.pathname === ROOT.pathname || url.pathname === new URL(INDEX).pathname) {
        try {
          const signal = typeof AbortSignal !== 'undefined' ? AbortSignal.timeout?.(4000) : undefined;
          const fresh = await fetch(request.url, {cache: 'no-store', ...(signal ? {signal} : {})});
          if (fresh.ok) return fresh;
        } catch {}
        return (await cache.match(INDEX)) || fetch(request);
      }
      return fetch(request, {cache: 'no-store'});
    }
    // Release-tagged code never falls back to a different release's code.
    const release = url.searchParams.get('release');
    if (release && /\.(?:js|css|webmanifest)$/.test(url.pathname)) {
      const name = CACHE_PREFIX + release;
      const available = name === VERSION || (await caches.keys()).includes(name);
      if (available) {
        const shell = name === VERSION ? cache : await caches.open(name);
        const cached = await shell.match(url.origin + url.pathname);
        if (cached) return cached;
      }
      return fetch(request, {cache: 'no-store'});
    }

    const cached = await cache.match(request.url);
    if (cached && request.headers.has('range')) return rangeResponse(request, cached);
    return cached || fetch(request);
  })());
});
