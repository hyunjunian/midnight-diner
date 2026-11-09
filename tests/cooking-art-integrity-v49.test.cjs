const {test}=require('node:test');
const assert=require('node:assert/strict');
const sharp=require('sharp');
const path=require('node:path');
const asset=f=>path.join(__dirname,'../docs/assets',f);
test('rice grip keeps opaque skin through the previously broken fingers and palm',async()=>{
 const {data,info}=await sharp(asset('rice-right-hand-v48.webp')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(const [x,y] of [[450,370],[470,380],[490,390],[480,400],[470,410],[410,420],[480,430],[500,440],[420,470],[420,490],[420,510],[440,520]])assert.ok(data[(y*info.width+x)*4+3]>=245,`skin hole at ${x},${y}`);
});
test('cabbage handle has clear atlas margins around its complete end',async()=>{
 const {data,info}=await sharp(asset('portrait-v28-plate-cabbage_stir.webp')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let n=0;n<4;n++)for(let y=570;y<744;y++){const p=((Math.floor(n/2)*768+y)*info.width+n%2*512)*4;assert.equal(data[p+3],0,`handle crosses the atlas seam at frame ${n}, row ${y}`)}
});
