// Keep the online HTML and offline shell on one release: node tools/set-release.cjs YYYYMMDD-vNN-description
const fs=require('node:fs');
const release=process.argv[2];
if(!/^\d{8}-v\d+-[a-z0-9-]+$/.test(release||''))throw new Error('Use YYYYMMDD-vNN-description');
const files=['docs/sw.js','docs/index.html','docs/preview.html'],[sw,index,preview]=files.map(f=>fs.readFileSync(f,'utf8'));
const previous=sw.match(/const RELEASE = '([^']+)'/)[1];
const next=[sw.replace(`const RELEASE = '${previous}'`,`const RELEASE = '${release}'`),index.replaceAll(previous,release),preview.replace(/const release = '[^']+'/g,`const release = '${release}'`)];
files.forEach((f,i)=>fs.writeFileSync(f,next[i]));
console.log('Release set:',release);
