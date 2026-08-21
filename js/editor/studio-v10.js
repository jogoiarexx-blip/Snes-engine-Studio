/**
 * SNES Engine Studio 1.0 Workspace Extension
 * Non-destructive editor upgrade: assets, prefabs, visual events, camera,
 * parallax, animation, particles/lighting, boss designer and debug overlays.
 */
(()=>{
'use strict';
const $=(q,r=document)=>r.querySelector(q);
const $$=(q,r=document)=>[...r.querySelectorAll(q)];
const uid=(p='id')=>p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
const clone=o=>JSON.parse(JSON.stringify(o));
let A=null, activeTab='assets', simpleMode=false, objectURLs=[];

function studio(){
 const p=A.project;
 p.studio=p.studio||{};
 const s=p.studio;
 s.version='1.0';
 s.assets=s.assets||[];
 s.prefabs=s.prefabs||defaultPrefabs();
 s.events=s.events||[];
 s.animations=s.animations||[];
 s.parallax=s.parallax||[
  {id:uid('px'),name:'Céu',speedX:.05,speedY:.02,visible:true},
  {id:uid('px'),name:'Fundo distante',speedX:.2,speedY:.05,visible:true},
  {id:uid('px'),name:'Foreground',speedX:1.15,speedY:1,visible:true}
 ];
 s.camera=Object.assign({mode:'follow',smooth:.15,lookAhead:80,deadZone:24,pixelPerfect:true,shake:true},s.camera||{});
 s.fx=Object.assign({ambient:.85,particlePreset:'none',particleRate:18,weather:'none'},s.fx||{});
 s.debug=Object.assign({hitboxes:false,grid:true,entities:true,triggers:true,chunkBounds:false},s.debug||{});
 s.world=Object.assign({logicalWidth:5000,logicalHeight:650,chunkWidth:512,chunkHeight:288,streaming:true},s.world||{});
 s.bosses=s.bosses||[];
 return s;
}
function defaultPrefabs(){return [
 {id:'pf_coin',name:'Moeda',icon:'🪙',entity:{type:'item',name:'Moeda',hp:1}},
 {id:'pf_heart',name:'Vida',icon:'❤️',entity:{type:'item',name:'Vida',sub:'heart',hp:1}},
 {id:'pf_checkpoint',name:'Checkpoint',icon:'💾',entity:{type:'object',name:'Checkpoint',sub:'checkpoint'}},
 {id:'pf_door',name:'Porta',icon:'🚪',entity:{type:'object',name:'Porta',sub:'door'}},
 {id:'pf_box',name:'Caixa',icon:'📦',entity:{type:'object',name:'Caixa',sub:'caixa'}},
 {id:'pf_enemy',name:'Inimigo',icon:'👾',entity:{type:'enemy',name:'Inimigo',hp:3,speed:45,damage:1}}
]}
function mark(msg){try{A.pushHistory()}catch(e){}; A.setStatus(msg||'Projeto alterado.'); try{A.renderAll()}catch(e){} }
function toast(s){A.toast(s)}

function boot(){
 A=window.SNESStudio;if(!A||$('#studio10Dock'))return;
 document.body.classList.add('studio-v10'); studio();
 modernizeTop(); modernizeNav(); buildDock(); buildOverlay(); bindShortcuts(); renderDock();
 window.addEventListener('resize',updateOverlay);
 window.addEventListener('snesstudio:ready',()=>{studio();renderDock();updateOverlay()});
 const oldDraw=A.drawGrid; if(oldDraw&&!oldDraw.__v10){
  const wrapped=function(){const r=oldDraw.apply(A,arguments);requestAnimationFrame(updateOverlay);return r};wrapped.__v10=true;
  // exported getter isn't writable in some builds; overlay is also updated by polling below
 }
 setInterval(()=>{if(studio().debug.hitboxes||studio().debug.chunkBounds)updateOverlay()},700);
}
function modernizeTop(){
 const top=$('.top'); if(!top)return;
 const logo=$('.logo'); if(logo)logo.innerHTML='<span class="s10-mark">◆</span><span><b>SNES ENGINE</b><small>STUDIO 1.0</small></span>';
 const mode=document.createElement('button'); mode.id='s10Mode';mode.className='s10-mode';mode.textContent='⚙ Avançado';mode.title='Alternar interface simples/avançada';
 mode.onclick=()=>{simpleMode=!simpleMode;document.body.classList.toggle('s10-simple',simpleMode);mode.textContent=simpleMode?'✨ Simples':'⚙ Avançado';};
 const inspect=document.createElement('button');inspect.id='s10Inspect';inspect.className='s10-icon';inspect.textContent='☷';inspect.title='Abrir ferramentas';inspect.onclick=()=>document.body.classList.toggle('s10-dock-open');
 top.append(mode,inspect);
}
function modernizeNav(){
 const left=$('.left');if(!left)return;
 const sec=document.createElement('div');sec.className='section s10-advanced-section';sec.textContent='STUDIO 1.0';
 const names=[['assets','🗂','Assets'],['prefabs','🧩','Prefabs'],['events','⚡','Eventos'],['animation','🎞','Animação'],['world','🌎','Mundo'],['fx','✨','FX / Luz'],['debug','🧪','Debug']];
 left.appendChild(sec);
 names.forEach(([id,ic,n])=>{const b=document.createElement('button');b.className='nav s10-nav s10-advanced';b.innerHTML=`<span class="navIcon">${ic}</span><span class="navLabel">${n}</span>`;b.onclick=()=>{activeTab=id;document.body.classList.add('s10-dock-open');renderDock()};left.appendChild(b)});
}
function buildDock(){
 const d=document.createElement('aside');d.id='studio10Dock';d.className='s10-dock';d.innerHTML=`<div class="s10-dock-head"><div><strong>STUDIO 1.0</strong><small id="s10DockSub">Ferramentas</small></div><button id="s10DockClose">×</button></div><div class="s10-tabs"></div><div id="s10DockBody" class="s10-dock-body"></div>`;
 $('.main').appendChild(d);$('#s10DockClose').onclick=()=>document.body.classList.remove('s10-dock-open');
 const tabs=[['assets','🗂'],['prefabs','🧩'],['events','⚡'],['animation','🎞'],['world','🌎'],['fx','✨'],['debug','🧪']];
 $('.s10-tabs',d).innerHTML=tabs.map(([i,x])=>`<button data-tab="${i}" title="${i}">${x}</button>`).join('');
 $$('.s10-tabs button',d).forEach(b=>b.onclick=()=>{activeTab=b.dataset.tab;renderDock()});
}
function renderDock(){
 if(!A)return;studio(); $$('.s10-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeTab));
 const body=$('#s10DockBody');if(!body)return;
 const labels={assets:'Biblioteca de Assets',prefabs:'Prefabs',events:'Eventos Visuais',animation:'Animações',world:'Mundo & Câmera',fx:'Partículas & Luz',debug:'Debug & Profiler'};
 $('#s10DockSub').textContent=labels[activeTab]||'Ferramentas';
 ({assets:renderAssets,prefabs:renderPrefabs,events:renderEvents,animation:renderAnimation,world:renderWorld,fx:renderFx,debug:renderDebug}[activeTab]||renderAssets)(body);
}
function section(title,content){return `<section class="s10-card"><h3>${title}</h3>${content}</section>`}
function field(label,id,val,type='text',attrs=''){return `<label class="s10-field"><span>${label}</span><input id="${id}" type="${type}" value="${val}" ${attrs}></label>`}
function select(label,id,val,opts){return `<label class="s10-field"><span>${label}</span><select id="${id}">${opts.map(o=>`<option value="${o[0]}" ${o[0]==val?'selected':''}>${o[1]}</option>`).join('')}</select></label>`}

function renderAssets(body){
 const s=studio();
 body.innerHTML=section('Importar',`<div class="s10-drop" id="s10Drop"><b>Solte sprites, backgrounds e áudio aqui</b><small>PNG, JPG, WEBP, GIF, WAV, MP3, OGG, JSON</small><button id="s10Import">＋ Escolher arquivos</button><input id="s10File" type="file" multiple accept="image/*,audio/*,.json" hidden></div>`)+
 section('Biblioteca',`<div class="s10-search"><input id="s10AssetSearch" placeholder="Pesquisar assets..."><select id="s10AssetKind"><option value="">Todos</option><option>image</option><option>audio</option><option>json</option></select></div><div id="s10AssetGrid" class="s10-asset-grid"></div>`)+
 section('Manifest',`<button id="s10Manifest">Gerar assets.json</button><small class="s10-note">Os arquivos importados ficam como referência de projeto. Você pode substituir os sprites depois mantendo os nomes.</small>`);
 const fi=$('#s10File');$('#s10Import').onclick=()=>fi.click();fi.onchange=()=>importFiles(fi.files);
 const drop=$('#s10Drop');['dragenter','dragover'].forEach(e=>drop.addEventListener(e,x=>{x.preventDefault();drop.classList.add('over')}));['dragleave','drop'].forEach(e=>drop.addEventListener(e,x=>{x.preventDefault();drop.classList.remove('over')}));drop.addEventListener('drop',e=>importFiles(e.dataTransfer.files));
 $('#s10AssetSearch').oninput=drawAssets;$('#s10AssetKind').onchange=drawAssets;$('#s10Manifest').onclick=downloadManifest;drawAssets();
}
function importFiles(files){
 const s=studio(); [...files].forEach(f=>{const kind=f.type.startsWith('image')?'image':f.type.startsWith('audio')?'audio':'json';const url=URL.createObjectURL(f);objectURLs.push(url);s.assets.push({id:uid('asset'),name:f.name,kind,size:f.size,type:f.type,url,placeholder:false,importedAt:Date.now()})});toast(files.length+' asset(s) importado(s)');drawAssets();
}
function drawAssets(){
 const grid=$('#s10AssetGrid');if(!grid)return;const q=($('#s10AssetSearch')?.value||'').toLowerCase(),k=$('#s10AssetKind')?.value||'';
 const arr=studio().assets.filter(a=>(!k||a.kind===k)&&(!q||a.name.toLowerCase().includes(q)));
 grid.innerHTML=arr.length?arr.map(a=>`<div class="s10-asset" data-id="${a.id}"><div class="s10-thumb">${a.kind==='image'&&a.url?`<img src="${a.url}">`:a.kind==='audio'?'♫':'{}'}</div><b title="${a.name}">${a.name}</b><small>${a.kind} · ${Math.max(1,Math.round((a.size||0)/1024))} KB</small><button class="s10-del">×</button></div>`).join(''):'<div class="s10-empty">Nenhum asset ainda. Importe depois seus sprites e backgrounds.</div>';
 $$('.s10-del',grid).forEach(b=>b.onclick=e=>{const id=e.target.closest('.s10-asset').dataset.id;studio().assets=studio().assets.filter(a=>a.id!==id);drawAssets()});
}
function downloadManifest(){const s=studio();const out={version:1,assets:s.assets.map(({url,...a})=>a),generatedAt:new Date().toISOString()};A.downloadFile('assets.json',JSON.stringify(out,null,2),'application/json');}

function renderPrefabs(body){
 const s=studio();body.innerHTML=section('Biblioteca de Prefabs',`<div id="s10PrefabGrid" class="s10-prefab-grid">${s.prefabs.map(p=>`<button data-id="${p.id}"><span>${p.icon||'🧩'}</span><b>${p.name}</b></button>`).join('')}</div><div class="s10-actions"><button id="s10PrefabFromSel">＋ Do selecionado</button><button id="s10PrefabJSON">Exportar JSON</button></div>`)+section('Como usar','<small class="s10-note">Clique em um prefab para adicioná-lo no centro da cena. Depois ajuste posição e propriedades no inspetor normal.</small>');
 $$('#s10PrefabGrid button').forEach(b=>b.onclick=()=>placePrefab(b.dataset.id));$('#s10PrefabFromSel').onclick=saveSelectedAsPrefab;$('#s10PrefabJSON').onclick=()=>A.downloadFile('prefabs.json',JSON.stringify(s.prefabs,null,2),'application/json');
}
function placePrefab(id){const p=studio().prefabs.find(x=>x.id===id);if(!p)return;const e=Object.assign({id:uid('e'),x:256,y:144},clone(p.entity));A.pushHistory();A.scene().entities=A.scene().entities||[];A.scene().entities.push(e);A.selectedEntity=e.id;A.renderAll();toast(p.name+' adicionado');}
function saveSelectedAsPrefab(){const e=(A.scene().entities||[]).find(x=>x.id===A.selectedEntity);if(!e)return toast('Selecione uma entidade primeiro');const name=prompt('Nome do prefab:',e.name||e.type||'Prefab');if(!name)return;const cp=clone(e);delete cp.id;delete cp.x;delete cp.y;studio().prefabs.push({id:uid('pf'),name,icon:'🧩',entity:cp});renderDock();toast('Prefab criado');}

function renderEvents(body){
 const s=studio();body.innerHTML=section('Novo evento',`${select('Quando','s10EvWhen','enter',[['enter','Player entra na área'],['interact','Interagir'],['enemyDead','Inimigo/Boss morrer'],['collect','Coletar item'],['sceneStart','Cena iniciar']])}${select('Ação','s10EvAction','dialog',[['dialog','Mostrar diálogo'],['door','Abrir porta'],['sound','Tocar som'],['scene','Trocar cena'],['flag','Definir variável'],['camera','Mover câmera'],['spawn','Criar entidade']])}${field('Valor','s10EvValue','')}<button id="s10EvAdd" class="s10-primary">＋ Criar evento</button>`)+section('Fluxo da cena',`<div id="s10EventFlow" class="s10-flow">${s.events.length?s.events.map((e,i)=>`<div class="s10-flow-row" data-id="${e.id}"><span class="node when">${i+1}. ${e.when}</span><i>→</i><span class="node action">${e.action}${e.value?' · '+e.value:''}</span><button>×</button></div>`).join(''):'<div class="s10-empty">Sem eventos. Crie regras sem escrever JavaScript.</div>'}</div>`);
 $('#s10EvAdd').onclick=()=>{s.events.push({id:uid('ev'),sceneId:A.scene().id,when:$('#s10EvWhen').value,conditions:[],action:$('#s10EvAction').value,value:$('#s10EvValue').value});mark('Evento criado');renderDock()};$$('.s10-flow-row>button').forEach(b=>b.onclick=()=>{s.events=s.events.filter(e=>e.id!==b.parentElement.dataset.id);renderDock()});
}

function renderAnimation(body){
 const s=studio();body.innerHTML=section('Editor de animação',`${field('Nome','s10AnimName','Walk')}${field('FPS','s10AnimFps',8,'number','min="1" max="60"')}${field('Frames','s10AnimFrames','0,1,2,3')}<label class="s10-check"><input id="s10AnimLoop" type="checkbox" checked> Loop</label><button id="s10AnimAdd" class="s10-primary">＋ Salvar animação</button>`)+section('Timeline',`<div class="s10-timeline">${s.animations.length?s.animations.map(a=>`<div class="s10-anim" data-id="${a.id}"><b>${a.name}</b><div>${a.frames.map(f=>`<span>${f}</span>`).join('')}</div><small>${a.fps} FPS · ${a.loop?'loop':'1x'}</small><button>×</button></div>`).join(''):'<div class="s10-empty">As animações ficam preparadas para seus sprites futuros.</div>'}</div>`);
 $('#s10AnimAdd').onclick=()=>{const frames=$('#s10AnimFrames').value.split(',').map(x=>parseInt(x.trim())).filter(Number.isFinite);s.animations.push({id:uid('anim'),name:$('#s10AnimName').value||'Anim',fps:+$('#s10AnimFps').value||8,frames,loop:$('#s10AnimLoop').checked});renderDock();toast('Animação salva')};$$('.s10-anim>button').forEach(b=>b.onclick=()=>{s.animations=s.animations.filter(a=>a.id!==b.parentElement.dataset.id);renderDock()});
}

function renderWorld(body){
 const s=studio(),w=s.world,c=s.camera,p=s.parallax;
 body.innerHTML=section('Mapa grande / streaming',`${field('Largura lógica','s10WorldW',w.logicalWidth,'number','min="512" step="16"')}${field('Altura lógica','s10WorldH',w.logicalHeight,'number','min="288" step="16"')}${field('Chunk W','s10ChunkW',w.chunkWidth,'number','min="128" step="16"')}${field('Chunk H','s10ChunkH',w.chunkHeight,'number','min="128" step="16"')}<label class="s10-check"><input id="s10Streaming" type="checkbox" ${w.streaming?'checked':''}> Streaming por chunks</label><button id="s10WorldApply" class="s10-primary">Aplicar configuração</button><div class="s10-world-stat" id="s10WorldStat"></div>`)+
 section('Câmera',`${select('Modo','s10CamMode',c.mode,[['follow','Seguir Player'],['fixed','Fixa'],['cinematic','Cinemática']])}${field('Suavização','s10CamSmooth',c.smooth,'number','min="0" max="1" step="0.05"')}${field('Look ahead','s10CamLook',c.lookAhead,'number','min="0"')}${field('Dead zone','s10CamDead',c.deadZone,'number','min="0"')}<label class="s10-check"><input id="s10Pixel" type="checkbox" ${c.pixelPerfect?'checked':''}> Pixel perfect</label><label class="s10-check"><input id="s10Shake" type="checkbox" ${c.shake?'checked':''}> Camera shake</label>`)+
 section('Parallax',`<div id="s10Parallax">${p.map(x=>`<div class="s10-parallax" data-id="${x.id}"><input class="pn" value="${x.name}"><label>X <input class="px" type="number" step="0.05" value="${x.speedX}"></label><label>Y <input class="py" type="number" step="0.05" value="${x.speedY}"></label><button>×</button></div>`).join('')}</div><button id="s10PxAdd">＋ Camada</button>`);
 const updateStat=()=>{const cw=Math.ceil((+$('#s10WorldW').value||512)/(+$('#s10ChunkW').value||512)),ch=Math.ceil((+$('#s10WorldH').value||288)/(+$('#s10ChunkH').value||288));$('#s10WorldStat').textContent=`${cw} × ${ch} = ${cw*ch} chunks lógicos`;};['s10WorldW','s10WorldH','s10ChunkW','s10ChunkH'].forEach(id=>$('#'+id).oninput=updateStat);updateStat();
 $('#s10WorldApply').onclick=()=>{Object.assign(w,{logicalWidth:+$('#s10WorldW').value,logicalHeight:+$('#s10WorldH').value,chunkWidth:+$('#s10ChunkW').value,chunkHeight:+$('#s10ChunkH').value,streaming:$('#s10Streaming').checked});toast('Mundo configurado para streaming');updateOverlay()};
 ['s10CamMode','s10CamSmooth','s10CamLook','s10CamDead','s10Pixel','s10Shake'].forEach(id=>$('#'+id).onchange=()=>{Object.assign(c,{mode:$('#s10CamMode').value,smooth:+$('#s10CamSmooth').value,lookAhead:+$('#s10CamLook').value,deadZone:+$('#s10CamDead').value,pixelPerfect:$('#s10Pixel').checked,shake:$('#s10Shake').checked})});
 $('#s10PxAdd').onclick=()=>{p.push({id:uid('px'),name:'Nova camada',speedX:.5,speedY:.2,visible:true});renderDock()};$$('.s10-parallax').forEach(row=>{const x=p.find(a=>a.id===row.dataset.id);$('.pn',row).onchange=e=>x.name=e.target.value;$('.px',row).onchange=e=>x.speedX=+e.target.value;$('.py',row).onchange=e=>x.speedY=+e.target.value;$('button',row).onclick=()=>{s.parallax=s.parallax.filter(a=>a.id!==x.id);renderDock()}});
}

function renderFx(body){
 const s=studio(),f=s.fx;
 body.innerHTML=section('Iluminação',`${field('Luz ambiente','s10Ambient',f.ambient,'range','min="0" max="1" step="0.05"')}<div class="s10-value" id="s10AmbientVal">${Math.round(f.ambient*100)}%</div><button id="s10LightPreview">Pré-visualizar luz</button>`)+section('Partículas',`${select('Preset','s10Particle',f.particlePreset,[['none','Nenhum'],['dust','Poeira'],['leaves','Folhas'],['rain','Chuva'],['snow','Neve'],['fire','Fogo'],['spark','Faíscas'],['smoke','Fumaça']])}${field('Quantidade','s10Rate',f.particleRate,'range','min="1" max="100"')}<button id="s10FxPreview" class="s10-primary">▶ Pré-visualizar</button>`)+section('Boss Designer',`<button id="s10BossAdd">＋ Novo boss de 3 fases</button><div id="s10BossList">${s.bosses.map(b=>`<div class="s10-boss"><b>👑 ${b.name}</b><small>F1 100–70% · F2 70–30% · F3 30–0%</small></div>`).join('')}</div>`);
 $('#s10Ambient').oninput=e=>{$('#s10AmbientVal').textContent=Math.round(e.target.value*100)+'%';f.ambient=+e.target.value;applyLight(true)};$('#s10Particle').onchange=e=>f.particlePreset=e.target.value;$('#s10Rate').oninput=e=>f.particleRate=+e.target.value;$('#s10LightPreview').onclick=()=>applyLight();$('#s10FxPreview').onclick=particlePreview;$('#s10BossAdd').onclick=()=>{const name=prompt('Nome do boss:','Boss');if(!name)return;s.bosses.push({id:uid('boss'),name,phases:[{from:100,to:70,attacks:['ataque 1']},{from:70,to:30,attacks:['ataque 2','dash']},{from:30,to:0,attacks:['especial','invocação']}]});renderDock()};
}
function applyLight(live=false){const ov=$('#s10LightOverlay');if(!ov)return;const a=studio().fx.ambient;ov.style.background=`rgba(0,0,0,${Math.max(0,1-a)*.78})`;ov.classList.add('show');if(!live)setTimeout(()=>ov.classList.remove('show'),1800)}
function particlePreview(){const wrap=$('.canvas-wrap');if(!wrap)return;const layer=$('#s10Particles');layer.innerHTML='';const f=studio().fx;const count=Math.min(100,f.particleRate);for(let i=0;i<count;i++){const p=document.createElement('i');p.textContent=f.particlePreset==='leaves'?'◆':f.particlePreset==='snow'?'•':f.particlePreset==='rain'?'│':f.particlePreset==='fire'?'✦':'·';p.style.left=Math.random()*100+'%';p.style.top=Math.random()*100+'%';p.style.animationDelay=(Math.random()*.8)+'s';layer.appendChild(p)}layer.classList.add('show');setTimeout(()=>layer.classList.remove('show'),2200)}

function renderDebug(body){
 const d=studio().debug;const ents=A.scene().entities||[];
 body.innerHTML=section('Visualização',`<label class="s10-check"><input id="s10Hit" type="checkbox" ${d.hitboxes?'checked':''}> Mostrar hitboxes</label><label class="s10-check"><input id="s10Chunk" type="checkbox" ${d.chunkBounds?'checked':''}> Limites de chunks</label><label class="s10-check"><input id="s10Trig" type="checkbox" ${d.triggers?'checked':''}> Triggers</label>`)+section('Cena atual',`<div class="s10-metrics"><div><b>${ents.length}</b><small>entidades</small></div><div><b>${(A.scene().layers?Object.keys(A.scene().layers).length:1)}</b><small>camadas</small></div><div><b>${studio().events.filter(e=>e.sceneId===A.scene().id).length}</b><small>eventos</small></div><div><b>${studio().assets.length}</b><small>assets</small></div></div>`)+section('Validação',`<button id="s10Validate" class="s10-primary">✓ Validar projeto</button><div id="s10Validation" class="s10-validation"></div>`)+section('Ferramentas',`<button id="s10ExportStudio">Exportar Studio Data</button> <button id="s10Clean">Limpar referências quebradas</button>`);
 $('#s10Hit').onchange=e=>{d.hitboxes=e.target.checked;updateOverlay()};$('#s10Chunk').onchange=e=>{d.chunkBounds=e.target.checked;updateOverlay()};$('#s10Trig').onchange=e=>{d.triggers=e.target.checked;updateOverlay()};$('#s10Validate').onclick=validateProject;$('#s10ExportStudio').onclick=()=>A.downloadFile('studio-data.json',JSON.stringify(studio(),null,2),'application/json');$('#s10Clean').onclick=()=>{studio().events=studio().events.filter(e=>A.project.scenes.some(s=>s.id===e.sceneId));toast('Referências verificadas');validateProject()};
}
function validateProject(){const p=A.project,issues=[];if(!p.name?.trim())issues.push('Projeto sem nome');if(!p.scenes?.length)issues.push('Nenhuma cena');p.scenes?.forEach(s=>{if(!s.entities?.some(e=>e.type==='player'))issues.push(`${s.name}: sem Player`);const ids=(s.entities||[]).map(e=>e.id);if(new Set(ids).size!==ids.length)issues.push(`${s.name}: IDs duplicados`)});studio().events.forEach(e=>{if(!p.scenes.some(s=>s.id===e.sceneId))issues.push('Evento aponta para cena inexistente')});const el=$('#s10Validation');el.innerHTML=issues.length?issues.map(x=>`<div class="bad">⚠ ${x}</div>`).join(''):'<div class="good">✓ Estrutura principal válida</div>';}

function buildOverlay(){const wrap=$('.canvas-wrap');if(!wrap)return;wrap.style.position='relative';const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='s10DebugOverlay';svg.setAttribute('viewBox','0 0 512 288');svg.setAttribute('preserveAspectRatio','none');wrap.appendChild(svg);const light=document.createElement('div');light.id='s10LightOverlay';wrap.appendChild(light);const particles=document.createElement('div');particles.id='s10Particles';wrap.appendChild(particles);updateOverlay()}
function updateOverlay(){const svg=$('#s10DebugOverlay'),canvas=$('#editor');if(!svg||!canvas||!A)return;const r=canvas.getBoundingClientRect(),wr=canvas.parentElement.getBoundingClientRect();Object.assign(svg.style,{left:(r.left-wr.left)+'px',top:(r.top-wr.top)+'px',width:r.width+'px',height:r.height+'px'});svg.innerHTML='';const d=studio().debug;if(!d.hitboxes&&!d.chunkBounds)return;
 if(d.hitboxes){(A.scene().entities||[]).forEach(e=>{const isPlayer=e.type==='player',w=e.w||e.width||(isPlayer?14:16),h=e.h||e.height||(isPlayer?22:16),x=(e.x||0)-w/2,y=(e.y||0)-h/2;const q=document.createElementNS(svg.namespaceURI,'rect');q.setAttribute('x',x);q.setAttribute('y',y);q.setAttribute('width',w);q.setAttribute('height',h);q.setAttribute('class','hit '+e.type);svg.appendChild(q)})}
 if(d.chunkBounds){for(let x=0;x<512;x+=128){const l=document.createElementNS(svg.namespaceURI,'line');l.setAttribute('x1',x);l.setAttribute('x2',x);l.setAttribute('y1',0);l.setAttribute('y2',288);l.setAttribute('class','chunk');svg.appendChild(l)}for(let y=0;y<288;y+=144){const l=document.createElementNS(svg.namespaceURI,'line');l.setAttribute('x1',0);l.setAttribute('x2',512);l.setAttribute('y1',y);l.setAttribute('y2',y);l.setAttribute('class','chunk');svg.appendChild(l)}}
}
function bindShortcuts(){document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='a'){e.preventDefault();activeTab='assets';document.body.classList.add('s10-dock-open');renderDock()}if(e.key==='F3'){e.preventDefault();studio().debug.hitboxes=!studio().debug.hitboxes;updateOverlay();toast('Hitboxes '+(studio().debug.hitboxes?'ON':'OFF'))}})}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));else setTimeout(boot,0);
window.SNESStudioV10={boot,renderDock,get data(){return studio()},updateOverlay};
})();
