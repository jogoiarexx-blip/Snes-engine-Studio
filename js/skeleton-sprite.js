(function(){'use strict';
const img=new Image();img.onload=()=>window.SNESStudio?.drawGrid();img.src=window.SKELETON_SHEET_DATA||'assets/skeleton.png';
const clips={
 idle:[[0,43,160,182],[155,43,160,182],[310,43,160,182],[465,43,162,182]],
 walk:[[646,43,142,184],[790,43,150,184],[942,43,150,184],[1092,43,150,184],[1237,43,148,184],[1380,43,156,184]],
 run:[[5,278,140,185],[145,278,145,185],[289,278,148,185],[434,278,145,185],[577,278,148,185],[720,278,145,185]],
 attack:[[810,278,140,190],[940,278,145,190],[1068,278,160,190],[1200,278,165,190],[1330,278,155,190],[1430,278,106,190]],
 hurt:[[8,522,135,180],[139,522,138,180],[274,522,137,180]],
 death:[[413,518,140,185],[548,518,140,185],[680,518,142,185],[814,518,145,185],[950,518,142,185],[1088,518,145,185],[1225,518,150,185],[1365,518,170,185]]
};
const rates={idle:5,walk:9,run:12,attack:13,hurt:9,death:8};
function state(e){if(e.dead)return'death';if(e.hurtUntil>Date.now())return'hurt';if(e.attackUntil>Date.now())return'attack';if(Math.abs(e.vx||0)>55)return'run';if(Math.abs(e.vx||0)>2)return'walk';return'idle'}
function draw(c,e){if(!img.complete||!img.naturalWidth){c.fillStyle='#b8a477';c.fillRect(e.x,e.y-30,22,46);return}const st=state(e),arr=clips[st],elapsed=e.animStarted?performance.now()-e.animStarted:performance.now(),i=st==='death'?Math.min(arr.length-1,Math.floor(elapsed/120)):Math.floor(elapsed/(1000/rates[st]))%arr.length,f=arr[i];c.save();c.imageSmoothingEnabled=false;const flip=e.facing==='left',dw=52,dh=64,dx=e.x-17,dy=e.y-48;if(flip){c.translate(dx+dw,0);c.scale(-1,1);c.drawImage(img,...f,0,dy,dw,dh)}else c.drawImage(img,...f,dx,dy,dw,dh);c.restore()}
async function dataURL(){if(window.SKELETON_SHEET_DATA)return window.SKELETON_SHEET_DATA;const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);return c.toDataURL('image/png')}
async function exportHTML(base){const src=await dataURL(),defs=JSON.stringify(clips),needle='function drawEntityAt(c,e){if(e.type==="enemy"){';const replacement='const SKIMG=new Image();SKIMG.src='+JSON.stringify(src)+';const SKCLIPS='+defs+';function drawEntityAt(c,e){if(e.type==="enemy"&&e.sprite==="skeleton"){const a=SKCLIPS.idle,f=a[Math.floor(performance.now()/180)%a.length];c.imageSmoothingEnabled=false;c.drawImage(SKIMG,f[0],f[1],f[2],f[3],e.x-17,e.y-48,52,64)}else if(e.type==="enemy"){';return base.replace(needle,replacement)}
window.SkeletonSprite={draw,clips,img,exportHTML};
const exportBtn=document.getElementById('exportBtn');exportBtn.onclick=async()=>{const A=window.SNESStudio;exportBtn.disabled=true;try{const html=await exportHTML(A.buildExport());A.downloadFile((A.project.name||'meu-jogo').replace(/[^a-z0-9-_]+/gi,'_')+'.html',html,'text/html');A.toast('Jogo HTML exportado com sprites')}catch(e){A.toast('Falha ao incorporar sprite: '+e.message)}finally{exportBtn.disabled=false}};
})();
