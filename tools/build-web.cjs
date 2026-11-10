// Build the browser site for Workers: copy docs/ to dist/web and tag it with this commit.
//   node tools/build-web.cjs     then: npx wrangler deploy
const fs=require('node:fs'),path=require('node:path'),{autoTag,stamp}=require('./set-release.cjs');
const root=path.join(__dirname,'..'),to=path.join(root,'dist','web');
fs.rmSync(to,{recursive:true,force:true});
fs.cpSync(path.join(root,'docs'),to,{recursive:true,filter:source=>path.basename(source)!=='.DS_Store'});
const result=stamp(to,process.env.RELEASE_TAG||autoTag(root));
console.log(`dist/web ready: ${result.release} with ${result.verified} verified offline files`);
