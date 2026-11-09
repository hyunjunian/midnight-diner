/* Continuous textured mesh deformation. No cut-out limbs or image-frame swapping. */
(() => {
  'use strict';
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
  const portrait=person=>({sheet:person%24<12?'a':'b',tile:person%12,rows:3});
  const gaussian=(x,y,cx,cy,rx,ry)=>Math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2));
  function mesh(person,cols=32,rows=48) {
    const points=[],indices=[];
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
      const x=i/cols,y=j/rows;
      points.push({x,y,head:1-smooth((y-.32)/.18),chest:gaussian(x,y,.5,.57,.36,.23),
        hair:gaussian(x,y,.5,.12,.38,.17),hairEdge:gaussian(x,y,.5,.22,.4,.19)*Math.min(1,Math.abs(x-.5)*4),
        hand:gaussian(x,y,.57,.89,.29,.14)});
    }
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const k=j*(cols+1)+i;indices.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1)}
    return {points,indices:new Uint16Array(indices),person};
  }
  // Seeded random knots blend continuously; guests never share a repeating pose loop.
  const hash=(n,seed=0)=>{const v=Math.sin(n*127.1+seed*311.7)*43758.5453;return v-Math.floor(v);};
  function noise(t,seed){const n=Math.floor(t),f=smooth(t-n);return (hash(n,seed)*(1-f)+hash(n+1,seed)*f)*2-1;}
  function gesture(t,seed,period,chance){
    const epoch=Math.floor(t/period);let result=0;
    // Include the preceding epoch so envelopes remain seamless across its boundary.
    for(let k=epoch-1;k<=epoch;k++){
      if(hash(k,seed+1)>chance)continue;
      const start=k*period+hash(k,seed+2)*period*.64;
      const duration=2.4+hash(k,seed+3)*3.2,u=(t-start)/duration;
      if(u>0&&u<1)result+=Math.sin(Math.PI*u)**2*(hash(k,seed+4)>.5?1:-1);
    }return result;
  }
  function motion(t,seed=0){
    const rhythm=t*(1.24+hash(1,seed)*.28)+seed+noise(t*.12,seed+4)*.34;
    const breath=Math.sin(rhythm),glance=gesture(t,seed+11,9,.82),settle=gesture(t,seed+23,12,.76),nod=gesture(t,seed+37,8,.68);
    return {breath,glance,settle,nod,
      sway:noise(t*.28,seed+5)*.035+glance*.042,
      lean:noise(t*.19,seed+9)*.008+settle*.009,
      hair:noise(t*.57,seed+13)*.009+glance*.011,
      hairY:noise(t*.4,seed+17)*.004+nod*.003,
      lift:breath*.008+nod*.008};
  }
  // All fields overlap smoothly in one connected mesh; no separate facial parts.
  function deform(m,t,state={},out=new Float32Array(m.points.length*4)) {
    const seed=state.seed??m.person*.79,q=motion(t,seed),walk=clamp(state.walk||0),cook=clamp(state.cook||0),eat=clamp(state.eat||0);
    const stride=Math.sin(t*10.5+seed),sway=q.sway-walk*stride*.03;
    const hairLag=q.hair+walk*Math.sin(t*10.5+seed-.7)*.006;
    for(let i=0;i<m.points.length;i++){
      const p=m.points[i];let x=p.x,y=p.y;
      x+=(x-.5)*q.breath*.021*p.chest+q.lean*p.chest;
      y-=q.breath*.0085*p.chest+q.lift*p.head;
      const dx=p.x-.5,dy=p.y-.42,angle=sway*p.head;
      x+=dx*(Math.cos(angle)-1)-dy*Math.sin(angle)*1.3333;
      y+=dx*Math.sin(angle)*.75+dy*(Math.cos(angle)-1);
      x+=hairLag*p.hairEdge+Math.sin(t*1.65+seed-.5)*.004*p.hair;
      y+=q.hairY*p.hairEdge;
      // A quiet shoulder/hand adjustment, rather than an identical full-body bob.
      y+=q.settle*(p.x-.5)*.024*p.chest;
      x+=q.settle*.007*p.hand;
      x+=walk*stride*.006*(1-p.head);y+=walk*Math.cos(t*21+seed)*.003*(1-p.y);
      x+=cook*Math.sin(t*4+seed)*.006*p.hand;y+=cook*Math.cos(t*4+seed)*.005*p.hand;
      x+=eat*Math.sin(t*2.1+seed)*.009*p.hand;y-=eat*(.014+.016*Math.sin(t*2.1+seed))*p.hand;
      y+=eat*Math.sin(t*2.1+seed)*.003*p.head;
      out[i*4]=x;out[i*4+1]=y;out[i*4+2]=p.x;out[i*4+3]=p.y;
    }
    return out;
  }
  const api={mesh,deform,portrait,motion};
  if(typeof module!=='undefined'){module.exports=api;return;}
  window.MidnightMorph=api;
  const images={};for(const [key,file] of Object.entries({a:'visitors-a.webp',b:'visitors-b.webp'})){const image=new Image();image.src=new URL(`./assets/${file}`,document.currentScript.src).href;images[key]=image;}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const records=new Map();let gl,program,vertex,index,textures={},locations={},ready=false,last=0,frameCount=0,failures=0;
  // Transfer a GPU-backed bitmap instead of reading WebGL pixels into a 2D
  // canvas for every portrait. Older browsers retain the existing 2D path.
  const bitmapTransfer=typeof OffscreenCanvas!=='undefined'&&typeof OffscreenCanvas.prototype.transferToImageBitmap==='function'&&!!document.createElement('canvas').getContext('bitmaprenderer');
  const surface=bitmapTransfer?new OffscreenCanvas(240,320):document.createElement('canvas');surface.width=240;surface.height=320;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  function init(){
    gl=surface.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:true,preserveDrawingBuffer:true});if(!gl)return;
    program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,`attribute vec2 position;attribute vec2 source;varying vec2 uv;void main(){uv=source;gl_Position=vec4(position.x*2.-1.,1.-position.y*2.,0.,1.);}`));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec2 uv;uniform sampler2D atlas;uniform vec2 tile;uniform float rows;
      void main(){gl_FragColor=texture2D(atlas,(tile+clamp(uv,vec2(.001),vec2(.999)))/vec2(4.,rows));}`));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    vertex=gl.createBuffer();index=gl.createBuffer();
    for(const [key,image]of Object.entries(images)){
      const texture=gl.createTexture();textures[key]=texture;gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
      for(const [p,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,p,v);
    }
    for(const name of ['tile','rows'])locations[name]=gl.getUniformLocation(program,name);
    gl.bindBuffer(gl.ARRAY_BUFFER,vertex);for(const [name,offset] of [['position',0],['source',8]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,16,offset);}
    gl.viewport(0,0,240,320);gl.clearColor(0,0,0,0);ready=true;
  }
  const uniform=name=>locations[name];
  function attach(){for(const el of document.querySelectorAll('.actor[data-person]'))if(!records.has(el)){
    const canvas=el.querySelector('.actor-morph');if(!canvas)continue;canvas.width=240;canvas.height=320;
    const ctx=canvas.getContext(bitmapTransfer?'bitmaprenderer':'2d');if(!ctx)continue;const m=mesh(Number(el.dataset.person));
    records.set(el,{el,canvas,ctx,m,vertices:new Float32Array(m.points.length*4),walk:0,cook:0,eat:0,seed:m.person*.79+Math.random()*1000});
  }}
  let dirty=true;new MutationObserver(()=>dirty=true).observe(document.documentElement,{childList:true,subtree:true});
  function frame(now){requestAnimationFrame(frame);if(document.hidden||now-last<1000/30)return;const dt=Math.min(.08,(now-last)/1000||.033);last=now;
    if(dirty){attach();dirty=false;}
    const ease=1-Math.exp(-dt*9);
    try{for(const [el,r]of records){if(!el.isConnected){records.delete(el);continue;}if(!el.getClientRects().length)continue;
      if(!ready){
        el.classList.add('motion-fallback');
        const q=motion(now/1000,r.seed);
        el.style.transform=reduced.matches?'none':`translate(${q.lean*35}px,${-q.lift*55}px) rotate(${q.sway*24}deg)`;
        continue;
      }
      if(el.classList.contains('motion-fallback')){el.classList.remove('motion-fallback');el.style.removeProperty('transform');}
      if(reduced.matches&&el.classList.contains('morph-ready'))continue;
      const customer=el.closest('.customer');
      const walking=customer?.classList.contains('arriving')?1:0;
      r.cook+=((el.closest('.cooking')?1:0)-r.cook)*ease;
      r.walk+=(walking-r.walk)*ease;r.eat+=((customer?.classList.contains('dining')?1:0)-r.eat)*ease;
      const t=reduced.matches?0:now/1000;deform(r.m,t,{seed:r.seed,walk:r.walk,cook:r.cook,eat:r.eat},r.vertices);
      gl.bindBuffer(gl.ARRAY_BUFFER,vertex);gl.bufferData(gl.ARRAY_BUFFER,r.vertices,gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,r.m.indices,gl.STATIC_DRAW);
      const art=portrait(r.m.person);gl.bindTexture(gl.TEXTURE_2D,textures[art.sheet]);gl.uniform2f(uniform('tile'),art.tile%4,Math.floor(art.tile/4));gl.uniform1f(uniform('rows'),art.rows);
      gl.clear(gl.COLOR_BUFFER_BIT);gl.drawElements(gl.TRIANGLES,r.m.indices.length,gl.UNSIGNED_SHORT,0);
      if(gl.isContextLost())throw new Error('context lost');
      if(bitmapTransfer)r.ctx.transferFromImageBitmap(surface.transferToImageBitmap());else{r.ctx.clearRect(0,0,240,320);r.ctx.drawImage(surface,0,0);}el.classList.add('morph-ready');r.canvas.dataset.motion=r.walk>.1?'walk':r.cook>.1?'cook':r.eat>.1?'eat':'idle';
    }frameCount++;}catch{failures++;ready=false;for(const el of records.keys())el.classList.remove('morph-ready');}
  }
  api.status=()=>({ready,frames:frameCount,failures,actors:records.size});
  Promise.all(Object.values(images).map(image=>image.decode())).then(()=>{try{init()}catch{failures++}requestAnimationFrame(frame)}).catch(()=>{failures++;requestAnimationFrame(frame)});
  surface.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;for(const el of records.keys())el.classList.remove('morph-ready');});
  surface.addEventListener('webglcontextrestored',()=>{try{init()}catch{failures++}});
})();
