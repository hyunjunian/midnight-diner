/* Continuous textured mesh deformation. No cut-out limbs or image-frame swapping. */
(() => {
  'use strict';
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
  const mouthCenters=[[.52,.335],[.53,.316],[.50,.32],[.54,.343],[.53,.343],[.52,.31],[.51,.344],[.52,.327],[.51,.346],[.52,.33],[.52,.35],[.50,.33],[.51,.323],[.49,.299],[.51,.335],[.50,.332],[.51,.306],[.50,.332],[.50,.323],[.51,.299],[.50,.366],[.50,.342],[.51,.359],[.50,.354]];
  const portrait=person=>person<0?{sheet:'owner',tile:6,rows:2,mouth:[.526,.310]}:{sheet:person%24<12?'a':'b',tile:person%12,rows:3,mouth:mouthCenters[person%24]};
  const gaussian=(x,y,cx,cy,rx,ry)=>Math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2));
  function mesh(person,cols=32,rows=48) {
    const points=[],indices=[],mouth=portrait(person).mouth;
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
      const x=i/cols,y=j/rows;
      points.push({x,y,head:1-smooth((y-.32)/.18),chest:gaussian(x,y,.5,.57,.36,.23),
        hair:gaussian(x,y,.5,.12,.38,.17),hairEdge:gaussian(x,y,.5,.22,.4,.19)*Math.min(1,Math.abs(x-.5)*4),
        jaw:gaussian(x,y,mouth[0],mouth[1]+.025,.14,.075),hand:gaussian(x,y,.57,.89,.29,.14)});
    }
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const k=j*(cols+1)+i;indices.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1)}
    return {points,indices:new Uint16Array(indices),mouth,person};
  }
  // All fields are smooth, overlapping weights in one connected mesh.
  function deform(m,t,state={},out=new Float32Array(m.points.length*4)) {
    const seed=state.seed??m.person*.79,breath=Math.sin(t*1.42+seed),walk=clamp(state.walk||0),talk=clamp(state.talk||0),cook=clamp(state.cook||0),open=clamp(state.open||0);
    const stride=Math.sin(t*10.5+seed),sway=Math.sin(t*.92+seed)*.012+talk*Math.sin(t*2.7+seed)*.012-walk*stride*.018;
    const hairLag=Math.sin(t*.92+seed-.65)*.004+walk*Math.sin(t*10.5+seed-.7)*.005;
    for(let i=0;i<m.points.length;i++){
      const p=m.points[i];let x=p.x,y=p.y;
      x+=(x-.5)*breath*.007*p.chest;
      y-=breath*(.0038*p.chest+.0022*p.head);
      const dx=p.x-.5,dy=p.y-.42,angle=sway*p.head;
      x+=dx*(Math.cos(angle)-1)-dy*Math.sin(angle)*1.3333;
      y+=dx*Math.sin(angle)*.75+dy*(Math.cos(angle)-1);
      x+=hairLag*p.hairEdge+Math.sin(t*1.65+seed-.5)*.002*p.hair;
      y+=Math.sin(t*1.1+seed-.9)*.0017*p.hairEdge;
      y+=open*talk*.008*p.jaw;
      x+=(p.x-m.mouth[0])*open*talk*.025*p.jaw;
      x+=walk*stride*.005*(1-p.head);y+=walk*Math.cos(t*21+seed)*.003*(1-p.y);
      x+=cook*Math.sin(t*4+seed)*.005*p.hand;y+=cook*Math.cos(t*4+seed)*.004*p.hand;
      y+=talk*Math.sin(t*3.2+seed)*.0015*p.head;
      out[i*4]=x;out[i*4+1]=y;out[i*4+2]=p.x;out[i*4+3]=p.y;
    }
    return out;
  }
  const vowels=[0,1,0,1,0,1,0,1,2,2,1,2,2,2,2,1,1,2,3,3,1];
  const forms=[[.042,.016,.28],[.048,.009,.18],[.026,.021,.85],[.040,.004,.12],[.034,.0015,0]];
  function syllables(text) {
    let end=0;return Array.from((text||'어서 와요.')+' ').map(c=>{const n=c.charCodeAt(0),pause=/[\s.,!?…·]/.test(c),duration=pause?.14:.16+(n%3)*.018;end+=duration;return{end,duration,form:pause?4:n>=0xac00&&n<=0xd7a3?vowels[Math.floor((n-0xac00)/28)%21]:n%4}});
  }
  function mouthShape(t,script) {
    const entry=script.findIndex(s=>t<s.end);if(t<0||entry<0)return {width:.034,height:.0015,round:0,active:false};
    const s=script[entry],a=forms[entry?script[entry-1].form:4],b=forms[s.form],k=smooth((t-(s.end-s.duration))/(s.duration*.65));
    return {width:a[0]+(b[0]-a[0])*k,height:a[1]+(b[1]-a[1])*k,round:a[2]+(b[2]-a[2])*k,active:true};
  }
  const api={mesh,deform,syllables,mouthShape,portrait};
  if(typeof module!=='undefined'){module.exports=api;return;}
  window.MidnightMorph=api;
  const images={};for(const [key,file] of Object.entries({owner:'characters-animated.webp',a:'visitors-a.webp',b:'visitors-b.webp'})){const image=new Image();image.src=new URL(`./assets/${file}`,document.currentScript.src).href;images[key]=image;}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const records=new Map();let gl,program,vertex,index,textures={},locations={},ready=false,last=0,frameCount=0,failures=0;
  const surface=document.createElement('canvas');surface.width=240;surface.height=320;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  function init(){
    gl=surface.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:true,preserveDrawingBuffer:true});if(!gl)return;
    program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,`attribute vec2 position;attribute vec2 source;varying vec2 uv;void main(){uv=source;gl_Position=vec4(position.x*2.-1.,1.-position.y*2.,0.,1.);}`));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec2 uv;uniform sampler2D atlas;uniform vec2 tile;uniform float rows;uniform vec2 mouth;uniform vec3 shape;uniform float speech;uniform float smile;
      vec4 sampleArt(vec2 p){return texture2D(atlas,(tile+clamp(p,vec2(.001),vec2(.999)))/vec2(4.,rows));}
      void main(){vec4 color=sampleArt(uv);vec2 d=uv-mouth;float patch=1.-smoothstep(.78,1.,length(d/vec2(.061,.023)));
        vec3 skin=(sampleArt(mouth+vec2(-.068,-.006)).rgb+sampleArt(mouth+vec2(.068,-.006)).rgb)*.5;
        color.rgb=mix(color.rgb,skin,patch*speech);
        float curve=smile*(pow(d.x/max(shape.x,.001),2.)-.5)*.006;
        vec2 p=vec2(d.x/shape.x,(d.y-curve)/shape.y);float edge=length(p);float opening=1.-smoothstep(.87,1.08,edge);
        vec3 inner=mix(vec3(.31,.16,.12),vec3(.58,.27,.22),smoothstep(.12,.8,p.y));
        float teeth=(1.-smoothstep(-.45,-.22,p.y))*smoothstep(-.85,-.62,p.y)*(1.-shape.z)*smoothstep(.006,.012,shape.y);
        inner=mix(inner,vec3(.96,.87,.70),teeth*.85);
        color.rgb=mix(color.rgb,inner,opening*speech);gl_FragColor=color;}`));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    vertex=gl.createBuffer();index=gl.createBuffer();
    for(const [key,image]of Object.entries(images)){
      const texture=gl.createTexture();textures[key]=texture;gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
      for(const [p,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,p,v);
    }
    for(const name of ['tile','rows','mouth','shape','speech','smile'])locations[name]=gl.getUniformLocation(program,name);
    gl.bindBuffer(gl.ARRAY_BUFFER,vertex);for(const [name,offset] of [['position',0],['source',8]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,16,offset);}
    gl.viewport(0,0,240,320);gl.clearColor(0,0,0,0);ready=true;
  }
  const uniform=name=>locations[name];
  function attach(){for(const el of document.querySelectorAll('.actor[data-person]'))if(!records.has(el)){
    const canvas=el.querySelector('.actor-morph');if(!canvas)continue;canvas.width=240;canvas.height=320;
    const ctx=canvas.getContext('2d');if(!ctx)continue;const m=mesh(Number(el.dataset.person));
    records.set(el,{el,canvas,ctx,m,vertices:new Float32Array(m.points.length*4),talk:0,walk:0,cook:0,seed:m.person*.79+records.size*.37,token:null,started:0,ownerX:null});
  }}
  let dirty=true;new MutationObserver(()=>dirty=true).observe(document.documentElement,{childList:true,subtree:true});
  function frame(now){requestAnimationFrame(frame);if(!ready||document.hidden||now-last<1000/30)return;const dt=Math.min(.08,(now-last)/1000||.033);last=now;
    if(dirty){attach();dirty=false;}
    const ease=1-Math.exp(-dt*9);
    try{for(const [el,r]of records){if(!el.isConnected){records.delete(el);continue;}if(!el.getClientRects().length)continue;
      if(reduced.matches&&el.classList.contains('morph-ready'))continue;
      const owner=el.closest('#owner'),customer=el.closest('.customer'),speaker=el.closest('.talking');
      const source=owner||customer||el.closest('.guest-profile,.conversation-cast')||el.parentElement;
      const text=el.dataset.speech||source.dataset.speech||source.querySelector('.guest-line,.ambient-line')?.textContent||'어서 와요. 따뜻할 때 드세요.';
      const token=speaker?`${source.dataset.speechEpoch||''}:${text}`:null;
      if(token!==r.token){r.token=token;r.started=now;r.script=syllables(text);}
      const form=mouthShape((now-r.started)/1000,r.script||[]),target=speaker&&form.active&&!reduced.matches?1:0;
      r.talk+=(target-r.talk)*ease;r.cook+=((el.closest('.cooking')?1:0)-r.cook)*ease;
      let walking=customer?.classList.contains('arriving')?1:0;
      if(owner){const x=owner.offsetLeft;if(r.ownerX!==null)walking=clamp(Math.abs(x-r.ownerX)/Math.max(dt,1e-3)/65);r.ownerX=x;}
      r.walk+=(walking-r.walk)*ease;
      const t=reduced.matches?0:now/1000;deform(r.m,t,{seed:r.seed,talk:r.talk,walk:r.walk,cook:r.cook,open:form.height/.021},r.vertices);
      gl.bindBuffer(gl.ARRAY_BUFFER,vertex);gl.bufferData(gl.ARRAY_BUFFER,r.vertices,gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,r.m.indices,gl.STATIC_DRAW);
      const art=portrait(r.m.person);gl.bindTexture(gl.TEXTURE_2D,textures[art.sheet]);gl.uniform2f(uniform('tile'),art.tile%4,Math.floor(art.tile/4));gl.uniform1f(uniform('rows'),art.rows);gl.uniform2f(uniform('mouth'),...r.m.mouth);gl.uniform3f(uniform('shape'),form.width,form.height,form.round);gl.uniform1f(uniform('speech'),r.talk);gl.uniform1f(uniform('smile'),el.closest('.disappointed')||owner?.dataset.mood==='concerned'?-1:1);
      gl.clear(gl.COLOR_BUFFER_BIT);gl.drawElements(gl.TRIANGLES,r.m.indices.length,gl.UNSIGNED_SHORT,0);
      if(gl.isContextLost())throw new Error('context lost');
      r.ctx.clearRect(0,0,240,320);r.ctx.drawImage(surface,0,0);el.classList.add('morph-ready');r.canvas.dataset.motion=r.walk>.1?'walk':r.cook>.1?'cook':r.talk>.1?'talk':'idle';
    }frameCount++;}catch{failures++;ready=false;for(const el of records.keys())el.classList.remove('morph-ready');}
  }
  api.status=()=>({ready,frames:frameCount,failures,actors:records.size});
  Promise.all(Object.values(images).map(image=>image.decode())).then(()=>{try{init()}catch{failures++}requestAnimationFrame(frame)}).catch(()=>{failures++});
  surface.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;for(const el of records.keys())el.classList.remove('morph-ready');});
  surface.addEventListener('webglcontextrestored',()=>{try{init()}catch{failures++}});
})();
