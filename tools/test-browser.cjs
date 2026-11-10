// Run the browser tests against local servers: node tools/test-browser.cjs [name ...]
// Serves docs/ at http://127.0.0.1:8765/midnight-diner/ and the native bundle (www/) at
// http://127.0.0.1:8766/, then runs tests/browser/*.cjs one by one and prints a summary.
// Needs Playwright with Chromium (CHROMIUM_PATH overrides the browser binary).
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.join(__dirname,'..'),dir=path.join(root,'tests','browser');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
function serve(base,port,prefix){
  return new Promise(resolve=>{
    const server=http.createServer((req,res)=>{
      let name=decodeURIComponent(new URL(req.url,'http://x').pathname);
      if(!name.startsWith(prefix)){res.writeHead(404);return res.end();}
      name=name.slice(prefix.length);if(name===''||name.endsWith('/'))name+='index.html';
      const file=path.join(base,name);
      if(!file.startsWith(base)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
      const size=fs.statSync(file).size,head={'content-type':types[path.extname(file)]||'application/octet-stream','accept-ranges':'bytes','cache-control':'no-cache'},range=/bytes=(\d*)-(\d*)/.exec(req.headers.range||'');
      if(range){const start=+range[1]||0,end=range[2]?+range[2]:size-1;res.writeHead(206,{...head,'content-range':`bytes ${start}-${end}/${size}`,'content-length':end-start+1});return fs.createReadStream(file,{start,end}).pipe(res);}
      res.writeHead(200,{...head,'content-length':size});fs.createReadStream(file).pipe(res);
    }).listen(port,'127.0.0.1',()=>resolve(server));
  });
}
(async()=>{
  let chromium=process.env.CHROMIUM_PATH;
  if(!chromium){try{chromium=require('playwright').chromium.executablePath();}catch{console.error('Playwright is not installed: npm install --no-save playwright && npx playwright install chromium');process.exit(1);}}
  cp.execFileSync(process.execPath,[path.join(__dirname,'set-release.cjs')],{stdio:'ignore'});
  cp.execFileSync(process.execPath,[path.join(__dirname,'build-native.cjs')],{stdio:'ignore'});
  const servers=[await serve(path.join(root,'docs'),8765,'/midnight-diner/'),await serve(path.join(root,'www'),8766,'/')];
  const wanted=process.argv.slice(2),names=fs.readdirSync(dir).filter(f=>f.endsWith('.cjs')).map(f=>f.slice(0,-4)).filter(n=>!wanted.length||wanted.includes(n)).sort();
  const failed=[];
  for(const name of names){
    const began=Date.now(),result=cp.spawnSync(process.execPath,[path.join(dir,name+'.cjs')],{cwd:root,env:{...process.env,CHROMIUM_PATH:chromium},encoding:'utf8',timeout:420000});
    const ok=result.status===0;if(!ok)failed.push(name);
    console.log(`${ok?'ok  ':'FAIL'} ${name} (${Math.round((Date.now()-began)/1000)}s)`);
    if(!ok)console.log(((result.stdout||'')+(result.stderr||'')).trim().split('\n').slice(0,12).map(line=>'     '+line.slice(0,220)).join('\n'));
  }
  for(const server of servers){server.closeAllConnections();server.close();}
  console.log(failed.length?`\n${failed.length} of ${names.length} browser tests failed: ${failed.join(', ')}`:`\nAll ${names.length} browser tests passed`);
  process.exit(failed.length?1:0);
})();
