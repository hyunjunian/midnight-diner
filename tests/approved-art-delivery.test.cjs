const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const frozen=require('../planning/approved-art-dc743754.json');
test('immutable delivery copies retain every approved image byte',()=>{
 for(const [name,expected]of Object.entries(frozen))for(const suffix of ['', '-approved-dc743754'])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(`docs/assets/${name}${suffix}.webp`)).digest('hex'),expected,name+suffix);
});
test('fresh approved entry preserves the exact main UI and only canonicalizes its URL',()=>{
 const entry=fs.readFileSync('docs/approved.html','utf8'),main=fs.readFileSync('docs/index.html','utf8');
 assert.equal(entry.replace("\n  <script>history.replaceState(null,'',new URL('./',location.href));</script>",''),main);
});
