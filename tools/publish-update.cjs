// Publish the current web bundle as a live update for the native apps.
//   node tools/publish-update.cjs            build dist/live-update/site (no deploy)
//   node tools/publish-update.cjs --deploy   also deploy it with wrangler.updates.jsonc
// Option: --min-native 1.2
// The site is a Workers static-assets deployment: the bundle files at their own
// paths plus latest.json. wrangler uploads only changed files and switches versions
// atomically (npx wrangler login first). The app reads the address from
// docs/src/platform/config.js (updateBaseUrl); keep the route in wrangler.updates.jsonc equal to it.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.join(__dirname,'..'),www=path.join(root,'www'),site=path.join(root,'dist','live-update','site');
const args=process.argv.slice(2),flag=name=>args.includes('--'+name),value=name=>{const i=args.indexOf('--'+name);return i<0?'':args[i+1]||'';};
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const base=((fs.readFileSync(path.join(root,'docs/src/platform/config.js'),'utf8').match(/updateBaseUrl:\s*'([^']*)'/)||[])[1]||'').replace(/\/+$/,'');
const minNative=value('min-native')||pkg.liveUpdate?.minNative||'1.0';
const wrangler=(process.env.WRANGLER||'npx wrangler').split(' ');
const LIMIT=25*1024*1024; // Workers static assets: 25 MiB per file
(async()=>{
  cp.execFileSync(process.execPath,[path.join(__dirname,'build-native.cjs')],{stdio:'inherit'});
  const version=JSON.parse(fs.readFileSync(path.join(www,'version.json'),'utf8')).release;
  const files={};let bytes=0;
  for(const entry of fs.readdirSync(www,{recursive:true,withFileTypes:true})){
    if(!entry.isFile())continue;
    const full=path.join(entry.parentPath??entry.path,entry.name),name=path.relative(www,full).split(path.sep).join('/'),size=fs.statSync(full).size;
    if(size>LIMIT)throw new Error(`${name} is larger than the 25 MiB static asset limit`);
    if(name==='latest.json'||name==='_headers')throw new Error(`${name} is reserved for the update site`);
    files[name]=crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');bytes+=size;
  }
  if(!files['index.html'])throw new Error('www/index.html missing');
  const latest={version,minNative,published:new Date().toISOString(),files:Object.fromEntries(Object.entries(files).sort())};
  fs.rmSync(site,{recursive:true,force:true});fs.cpSync(www,site,{recursive:true});
  fs.writeFileSync(path.join(site,'latest.json'),JSON.stringify(latest)+'\n');
  fs.writeFileSync(path.join(site,'_headers'),'/latest.json\n  Cache-Control: no-cache, max-age=0\n/*\n  Access-Control-Allow-Origin: *\n');
  console.log(`Update ${version}: ${Object.keys(files).length} files, ${(bytes/1048576).toFixed(1)} MB, minNative ${minNative}`);
  console.log('Built',path.relative(root,site));
  if(!flag('deploy')){console.log('Not deployed. Add --deploy to publish.');return;}
  if(!/^https:\/\//.test(base))throw new Error('Set updateBaseUrl in docs/src/platform/config.js to the https address of the update site');
  const config=fs.readFileSync(path.join(root,'wrangler.updates.jsonc'),'utf8');
  if(!config.includes(`"${new URL(base).hostname}"`))throw new Error(`wrangler.updates.jsonc has no route for ${new URL(base).hostname}`);
  cp.execFileSync(wrangler[0],[...wrangler.slice(1),'deploy','-c','wrangler.updates.jsonc'],{cwd:root,stdio:'inherit'});
  // A new custom domain can take a moment; confirm devices will see this release.
  let live='';
  for(let attempt=0;attempt<6&&live!==version;attempt++){
    if(attempt)await new Promise(resolve=>setTimeout(resolve,5000));
    try{live=(await (await fetch(`${base}/latest.json?check=${Date.now()}`,{cache:'no-store'})).json()).version;}catch{}
  }
  if(live!==version)throw new Error(`Deployed, but ${base}/latest.json reports "${live||'nothing'}" instead of ${version}. Check the domain.`);
  console.log(`Published ${version} at ${base}/latest.json`);
})().catch(error=>{console.error(error.message||error);process.exit(1);});
