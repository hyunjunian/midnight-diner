// Copy the playable site (docs/) into www/ for Capacitor: node tools/build-native.cjs
// The Workers/Pages site keeps serving docs/ directly; www/ is generated and untracked.
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),from=path.join(root,'docs'),to=path.join(root,'www');
// Not needed inside a store bundle: design mockups, the browser-only worker and
// preview/approval entries, and the renovation review pages (the game itself
// uses only renovation-preview/model.js and renovation-preview/assets/).
const skip=[/^mockups(\/|$)/,/^sw\.js$/,/^preview\.html$/,/^approved\.html$/,/^_headers$/,/(^|\/)\.DS_Store$/,
  /^renovation-preview\/(?!assets(\/|$)|model\.js$).+/];
fs.rmSync(to,{recursive:true,force:true});
let files=0,bytes=0;
fs.cpSync(from,to,{recursive:true,filter(source){
  const rel=path.relative(from,source).split(path.sep).join('/');
  if(rel&&skip.some(rule=>rule.test(rel)))return false;
  const stat=fs.statSync(source);if(stat.isFile()){files++;bytes+=stat.size;}
  return true;
}});
if(!fs.existsSync(path.join(to,'index.html')))throw new Error('www/index.html missing');
console.log(`www/ ready: ${files} files, ${(bytes/1048576).toFixed(1)} MB`);
