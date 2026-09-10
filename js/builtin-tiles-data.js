/** Built-in tile packs. Editor loads real asset files; standalone export may inline on demand. */
(function(g){'use strict';
const DATA={terrain_pack:'assets/terrain-tiles-pack.png',platform_pack:'assets/platform-tiles-pack.png'},cache={};
function image(id){if(cache[id])return cache[id];const src=DATA[id];if(!src)return null;const im=new Image();im.onload=()=>{try{g.SNESStudio?.drawGrid?.();g.SNESStudio?.renderRight?.()}catch(_){}};im.src=src;cache[id]=im;return im}
function draw(ctx,tile,x,y,size){if(!tile||!tile.sheet||!tile.src)return false;const im=image(tile.sheet);if(!im||!im.complete||!im.naturalWidth)return false;const r=tile.src;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(im,r[0],r[1],r[2],r[3],x,y,size,size);ctx.restore();return true}
async function inlineAll(){for(const id of Object.keys(DATA)){const im=image(id);if(!im.complete||!im.naturalWidth)await new Promise((res,rej)=>{im.addEventListener('load',res,{once:true});im.addEventListener('error',rej,{once:true})});if(String(DATA[id]).startsWith('data:'))continue;const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);DATA[id]=c.toDataURL('image/png')}return DATA}
g.SNES_BUILTIN_TILE_SHEETS=DATA;g.SNESBuiltinTiles={image,draw,inlineAll};
})(typeof window!=='undefined'?window:globalThis);
