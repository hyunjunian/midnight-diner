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
  // All fields are smooth, overlapping weights in one connected mesh.
  function deform(m,t,state={},out=new Float32Array(m.points.length*4)) {
    const seed=state.seed??m.person*.79,breath=Math.sin(t*1.42+seed),walk=clamp(state.walk||0),cook=clamp(state.cook||0);
    const stride=Math.sin(t*10.5+seed),sway=Math.sin(t*.92+seed)*.022-walk*stride*.024;
    const hairLag=Math.sin(t*.92+seed-.65)*.007+walk*Math.sin(t*10.5+seed-.7)*.005;
    for(let i=0;i<m.points.length;i++){
      const p=m.points[i];let x=p.x,y=p.y;
      x+=(x-.5)*breath*.011*p.chest;
      y-=breath*(.0062*p.chest+.0036*p.head);
      const dx=p.x-.5,dy=p.y-.42,angle=sway*p.head;
      x+=dx*(Math.cos(angle)-1)-dy*Math.sin(angle)*1.3333;
      y+=dx*Math.sin(angle)*.75+dy*(Math.cos(angle)-1);
      x+=hairLag*p.hairEdge+Math.sin(t*1.65+seed-.5)*.0035*p.hair;
      y+=Math.sin(t*1.1+seed-.9)*.0027*p.hairEdge;
      x+=walk*stride*.005*(1-p.head);y+=walk*Math.cos(t*21+seed)*.003*(1-p.y);
      x+=cook*Math.sin(t*4+seed)*.005*p.hand;y+=cook*Math.cos(t*4+seed)*.004*p.hand;
      out[i*4]=x;out[i*4+1]=y;out[i*4+2]=p.x;out[i*4+3]=p.y;
    }
    return out;
  }
  const api={mesh,deform,portrait};
  if(typeof module!=='undefined'){module.exports=api;return;}
  window.MidnightMorph=api;
  const images={};for(const [key,file] of Object.entries({a:'visitors-a.webp',b:'visitors-b.webp'})){const image=new Image();image.src=new URL(`./assets/${file}`,document.currentScript.src).href;images[key]=image;}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const records=new Map();let gl,program,vertex,index,textures={},locations={},ready=false,last=0,frameCount=0,failures=0;
  const surface=document.createElement('canvas');surface.width=240;surface.height=320;
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
    const ctx=canvas.getContext('2d');if(!ctx)continue;const m=mesh(Number(el.dataset.person));
    records.set(el,{el,canvas,ctx,m,vertices:new Float32Array(m.points.length*4),walk:0,cook:0,seed:m.person*.79+records.size*.37});
  }}
  let dirty=true;new MutationObserver(()=>dirty=true).observe(document.documentElement,{childList:true,subtree:true});
  function frame(now){requestAnimationFrame(frame);if(!ready||document.hidden||now-last<1000/30)return;const dt=Math.min(.08,(now-last)/1000||.033);last=now;
    if(dirty){attach();dirty=false;}
    const ease=1-Math.exp(-dt*9);
    try{for(const [el,r]of records){if(!el.isConnected){records.delete(el);continue;}if(!el.getClientRects().length)continue;
      if(reduced.matches&&el.classList.contains('morph-ready'))continue;
      const customer=el.closest('.customer');
      const walking=customer?.classList.contains('arriving')?1:0;
      r.cook+=((el.closest('.cooking')?1:0)-r.cook)*ease;
      r.walk+=(walking-r.walk)*ease;
      const t=reduced.matches?0:now/1000;deform(r.m,t,{seed:r.seed,walk:r.walk,cook:r.cook},r.vertices);
      gl.bindBuffer(gl.ARRAY_BUFFER,vertex);gl.bufferData(gl.ARRAY_BUFFER,r.vertices,gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,r.m.indices,gl.STATIC_DRAW);
      const art=portrait(r.m.person);gl.bindTexture(gl.TEXTURE_2D,textures[art.sheet]);gl.uniform2f(uniform('tile'),art.tile%4,Math.floor(art.tile/4));gl.uniform1f(uniform('rows'),art.rows);
      gl.clear(gl.COLOR_BUFFER_BIT);gl.drawElements(gl.TRIANGLES,r.m.indices.length,gl.UNSIGNED_SHORT,0);
      if(gl.isContextLost())throw new Error('context lost');
      r.ctx.clearRect(0,0,240,320);r.ctx.drawImage(surface,0,0);el.classList.add('morph-ready');r.canvas.dataset.motion=r.walk>.1?'walk':r.cook>.1?'cook':'idle';
    }frameCount++;}catch{failures++;ready=false;for(const el of records.keys())el.classList.remove('morph-ready');}
  }
  api.status=()=>({ready,frames:frameCount,failures,actors:records.size});
  Promise.all(Object.values(images).map(image=>image.decode())).then(()=>{try{init()}catch{failures++}requestAnimationFrame(frame)}).catch(()=>{failures++});
  surface.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;for(const el of records.keys())el.classList.remove('morph-ready');});
  surface.addEventListener('webglcontextrestored',()=>{try{init()}catch{failures++}});
})();
