/* Recipe-specific station sequences, shared by the kitchen UI and save validator. */
(() => {
  const step=(id,title,action,station,art,goal=1)=>({id,title,action,station,art,goal});
  const lid=()=>step('lid','밥솥 열기','밥솥 뚜껑을 위로 밀거나 눌러 열어 주세요.','rice','rice-closed');
  const portion=()=>step('portion','밥 담기','밥을 눌러 한 주걱씩 떠요. 세 주걱이 한 그릇에 알맞아요.','rice','rice-open',3);
  const cut=()=>step('cut','재료 손질','도마 위를 좌우로 밀어 한입 크기로 손질해요.','board','board',4);
  const oil=required=>({...step('oil','팬 준비',required?'기름병을 눌러 팬에 기름을 둘러 주세요.':'기름을 얇게 두르거나 마른 팬으로 구울 수 있어요.','stove','pan'),required});
  const heat=(art='pan',title='불 조절')=>step('heat',title,'불 세기를 조절하고 초록 구간에서 마무리해요.','stove',art);
  const plate=()=>step('plate','마지막 담음새','완성 접시를 눌러 정성껏 담아 주세요.','board','plate');
  function family(id,r){
    if(/hiyayakko|sashimi|sushi|^nigiri_|tuna_don/.test(id))return'cold';
    if(/onigiri/.test(id))return'riceball';
    if(/udon|soba|ramen|tantan/.test(id))return'noodle';
    if(/soup|misoshiru|tonjiru|nabe|shabu|sukiyaki|clam_miso|chawan/.test(id))return'soup';
    if(/katsu|fry|tempura|karaage|croquette/.test(id))return'fry';
    if(/tamago|omelette/.test(id)&&!r.ingredients.includes('rice'))return'egg';
    return r.ingredients.includes('rice')?'ricebowl':'pan';
  }
  function plan(id,r){switch(family(id,r)){
    case'riceball':return[lid(),portion(),step('shape','세모로 빚기','두 손을 안쪽으로 밀어 세 번 살살 모양을 잡아요.','board','shape',3),oil(false),{...heat('pan','앞뒤로 노릇하게 굽기'),flip:true},...(r.ingredients.includes('nori')?[step('wrap','김 두르기','김을 주먹밥 쪽으로 밀거나 눌러 감싸 주세요.','board','nori')]:[]),plate()];
    case'egg':return[step('beat','달걀 풀기','그릇 안을 원을 그리듯 저어 달걀과 다시를 섞어요.','board','egg-bowl',5),oil(true),step('pour','달걀물 붓기','그릇을 눌러 팬에 달걀물을 얇게 부어요.','stove','egg-pan'),{...heat('egg-pan','천천히 익혀 말기'),flip:true},plate()];
    case'soup':return[cut(),step('add','냄비에 재료 넣기','손질한 재료를 눌러 냄비에 넣어요.','stove','soup',3),step('broth','국물 붓기','다시를 눌러 재료가 잠길 만큼 부어요.','stove','soup',2),heat('soup','보글보글 끓이기'),plate()];
    case'noodle':return[step('water','물 올리기','냄비를 눌러 면 삶을 물을 준비해요.','stove','noodles'),step('add','면 넣기','면을 눌러 끓는 물에 넣어요.','stove','noodles'),heat('noodles','면 삶기'),step('drain','면 건지기','젓가락을 위로 밀어 면을 건져요.','stove','noodles'),step('garnish','고명 올리기','고명을 눌러 면 위에 올려요.','board','plate',2),plate()];
    case'fry':return[cut(),step('coat','튀김옷 입히기','재료를 눌러 튀김옷을 고르게 입혀요.','board','board',3),oil(true),heat('fryer','바삭하게 튀기기'),step('drain','기름 빼기','접시를 위로 밀어 기름을 빼요.','board','plate'),plate()];
    case'cold':return[cut(),step('season','간 맞추기','간장을 조금씩 더해 재료의 맛을 살려요.','board','cold',2),step('garnish','차갑게 담기','재료를 눌러 모양을 살려 담아요.','board','cold',3),plate()];
    case'ricebowl':return[lid(),portion(),cut(),heat('pan','곁들임 익히기'),step('assemble','밥 위에 담기','따뜻한 밥 위에 재료를 고르게 올려요.','board','plate',3),plate()];
    default:return[cut(),oil(false),heat(),step('garnish','한 접시 완성하기','곁들임을 눌러 차림을 마무리해요.','board','plate',2),plate()];
  }}
  const api={family,plan};if(typeof module!=='undefined')module.exports=api;else window.MidnightCookingRules=api;
})();
