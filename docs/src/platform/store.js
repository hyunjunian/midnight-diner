/* Platform layer: in-app purchases. Game code calls only window.MidnightPlatform.store.
   Stage 1 has no billing SDK. A browser treats every purchase as successful (kept in
   memory only); a native build reports the store as unavailable until stage 3 adds
   StoreKit / Play Billing behind this file, so a device build can never grant goods free. */
(()=>{'use strict';
  const isNative=()=>window.Capacitor?.isNativePlatform?.()===true;
  // Product ids are placeholders until the store listings exist.
  const PRODUCTS=[
    {id:'coins_small',type:'consumable'},
    {id:'remove_ads',type:'non-consumable'}
  ];
  const owned=new Set();
  const find=id=>PRODUCTS.find(product=>product.id===id);
  const store={
    isNative,
    async init(){return{ready:!isNative(),native:isNative()};},
    // Resolves [{id,type,price}] — price is filled by the real store later.
    async getProducts(){return PRODUCTS.map(product=>({...product,price:null}));},
    // Resolves {ok,productId}. The caller grants the goods only when ok is true.
    async purchase(productId){
      const product=find(productId);
      if(!product)return{ok:false,productId,reason:'unknown-product'};
      if(isNative())return{ok:false,productId,reason:'unavailable'};
      if(product.type==='non-consumable')owned.add(productId);
      return{ok:true,productId,reason:'browser-fallback'};
    },
    // Resolves {ok,restored:[ids]} for non-consumables.
    async restore(){
      if(isNative())return{ok:false,restored:[],reason:'unavailable'};
      return{ok:true,restored:[...owned],reason:'browser-fallback'};
    },
    isOwned:productId=>owned.has(productId),
    // Stage 3 also returns true for iOS players whose original purchase predates the free switch.
    hasNoAds:()=>owned.has('remove_ads')
  };
  (window.MidnightPlatform=window.MidnightPlatform||{}).store=store;
})();
