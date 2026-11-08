/* Recipe-specific station sequences, shared by the kitchen UI and save validator. */
(() => {
  const step=(id,title,action,station,art,goal=1)=>({id,title,action,station,art,goal});
  const lid=()=>step('lid','밥솥 열기','뚜껑을 잡고 위로 밀어 열어 주세요.','rice','rice-closed');
  const portion=()=>step('portion','밥 담기','왼쪽 밥솥에서 오른쪽 그릇으로 세 주걱 끌어 담으세요.','rice','rice-open',3);
  const cut=()=>step('cut','재료 손질','칼을 집어 들고 표시된 선을 따라 위에서 아래로 썰어 주세요.','board','board',4);
  const oil=required=>({...step('oil','팬 준비',required?'기름병을 눌러 팬에 기름을 둘러 주세요.':'기름을 얇게 두르거나 마른 팬으로 구울 수 있어요.','stove','pan'),required});
  const heat=(art='pan',title='불 조절')=>step('heat',title,'다이얼을 돌려 불을 조절하고 초록 구간에서 0으로 돌려 꺼 주세요.','stove',art);
  const plate=()=>step('plate','마지막 담음새','완성 접시를 눌러 정성껏 담아 주세요.','board','plate');
  function family(id,r){
    if(/hiyayakko|sashimi|sushi|^nigiri_|tuna_don/.test(id))return'cold';
    if(/onigiri/.test(id))return'riceball';
    if(/(?:^|_)udon|soba|ramen|tantan/.test(id))return'noodle';
    if(/soup|misoshiru|tonjiru|nabe|shabu|sukiyaki|clam_miso|chawan/.test(id))return'soup';
    if(/katsu|fry|tempura|karaage|croquette/.test(id))return'fry';
    if(/tamago|omelette/.test(id)&&!r.ingredients.includes('rice'))return'egg';
    return r.ingredients.includes('rice')?'ricebowl':'pan';
  }
  function plan(id,r){const f=family(id,r),assemble=()=>step('assemble','서빙 접시에 옮겨 담기','왼쪽의 조리된 음식을 오른쪽 서빙 그릇까지 직접 끌어 놓으세요.','board','plate',1);
    if(f==='riceball')return[lid(),portion(),step('shape','세모로 빚기','가장자리에서 가운데로 손을 밀어 세모 모양을 잡으세요.','board','shape',3),oil(false),{...heat('pan','앞뒤로 굽기'),flip:true},...(r.ingredients.includes('nori')?[step('wrap','김 두르기','왼쪽 김을 오른쪽 주먹밥으로 끌어 감싸세요.','board','nori')]:[]),assemble()];
    if(f==='egg')return[step('beat','달걀 풀기','그릇 안에서 원을 그리며 달걀을 직접 저으세요.','board','egg-bowl',3),oil(true),step('pour','달걀물 붓기','왼쪽 달걀물을 오른쪽 팬으로 끌어 부으세요.','stove','egg-pan'),{...heat('egg-pan','익히고 말기'),flip:true},assemble()];
    if(f==='cold')return[cut(),step('season','간 맞추기','왼쪽 양념을 오른쪽 재료로 끌어 골고루 더하세요.','board','cold',2),assemble()];
    return[cut(),...(f==='soup'?[step('broth','국물 붓기','왼쪽 육수를 오른쪽 냄비까지 끌어 부으세요.','stove','soup',2)]:[]),heat(f==='noodle'?'noodles':f==='soup'?'soup':f==='fry'?'fryer':'pan','재료 익히기'),...(f==='noodle'?[step('drain','면 건지기','위로 끌어 면을 건져 주세요.','stove','noodles')]:[]),assemble()];
  }
  const api={family,plan};if(typeof module!=='undefined')module.exports=api;else window.MidnightCookingRules=api;
})();
