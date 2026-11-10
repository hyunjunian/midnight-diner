// Release tags keep the HTML, scripts, styles and offline shell of one build together.
// Deploys tag their own output automatically (tools/build-web.cjs, tools/build-native.cjs),
// so nobody has to bump a tag before pushing.
//   node tools/set-release.cjs                     refresh docs/ hashes, keeping its tag (tests need this)
//   node tools/set-release.cjs YYYYMMDD-vNN-name   set an explicit tag on docs/
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path'),cp=require('node:child_process');
const FORMAT=/^\d{8}-v\d+-[a-z0-9-]+$/;
// One tag per commit: commit date, time and short hash (UTC), e.g. 20261110-v142355-a1b2c3d.
// Later commits always sort as newer, which is what browsers and devices compare.
function autoTag(root=path.join(__dirname,'..')){
  let seconds=0,sha='';
  try{[seconds,sha]=cp.execFileSync('git',['log','-1','--format=%ct %h','--abbrev=7'],{cwd:root,stdio:['ignore','pipe','ignore']}).toString().trim().split(' ');}catch{}
  if(!/^[0-9a-f]{7,}$/.test(sha||'')){seconds=Math.floor(Date.now()/1000);sha=(process.env.WORKERS_CI_COMMIT_SHA||'').slice(0,7).toLowerCase();}
  if(!/^[0-9a-f]{7,}$/.test(sha))sha='local';
  const stamp=new Date(Number(seconds)*1000).toISOString().replace(/[-:T]/g,'');
  return `${stamp.slice(0,8)}-v${stamp.slice(8,14)}-${sha}`;
}
// Rewrites the tag (and the worker's file digests, when a worker is present) inside dir.
function stamp(dir,release){
  if(!FORMAT.test(release||''))throw new Error('Use YYYYMMDD-vNN-description');
  const file=name=>path.join(dir,name),has=name=>fs.existsSync(file(name)),read=name=>fs.readFileSync(file(name),'utf8');
  const index=read('index.html'),previous=(index.match(/<meta name="app-release" content="([^"]+)"/)||[])[1];
  if(!FORMAT.test(previous||''))throw new Error('index.html has no app-release tag');
  fs.writeFileSync(file('index.html'),index.replaceAll(previous,release));
  if(has('approved.html'))fs.writeFileSync(file('approved.html'),read('approved.html').replaceAll(previous,release));
  if(has('preview.html'))fs.writeFileSync(file('preview.html'),read('preview.html').replace(/const release = '[^']+'/g,`const release = '${release}'`));
  fs.writeFileSync(file('version.json'),JSON.stringify({release})+'\n');
  let verified=0;
  if(has('sw.js')){
    const sw=read('sw.js').replace(/const RELEASE = '[^']+'/,`const RELEASE = '${release}'`);
    const paths=[...sw.match(/const FILES = \[([\s\S]*?)\]\.map/)[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
    const hashes=Object.fromEntries(paths.map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(file(name))).digest('hex')]));
    fs.writeFileSync(file('sw.js'),sw.replace(/const FILE_HASHES = \{[\s\S]*?\};/,'const FILE_HASHES = '+JSON.stringify(hashes,null,2)+';'));
    verified=paths.length;
  }
  return{release,previous,verified};
}
module.exports={autoTag,stamp,FORMAT};
if(require.main===module){
  const docs=path.join(__dirname,'..','docs');
  const current=(fs.readFileSync(path.join(docs,'index.html'),'utf8').match(/<meta name="app-release" content="([^"]+)"/)||[])[1];
  const result=stamp(docs,process.argv[2]||current);
  console.log('Release set:',result.release,'with',result.verified,'verified offline files');
}
