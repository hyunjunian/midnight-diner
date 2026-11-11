// Switch from "ads off" to real AdMob ads in one step, once the AdMob account exists:
//   node tools/set-admob.cjs \
//     --ios-app ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX --android-app ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX \
//     --ios-interstitial ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX --ios-rewarded ca-app-pub-…/… \
//     --android-interstitial ca-app-pub-…/… --android-rewarded ca-app-pub-…/…
// It writes the two app ids into the native projects (needs a new store build) and the four
// unit ids into docs/src/platform/config.js, then sets ads.enabled: true and testMode: false.
// All six ids are checked first; nothing is written unless every one is valid.
const fs=require('node:fs'),path=require('node:path');
const args=process.argv.slice(2),value=name=>{const i=args.indexOf('--'+name);return i<0?'':args[i+1]||'';};
const root=path.resolve(value('root')||path.join(__dirname,'..'));
const APP=/^ca-app-pub-\d{16}~\d{10}$/,UNIT=/^ca-app-pub-\d{16}\/\d{10}$/,SAMPLE='ca-app-pub-3940256099942544';
const wanted=[['ios-app',APP],['android-app',APP],['ios-interstitial',UNIT],['ios-rewarded',UNIT],['android-interstitial',UNIT],['android-rewarded',UNIT]];
const ids={},problems=[];
for(const [name,shape] of wanted){
  const id=value(name);ids[name]=id;
  if(!id)problems.push(`--${name} is missing`);
  else if(!shape.test(id))problems.push(`--${name} does not look like ${shape===APP?'an app id (ca-app-pub-…~…)':'an ad unit id (ca-app-pub-…/…)'}`);
  else if(id.startsWith(SAMPLE))problems.push(`--${name} is Google's sample id, not your own`);
}
if(new Set(Object.values(ids)).size!==wanted.length&&!problems.length)problems.push('the same id was given twice');
if(problems.length){console.error('Nothing was changed:\n- '+problems.join('\n- '));process.exit(1);}
const edit=(file,change)=>{const full=path.join(root,file),before=fs.readFileSync(full,'utf8'),after=change(before);if(after===before)throw new Error(`Could not find the place to edit in ${file}`);return[full,after];};
const once=(text,pattern,replacement)=>{if(!pattern.test(text))throw new Error('pattern not found: '+pattern);return text.replace(pattern,replacement);};
const writes=[
  edit('ios/App/App/Info.plist',text=>once(text,/(<key>GADApplicationIdentifier<\/key>\s*<string>)[^<]*(<\/string>)/,`$1${ids['ios-app']}$2`)),
  edit('android/app/src/main/AndroidManifest.xml',text=>once(text,/(android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"\s*android:value=")[^"]*(")/,`$1${ids['android-app']}$2`)
    .replace(/\s*<!-- AdMob app id\. This is Google's public sample id; replace it with the real one before release\. -->/,'')),
  edit('docs/src/platform/config.js',text=>{
    let next=once(text,/ios: \{ interstitial: '[^']*', rewarded: '[^']*' \}/,`ios: { interstitial: '${ids['ios-interstitial']}', rewarded: '${ids['ios-rewarded']}' }`);
    next=once(next,/android: \{ interstitial: '[^']*', rewarded: '[^']*' \}/,`android: { interstitial: '${ids['android-interstitial']}', rewarded: '${ids['android-rewarded']}' }`);
    next=once(next,/(\n\s*)enabled: (true|false),/,'$1enabled: true,');
    return once(next,/(\n\s*)testMode: (true|false),/,'$1testMode: false,');
  })
];
for(const [full,text] of writes)fs.writeFileSync(full,text);
console.log('AdMob ids written and ads turned on.\nNext: npm test, commit, push to main and release, then build and submit the apps\n(the app ids live in the native projects, so they reach players only through a store build).');
