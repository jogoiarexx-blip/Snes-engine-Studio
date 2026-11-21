/** SNES Engine Studio 1.0 — Game Flow runtime
 * Full-game shell: splash, main menu, save slots, gameplay, pause, options,
 * game over, victory, credits, campaign progression and lightweight HUD.
 */
(function(global){
'use strict';

function slug(s){return String(s||'game').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')||'game'}
function clone(v){try{return JSON.parse(JSON.stringify(v))}catch(_){return v}}
const DEFAULT_CONTROLS={left:['arrowleft','a'],right:['arrowright','d'],up:['arrowup','w'],down:['arrowdown','s'],jump:['z',' '],attack:['x','c'],attack2:['v'],action:['e','enter'],inventory:['i'],pause:['escape','p']};
function defaults(project){
  project=project||{}; project.game=project.game||{}; const g=project.game;
  const first=(project.scenes&&project.scenes[0]&&project.scenes[0].id)||project.currentScene||'scene1';
  if(!g.startScene)g.startScene=first;
  if(g.startMode==null)g.startMode='menu';
  g.splash=Object.assign({enabled:true,title:project.name||'SNES ENGINE',subtitle:'',duration:1300},g.splash||{});
  g.mainMenu=Object.assign({title:project.name||'Meu Jogo',subtitle:'',background:'',showContinue:true,showOptions:true,showCredits:true},g.mainMenu||{});
  g.pause=Object.assign({enabled:true,allowSave:true,allowRestart:true,allowOptions:true},g.pause||{});
  g.hud=Object.assign({enabled:true,showHp:true,showScore:true,showCoins:true,showScene:true},g.hud||{});
  g.gameOver=Object.assign({title:'GAME OVER',retry:true,load:true,menu:true},g.gameOver||{});
  g.victory=Object.assign({title:'FASE CONCLUÍDA!',next:true,menu:true},g.victory||{});
  g.credits=Object.assign({title:'CRÉDITOS',text:'Criado com SNES Engine Studio\n\nObrigado por jogar!'},g.credits||{});
  g.settings=Object.assign({music:0.7,sfx:1,fullscreen:false,pixelPerfect:true,difficulty:'normal',autosave:true,transition:'fade',transitionMs:260,quality:'auto',autoPause:true},g.settings||{});
  g.loading=Object.assign({initialEnabled:true,sceneEnabled:true,smartPreload:true,title:'CARREGANDO...',subtitle:'Preparando o jogo',sceneTitle:'CARREGANDO {scene}',showPercent:true,showBar:true,showTips:true,minDuration:500,sceneMinDuration:280,background:'',logo:'',tips:['Explore cada canto da fase.','Checkpoints salvam seu progresso.','Você pode alterar os controles em Opções.']},g.loading||{});
  g.controls=Object.assign(clone(DEFAULT_CONTROLS),g.controls||{});
  g.intro=Object.assign({enabled:false,title:'INTRODUÇÃO',text:'Uma nova aventura começa...'},g.intro||{});
  g.ending=Object.assign({title:'FIM',text:'Obrigado por jogar!'},g.ending||{});
  g.saveSlots=Math.max(1,Math.min(9,Number(g.saveSlots)||3));
  if(!Array.isArray(g.campaign)||!g.campaign.length)g.campaign=(project.scenes||[]).map(s=>s.id);
  g.objectives=g.objectives||{};g.quests=Array.isArray(g.quests)?g.quests:[];global.SNESQuestSystem?.normalize?.(project);
  g.flowGraph=g.flowGraph||{nodes:[],edges:[]};if(!Array.isArray(g.flowGraph.nodes))g.flowGraph.nodes=[];if(!Array.isArray(g.flowGraph.edges))g.flowGraph.edges=[];
  if(!g.flowGraph.nodes.length)g.flowGraph.nodes=g.campaign.map((id,i)=>({id,x:40+(i%4)*150,y:40+Math.floor(i/4)*92}));
  if(!g.flowGraph.edges.length)g.flowGraph.edges=g.campaign.slice(0,-1).map((id,i)=>({from:id,to:g.campaign[i+1],condition:{type:'always'}}));
  g.ui=Object.assign({accent:'#ffd45e',panel:'#101526',text:'#ffffff',button:'#182541',menuAlign:'center',menuX:50,menuY:50,hudScale:1,pauseOpacity:.94,screens:{}},g.ui||{});g.ui.screens=g.ui.screens||{};
  g.cutscenes=g.cutscenes||{intro:[],ending:[],scenes:{}};g.cutscenes.intro=g.cutscenes.intro||[];g.cutscenes.ending=g.cutscenes.ending||[];g.cutscenes.scenes=g.cutscenes.scenes||{};
  return g;
}
function storageKey(project){return 'snes_gameflow_'+slug(project.id||project.name)}
function loadAll(project){const id=storageKey(project),hub=globalThis.SNESStorage;if(hub?.saves)return hub.saves.get(id)||{slots:{}};const raw=hub?.legacy?.get(id,null);try{return raw?JSON.parse(raw):{slots:{}}}catch(_){return {slots:{}}}}
function saveAll(project,data){const id=storageKey(project),hub=globalThis.SNESStorage;if(hub?.saves){hub.saves.set(id,data);return true}return !!hub?.legacy?.set(id,JSON.stringify(data))}
function prefKey(project){return storageKey(project)+'_preferences'}
function loadPreferences(project){const id=prefKey(project),hub=globalThis.SNESStorage;if(hub?.preferences)return hub.preferences.get(id,null);const raw=hub?.legacy?.get(id,null);try{return raw?JSON.parse(raw):null}catch(_){return null}}
function savePreferencesFor(project){const id=prefKey(project),value={settings:project.game.settings,controls:project.game.controls},hub=globalThis.SNESStorage;if(hub?.preferences){hub.preferences.set(id,value);return true}return !!hub?.legacy?.set(id,JSON.stringify(value))}
function fmtTime(sec){sec=Math.max(0,sec|0);const h=(sec/3600)|0,m=((sec%3600)/60)|0,s=sec%60;return (h?String(h).padStart(2,'0')+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}

const CSS=`
.sgf-root{position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;pointer-events:none;font-family:monospace;color:var(--sgf-text,#fff);text-shadow:2px 2px #000;background:transparent}
.sgf-root *{box-sizing:border-box}.sgf-screen{pointer-events:auto;min-width:min(86vw,540px);max-width:90vw;padding:28px;background:linear-gradient(color-mix(in srgb,var(--sgf-panel,#101526) 94%,transparent),#070a12f4);border:3px solid #d7e5ff;box-shadow:0 0 0 4px #1d2944,0 18px 70px #000b;text-align:center}
.sgf-title{font-size:clamp(25px,5vw,48px);font-weight:900;color:var(--sgf-accent,#ffd45e);margin:0 0 8px;letter-spacing:2px}.sgf-sub{opacity:.78;margin-bottom:22px}.sgf-menu{display:grid;gap:8px;max-width:330px;margin:auto}.sgf-btn{font:700 16px monospace;padding:10px 16px;border:2px solid #8aa4d6;background:var(--sgf-button,#182541);color:var(--sgf-text,#fff);cursor:pointer}.sgf-btn:hover,.sgf-btn:focus{background:#315082;outline:none}.sgf-btn[disabled]{opacity:.35;cursor:default}.sgf-small{font-size:12px;opacity:.75}.sgf-slots{display:grid;gap:8px}.sgf-slot{padding:12px;text-align:left;border:2px solid #536b96;background:#101a2d;cursor:pointer}.sgf-slot:hover{background:#20375d}.sgf-row{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap}.sgf-hud{position:fixed;top:12px;left:12px;right:12px;display:flex;justify-content:space-between;pointer-events:none;font:700 14px monospace;z-index:9997}.sgf-chip{background:#07101bcc;border:2px solid #ffffff55;padding:5px 9px}.sgf-hp{width:130px;height:10px;border:1px solid #fff8;background:#200}.sgf-hp>i{display:block;height:100%;background:#e34242}.sgf-credits{white-space:pre-line;line-height:1.7;max-height:55vh;overflow:auto}.sgf-loading{font-size:18px}.sgf-progress{height:12px;background:#000;border:1px solid #fff;margin-top:12px}.sgf-progress i{display:block;height:100%;background:#5fb0ff}.sgf-transition{position:fixed;inset:0;z-index:10020;background:#000;opacity:0;pointer-events:none;transition:opacity .26s ease}.sgf-asset-errors{max-height:180px;overflow:auto;text-align:left;font-size:11px;opacity:.82;margin-top:10px}.sgf-setting{display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:left;margin:8px 0}.sgf-setting input,.sgf-setting select{width:100%}.sgf-loadscreen{position:relative;overflow:hidden;min-width:min(88vw,620px)}.sgf-loadscreen:before{content:'';position:absolute;inset:0;background:var(--sgf-loading-bg,none) center/cover no-repeat;opacity:.28;z-index:-1}.sgf-loadlogo{display:block;max-width:min(65vw,320px);max-height:140px;object-fit:contain;margin:0 auto 16px;image-rendering:auto}.sgf-loadtip{margin-top:14px;min-height:2.3em;opacity:.74;font-size:12px}.sgf-spinner{width:28px;height:28px;border:4px solid #ffffff33;border-top-color:var(--sgf-accent,#ffd45e);border-radius:50%;margin:14px auto 0;animation:sgfSpin .75s linear infinite}@keyframes sgfSpin{to{transform:rotate(360deg)}}
`;
function injectStyle(){if(document.getElementById('snesGameFlowStyle'))return;const s=document.createElement('style');s.id='snesGameFlowStyle';s.textContent=CSS;document.head.appendChild(s)}
function button(text,fn,disabled){const b=document.createElement('button');b.className='sgf-btn';b.textContent=text;b.disabled=!!disabled;b.onclick=fn;return b}
function wait(ms){return new Promise(r=>setTimeout(r,Math.max(0,ms|0)))}

function create(project,canvas,env){
  const definitionProject=project;
  const session=global.SNESRuntimeSession?global.SNESRuntimeSession.create(project):{definition:project,project:clone(project)};
  project=session.project; defaults(project); injectStyle(); env=env||{};
  const state={project,definitionProject,session,canvas,env,screen:'boot',handle:null,slot:1,startedAt:0,elapsed:0,root:null,hud:null,transition:null,paused:false,lastScene:null,routeState:global.SNESStageRoutes?.emptyState?.()||{version:1,claimed:[],history:[]},assetStats:null,loading:false,loadedScenes:new Set()};
  const machine=global.SNESGameStateMachine?global.SNESGameStateMachine.create(state):null;
  if(machine){['boot','loading','splash','menu','slots','gameplay','pause','routes','options','controls','gameover','victory','cutscene','intro','ending','credits'].forEach(name=>machine.register(name,{enter(ctx){ctx.screen=name}}));state.machine=machine;}
  const root=document.createElement('div');root.className='sgf-root';root.style.display='none';document.body.appendChild(root);state.root=root;
  const hud=document.createElement('div');hud.className='sgf-hud';hud.style.display='none';document.body.appendChild(hud);state.hud=hud;
  const transition=document.createElement('div');transition.className='sgf-transition';document.body.appendChild(transition);state.transition=transition;
  state.questSystem=global.SNESQuestSystem?.create?.(project)||null;
  let offCheckpoint=null,offScene=null;

  function clear(){root.innerHTML='';root.style.display='none'}
  function panel(title,sub){clear();root.style.display='flex';const p=document.createElement('div');p.className='sgf-screen';if(title){const h=document.createElement('div');h.className='sgf-title';h.textContent=title;p.appendChild(h)}if(sub){const q=document.createElement('div');q.className='sgf-sub';q.textContent=sub;p.appendChild(q)}root.appendChild(p);applyDesignedScreen(p,state.screen);return p}
  function menuBox(p){const m=document.createElement('div');m.className='sgf-menu';p.appendChild(m);return m}
  function uiAction(name){if(!name)return null;return()=>{if(name==='newGame')showSlots('new');else if(name==='continue')continueLatest();else if(name==='options')options(state.screen==='pause');else if(name==='credits')credits();else if(name==='resume')resume();else if(name==='menu')mainMenu();else if(name==='save')saveSlot(state.slot);else if(name==='restart')playScene(project.currentScene);else if(name.startsWith('scene:'))playScene(name.slice(6));else global.SNESEvents?.emit('ui:action',{name,state})}}
  function applyDesignedScreen(host,name){const def=project.game.ui?.screens?.[name];if(!def?.widgets?.length)return;host.style.position='relative';host.dataset.uiScreen=name;for(const w of def.widgets){if(w.visible===false)continue;let el;if(w.type==='Text'){el=document.createElement('div');el.textContent=w.text||''}else if(w.type==='Image'||w.type==='Icon'){el=document.createElement('img');el.alt=w.text||'';el.src=assetUrl(w.assetId)||w.src||'';el.style.objectFit=w.fit||'contain';el.style.imageRendering=w.pixelated===false?'auto':'pixelated'}else if(w.type==='Button'){el=button(w.text||'BOTÃO',uiAction(w.action),w.disabled);el.classList.add('sgf-ui-widget')}else if(w.type==='ProgressBar'){el=document.createElement('progress');el.max=w.max||100;el.value=w.value||0}else if(w.type==='Slider'){el=document.createElement('input');el.type='range';el.min=w.min??0;el.max=w.max??100;el.value=w.value??50}else if(w.type==='List'){el=document.createElement('div');el.textContent=(w.items||[]).join(' • ')}else{el=document.createElement('div');if(w.type==='Panel')el.style.background=w.background||'rgba(0,0,0,.5)';else el.textContent=w.text||''}el.dataset.widgetId=w.id||'';el.style.position='absolute';el.style.left=(w.x??0)+'%';el.style.top=(w.y??0)+'%';el.style.width=(w.w??30)+'%';el.style.minHeight=(w.h??10)+'%';el.style.transform=(w.anchor==='center'?'translate(-50%,-50%)':w.anchor==='top-right'?'translate(-100%,0)':w.anchor==='bottom-left'?'translate(0,-100%)':w.anchor==='bottom-right'?'translate(-100%,-100%)':'none');el.style.textAlign=w.align||'left';if(w.fontSize)el.style.fontSize=w.fontSize+'px';if(w.margin!=null)el.style.margin=w.margin+'px';if(w.opacity!=null)el.style.opacity=w.opacity;if(w.z!=null)el.style.zIndex=w.z;host.appendChild(el)}}
  function setScreen(x){state.screen=x;if(machine&&machine.name!==x)machine.change(x).catch?.(e=>global.SNESLogger?.error?.('gameflow','Falha ao trocar estado',e))}
  function assetUrl(id){const a=project.studio&&project.studio.assets&&project.studio.assets.find(x=>x.id===id);return a&&(a.dataUrl||a.url)||''}
  function applyTheme(){const u=project.game.ui||{};root.style.setProperty('--sgf-accent',u.accent||'#ffd45e');root.style.setProperty('--sgf-panel',u.panel||'#101526');root.style.setProperty('--sgf-text',u.text||'#fff');root.style.setProperty('--sgf-button',u.button||'#182541');hud.style.transform='scale('+(u.hudScale||1)+')';hud.style.transformOrigin='top left'}
  function randomTip(){const tips=project.game.loading?.tips||[];return tips.length?tips[(Math.random()*tips.length)|0]:''}
  function loadingPanel(title,subtitle){
    const cfg=project.game.loading||{};const p=panel(title||cfg.title||'CARREGANDO...',subtitle||cfg.subtitle||'');p.classList.add('sgf-loadscreen');
    const bg=assetUrl(cfg.background);if(bg)p.style.setProperty('--sgf-loading-bg','url('+JSON.stringify(bg)+')');
    const logo=assetUrl(cfg.logo);if(logo){const img=document.createElement('img');img.className='sgf-loadlogo';img.src=logo;img.alt='';p.insertBefore(img,p.firstChild);}
    const label=document.createElement('div');label.className='sgf-loading';label.textContent=cfg.showPercent===false?'Carregando...':'0%';p.appendChild(label);
    let fill=null;if(cfg.showBar!==false){const prog=document.createElement('div');prog.className='sgf-progress';fill=document.createElement('i');fill.style.width='0%';prog.appendChild(fill);p.appendChild(prog);}else{const spin=document.createElement('div');spin.className='sgf-spinner';p.appendChild(spin);}
    let tip=null;if(cfg.showTips!==false){tip=document.createElement('div');tip.className='sgf-loadtip';tip.textContent=randomTip();p.appendChild(tip);}
    return {p,label,fill,tip};
  }
  async function runLoading(loader,opts){
    opts=opts||{};const cfg=project.game.loading||{},start=performance.now();state.loading=true;setScreen('loading');hud.style.display='none';
    const ui=loadingPanel(opts.title,opts.subtitle), onProgress=(done,total,ratio,st)=>{const pct=Math.max(0,Math.min(100,Math.round((ratio==null?1:ratio)*100)));if(cfg.showPercent===false)ui.label.textContent=(done||0)+'/'+(total||0);else ui.label.textContent=pct+'%'+(total?' · '+done+'/'+total:'');if(ui.fill)ui.fill.style.width=pct+'%';state.assetStats=st||state.assetStats;};
    let stats={total:0,done:0,ok:0,error:0,errors:[]};try{stats=await loader(onProgress)||stats}catch(err){stats.error=1;stats.errors=[{error:String(err&&err.message||err)}];global.SNESLogger?.error?.('loading','Falha no carregamento',err)}
    onProgress(stats.done||stats.total||0,stats.total||0,1,stats);state.assetStats=stats;
    if(stats?.error){const errs=document.createElement('div');errs.className='sgf-asset-errors';errs.textContent='Avisos de assets: '+(stats.errors||[]).map(x=>x.name||x.assetId||x.id||x.error).join(', ');ui.p.appendChild(errs);global.SNESLogger?.warn?.('asset','Carregamento concluiu com assets ausentes',stats)}
    const elapsed=performance.now()-start,min=Math.max(0,+opts.minDuration||0);if(elapsed<min)await wait(min-elapsed);state.loading=false;return stats;
  }
  async function preloadGame(){
    const assets=global.SNESAssets,cfg=project.game.loading||{};if(cfg.initialEnabled===false)return {total:0,done:0,ok:0,error:0,errors:[]};
    if(!assets){return {total:0,done:0,ok:0,error:0,errors:[]};}
    const loader=cfg.smartPreload!==false&&assets.preloadCore?function(cb){return assets.preloadCore(project,cb)}:function(cb){return assets.preloadProject?assets.preloadProject(project,cb):Promise.resolve({total:0,done:0,ok:0,error:0,errors:[]})};
    const stats=await runLoading(loader,{title:cfg.title,subtitle:cfg.subtitle,minDuration:cfg.minDuration||500});state.loadedScenes.add(project.game.startScene);return stats;
  }
  async function preloadScene(target){
    const cfg=project.game.loading||{},assets=global.SNESAssets;if(cfg.sceneEnabled===false||!target)return {total:0,done:0,ok:0,error:0,errors:[]};
    const sceneNameText=sceneName(target),title=String(cfg.sceneTitle||'CARREGANDO {scene}').replace('{scene}',sceneNameText);
    const loader=assets?.preloadScene?function(cb){return assets.preloadScene(project,target,cb)}:function(){return Promise.resolve({total:0,done:0,ok:0,error:0,errors:[]})};
    const stats=await runLoading(loader,{title:title,subtitle:'Preparando '+sceneNameText,minDuration:cfg.sceneMinDuration||280});state.loadedScenes.add(target);return stats;
  }
  async function withTransition(task){
    const mode=project.game.settings.transition||'fade',ms=Math.max(0,+project.game.settings.transitionMs||260);if(mode==='none'||!transition||!ms)return task();
    transition.style.transitionDuration=ms+'ms';transition.style.opacity='1';await wait(ms);let out;try{out=await task()}finally{await wait(20);transition.style.opacity='0'}return out;
  }
  function saves(){return loadAll(project)}
  function hasAnySave(){const d=saves();return Object.keys(d.slots||{}).some(k=>d.slots[k]&&d.slots[k].sceneId)}
  function currentRt(){return state.handle&&state.handle.rt}
  function savePreferences(){return savePreferencesFor(project)}
  function snapshot(){const rt=currentRt(),p=rt&&rt.player||null;if(!p&&state.lastSnapshot){const q=clone(state.lastSnapshot);q.sceneId=project.currentScene||q.sceneId;q.flags=clone(project.studio&&project.studio.flags||{});q.variables=clone(project.studio&&project.studio.variables||{});q.quests=state.questSystem?.snapshot?.()||q.quests||{};q.playTime=Math.floor(state.elapsed);q.savedAt=Date.now();q.routes=clone(state.routeState);return q}const pl=p||{};const snap={sceneId:project.currentScene,checkpoint:clone(pl.checkpoint||null),player:{x:pl.x,y:pl.y,hp:pl.hp,maxHp:pl.maxHp,score:pl.score||state.handle?.rt?.score||0,coins:pl.coins||0,keys:pl.keys||0},flags:clone(project.studio&&project.studio.flags||{}),variables:clone(project.studio&&project.studio.variables||{}),inventory:clone(project.inventory||null),upgrades:clone(project.upgrades||null),quests:state.questSystem?.snapshot?.()||{},routes:clone(state.routeState),playTime:Math.floor(state.elapsed+(state.startedAt?(performance.now()-state.startedAt)/1000:0)),savedAt:Date.now()};state.lastSnapshot=clone(snap);return snap}
  function saveSlot(n){const d=saves();d.slots=d.slots||{};d.slots[n]=snapshot();saveAll(project,d);state.slot=n;return d.slots[n]}
  function deleteSlot(n){const d=saves();if(d.slots)delete d.slots[n];saveAll(project,d)}
  function applySave(s){if(!s)return; project.currentScene=s.sceneId||project.game.startScene;if(project.studio){if(s.flags)project.studio.flags=clone(s.flags);if(s.variables)project.studio.variables=clone(s.variables)}if(s.inventory)project.inventory=clone(s.inventory);if(s.upgrades)project.upgrades=clone(s.upgrades);state.elapsed=s.playTime||0;state.lastSnapshot=clone(s);state.routeState=global.SNESStageRoutes?.restore?.(project.game.stageRoutes,s.routes)||{version:1,claimed:[],history:[]};if(s.quests&&global.SNESQuestSystem){state.questSystem?.destroy?.();state.questSystem=global.SNESQuestSystem.create(project,s.quests);}
    state.pendingPlayer=Object.assign({},clone(s.player||{}),s.checkpoint?{checkpoint:clone(s.checkpoint)}:{})}

  function splash(){setScreen('splash');const g=project.game.splash;if(!g.enabled){mainMenu();return}const p=panel(g.title||project.name,g.subtitle||'');const sm=document.createElement('div');sm.className='sgf-small';sm.textContent='SNES ENGINE STUDIO';p.appendChild(sm);setTimeout(()=>{if(state.screen==='splash')mainMenu()},Math.max(300,g.duration||1300))}
  function mainMenu(){stopGameplay(false);setScreen('menu');hud.style.display='none';const g=project.game.mainMenu;const p=panel(g.title||project.name,g.subtitle);const u=project.game.ui||{};p.style.position='absolute';p.style.left=(u.menuX||50)+'%';p.style.top=(u.menuY||50)+'%';p.style.transform='translate(-50%,-50%)';p.style.textAlign=u.menuAlign||'center';const bg=assetUrl(g.background);if(bg){root.style.backgroundImage='linear-gradient(#0006,#0008),url('+JSON.stringify(bg)+')';root.style.backgroundSize='cover';root.style.backgroundPosition='center'}else root.style.backgroundImage='none';const m=menuBox(p);m.appendChild(button('NOVO JOGO',()=>showSlots('new')));if(g.showContinue)m.appendChild(button('CONTINUAR',continueLatest,!hasAnySave()));if(g.showOptions)m.appendChild(button('OPÇÕES',options));if(g.showCredits)m.appendChild(button('CRÉDITOS',credits));}
  function showSlots(mode){setScreen('slots');const p=panel(mode==='new'?'NOVO JOGO':'CARREGAR JOGO','Selecione um arquivo');const d=saves();const wrap=document.createElement('div');wrap.className='sgf-slots';p.appendChild(wrap);for(let i=1;i<=project.game.saveSlots;i++){const s=d.slots&&d.slots[i];const el=document.createElement('div');el.className='sgf-slot';el.innerHTML='<b>SLOT '+i+'</b><div class="sgf-small">'+(s?(sceneName(s.sceneId)+' · '+fmtTime(s.playTime||0)):'Vazio')+'</div>';el.onclick=()=>{state.slot=i;if(mode==='new'){if(s&&!confirm('Substituir este save?'))return;newGame(i)}else if(s){applySave(s);playScene(project.currentScene)}};wrap.appendChild(el)}const m=menuBox(p);m.appendChild(button('VOLTAR',mainMenu));if(mode!=='new')m.appendChild(button('APAGAR SLOT ATUAL',()=>{deleteSlot(state.slot);showSlots(mode)}));}
  function continueLatest(){const d=saves(),list=Object.keys(d.slots||{}).map(k=>({k:+k,s:d.slots[k]})).filter(x=>x.s&&x.s.sceneId).sort((a,b)=>(b.s.savedAt||0)-(a.s.savedAt||0));if(!list.length)return;state.slot=list[0].k;applySave(list[0].s);playScene(project.currentScene)}
  function newGame(slot){state.slot=slot||1;state.elapsed=0;state.lastSnapshot=null;state.routeState=global.SNESStageRoutes?.emptyState?.()||{version:1,claimed:[],history:[]};project.currentScene=project.game.startScene||(project.game.campaign||[])[0]||project.currentScene;if(project.studio){project.studio.flags={};project.studio.variables={}};state.pendingPlayer=null;if(global.SNESQuestSystem){state.questSystem?.destroy?.();state.questSystem=global.SNESQuestSystem.create(project);}saveSlot(state.slot);if(project.game.intro.enabled)intro();else startFirstRoute()}

  function startFirstRoute(){
    if(global.SNESStageRoutes?.choicesFor?.(project.game.stageRoutes,0,state.routeState)?.length)return routeMenu(0);
    return playScene(project.currentScene,true);
  }
  function routeMenu(stage){
    const options=global.SNESStageRoutes?.choicesFor?.(project.game.stageRoutes,stage,state.routeState)||[];
    if(!options.length)return false;
    stopGameplay(false);
    setScreen('routes');
    const p=panel('ESCOLHA SEU CAMINHO','Fase '+(stage+1)+' · escolha uma rota com desafios e recompensas diferentes');
    const m=menuBox(p);
    options.forEach(o=>{
      const label=o.name+' · '+o.description+' · +'+o.reward+' PTS'+(o.locked?' (BLOQUEADA)':'');
      m.appendChild(button(label,()=>selectRoute(stage,o.id),o.locked));
    });
    m.appendChild(button('MENU PRINCIPAL',mainMenu));
    return true;
  }
  function selectRoute(stage,id){
    const selected=global.SNESStageRoutes?.select?.(project.game.stageRoutes,state.routeState,stage,id);
    if(!selected)return false;
    const destination=project.scenes?.find(s=>s.id===selected.sceneId);
    if(!destination)return false;
    const spawn=destination.entities?.find(e=>e.type==='player')||{x:32,y:200,hp:3};
    const previous=state.lastSnapshot?.player||{};
    const player={x:spawn.x,y:spawn.y,
      hp:Number.isFinite(previous.hp)&&previous.hp>0?previous.hp:(spawn.hp||3),
      maxHp:Number.isFinite(previous.maxHp)&&previous.maxHp>0?previous.maxHp:(spawn.hp||3),
      score:Number.isFinite(previous.score)?previous.score:0,
      coins:Number.isFinite(previous.coins)?previous.coins:0,
      keys:Number.isFinite(previous.keys)?previous.keys:0};
    project.currentScene=selected.sceneId;
    project.game.flags=project.game.flags||{};
    project.game.flags['decision:route_stage_'+stage]=id;
    state.lastSnapshot=Object.assign({},state.lastSnapshot||{},{
      sceneId:selected.sceneId,checkpoint:null,player,routes:clone(state.routeState)});
    state.pendingPlayer={hp:player.hp,maxHp:player.maxHp,score:player.score,coins:player.coins,keys:player.keys};
    saveSlot(state.slot);
    playScene(selected.sceneId);
    return true;
  }
  function sceneName(id){const s=(project.scenes||[]).find(x=>x.id===id);return s?s.name:id||'Fase'}
  function graphConditionOk(c){c=c||{type:'always'};const key=c.key||c.target||'',value=c.value==null?true:c.value,qs=state.questSystem?.state||{};if(c.type==='always')return true;if(c.type==='flag')return (project.game.flags||{})[key]===value||String((project.game.flags||{})[key])===String(value);if(c.type==='quest')return qs.completed?.[key]===true||qs.quests?.[key]?.status==='completed';if(c.type==='item')return ((state.handle?.player?.inventory||[]).find?.(x=>(x.id||x)===key)?.count||0)>=Math.max(1,+value||1);if(c.type==='boss')return !!(project.game.flags||{})['boss:'+key];if(c.type==='decision')return String((project.game.flags||{})['decision:'+key])===String(value);return false}
  function nextScene(id){const edges=project.game.flowGraph?.edges||[];for(const e of edges){if(e.from===id&&graphConditionOk(e.condition))return e.to;}const arr=project.game.campaign||[];const i=arr.indexOf(id);return i>=0&&i+1<arr.length?arr[i+1]:null}

  async function playScene(id,isNew,skipSceneCutscene,skipTransition){
    if(!global.SNESEngine){console.error('SNESEngine missing');return}
    const target=id||project.game.startScene;
    // Timelines associadas a uma cena agora são realmente executadas antes do gameplay.
    // skipSceneCutscene evita recursão quando a própria timeline termina.
    const sceneTrack=project.game.cutscenes&&project.game.cutscenes.scenes&&project.game.cutscenes.scenes[target];
    if(!skipSceneCutscene&&sceneTrack&&sceneTrack.length){
      stopGameplay(false);project.currentScene=target;
      runTimeline(sceneTrack,()=>playScene(project.currentScene||target,isNew,true,false));
      return;
    }
    if(!skipTransition){if(project.game.loading?.sceneEnabled!==false&&(state.lastScene!==target||!state.loadedScenes.has(target)))await preloadScene(target);await withTransition(()=>playScene(target,isNew,true,true));return;}
    stopGameplay(false);project.currentScene=target;clear();setScreen('gameplay');state.lastScene=project.currentScene;state.startedAt=performance.now();state.paused=false;
    const liveScene=(project.scenes||[]).find(s=>s.id===target);
    if(global.SNESAudio&&liveScene?.audio){
      for(const key of ['bgm','ambient']){const id=liveScene.audio[key],asset=id&&project.studio?.assets?.find(a=>a.id===id||a.name===id),src=asset&&(asset.dataUrl||asset.url);if(asset&&src)try{await global.SNESAudio.loadBuffer(asset.id,src)}catch(_){}}
      try{global.SNESAudio.setSceneAudio(liveScene,{fade:.45,stopMissing:true})}catch(_){}
    }
    const h=global.SNESEngine.play(project,canvas,env.themes||{},env.enemyVariants||{},env.skeletonDraw||null,{
      onStop:function(){},
      onFrame:function(){ const rt=currentRt();if(state.screen==='gameplay') updateHud();let shellPause=!!rt?.input?.touch?.pause;try{const gp=navigator.getGamepads&&navigator.getGamepads()[0];shellPause=shellPause||!!(gp&&gp.buttons[9]&&gp.buttons[9].pressed)}catch(_){}if(shellPause&&!state._shellPauseHeld){if(state.screen==='gameplay')pause();else if(state.screen==='pause')resume()}state._shellPauseHeld=shellPause; },
      onGameOver:function(){ if(state.screen==='gameplay'){ stopGameplay(true); gameOver(); } },
      onWon:function(){ if(state.screen==='gameplay'){ stopGameplay(true); victory(); } }
    });state.handle=h;
    if(h&&h.rt){h.rt.__questSystem=state.questSystem;state.questSystem?.consume?.('scene',project.currentScene,1);h.rt.__externalUi=true;if(state.pendingPlayer){Object.assign(h.rt.player,state.pendingPlayer);state.pendingPlayer=null}}
    hud.style.display=project.game.hud.enabled?'flex':'none';updateHud();
  }
  function stopGameplay(accumulate){if(state.handle&&state.handle.rt)state.lastSnapshot=snapshot();if(accumulate&&state.startedAt)state.elapsed+=(performance.now()-state.startedAt)/1000;state.startedAt=0;if(state.handle&&global.SNESEngine&&global.SNESEngine.getActive&&global.SNESEngine.getActive())global.SNESEngine.stop();state.handle=null;hud.style.display='none'}
  function updateHud(){const rt=currentRt(),p=rt&&rt.player||{};if(!rt)return;const g=project.game.hud;let left='',right='';if(g.showHp&&p.hp!=null){const max=Math.max(1,p.maxHp||p.hp||1),pct=Math.max(0,Math.min(100,100*p.hp/max));left+='<span class="sgf-chip">HP '+p.hp+'/'+max+' <span class="sgf-hp"><i style="width:'+pct+'%"></i></span></span>'}if(g.showScene)left+='<span class="sgf-chip">'+sceneName(project.currentScene)+'</span>';const obj=project.game.objectives&&project.game.objectives[project.currentScene];if(obj)left+='<span class="sgf-chip">🎯 '+String(obj).replace(/</g,'&lt;')+'</span>';const aq=state.questSystem?.active?.()[0];if(aq){const done=(aq.quest.objectives||[]).filter(o=>(aq.state.objectives[o.id]||0)>=(o.count||1)).length;left+='<span class="sgf-chip">📜 '+String(aq.quest.title).replace(/</g,'&lt;')+' '+done+'/'+(aq.quest.objectives?.length||0)+'</span>'; }if(g.showScore){const score=p.score!=null?p.score:(rt.score||0);right+='<span class="sgf-chip">PTS '+score+'</span>'}if(g.showCoins&&p.coins!=null)right+='<span class="sgf-chip">🪙 '+p.coins+'</span>';hud.innerHTML='<div class="sgf-row">'+left+'</div><div class="sgf-row">'+right+'</div>'}

  function pause(){if(!project.game.pause.enabled||!['gameplay','options','controls'].includes(state.screen))return;const rt=currentRt();if(rt)rt.paused=true;global.SNESAudio?.suspend?.();state.paused=true;setScreen('pause');const p=panel('PAUSADO',sceneName(project.currentScene));const m=menuBox(p);m.appendChild(button('CONTINUAR',resume));if(project.game.pause.allowSave)m.appendChild(button('SALVAR',()=>{saveSlot(state.slot);toastIn(p,'Jogo salvo.')}));if(project.game.pause.allowRestart)m.appendChild(button('REINICIAR FASE',()=>{state.pendingPlayer=null;playScene(project.currentScene)}));if(project.game.pause.allowOptions)m.appendChild(button('OPÇÕES',()=>options(true)));m.appendChild(button('MENU PRINCIPAL',()=>{saveSlot(state.slot);mainMenu()}));}
  function resume(){clear();setScreen('gameplay');const rt=currentRt();if(rt)rt.paused=false;global.SNESAudio?.resume?.();state.paused=false;hud.style.display=project.game.hud.enabled?'flex':'none'}
  function gameOver(){setScreen('gameover');const p=panel(project.game.gameOver.title,'');const m=menuBox(p);if(project.game.gameOver.retry)m.appendChild(button('TENTAR NOVAMENTE',()=>{const d=saves(),sv=d.slots&&d.slots[state.slot];if(sv&&sv.sceneId){applySave(sv);playScene(project.currentScene)}else playScene(state.lastScene)}));if(project.game.gameOver.load)m.appendChild(button('CARREGAR',()=>showSlots('load')));if(project.game.gameOver.menu)m.appendChild(button('MENU PRINCIPAL',mainMenu))}
  function victory(){
    const routes=global.SNESStageRoutes,config=project.game.stageRoutes;
    const routeIndex=routes?.stageOf?.(config,state.lastScene)??-1;
    if(routeIndex>=0){
      const score=state.lastSnapshot?.player?.score;
      const outcome=routes.complete(config,state.routeState,state.lastScene,score);
      state.routeState=outcome.state;
      if(state.lastSnapshot?.player)state.lastSnapshot.player.score=outcome.score;
    }
    saveSlot(state.slot);
    setScreen('victory');
    const nextStage=routeIndex>=0?routes.nextStage(config,state.lastScene):-1;
    const next=routeIndex<0?nextScene(state.lastScene):null;
    const p=panel(project.game.victory.title,sceneName(state.lastScene)),m=menuBox(p);
    if(nextStage>=0&&project.game.victory.next)
      m.appendChild(button('ESCOLHER PRÓXIMO CAMINHO',()=>routeMenu(nextStage)));
    else if(next&&project.game.victory.next)
      m.appendChild(button('PRÓXIMA FASE',()=>{project.currentScene=next;playScene(next)}));
    else m.appendChild(button('VER FINAL / CRÉDITOS',ending));
    if(project.game.victory.menu)m.appendChild(button('MENU PRINCIPAL',mainMenu));
  }
  function runTimeline(list,done){
    list=(list||[]).slice().sort((a,b)=>(+a.time||0)-(+b.time||0));if(!list.length){done&&done();return}
    setScreen('cutscene');const p=panel('CUTSCENE',''),text=document.createElement('div');text.className='sgf-credits';p.appendChild(text);const timers=[],rafs=[];let finished=false;
    function liveEntity(key){const rt=currentRt();if(rt?.world){return rt.world.get(key)||rt.world.all().find(e=>e.name===key)||null}const sc=project.scenes?.find(s=>s.id===project.currentScene);return (sc?.entities||[]).find(e=>e.id===key||e.name===key)||null}
    function finish(){if(finished)return;finished=true;timers.forEach(clearTimeout);rafs.forEach(cancelAnimationFrame);root.style.opacity='1';done&&done()}
    function cameraPan(a){const rt=currentRt(),cam=rt?.camera;if(!cam)return;const fromX=cam.x||0,fromY=cam.y||0,toX=+a.x||0,toY=+a.y||0,dur=Math.max(.05,+a.duration||1)*1000,oldMode=cam.mode,start=performance.now();cam.mode='fixed';function step(now){const t=Math.max(0,Math.min(1,(now-start)/dur)),e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;cam.x=fromX+(toX-fromX)*e;cam.y=fromY+(toY-fromY)*e;global.SNESCamera?.clamp?.(cam);if(t<1)rafs.push(requestAnimationFrame(step));else cam.mode=oldMode||'follow'}rafs.push(requestAnimationFrame(step))}
    function action(a){
      if(a.type==='dialog'||a.type==='objective')text.textContent=a.value||'';
      else if(a.type==='fade'){root.style.transition='opacity '+Math.max(.1,+a.duration||1)+'s';root.style.opacity='0';timers.push(setTimeout(()=>root.style.opacity='1',Math.max(100,(+a.duration||1)*500)))}
      else if(a.type==='shake'){if(currentRt()&&global.SNESStudioRuntime?.shake)global.SNESStudioRuntime.shake(currentRt(),+a.amount||8,+a.duration||.4);else p.animate([{transform:'translate(0,0)'},{transform:'translate(6px,-3px)'},{transform:'translate(-5px,3px)'},{transform:'translate(0,0)'}],{duration:Math.max(150,(+a.duration||.4)*1000),iterations:2})}
      else if(a.type==='setFlag'){project.studio=project.studio||{};project.studio.flags=project.studio.flags||{};project.studio.flags[a.value||a.key||'flag']=a.flagValue!==undefined?a.flagValue:true}
      else if(a.type==='setVariable'){project.studio=project.studio||{};project.studio.variables=project.studio.variables||{};const parts=String(a.value||'').split('=');project.studio.variables[parts.shift().trim()||'var']=parts.join('=').trim()}
      else if(a.type==='movePlayer'){const rt=currentRt();if(rt?.player){rt.player.x=+a.x||0;rt.player.y=+a.y||0}else state.pendingPlayer=Object.assign({},state.pendingPlayer||{},{x:+a.x||0,y:+a.y||0})}
            else if(a.type==='gotoScene'){if(a.value)project.currentScene=a.value}
      else if(a.type==='playSound'){const asset=project.studio?.assets?.find(x=>x.id===a.value||x.name===a.value),src=asset&&(asset.dataUrl||asset.url);if(global.SNESAudio){if(src)global.SNESAudio.loadBuffer(asset.id,src).then(()=>global.SNESAudio.playSfx(asset.id));else global.SNESAudio.playProcedural(a.value||'blip')}}
      else if(a.type==='music'){const asset=project.studio?.assets?.find(x=>x.id===a.value||x.name===a.value),src=asset&&(asset.dataUrl||asset.url);if(global.SNESAudio&&asset&&src)global.SNESAudio.loadBuffer(asset.id,src).then(()=>global.SNESAudio.playBgm(asset.id,{loop:a.loop!==false,fade:+a.fade||.4}))}
      else if(a.type==='setAnimation'){const ent=liveEntity(a.value||a.entityId||'');if(ent){global.SNESEntityComponents?.ensure?.(ent);ent.components=ent.components||{};ent.components.spriteRenderer=ent.components.spriteRenderer||{};ent.components.spriteRenderer.runtimeAnimationId=a.animationId||a.target||''}}
      else if(a.type==='spawnPrefab'){const pf=project.studio?.prefabs?.find(x=>x.id===a.value||x.name===a.value),rt=currentRt();if(pf&&rt?.world){const ent=rt.world.spawn(pf.entity);ent.x=+a.x||rt.player?.x||0;ent.y=+a.y||rt.player?.y||0}else if(pf){const sc=project.scenes?.find(s=>s.id===project.currentScene);if(sc){const ent=clone(pf.entity);ent.id='cut_'+Date.now().toString(36);ent.x=+a.x||0;ent.y=+a.y||0;sc.entities.push(ent)}}}
      else if(a.type==='removeEntity'){const rt=currentRt(),ent=liveEntity(a.value||a.entityId||'');if(rt?.world&&ent)rt.world.destroy(ent.id);else{const sc=project.scenes?.find(s=>s.id===project.currentScene);if(sc)sc.entities=sc.entities.filter(e=>e.id!==a.value&&e.name!==a.value)}}
      else if(a.type==='cameraPan')cameraPan(a)
    }
    for(const a of list)timers.push(setTimeout(()=>action(a),Math.max(0,(+a.time||0)*1000)));
    const end=Math.max(...list.map(a=>(+a.time||0)+(+a.duration||0)),0);timers.push(setTimeout(finish,Math.max(200,end*1000+250)));const m=menuBox(p);m.appendChild(button('PULAR',finish));
  }
  function intro(){const tl=project.game.cutscenes&&project.game.cutscenes.intro;if(tl&&tl.length){runTimeline(tl,startFirstRoute);return}setScreen('intro');const p=panel(project.game.intro.title,'');const t=document.createElement('div');t.className='sgf-credits';t.textContent=project.game.intro.text;p.appendChild(t);const m=menuBox(p);m.appendChild(button('COMEÇAR',startFirstRoute));m.appendChild(button('PULAR',startFirstRoute))}
  function ending(){const tl=project.game.cutscenes&&project.game.cutscenes.ending;if(tl&&tl.length){runTimeline(tl,credits);return}setScreen('ending');const p=panel(project.game.ending.title,'');const t=document.createElement('div');t.className='sgf-credits';t.textContent=project.game.ending.text;p.appendChild(t);const m=menuBox(p);m.appendChild(button('CRÉDITOS',credits));m.appendChild(button('MENU PRINCIPAL',mainMenu))}
  function credits(){setScreen('credits');const p=panel(project.game.credits.title,'');const t=document.createElement('div');t.className='sgf-credits';t.textContent=project.game.credits.text||'';p.appendChild(t);const m=menuBox(p);m.appendChild(button('VOLTAR',mainMenu))}
  function options(fromPause){setScreen('options');const g=project.game.settings,p=panel('OPÇÕES','');const form=document.createElement('div');form.innerHTML='<div class="sgf-setting"><label>Música</label><input id="sgfMusic" type="range" min="0" max="1" step=".05" value="'+g.music+'"></div><div class="sgf-setting"><label>Efeitos</label><input id="sgfSfx" type="range" min="0" max="1" step=".05" value="'+g.sfx+'"></div><div class="sgf-setting"><label>Dificuldade</label><select id="sgfDiff"><option value="easy">Fácil</option><option value="normal">Normal</option><option value="hard">Difícil</option></select></div><div class="sgf-setting"><label>Qualidade</label><select id="sgfQuality"><option value="auto">Automática</option><option value="low">Baixa</option><option value="balanced">Balanceada</option><option value="high">Alta</option></select></div><div class="sgf-setting"><label>Pixel Perfect</label><input id="sgfPixel" type="checkbox" '+(g.pixelPerfect?'checked':'')+'></div><div class="sgf-setting"><label>Pausar ao perder foco</label><input id="sgfAutoPause" type="checkbox" '+(g.autoPause!==false?'checked':'')+'></div>';p.appendChild(form);form.querySelector('#sgfDiff').value=g.difficulty;form.querySelector('#sgfQuality').value=g.quality||'auto';form.querySelector('#sgfMusic').oninput=e=>{g.music=+e.target.value;applyAudio();savePreferences()};form.querySelector('#sgfSfx').oninput=e=>{g.sfx=+e.target.value;applyAudio();savePreferences()};form.querySelector('#sgfDiff').onchange=e=>{g.difficulty=e.target.value;savePreferences()};form.querySelector('#sgfQuality').onchange=e=>{g.quality=e.target.value;const rt=currentRt();if(rt&&global.SNESQuality&&g.quality!=='auto')global.SNESQuality.set(rt,g.quality,'options');savePreferences()};form.querySelector('#sgfPixel').onchange=e=>{g.pixelPerfect=e.target.checked;canvas.style.imageRendering=g.pixelPerfect?'pixelated':'auto';savePreferences()};form.querySelector('#sgfAutoPause').onchange=e=>{g.autoPause=e.target.checked;savePreferences()};const m=menuBox(p);m.appendChild(button('CONTROLES',()=>controls(fromPause)));m.appendChild(button('TELA CHEIA',()=>{document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen()}));m.appendChild(button('VOLTAR',fromPause?pause:mainMenu));}
  function controls(fromPause){
    setScreen('controls');
    const p=panel('CONTROLES','Clique em uma ação e pressione a nova tecla.');
    const map=project.game.controls,labels={left:'Esquerda',right:'Direita',up:'Cima',down:'Baixo',jump:'Pular',attack:'Atacar',attack2:'Ataque 2',action:'Interagir',inventory:'Inventário',pause:'Pause'};
    const box=document.createElement('div');box.className='sgf-slots';p.appendChild(box);
    let waiting=null;
    function keyLabel(k){return k===' '?'ESPAÇO':String(k||'').toUpperCase()}
    function redraw(){
      box.innerHTML='';
      Object.keys(labels).forEach(k=>{
        const d=document.createElement('button');d.className='sgf-slot';d.style.width='100%';d.style.color='#fff';d.style.font='inherit';d.style.background=waiting===k?'#315082':'#101a2d';
        d.innerHTML='<b>'+labels[k]+'</b><span style="float:right">'+(waiting===k?'PRESSIONE UMA TECLA…':(map[k]||[]).map(keyLabel).join(' / '))+'</span>';
        d.onclick=()=>{waiting=k;redraw()};box.appendChild(d);
      });
    }
    function capture(e){
      if(!waiting)return;
      e.preventDefault();e.stopImmediatePropagation();
      const key=(e.key||'').toLowerCase();
      if(!key)return;
      if(key==='escape'&&waiting!=='pause'){waiting=null;redraw();return;}
      map[waiting]=[key];waiting=null;
      if(global.SNESInput&&global.SNESInput.setKeyMap)global.SNESInput.setKeyMap(map);
      savePreferences();redraw();
    }
    window.addEventListener('keydown',capture,true);
    redraw();
    const m=menuBox(p);
    m.appendChild(button('RESTAURAR PADRÃO',()=>{project.game.controls=clone(DEFAULT_CONTROLS);Object.keys(map).forEach(k=>delete map[k]);Object.assign(map,clone(DEFAULT_CONTROLS));if(global.SNESInput)global.SNESInput.setKeyMap(map);savePreferences();redraw()}));
    m.appendChild(button('VOLTAR',()=>{window.removeEventListener('keydown',capture,true);options(fromPause)}));
  }
  function applyAudio(){const a=global.SNESAudio;if(!a)return;try{if(a.setBgmVolume)a.setBgmVolume(project.game.settings.music);if(a.setSfxVolume)a.setSfxVolume(project.game.settings.sfx)}catch(_){}}
  function toastIn(p,msg){let x=p.querySelector('.sgf-toast');if(!x){x=document.createElement('div');x.className='sgf-small sgf-toast';p.appendChild(x)}x.textContent=msg;setTimeout(()=>{if(x)x.textContent=''},1500)}
  function visibilityPause(){if(document.hidden&&project.game.settings.autoPause!==false&&state.screen==='gameplay')pause()}
  document.addEventListener('visibilitychange',visibilityPause);
  async function start(){defaults(project);applyTheme();const prefs=loadPreferences(project);if(prefs){if(prefs.settings)project.game.settings=Object.assign(project.game.settings,prefs.settings);if(prefs.controls)project.game.controls=Object.assign(clone(DEFAULT_CONTROLS),prefs.controls)}if(global.SNESInput&&global.SNESInput.setKeyMap)global.SNESInput.setKeyMap(project.game.controls);applyAudio();await preloadGame();if(project.game.startMode==='scene')startFirstRoute();else splash()}
  function destroy(){stopGameplay(false);if(offCheckpoint)offCheckpoint();if(offScene)offScene();document.removeEventListener('visibilitychange',visibilityPause);root.remove();hud.remove();transition.remove();window.removeEventListener('keydown',keyCapture,true)}
  function keyCapture(e){const key=(e.key||'').toLowerCase(),pauseKeys=(project.game.controls&&project.game.controls.pause)||['escape','p'];if(!pauseKeys.map(String).map(k=>k.toLowerCase()).includes(key))return;if(state.screen==='gameplay'){e.preventDefault();e.stopImmediatePropagation();pause()}else if(state.screen==='pause'){e.preventDefault();e.stopImmediatePropagation();resume()}}
  window.addEventListener('keydown',keyCapture,true);
  if(global.SNESEvents)offCheckpoint=global.SNESEvents.on('checkpoint:activated',ev=>{if(project.game.settings.autosave!==false&&state.screen==='gameplay'&&ev?.rt===currentRt()){saveSlot(state.slot);global.SNESEvents.emit('game:autosaved',{slot:state.slot,checkpoint:ev.checkpoint});}});
  if(global.SNESEvents)offScene=global.SNESEvents.on('scene:changed',ev=>{if(ev?.rt!==currentRt())return;(async()=>{ev.rt.paused=true;project.currentScene=ev.current;state.lastScene=ev.current;state.lastSnapshot=null;if(project.game.settings.autosave!==false)saveSlot(state.slot);if(project.game.loading?.sceneEnabled!==false)await preloadScene(ev.current);const ms=Math.max(0,+project.game.settings.transitionMs||260);if(project.game.settings.transition!=='none'&&ms){transition.style.transitionDuration=ms+'ms';transition.style.opacity='1';await wait(ms);transition.style.opacity='0'}const track=project.game.cutscenes?.scenes?.[ev.current];if(track&&track.length){runTimeline(track,()=>{clear();setScreen('gameplay');ev.rt.paused=false;hud.style.display=project.game.hud.enabled?'flex':'none';updateHud()})}else{clear();setScreen('gameplay');ev.rt.paused=false;hud.style.display=project.game.hud.enabled?'flex':'none';updateHud()}})().catch(err=>{ev.rt.paused=false;global.SNESLogger?.error?.('loading','Falha ao trocar cena',err)})});
  return {state,start,destroy,mainMenu,newGame,continueLatest,showSlots,playScene,routeMenu,selectRoute,pause,resume,saveSlot,gameOver,victory,credits,options,controls,intro,ending,runTimeline,preloadGame,defaults:()=>defaults(project)};
}

let active=null;
function start(project,canvas,env){if(active)active.destroy();active=create(project,canvas,env);active.start();return active}
function stop(){if(active){active.destroy();active=null}}
function getActive(){return active}

function previewCutscene(project,key,canvas){defaults(project);const c=project.game.cutscenes||{},list=(key==='intro'||key==='ending')?(c[key]||[]):((c.scenes||{})[key]||[]);if(!list.length)return false;injectStyle();const root=document.createElement('div');root.className='sgf-root';root.style.display='flex';document.body.appendChild(root);const p=document.createElement('div');p.className='sgf-screen';const h=document.createElement('div');h.className='sgf-title';h.textContent='PREVIEW CUTSCENE';const t=document.createElement('div');t.className='sgf-credits';p.append(h,t);root.appendChild(p);const timers=[];for(const a of list.slice().sort((a,b)=>a.time-b.time)){timers.push(setTimeout(()=>{if(a.type==='dialog'||a.type==='objective')t.textContent=a.value||'';if(a.type==='fade')root.animate([{opacity:1},{opacity:0},{opacity:1}],{duration:Math.max(200,(+a.duration||1)*1000)});if(a.type==='shake')p.animate([{transform:'translateX(0)'},{transform:'translateX(7px)'},{transform:'translateX(-7px)'},{transform:'translateX(0)'}],{duration:350,iterations:2})},Math.max(0,(+a.time||0)*1000)))}const end=Math.max(...list.map(a=>(+a.time||0)+(+a.duration||0)),0);timers.push(setTimeout(()=>root.remove(),end*1000+1000));root.onclick=()=>{timers.forEach(clearTimeout);root.remove()};return true}
global.SNESGameFlow={defaults,create,start,stop,getActive,loadAll,saveAll,loadPreferences,savePreferences:savePreferencesFor,previewCutscene,DEFAULT_CONTROLS};
})(typeof window!=='undefined'?window:globalThis);
