const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function worker(options={}) {
  const handlers = {}, stored = new Map(), stores=new Map(), messages=[];
  const context = vm.createContext({URL, Response, Request, Number, AbortSignal, caches: {
    open: async name => {
      if(!stores.has(name))stores.set(name,new Map());
      const data=stores.get(name);
      return {match:async key=>data.get(key)?.clone(),addAll:async paths=>{
        context.precache=paths.map(x=>x.url||x);
        context.precacheModes=paths.map(x=>x.cache);
        if(options.installFailure)throw new Error('Incomplete download');
      }};
    },
    keys: async () => [...stores.keys()], delete: async name => stores.delete(name),
  }, fetch: options.fetch || (async () => { throw new Error('Network offline'); }), self: {
    location: {href: 'https://example.test/midnight-diner/sw.js'},
    addEventListener: (type, handler) => { handlers[type] = handler; },
    clients: {claim: async () => {context.claimed=true;},matchAll:async()=>[{postMessage:data=>messages.push(data)}]},
    skipWaiting: async () => {context.skipped=true;},
  }});
  vm.runInContext(fs.readFileSync('docs/sw.js', 'utf8'), context);
  const version=vm.runInContext('VERSION',context),release=vm.runInContext('RELEASE',context);
  stores.set(version,stored);
  stored.set('https://example.test/midnight-diner/assets/opening-visible-rain.mp4', new Response(new Uint8Array([0,1,2,3,4,5,6,7,8,9]), {headers: {'Content-Type':'video/mp4'}}));
  stored.set('https://example.test/midnight-diner/index.html', new Response('<main>offline game</main>'));
  function request(path, range, mode) {
    let response;
    handlers.fetch({request: {method:'GET', url: new URL(path,'https://example.test').href, mode,
      headers: new Headers(range ? {Range:range} : {})}, respondWith: r => { response=r; }});
    return response;
  }
  return {handlers, request, context,stored,stores,messages,version,release};
}
test('offline MP4 seeking returns correct bytes and byte-range metadata', async () => {
  const {request}=worker(); const r=await request('/midnight-diner/assets/opening-visible-rain.mp4','bytes=2-5');
  assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),'bytes 2-5/10');
  assert.equal(r.headers.get('content-length'),'4');assert.equal(r.headers.get('content-type'),'video/mp4');
  assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[2,3,4,5]);
});
test('open-ended and suffix ranges work for media decoders', async () => {
  const {request}=worker();
  for (const [range, bytes] of [['bytes=7-',[7,8,9]],['bytes=-3',[7,8,9]],['bytes=8-99',[8,9]]]) {
    const r=await request('/midnight-diner/assets/opening-visible-rain.mp4',range);
    assert.equal(r.status,206);assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],bytes);
  }
});
test('invalid or unsatisfiable ranges return 416 without corrupting the cached full clip', async () => {
  const {request}=worker();
  for (const range of ['bytes=15-','bytes=8-2','bytes=','bytes=-0','bytes=0-1,3-4']) {
    const r=await request('/midnight-diner/assets/opening-visible-rain.mp4',range);assert.equal(r.status,416);
    assert.equal(r.headers.get('content-range'),'bytes */10');
  }
  const full=await request('/midnight-diner/assets/opening-visible-rain.mp4');assert.equal((await full.arrayBuffer()).byteLength,10);
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
  assert.ok(context.precache.includes('https://example.test/midnight-diner/assets/opening-visible-rain.mp4'));
  assert.ok(context.precache.includes('https://example.test/midnight-diner/index.html'));
  assert.ok(context.precache.includes('https://example.test/midnight-diner/manifest.webmanifest'));
});

test('ordinary online navigation bypasses HTTP cache and checks the newest shell',async()=>{
  const calls=[],w=worker({fetch:async(url,options)=>{calls.push({url,options});return new Response('<main>new release</main>')}});
  assert.equal(await(await w.request('/midnight-diner/',null,'navigate')).text(),'<main>new release</main>');
  assert.equal(calls[0].options.cache,'no-store');
  assert.equal(await w.stored.get('https://example.test/midnight-diner/index.html').clone().text(),'<main>offline game</main>','network HTML must not replace only half of the offline shell');
});
test('server errors keep the complete offline shell available',async()=>{
  const w=worker({fetch:async()=>new Response('temporarily unavailable',{status:503})});
  assert.equal(await(await w.request('/midnight-diner/',null,'navigate')).text(),'<main>offline game</main>');
});
test('release-tagged code uses its matching shell and never a different cached release',async()=>{
  const calls=[],w=worker({fetch:async(request,options)=>{calls.push(options);return new Response('network new code')}});
  const code='https://example.test/midnight-diner/game.js';w.stored.set(code,new Response('current code'));
  w.stores.set('midnight-diner-pwa-previous',new Map([[code,new Response('previous code')]]));
  assert.equal(await(await w.request('/midnight-diner/game.js?release='+w.release)).text(),'current code');
  assert.equal(await(await w.request('/midnight-diner/game.js?release=previous')).text(),'previous code');
  assert.equal(await(await w.request('/midnight-diner/game.js?release=next')).text(),'network new code');
  assert.equal(calls[0].cache,'no-store');
});
test('a complete download activates automatically and retains the previous running shell',async()=>{
  const w=worker();let done;
  w.stores.clear();w.stores.set('midnight-diner-pwa-old',new Map());w.stores.set('midnight-diner-pwa-previous',new Map());
  w.handlers.install({waitUntil:p=>done=p});await done;
  assert.equal(w.context.skipped,true);assert.ok(w.context.precacheModes.every(x=>x==='no-store'));
  w.handlers.activate({waitUntil:p=>done=p});await done;
  assert.equal(w.context.claimed,true);assert.ok(w.stores.has(w.version));assert.ok(w.stores.has('midnight-diner-pwa-previous'));assert.ok(!w.stores.has('midnight-diner-pwa-old'));
  assert.equal(w.messages[0].type,'APP_UPDATED');assert.equal(w.messages[0].release,w.release);
});
test('a failed download cannot activate or leave a partial shell behind',async()=>{
  const w=worker({installFailure:true});let done;w.handlers.install({waitUntil:p=>done=p});
  await assert.rejects(done,/Incomplete download/);assert.ok(!w.context.skipped);assert.ok(!w.stores.has(w.version));
});

test('entry scripts, styles and manifest match the worker release and are in its offline shell',async()=>{
  const w=worker();let done;w.handlers.install({waitUntil:p=>done=p});await done;
  const html=fs.readFileSync('docs/index.html','utf8');
  assert.ok(html.includes('name="app-release" content="'+w.release+'"'));
  const sources=[...html.matchAll(/(?:src|href)="(\.\/[^"?]+\.(?:js|css|webmanifest))\?release=([^"&]+)"/g)];
  assert.ok(sources.length>20);
  for(const[,file,release]of sources){assert.equal(release,w.release,file);assert.ok(w.context.precache.includes(new URL(file,'https://example.test/midnight-diner/').href),file)}
});
