const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const {webcrypto, createHash} = require('node:crypto');
const ROOT = 'https://example.test/midnight-diner/';
const DOCS = path.resolve('docs');
function worker(options={}) {
  const handlers = {}, stored = new Map(), stores=new Map(), messages=[], downloads=[], puts=[];
  let installing=false;
  const keyOf=key=>key.url||String(key);
  const context = vm.createContext({URL, Response, Request, Headers, Number, AbortSignal, crypto:webcrypto, caches: {
    open: async name => {
      if(!stores.has(name))stores.set(name,new Map());
      const data=stores.get(name);
      return {match:async key=>data.get(keyOf(key))?.clone(),put:async(key,response)=>{
        const url=keyOf(key),body=await response.arrayBuffer();
        data.set(url,new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers}));
        puts.push({name,url});
      }};
    },
    keys: async () => [...stores.keys()], delete: async name => stores.delete(name),
  }, fetch: async (input,init)=>{
    if(!installing){if(options.fetch)return options.fetch(input,init);throw new Error('Network offline');}
    const url=keyOf(input),relative=new URL(url).pathname.slice('/midnight-diner/'.length);
    downloads.push({url,relative,cache:init?.cache||input.cache});
    if((options.installFailure===true&&relative==='assets/opening-visible-rain.mp4')||options.installFailure===relative)throw new Error('Incomplete download');
    const body=options.corruptDownload===relative?Buffer.from('wrong deployment bytes'):fs.readFileSync(path.join(DOCS,relative));
    return new Response(body);
  }, self: {
    location: {href: ROOT+'sw.js'},
    addEventListener: (type, handler) => { handlers[type] = handler; },
    clients: {claim: async () => {context.claimed=true;},matchAll:async()=>[{postMessage:data=>messages.push(data)}]},
    skipWaiting: async () => {context.skipped=true;},
  }});
  vm.runInContext(fs.readFileSync('docs/sw.js', 'utf8'), context);
  const version=vm.runInContext('VERSION',context),release=vm.runInContext('RELEASE',context),files=Array.from(vm.runInContext('FILES',context));
  stores.set(version,stored);
  stored.set(ROOT+'assets/opening-visible-rain.mp4', new Response(new Uint8Array([0,1,2,3,4,5,6,7,8,9]), {headers: {'Content-Type':'video/mp4'}}));
  stored.set(ROOT+'index.html', new Response('<main>offline game</main>'));
  function request(path, range, mode) {
    let response;
    handlers.fetch({request: {method:'GET', url: new URL(path,'https://example.test').href, mode,
      headers: new Headers(range ? {Range:range} : {})}, respondWith: r => { response=r; }});
    return response;
  }
  async function install(){
    installing=true;let done;
    try{handlers.install({waitUntil:p=>{done=p;}});await done;}finally{installing=false;}
  }
  async function activate(){let done;handlers.activate({waitUntil:p=>{done=p;}});await done;}
  function previous(filesToSeed=files){
    const data=new Map(filesToSeed.map(url=>[url,new Response(fs.readFileSync(path.join(DOCS,new URL(url).pathname.slice('/midnight-diner/'.length))))]));
    stores.set('midnight-diner-pwa-previous',data);return data;
  }
  return {handlers, request, install,activate,previous,context,stored,stores,messages,version,release,files,downloads,puts};
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
  const w=worker();await w.install();const precache=w.puts.map(x=>x.url);
  assert.ok(precache.includes('https://example.test/midnight-diner/assets/opening-visible-rain.mp4'));
  assert.ok(precache.includes('https://example.test/midnight-diner/index.html'));
  assert.ok(precache.includes('https://example.test/midnight-diner/manifest.webmanifest'));
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
  const w=worker();
  w.stores.clear();w.stores.set('midnight-diner-pwa-old',new Map());w.stores.set('midnight-diner-pwa-previous',new Map());
  await w.install();
  assert.equal(w.context.skipped,true);assert.ok(w.downloads.length>0);assert.ok(w.downloads.every(x=>x.cache==='no-store'));
  await w.activate();
  assert.equal(w.context.claimed,true);assert.ok(w.stores.has(w.version));assert.ok(w.stores.has('midnight-diner-pwa-previous'));assert.ok(!w.stores.has('midnight-diner-pwa-old'));
  assert.equal(w.messages[0].type,'APP_UPDATED');assert.equal(w.messages[0].release,w.release);
});
test('a failed download cannot activate or leave a partial shell behind',async()=>{
  const w=worker({installFailure:true});
  await assert.rejects(w.install(),/Incomplete download/);assert.ok(w.puts.length>0,'failure happens after partial download');assert.ok(!w.context.skipped);assert.ok(!w.context.claimed);assert.deepEqual(w.messages,[]);assert.ok(!w.stores.has(w.version));
});

test('entry scripts, styles and manifest match the worker release and are in its offline shell',async()=>{
  const w=worker();await w.install();
  const html=fs.readFileSync('docs/index.html','utf8');
  assert.ok(html.includes('name="app-release" content="'+w.release+'"'));
  const sources=[...html.matchAll(/(?:src|href)="(\.\/[^"?]+\.(?:js|css|webmanifest))\?release=([^"&]+)"/g)];
  assert.ok(sources.length>20);
  for(const[,file,release]of sources){assert.equal(release,w.release,file);assert.ok(w.puts.some(x=>x.url===new URL(file,ROOT).href),file)}
});

test('every offline shell file has its exact lowercase SHA256 deployment digest',()=>{
  const w=worker(),hashes=vm.runInContext('FILE_HASHES',w.context);
  const relative=w.files.map(url=>new URL(url).pathname.slice('/midnight-diner/'.length));
  assert.deepEqual(Object.keys(hashes).sort(),relative.slice().sort());
  for(const file of relative){
    assert.match(hashes[file],/^[a-f0-9]{64}$/,file);
    assert.equal(hashes[file],createHash('sha256').update(fs.readFileSync(path.join(DOCS,file))).digest('hex'),file);
  }
});
test('verified unchanged assets are reused from the previous cache without downloading again',async()=>{
  const w=worker(),previous=w.previous();
  previous.set(ROOT+'index.html',new Response('<main>previous release</main>'));
  const oldHashes={...vm.runInContext('FILE_HASHES',w.context),'index.html':createHash('sha256').update('<main>previous release</main>').digest('hex')};
  previous.set(vm.runInContext('REVISION_KEY',w.context),new Response(JSON.stringify(oldHashes)));
  await w.install();
  assert.deepEqual(w.downloads.map(x=>x.relative),['index.html'],'only the changed shell needs the network');
  assert.equal(w.puts.filter(x=>w.files.includes(x.url)).length,w.files.length,'the new shell contains every verified file');
  assert.equal(await previous.get(ROOT+'index.html').clone().text(),'<main>previous release</main>','previous running shell remains intact');
  assert.equal(await w.stored.get(ROOT+'index.html').clone().text(),fs.readFileSync('docs/index.html','utf8'));
  assert.equal(w.context.skipped,true);
});
test('changed cached bytes fail digest validation and are fetched before installation',async()=>{
  const w=worker(),previous=w.previous(),url=ROOT+'game.js';
  previous.set(url,new Response('old game code'));
  await w.install();
  assert.deepEqual(w.downloads.map(x=>x.relative),['game.js']);
  assert.equal(await w.stored.get(url).clone().text(),fs.readFileSync('docs/game.js','utf8'));
  assert.equal(await previous.get(url).clone().text(),'old game code');
});
test('incorrect downloaded bytes cannot activate or damage the previous offline shell',async()=>{
  const w=worker({corruptDownload:'game.js'}),previous=w.previous();
  previous.set(ROOT+'game.js',new Response('previous release code'));
  await assert.rejects(w.install(),/Incomplete download.*game\.js/);
  assert.ok(!w.context.skipped);assert.ok(!w.context.claimed);assert.deepEqual(w.messages,[]);
  assert.ok(!w.stores.has(w.version));
  assert.equal(await previous.get(ROOT+'game.js').clone().text(),'previous release code');
});
test('Cloudflare redirected responses become direct body responses without changing bytes or content type',async()=>{
  const w=worker(),source=new Response('<main>redirected shell</main>',{headers:{'Content-Type':'text/html; charset=utf-8','Content-Encoding':'gzip','Content-Length':'10','Cache-Control':'no-cache'}});
  Object.defineProperty(source,'redirected',{value:true});
  const result=w.context.withoutRedirect(source);
  assert.equal(result.redirected,false);assert.equal(result.headers.get('content-type'),'text/html; charset=utf-8');assert.equal(result.headers.get('cache-control'),'no-cache');assert.equal(result.headers.get('content-encoding'),null);assert.equal(result.headers.get('content-length'),null);assert.equal(await result.text(),'<main>redirected shell</main>');
});
test('fresh canonical HTML responses are safe for browser navigation without erasing redirects needed by the network',async()=>{
  const w=worker({fetch:async()=>{const response=new Response('<main>fresh canonical shell</main>',{headers:{'Content-Type':'text/html'}});Object.defineProperty(response,'redirected',{value:true});return response;}});
  const result=await w.request('/midnight-diner/',null,'navigate');assert.equal(result.redirected,false);assert.equal(await result.text(),'<main>fresh canonical shell</main>');
});
