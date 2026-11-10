// Publish the current web bundle as a live update on Cloudflare R2.
//   node tools/publish-update.cjs                      build + write dist/live-update/latest.json (no upload)
//   node tools/publish-update.cjs --upload --bucket NAME   also upload new files, then latest.json
// Options: --zip (also publish a whole-bundle zip), --min-native 1.2, --base-url https://...
// Uploads use wrangler (npx wrangler login first). The public address of the bucket comes
// from docs/src/platform/config.js (updateBaseUrl), the same value the app reads.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.join(__dirname,'..'),www=path.join(root,'www'),out=path.join(root,'dist','live-update');
const args=process.argv.slice(2),flag=name=>args.includes('--'+name),value=name=>{const i=args.indexOf('--'+name);return i<0?'':args[i+1]||'';};
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const configured=(fs.readFileSync(path.join(root,'docs/src/platform/config.js'),'utf8').match(/updateBaseUrl:\s*'([^']*)'/)||[])[1]||'';
const base=(value('base-url')||configured).replace(/\/+$/,'');
const bucket=value('bucket')||process.env.R2_BUCKET||'';
const minNative=value('min-native')||pkg.liveUpdate?.minNative||'1.0';
const wrangler=(process.env.WRANGLER||'npx wrangler').split(' ');
const local=/^http:\/\/127\.0\.0\.1[:/]/.test(base); // local rehearsal only
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function run(command,argv,options={}){
  return new Promise((resolve,reject)=>{
    const child=cp.spawn(command,argv,{cwd:root,stdio:['ignore','pipe','pipe'],...options});let log='';
    child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
    child.on('error',reject);child.on('close',code=>code===0?resolve(log):reject(new Error(`${command} ${argv.join(' ')}\n${log}`)));
  });
}
async function pool(items,size,work){
  let next=0,done=0;
  await Promise.all(Array.from({length:Math.min(size,items.length)},async()=>{
    while(next<items.length){const item=items[next++];await work(item);done++;if(done%25===0||done===items.length)process.stdout.write(`\r  ${done}/${items.length}`);}
  }));
  if(items.length)process.stdout.write('\n');
}
const put=(key,file,type,cache)=>run(wrangler[0],[...wrangler.slice(1),'r2','object','put',`${bucket}/${key}`,'--file',file,'--remote','--content-type',type,'--cache-control',cache]);
const IMMUTABLE='public, max-age=31536000, immutable';
(async()=>{
  cp.execFileSync(process.execPath,[path.join(__dirname,'build-native.cjs')],{stdio:'inherit'});
  const version=JSON.parse(fs.readFileSync(path.join(www,'version.json'),'utf8')).release;
  const files={};let bytes=0;
  for(const entry of fs.readdirSync(www,{recursive:true,withFileTypes:true})){
    if(!entry.isFile())continue;
    const full=path.join(entry.parentPath??entry.path,entry.name);
    files[path.relative(www,full).split(path.sep).join('/')]=sha(full);bytes+=fs.statSync(full).size;
  }
  if(!files['index.html'])throw new Error('www/index.html missing');
  const latest={version,minNative,published:new Date().toISOString(),files:Object.fromEntries(Object.entries(files).sort())};
  fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
  if(flag('zip')){
    if(!base)throw new Error('--zip needs the bucket address (updateBaseUrl or --base-url)');
    const zip=path.join(out,version+'.zip');
    cp.execFileSync('zip',['-q','-r','-X',zip,'.'],{cwd:www,stdio:'inherit'});
    latest.zip={url:`${base}/bundles/${version}.zip`,checksum:sha(zip),size:fs.statSync(zip).size};
  }
  const latestFile=path.join(out,'latest.json');
  fs.writeFileSync(latestFile,JSON.stringify(latest)+'\n');
  console.log(`Update ${version}: ${Object.keys(files).length} files, ${(bytes/1048576).toFixed(1)} MB, minNative ${minNative}`);
  console.log('Wrote',path.relative(root,latestFile));
  if(!flag('upload')){console.log('Dry run only. Add --upload --bucket NAME to publish.');return;}
  if(!/^https:\/\//.test(base)&&!local)throw new Error('Set updateBaseUrl in docs/src/platform/config.js to the https address of the bucket');
  if(!bucket)throw new Error('Name the bucket with --bucket NAME or R2_BUCKET');
  // Files are stored by content hash, so anything already in the bucket is skipped.
  const byHash=new Map(Object.entries(files).map(([name,hash])=>[hash,name])),missing=[];
  console.log('Checking which files the bucket already has…');
  await pool([...byHash.keys()],16,async hash=>{
    let ok=false;try{ok=(await fetch(`${base}/files/${hash}`,{method:'HEAD'})).ok;}catch{}
    if(!ok)missing.push(hash);
  });
  console.log(`Uploading ${missing.length} new files…`);
  await pool(missing,4,hash=>put(`files/${hash}`,path.join(www,byHash.get(hash)),'application/octet-stream',IMMUTABLE));
  if(latest.zip){console.log('Uploading zip…');await put(`bundles/${version}.zip`,path.join(out,version+'.zip'),'application/zip',IMMUTABLE);}
  // latest.json goes last: devices only see the release once every file is in place.
  await put('latest.json',latestFile,'application/json','no-cache, max-age=0');
  const live=await (await fetch(`${base}/latest.json?check=${Date.now()}`,{cache:'no-store'})).json();
  if(live.version!==version)throw new Error(`latest.json still reports ${live.version}`);
  console.log(`Published ${version} at ${base}/latest.json`);
})().catch(error=>{console.error(error.message||error);process.exit(1);});
