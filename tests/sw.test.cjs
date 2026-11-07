const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function worker() {
  const handlers = {}, stored = new Map();
  const context = vm.createContext({URL, Response, Number, caches: {
    open: async () => ({match: async key => stored.get(key)?.clone(), addAll: async paths => { context.precache = paths; }}),
    keys: async () => [], delete: async () => true,
  }, fetch: async () => { throw new Error('Network offline'); }, self: {
    location: {href: 'https://example.test/midnight-diner/sw.js'},
    addEventListener: (type, handler) => { handlers[type] = handler; },
    clients: {claim: async () => {}}, skipWaiting: async () => {},
  }});
  vm.runInContext(fs.readFileSync('docs/sw.js', 'utf8'), context);
  stored.set('https://example.test/midnight-diner/assets/opening-portrait.mp4', new Response(new Uint8Array([0,1,2,3,4,5,6,7,8,9]), {headers: {'Content-Type':'video/mp4'}}));
  stored.set('https://example.test/midnight-diner/index.html', new Response('<main>offline game</main>'));
  function request(path, range, mode) {
    let response;
    handlers.fetch({request: {method:'GET', url: new URL(path,'https://example.test').href, mode,
      headers: new Headers(range ? {Range:range} : {})}, respondWith: r => { response=r; }});
    return response;
  }
  return {handlers, request, context};
}
test('offline MP4 seeking returns correct bytes and byte-range metadata', async () => {
  const {request}=worker(); const r=await request('/midnight-diner/assets/opening-portrait.mp4','bytes=2-5');
  assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),'bytes 2-5/10');
  assert.equal(r.headers.get('content-length'),'4');assert.equal(r.headers.get('content-type'),'video/mp4');
  assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[2,3,4,5]);
});
test('open-ended and suffix ranges work for media decoders', async () => {
  const {request}=worker();
  for (const [range, bytes] of [['bytes=7-',[7,8,9]],['bytes=-3',[7,8,9]],['bytes=8-99',[8,9]]]) {
    const r=await request('/midnight-diner/assets/opening-portrait.mp4',range);
    assert.equal(r.status,206);assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],bytes);
  }
});
test('invalid or unsatisfiable ranges return 416 without corrupting the cached full clip', async () => {
  const {request}=worker();
  for (const range of ['bytes=15-','bytes=8-2','bytes=','bytes=-0','bytes=0-1,3-4']) {
    const r=await request('/midnight-diner/assets/opening-portrait.mp4',range);assert.equal(r.status,416);
    assert.equal(r.headers.get('content-range'),'bytes */10');
  }
  const full=await request('/midnight-diner/assets/opening-portrait.mp4');assert.equal((await full.arrayBuffer()).byteLength,10);
});
test('PWA start URL and index navigation work offline under a repository subpath', async () => {
  const {request}=worker();
  for (const path of ['/midnight-diner/?launch=pwa','/midnight-diner/index.html']) {
    assert.equal(await (await request(path,null,'navigate')).text(),'<main>offline game</main>');
  }
  assert.equal(request('/another-app/',null,'navigate'),undefined);
});
test('an install precaches the app and entire video together', async () => {
  const {handlers,context}=worker();let done;
  handlers.install({waitUntil:p=>{done=p;}});await done;
  assert.ok(context.precache.includes('https://example.test/midnight-diner/assets/opening-portrait.mp4'));
  assert.ok(context.precache.includes('https://example.test/midnight-diner/index.html'));
  assert.ok(context.precache.includes('https://example.test/midnight-diner/manifest.webmanifest'));
});
