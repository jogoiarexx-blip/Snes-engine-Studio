(function(){
'use strict';
function init(){const A=window.SNESStudio;if(!A)return;const bar=document.getElementById('toolbar'),canvas=document.getElementById('editor');
 const group=document.createElement('span');group.className='v4tools';group.innerHTML='<select id="v4layer" title="Camada"><option value="background">Fundo</option><option value="ground" selected>Terreno</option><option value="foreground">Frente</option></select><button id="v4auto" title="Cria superfícies e miolo automaticamente">Auto-tile</button><button id="v4fill" title="Preencher área">▧ Balde</button><button id="v4select" title="Selecionar região">▣ Seleção</button><button id="v4copy">Copiar</button><button id="v4paste">Colar</button><button id="v4minus">−</button><span id="v4zoom">100%</span><button id="v4plus">＋</button>';
 bar.insertBefore(group,bar.querySelector('.spacer'));
 let active='ground',zoom=1,mode='paint',start=null,selection=null,clip=null;
 function setupScene(){const s=A.scene();if(!s.layers)s.layers={background:A.blankMap(),ground:s.map,foreground:A.blankMap()};if(s.map!==s.layers[active])s.map=s.layers[active]}
 setupScene();
 document.getElementById('v4layer').onchange=e=>{const s=A.scene();setupScene();s.layers[active]=s.map;active=e.target.value;s.map=s.layers[active];A.renderAll();A.toast('Camada: '+e.target.options[e.target.selectedIndex].text)};
 function fit(){canvas.style.width=Math.round(Math.min(innerWidth*.72,960)*zoom)+'px';document.getElementById('v4zoom').textContent=Math.round(zoom*100)+'%'}
 document.getElementById('v4minus').onclick=()=>{zoom=Math.max(.5,zoom-.25);fit()};document.getElementById('v4plus').onclick=()=>{zoom=Math.min(3,zoom+.25);fit()};
 document.getElementById('v4fill').onclick=()=>{setupScene();const m=A.scene().map,from=m[0][0],to=A.selectedTile;if(from===to)return;A.pushHistory();const q=[[0,0]],seen=new Set;while(q.length){const [x,y]=q.pop(),k=x+','+y;if(x<0||y<0||x>=32||y>=18||seen.has(k)||m[y][x]!==from)continue;seen.add(k);m[y][x]=to;q.push([x+1,y],[x-1,y],[x,y+1],[x,y-1])}A.drawGrid();A.toast('Área preenchida')};
 document.getElementById('v4auto').onclick=()=>{setupScene();const m=A.scene().map;A.pushHistory();for(let y=0;y<18;y++)for(let x=0;x<32;x++)if(m[y][x]!==0)m[y][x]=(y===0||m[y-1][x]===0)?1:2;A.drawGrid();A.toast('Auto-tile aplicado: superfície e preenchimento')};
 document.getElementById('v4select').onclick=()=>{mode=mode==='select'?'paint':'select';document.getElementById('v4select').classList.toggle('active',mode==='select');A.toast(mode==='select'?'Arraste no mapa para selecionar':'Pincel ativado')};
 function pos(e){const r=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(31,Math.floor((e.clientX-r.left)*512/r.width/16))),y:Math.max(0,Math.min(17,Math.floor((e.clientY-r.top)*288/r.height/16)))}}
 canvas.addEventListener('mousedown',e=>{if(mode!=='select'||A.playing)return;e.stopImmediatePropagation();start=pos(e)},true);
 canvas.addEventListener('mouseup',e=>{if(mode!=='select'||!start)return;e.stopImmediatePropagation();const p=pos(e);selection={x1:Math.min(start.x,p.x),y1:Math.min(start.y,p.y),x2:Math.max(start.x,p.x),y2:Math.max(start.y,p.y)};start=null;A.toast('Seleção '+(selection.x2-selection.x1+1)+'×'+(selection.y2-selection.y1+1))},true);
 document.getElementById('v4copy').onclick=()=>{if(!selection)return A.toast('Faça uma seleção primeiro');const m=A.scene().map;clip=[];for(let y=selection.y1;y<=selection.y2;y++)clip.push(m[y].slice(selection.x1,selection.x2+1));A.toast('Seleção copiada')};
 document.getElementById('v4paste').onclick=()=>{if(!clip)return A.toast('Nada copiado');const x=selection?selection.x1:0,y=selection?selection.y1:0,m=A.scene().map;A.pushHistory();clip.forEach((r,dy)=>r.forEach((v,dx)=>{if(m[y+dy]&&m[y+dy][x+dx]!=null)m[y+dy][x+dx]=v}));A.drawGrid();A.toast('Seleção colada')};
 const oldRender=A.renderAll;A.renderAll=function(){setupScene();oldRender();};
 document.addEventListener('click',e=>{if(['playBtn','exportBtn','exportSnesBtn'].includes(e.target.id)){setupScene();A.scene().layers[active]=A.scene().map;active='ground';A.scene().map=A.scene().layers.ground;document.getElementById('v4layer').value='ground'}else queueMicrotask(setupScene)},true);
}
window.addEventListener('snesstudio:ready',init);if(window.SNESStudio)init();
})();
