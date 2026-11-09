// Keep the online HTML and offline shell on one release: node tools/set-release.cjs YYYYMMDD-vNN-description
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const release=process.argv[2];
if(!/^\d{8}-v\d+-[a-z0-9-]+$/.test(release||''))throw new Error('Use YYYYMMDD-vNN-description');
const files=['docs/sw.js','docs/index.html','docs/preview.html'],[sw,index,preview]=files.map(f=>fs.readFileSync(f,'utf8'));
const previous=sw.match(/const RELEASE = '([^']+)'/)[1];
const next=[sw.replace(`const RELEASE = '${previous}'`,`const RELEASE = '${release}'`),index.replaceAll(previous,release),preview.replace(/const release = '[^']+'/g,`const release = '${release}'`)];
files.forEach((f,i)=>fs.writeFileSync(f,next[i]));
if(fs.existsSync('docs/approved.html'))fs.writeFileSync('docs/approved.html',fs.readFileSync('docs/approved.html','utf8').replaceAll(previous,release));
fs.writeFileSync('docs/version.json',JSON.stringify({release})+'\n');
const paths=[...next[0].match(/const FILES = \[([\s\S]*?)\]\.map/)[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
const hashes=Object.fromEntries(paths.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join('docs',file))).digest('hex')]));
fs.writeFileSync('docs/sw.js',next[0].replace(/const FILE_HASHES = \{[\s\S]*?\};/, 'const FILE_HASHES = '+JSON.stringify(hashes,null,2)+';'));
console.log('Release set:',release,'with',paths.length,'verified offline files');
