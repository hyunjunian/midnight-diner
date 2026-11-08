/* Recipe-specific station sequences, shared by the kitchen UI and save validator. */
(() => {
  const step=(id,title,action,station,art,goal=1)=>({id,title,action,station,art,goal});
  const lid=()=>step('lid','밥솥 열기','뚜껑을 잡고 위로 밀어 열어 주세요.','rice','rice-closed');
  const portion=()=>step('portion','밥 담기','주걱을 위로 들어 밥을 뜬 뒤 그릇 쪽으로 내려 주세요.','rice','rice-open',3);
  const cut=()=>step('cut','재료 손질','칼을 집어 들고 표시된 선을 따라 위에서 아래로 썰어 주세요.','board','board',4);
  const oil=required=>({...step('oil','팬 준비',required?'기름병을 눌러 팬에 기름을 둘러 주세요.':'기름을 얇게 두르거나 마른 팬으로 구울 수 있어요.','stove','pan'),required});
  const heat=(art='pan',title='불 조절')=>step('heat',title,'다이얼을 돌려 불을 조절하고 초록 구간에서 0으로 돌려 꺼 주세요.','stove',art);
  const plate=()=>step('plate','마지막 담음새','완성 접시를 눌러 정성껏 담아 주세요.','board','plate');
  function family(id,r){
    if(/hiyayakko|sashimi|sushi|^nigiri_|tuna_don|^chirashi$|^tamagokake$/.test(id))return'cold';
    if(/^yakisoba$|^yakiudon$/.test(id))return'pan';
    if(/onigiri/.test(id))return'riceball';
    if(/(?:^|_)udon|soba|ramen|tantan/.test(id))return'noodle';
    if(/soup|misoshiru|tonjiru|nabe|shabu|sukiyaki|clam_miso|chawan/.test(id))return'soup';
    if(/katsu|fry|tempura|karaage|croquette/.test(id))return'fry';
    if(/tamago|omelette/.test(id)&&!r.ingredients.includes('rice'))return'egg';
    return r.ingredients.includes('rice')?'ricebowl':'pan';
  }
  function heatMode(id,r){const f=family(id,r);if(f==='cold'||id==='shio_onigiri')return 'none';return ['soup','noodle'].includes(f)||/chazuke|curry|kamameshi|salmonbowl|kinoko_rice|oyster_rice|gyudon|oyakodon|kakuni|chawan|stew|simmer|nikujaga/.test(id)?'boil':'sizzle';}
  function cookPlan(id,r){
    const f=family(id,r),rice=r.ingredients.includes('rice')?[lid(),portion()]:[],assemble=()=>step('assemble','서빙 접시에 옮겨 담기','조리된 음식을 점선을 따라 서빙 그릇에 담아 주세요.','board','plate');
    if(f==='riceball')return [...rice,step('shape','세모로 빚기','흩어진 밥을 모아 동그랗게, 다시 세모로 빚어 주세요.','board','shape',3),...(id==='shio_onigiri'?[]:[{...heat('pan','앞뒤로 굽기'),flip:true}]),...(r.ingredients.includes('nori')?[step('wrap','김 두르기','좁은 김을 앞면 가운데로 가져와 아래에서 위로 세로로 붙여 주세요.','board','nori')]:[]),assemble()];
    if(f==='egg')return [step('beat','달걀 풀기','그릇 안에서 원을 그리며 달걀을 저으세요.','board','egg-bowl',3),step('pour','달걀물 붓기','그릇을 기울여 팬에 달걀물을 부어 주세요.','stove','egg-pan'),{...heat('egg-pan','익히고 말기'),flip:true},assemble()];
    if(f==='cold')return [...rice,assemble()];
    const broth=f==='soup'? [step('broth',r.ingredients.includes('dashi')?'국물 붓기':'냄비에 물 붓기',r.ingredients.includes('dashi')?'계량한 다시를 냄비에 부어 주세요.':'냄비에 물을 부어 조리할 바탕을 만들어요.','stove','soup',2)]:[];
    return [...rice,...broth,heat(f==='noodle'?'noodles':f==='soup'?'soup':f==='fry'?'fryer':'pan',f==='fry'?'노릇하게 튀기기':f==='soup'?'재료 끓이기':'재료 익히기'),...(f==='noodle'?[step('drain','면 건지기','면을 위로 건져 물기를 빼 주세요.','stove','noodles')]:[]),assemble()];
  }
  const prepOrder=['rice','nori','egg','dashi','pork','miso','salmon','tofu','vegetables','mushroom','noodles','flour','shrimp','chicken','beef','tuna','soy','butter','milk','potato','cheese','clam','scallops','oyster','crab','sugar','fish','scallion'];
  const names={rice:'쌀',nori:'김',egg:'달걀',dashi:'다시',pork:'돼지고기',miso:'된장',salmon:'연어',tofu:'두부',vegetables:'양배추',scallion:'대파',mushroom:'버섯',noodles:'면',flour:'밀가루',shrimp:'새우',chicken:'닭고기',beef:'소고기',tuna:'참치',soy:'간장',butter:'버터',milk:'우유',potato:'감자',cheese:'치즈',clam:'바지락',scallops:'가리비',oyster:'굴',crab:'게살',sugar:'설탕',fish:'생선'};
  function prepMode(id){if(['pork','salmon','tofu','vegetables','scallion','mushroom','chicken','beef','tuna','butter','cheese','fish'].includes(id))return'cut';if(['rice','noodles','clam','scallops','oyster'].includes(id))return'wash';if(['shrimp','potato','crab'].includes(id))return'peel';if(id==='egg')return'crack';if(id==='nori')return'fold';return'measure';}
  function preparations(r){return r.ingredients.flatMap(id=>(id==='vegetables'?['vegetables','scallion']:[id]).map(part=>{const mode=prepMode(part),name=names[part],verb={cut:'썰기',wash:'씻기',peel:'손질',crack:'깨기',fold:'접기',measure:'계량'}[mode];return {...step('prep',`${name} ${verb}`,{cut:`${name} 썰기`,wash:`${name}에 물을 더하고 부드럽게 원을 그리며 씻어 주세요.`,peel:`${name}의 겉부분을 잡고 바깥쪽으로 벗겨 주세요.`,crack:'달걀을 그릇 가장자리 쪽으로 내린 뒤 벌려 주세요.',fold:'김의 가장자리를 가운데로 접어 주세요.',measure:`${part==='miso'?'된장 한 숟갈을 덜어 준비해 주세요.':`${name} 한 분량을 계량컵에 덜어 준비해 주세요.`} 용기를 아래로 기울여 덜어 주세요.`}[mode],'board','ingredient',mode==='cut'?3:1),ingredient:id,part,mode,art:prepOrder.indexOf(part)};}));}
  function plan(id,r,legacyLid=false){return [...preparations(r),...cookPlan(id,r).filter(st=>(legacyLid||st.id!=='lid')&&st.id!=='cut'&&st.id!=='season'&&st.id!=='oil').map(st=>r.level<=5&&['pour','broth','drain'].includes(st.id)?{...st,station:'board'}:st)];}
  const catalog=typeof module!=='undefined'?require('./catalog.js'):window.MidnightCatalog;
  const sceneAssets=typeof module!=='undefined'?require('./scene-assets-v28.js'):window.MidnightSceneAssets;
  const heated=Object.keys(catalog.recipes).filter(id=>family(id,catalog.recipes[id])!=='cold'&&id!=='shio_onigiri');
  const imagePilot=Object.freeze(Object.keys(catalog.recipes).filter(id=>catalog.recipes[id].level<=5));
  // The user approved the new workbench/stove direction for levels 1–5 only.
  const inImagePilot=id=>imagePilot.includes(id);
  function platingArt(id,appearance='good'){
    const index=Object.keys(catalog.recipes).indexOf(id);if(index<0)return null;
    if(inImagePilot(id)){const n=appearance==='raw'?1:['dry','burnt'].includes(appearance)?2:0;return{file:`portrait-v28-plate-${id}`,cols:2,rows:2,col:n%2,row:Math.floor(n/2),className:'plating-frame'};}
    return {file:`plating-${Math.floor(index/4)+1}`,cols:2,rows:2,col:index%2,row:Math.floor(index%4/2),className:'plating-frame'};
  }
  function wrapArt(id,appearance='good'){
    if(id!=='onigiri')return null;const condition=appearance==='raw'?'raw':['dry','burnt'].includes(appearance)?'burnt':null;
    return condition?{file:`core-wrap-${condition}-v24`,cols:2,rows:2,className:'core-frame'}:null;
  }
  function heatArt(id,phase=0){return inImagePilot(id)&&heated.includes(id)?{file:`stove-v28-${id}`,cols:2,rows:2,col:phase%2,row:Math.floor(phase/2),className:'heat-frame'}:null;}
  function finalArt(id,appearance='good',eaten=false){
    if(id==='onigiri'){const n=eaten?3:appearance==='raw'?1:['dry','burnt'].includes(appearance)?2:0;return{file:'onigiri-final-v28',n,ratio:'3/4'};}
    if(inImagePilot(id)&&heated.includes(id))return{file:`final-v28-${id}`,n:eaten?3:appearance==='raw'?1:['dry','burnt'].includes(appearance)?2:0,ratio:'3/4'};
    return null;
  }
  const nightPrepRecipes=imagePilot;
  function prepImage(recipe,part){return `prep-hi-${part}`;}
  const nightSceneFiles=sceneAssets.files;
  function nightImage(recipe,file){return inImagePilot(recipe)?nightSceneFiles[file]||file:file;}
  function portraitImage(recipe,file){return sceneAssets.portrait(nightImage(recipe,file));}
  const api={heatLayout:sceneAssets.heatLayout,inImagePilot,heatArt,finalArt,portraitImage,nightImage,nightSceneFiles,wrapArt,platingArt,prepImage,nightPrepRecipes,imagePilot,heated,family,heatMode,plan,preparations,prepMode,prepOrder,prepNames:names};if(typeof module!=='undefined')module.exports=api;else window.MidnightCookingRules=api;
})();
