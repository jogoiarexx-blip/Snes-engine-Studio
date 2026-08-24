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
  g.settings=Object.assign({music:0.7,sfx:1,fullscreen:false,pixelPerfect:true,difficulty:'normal'},g.settings||{});
  g.controls=Object.assign(clone(DEFAULT_CONTROLS),g.controls||{});
  g.intro=Object.assign({enabled:false,title:'INTRODUÇÃO',text:'Uma nova aventura começa...'},g.intro||{});
  g.ending=Object.assign({title:'FIM',text:'Obrigado por jogar!'},g.ending||{});
  g.saveSlots=Math.max(1,Math.min(9,Number(g.saveSlots)||3));
  if(!Array.isArray(g.campaign)||!g.campaign.length)g.campaign=(project.scenes||[]).map(s=>s.id);
  g.objectives=g.objectives||{};
  g.ui=Object.assign({accent:'#ffd45e',panel:'#101526',text:'#ffffff',button:'#182541',menuAlign:'center',menuX:50,menuY:50,hudScale:1,pauseOpacity:.94},g.ui||{});
  g.cutscenes=g.cutscenes||{intro:[],ending:[],scenes:{}};g.cutscenes.intro=g.cutscenes.intro||[];g.cutscenes.ending=g.cutscenes.ending||[];g.cutscenes.scenes=g.cutscenes.scenes||{};
  return g;
}
function storageKey(project){return 'snes_gameflow_'+slug(project.id||project.name)}
function loadAll(project){const id=storageKey(project);if(globalThis.SNESStorage?.saves)return globalThis.SNESStorage.saves.get(id)||{slots:{}};try{return JSON.parse(localStorage.getItem(id)||'{"slots":{}}')}catch(_){return {slots:{}}}}
function saveAll(project,data){const id=storageKey(project);if(globalThis.SNESStorage?.saves){globalThis.SNESStorage.saves.set(id,data);return true}try{localStorage.setItem(id,JSON.stringify(data));return true}catch(_){return false}}
function prefKey(project){return storageKey(project)+'_preferences'}
function loadPreferences(project){const id=prefKey(project);if(globalThis.SNESStorage?.preferences)return globalThis.SNESStorage.preferences.get(id,null);try{return JSON.parse(localStorage.getItem(id)||'null')}catch(_){return null}}
function savePreferencesFor(project){const id=prefKey(project),value={settings:project.game.settings,controls:project.game.controls};if(globalThis.SNESStorage?.preferences){globalThis.SNESStorage.preferences.set(id,value);return true}try{localStorage.setItem(id,JSON.stringify(value));return true}catch(_){return false}}
function fmtTime(sec){sec=Math.max(0,sec|0);const h=(sec/3600)|0,m=((sec%3600)/60)|0,s=sec%60;return (h?String(h).padStart(2,'0')+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}

const CSS=`
.sgf-root{position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;pointer-events:none;font-family:monospace;color:var(--sgf-text,#fff);text-shadow:2px 2px #000;background:transparent}
.sgf-root *{box-sizing:border-box}.sgf-screen{pointer-events:auto;min-width:min(86vw,540px);max-width:90vw;padding:28px;background:linear-gradient(color-mix(in srgb,var(--sgf-panel,#101526) 94%,transparent),#070a12f4);border:3px solid #d7e5ff;box-shadow:0 0 0 4px #1d2944,0 18px 70px #000b;text-align:center}
.sgf-title{font-size:clamp(25px,5vw,48px);font-weight:900;color:var(--sgf-accent,#ffd45e);margin:0 0 8px;letter-spacing:2px}.sgf-sub{opacity:.78;margin-bottom:22px}.sgf-menu{display:grid;gap:8px;max-width:330px;margin:auto}.sgf-btn{font:700 16px monospace;padding:10px 16px;border:2px solid #8aa4d6;background:var(--sgf-button,#182541);color:var(--sgf-text,#fff);cursor:pointer}.sgf-btn:hover,.sgf-btn:focus{background:#315082;outline:none}.sgf-btn[disabled]{opacity:.35;cursor:default}.sgf-small{font-size:12px;opacity:.75}.sgf-slots{display:grid;gap:8px}.sgf-slot{padding:12px;text-align:left;border:2px solid #536b96;background:#101a2d;cursor:pointer}.sgf-slot:hover{background:#20375d}.sgf-row{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap}.sgf-hud{position:fixed;top:12px;left:12px;right:12px;display:flex;justify-content:space-between;pointer-events:none;font:700 14px monospace;z-index:9997}.sgf-chip{background:#07101bcc;border:2px solid #ffffff55;padding:5px 9px}.sgf-hp{width:130px;height:10px;border:1px solid #fff8;background:#200}.sgf-hp>i{display:block;height:100%;background:#e34242}.sgf-credits{white-space:pre-line;line-height:1.7;max-height:55vh;overflow:auto}.sgf-loading{font-size:18px}.sgf-progress{height:12px;background:#000;border:1px solid #fff;margin-top:12px}.sgf-progress i{display:block;height:100%;background:#5fb0ff}.sgf-setting{display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:left;margin:8px 0}.sgf-setting input,.sgf-setting select{width:100%}
`;
function injectStyle(){if(document.getElementById('snesGameFlowStyle'))return;const s=document.createElement('style');s.id='snesGameFlowStyle';s.textContent=CSS;document.head.appendChild(s)}
function button(text,fn,disabled){const b=document.createElement('button');b.className='sgf-btn';b.textContent=text;b.disabled=!!disabled;b.onclick=fn;return b}

function create(project,canvas,env){
  const definitionProject=project;
  const session=global.SNESRuntimeSession?global.SNESRuntimeSession.create(project):{definition:project,project:clone(project)};
  project=session.project; defaults(project); injectStyle(); env=env||{};
  const state={project,definitionProject,session,canvas,env,screen:'boot',handle:null,slot:1,startedAt:0,elapsed:0,root:null,hud:null,paused:false,lastScene:null};
  const machine=global.SNESGameStateMachine?global.SNESGameStateMachine.create(state):null;
  if(machine){['boot','splash','menu','slots','gameplay','pause','options','controls','gameover','victory','cutscene','intro','ending','credits'].forEach(name=>machine.register(name,{enter(ctx){ctx.screen=name}}));state.machine=machine;}
  const root=document.createElement('div');root.className='sgf-root';root.style.display='none';document.body.appendChild(root);state.root=root;
  const hud=document.createElement('div');hud.className='sgf-hud';hud.style.display='none';document.body.appendChild(hud);state.hud=hud;

  function clear(){root.innerHTML='';root.style.display='none'}
  function panel(title,sub){clear();root.style.display='flex';const p=document.createElement('div');p.className='sgf-screen';if(title){const h=document.createElement('div');h.className='sgf-title';h.textContent=title;p.appendChild(h)}if(sub){const q=document.createElement('div');q.className='sgf-sub';q.textContent=sub;p.appendChild(q)}root.appendChild(p);return p}
  function menuBox(p){const m=document.createElement('div');m.className='sgf-menu';p.appendChild(m);return m}
  function setScreen(x){state.screen=x;if(machine&&machine.name!==x)machine.change(x).catch?.(e=>global.SNESLogger?.error?.('gameflow','Falha ao trocar estado',e))}
  function assetUrl(id){const a=project.studio&&project.studio.assets&&project.studio.assets.find(x=>x.id===id);return a&&(a.dataUrl||a.url)||''}
  function applyTheme(){const u=project.game.ui||{};root.style.setProperty('--sgf-accent',u.accent||'#ffd45e');root.style.setProperty('--sgf-panel',u.panel||'#101526');root.style.setProperty('--sgf-text',u.text||'#fff');root.style.setProperty('--sgf-button',u.button||'#182541');hud.style.transform='scale('+(u.hudScale||1)+')';hud.style.transformOrigin='top left'}
  function saves(){return loadAll(project)}
  function hasAnySave(){const d=saves();return Object.keys(d.slots||{}).some(k=>d.slots[k]&&d.slots[k].sceneId)}
  function currentRt(){return state.handle&&state.handle.rt}
  function savePreferences(){return savePreferencesFor(project)}
  function snapshot(){const rt=currentRt(),p=rt&&rt.player||{};return {sceneId:project.currentScene,checkpoint:p.checkpoint||null,player:{x:p.x,y:p.y,hp:p.hp,maxHp:p.maxHp,score:p.score||state.handle?.rt?.score||0,coins:p.coins||0,keys:p.keys||0},flags:clone(project.studio&&project.studio.flags||{}),variables:clone(project.studio&&project.studio.variables||{}),inventory:clone(project.inventory||null),upgrades:clone(project.upgrades||null),playTime:Math.floor(state.elapsed+(state.startedAt?(performance.now()-state.startedAt)/1000:0)),savedAt:Date.now()}}
  function saveSlot(n){const d=saves();d.slots=d.slots||{};d.slots[n]=snapshot();saveAll(project,d);state.slot=n;return d.slots[n]}
  function deleteSlot(n){const d=saves();if(d.slots)delete d.slots[n];saveAll(project,d)}
  function applySave(s){if(!s)return; project.currentScene=s.sceneId||project.game.startScene;if(project.studio){if(s.flags)project.studio.flags=clone(s.flags);if(s.variables)project.studio.variables=clone(s.variables)}if(s.inventory)project.inventory=clone(s.inventory);if(s.upgrades)project.upgrades=clone(s.upgrades);state.elapsed=s.playTime||0;state.pendingPlayer=s.player||null}

  function splash(){setScreen('splash');const g=project.game.splash;if(!g.enabled){mainMenu();return}const p=panel(g.title||project.name,g.subtitle||'');const sm=document.createElement('div');sm.className='sgf-small';sm.textContent='SNES ENGINE STUDIO';p.appendChild(sm);setTimeout(()=>{if(state.screen==='splash')mainMenu()},Math.max(300,g.duration||1300))}
  function mainMenu(){stopGameplay(false);setScreen('menu');hud.style.display='none';const g=project.game.mainMenu;const p=panel(g.title||project.name,g.subtitle);const u=project.game.ui||{};p.style.position='absolute';p.style.left=(u.menuX||50)+'%';p.style.top=(u.menuY||50)+'%';p.style.transform='translate(-50%,-50%)';p.style.textAlign=u.menuAlign||'center';const bg=assetUrl(g.background);if(bg){root.style.backgroundImage='linear-gradient(#0006,#0008),url('+JSON.stringify(bg)+')';root.style.backgroundSize='cover';root.style.backgroundPosition='center'}else root.style.backgroundImage='none';const m=menuBox(p);m.appendChild(button('NOVO JOGO',()=>showSlots('new')));if(g.showContinue)m.appendChild(button('CONTINUAR',continueLatest,!hasAnySave()));if(g.showOptions)m.appendChild(button('OPÇÕES',options));if(g.showCredits)m.appendChild(button('CRÉDITOS',credits));}
  function showSlots(mode){setScreen('slots');const p=panel(mode==='new'?'NOVO JOGO':'CARREGAR JOGO','Selecione um arquivo');const d=saves();const wrap=document.createElement('div');wrap.className='sgf-slots';p.appendChild(wrap);for(let i=1;i<=project.game.saveSlots;i++){const s=d.slots&&d.slots[i];const el=document.createElement('div');el.className='sgf-slot';el.innerHTML='<b>SLOT '+i+'</b><div class="sgf-small">'+(s?(sceneName(s.sceneId)+' · '+fmtTime(s.playTime||0)):'Vazio')+'</div>';el.onclick=()=>{state.slot=i;if(mode==='new'){if(s&&!confirm('Substituir este save?'))return;newGame(i)}else if(s){applySave(s);playScene(project.currentScene)}};wrap.appendChild(el)}const m=menuBox(p);m.appendChild(button('VOLTAR',mainMenu));if(mode!=='new')m.appendChild(button('APAGAR SLOT ATUAL',()=>{deleteSlot(state.slot);showSlots(mode)}));}
  function continueLatest(){const d=saves(),list=Object.keys(d.slots||{}).map(k=>({k:+k,s:d.slots[k]})).filter(x=>x.s&&x.s.sceneId).sort((a,b)=>(b.s.savedAt||0)-(a.s.savedAt||0));if(!list.length)return;state.slot=list[0].k;applySave(list[0].s);playScene(project.currentScene)}
  function newGame(slot){state.slot=slot||1;state.elapsed=0;project.currentScene=project.game.startScene||(project.game.campaign||[])[0]||project.currentScene;if(project.studio){project.studio.flags={};project.studio.variables={}};state.pendingPlayer=null;saveSlot(state.slot);if(project.game.intro.enabled)intro();else playScene(project.currentScene,true)}
  function sceneName(id){const s=(project.scenes||[]).find(x=>x.id===id);return s?s.name:id||'Fase'}
  function nextScene(id){const arr=project.game.campaign||[];const i=arr.indexOf(id);return i>=0&&i+1<arr.length?arr[i+1]:null}

  function playScene(id,isNew,skipSceneCutscene){
    if(!global.SNESEngine){console.error('SNESEngine missing');return}
    const target=id||project.game.startScene;
    // Timelines associadas a uma cena agora são realmente executadas antes do gameplay.
    // skipSceneCutscene evita recursão quando a própria timeline termina.
    const sceneTrack=project.game.cutscenes&&project.game.cutscenes.scenes&&project.game.cutscenes.scenes[target];
    if(!skipSceneCutscene&&sceneTrack&&sceneTrack.length){
      stopGameplay(false);project.currentScene=target;
      runTimeline(sceneTrack,()=>playScene(project.currentScene||target,isNew,true));
      return;
    }
    stopGameplay(false);project.currentScene=target;clear();setScreen('gameplay');state.lastScene=project.currentScene;state.startedAt=performance.now();state.paused=false;
    const h=global.SNESEngine.play(project,canvas,env.themes||{},env.enemyVariants||{},env.skeletonDraw||null,{
      onStop:function(){},
      onFrame:function(){ if(state.screen==='gameplay') updateHud(); },
      onGameOver:function(){ if(state.screen==='gameplay'){ stopGameplay(true); gameOver(); } },
      onWon:function(){ if(state.screen==='gameplay'){ stopGameplay(true); victory(); } }
    });state.handle=h;
    if(h&&h.rt){h.rt.__externalUi=true;if(state.pendingPlayer){Object.assign(h.rt.player,state.pendingPlayer);state.pendingPlayer=null}}
    hud.style.display=project.game.hud.enabled?'flex':'none';updateHud();
  }
  function stopGameplay(accumulate){if(accumulate&&state.startedAt)state.elapsed+=(performance.now()-state.startedAt)/1000;state.startedAt=0;if(state.handle&&global.SNESEngine&&global.SNESEngine.getActive&&global.SNESEngine.getActive())global.SNESEngine.stop();state.handle=null;hud.style.display='none'}
  function updateHud(){const rt=currentRt(),p=rt&&rt.player||{};if(!rt)return;const g=project.game.hud;let left='',right='';if(g.showHp&&p.hp!=null){const max=Math.max(1,p.maxHp||p.hp||1),pct=Math.max(0,Math.min(100,100*p.hp/max));left+='<span class="sgf-chip">HP '+p.hp+'/'+max+' <span class="sgf-hp"><i style="width:'+pct+'%"></i></span></span>'}if(g.showScene)left+='<span class="sgf-chip">'+sceneName(project.currentScene)+'</span>';const obj=project.game.objectives&&project.game.objectives[project.currentScene];if(obj)left+='<span class="sgf-chip">🎯 '+String(obj).replace(/</g,'&lt;')+'</span>';if(g.showScore){const score=p.score!=null?p.score:(rt.score||0);right+='<span class="sgf-chip">PTS '+score+'</span>'}if(g.showCoins&&p.coins!=null)right+='<span class="sgf-chip">🪙 '+p.coins+'</span>';hud.innerHTML='<div class="sgf-row">'+left+'</div><div class="sgf-row">'+right+'</div>'}

  function pause(){if(!project.game.pause.enabled||state.screen!=='gameplay')return;const rt=currentRt();if(rt)rt.paused=true;state.paused=true;setScreen('pause');const p=panel('PAUSADO',sceneName(project.currentScene));const m=menuBox(p);m.appendChild(button('CONTINUAR',resume));if(project.game.pause.allowSave)m.appendChild(button('SALVAR',()=>{saveSlot(state.slot);toastIn(p,'Jogo salvo.')}));if(project.game.pause.allowRestart)m.appendChild(button('REINICIAR FASE',()=>{state.pendingPlayer=null;playScene(project.currentScene)}));if(project.game.pause.allowOptions)m.appendChild(button('OPÇÕES',()=>options(true)));m.appendChild(button('MENU PRINCIPAL',()=>{saveSlot(state.slot);mainMenu()}));}
  function resume(){clear();setScreen('gameplay');const rt=currentRt();if(rt)rt.paused=false;state.paused=false;hud.style.display=project.game.hud.enabled?'flex':'none'}
  function gameOver(){setScreen('gameover');const p=panel(project.game.gameOver.title,'');const m=menuBox(p);if(project.game.gameOver.retry)m.appendChild(button('TENTAR NOVAMENTE',()=>playScene(state.lastScene)));if(project.game.gameOver.load)m.appendChild(button('CARREGAR',()=>showSlots('load')));if(project.game.gameOver.menu)m.appendChild(button('MENU PRINCIPAL',mainMenu))}
  function victory(){saveSlot(state.slot);setScreen('victory');const next=nextScene(state.lastScene),p=panel(project.game.victory.title,sceneName(state.lastScene));const m=menuBox(p);if(next&&project.game.victory.next)m.appendChild(button('PRÓXIMA FASE',()=>{project.currentScene=next;playScene(next)}));else m.appendChild(button('VER FINAL / CRÉDITOS',ending));if(project.game.victory.menu)m.appendChild(button('MENU PRINCIPAL',mainMenu))}
  function runTimeline(list,done){list=(list||[]).slice().sort((a,b)=>(+a.time||0)-(+b.time||0));if(!list.length){done&&done();return}setScreen('cutscene');const p=panel('CUTSCENE','');const text=document.createElement('div');text.className='sgf-credits';p.appendChild(text);const started=performance.now(),timers=[];function action(a){if(a.type==='dialog'||a.type==='objective'){text.textContent=a.value||''}else if(a.type==='fade'){root.style.transition='opacity '+Math.max(.1,+a.duration||1)+'s';root.style.opacity='0';setTimeout(()=>root.style.opacity='1',Math.max(100,(+a.duration||1)*500))}else if(a.type==='shake'){p.animate([{transform:'translate(0,0)'},{transform:'translate(6px,-3px)'},{transform:'translate(-5px,3px)'},{transform:'translate(0,0)'}],{duration:Math.max(150,(+a.duration||.4)*1000),iterations:2})}else if(a.type==='setFlag'){project.studio=project.studio||{};project.studio.flags=project.studio.flags||{};project.studio.flags[a.value||'flag']=true}else if(a.type==='movePlayer'){state.pendingPlayer=Object.assign({},state.pendingPlayer||{}, {x:+a.x||0,y:+a.y||0})}else if(a.type==='gotoScene'){if(a.value)project.currentScene=a.value}}for(const a of list)timers.push(setTimeout(()=>action(a),Math.max(0,(+a.time||0)*1000)));const end=Math.max(...list.map(a=>(+a.time||0)+(+a.duration||0)),0);timers.push(setTimeout(()=>{root.style.opacity='1';done&&done()},Math.max(200,end*1000+250)));const m=menuBox(p);m.appendChild(button('PULAR',()=>{timers.forEach(clearTimeout);root.style.opacity='1';done&&done()}))}
  function intro(){const tl=project.game.cutscenes&&project.game.cutscenes.intro;if(tl&&tl.length){runTimeline(tl,()=>playScene(project.currentScene,true));return}setScreen('intro');const p=panel(project.game.intro.title,'');const t=document.createElement('div');t.className='sgf-credits';t.textContent=project.game.intro.text;p.appendChild(t);const m=menuBox(p);m.appendChild(button('COMEÇAR',()=>playScene(project.currentScene,true)));m.appendChild(button('PULAR',()=>playScene(project.currentScene,true)))}
  function ending(){const tl=project.game.cutscenes&&project.game.cutscenes.ending;if(tl&&tl.length){runTimeline(tl,credits);return}setScreen('ending');const p=panel(project.game.ending.title,'');const t=document.createElement('div');t.className='sgf-credits';t.textContent=project.game.ending.text;p.appendChild(t);const m=menuBox(p);m.appendChild(button('CRÉDITOS',credits));m.appendChild(button('MENU PRINCIPAL',mainMenu))}
  function credits(){setScreen('credits');const p=panel(project.game.credits.title,'');const t=document.createElement('div');t.className='sgf-credits';t.textContent=project.game.credits.text||'';p.appendChild(t);const m=menuBox(p);m.appendChild(button('VOLTAR',mainMenu))}
  function options(fromPause){setScreen('options');const g=project.game.settings,p=panel('OPÇÕES','');const form=document.createElement('div');form.innerHTML='<div class="sgf-setting"><label>Música</label><input id="sgfMusic" type="range" min="0" max="1" step=".05" value="'+g.music+'"></div><div class="sgf-setting"><label>Efeitos</label><input id="sgfSfx" type="range" min="0" max="1" step=".05" value="'+g.sfx+'"></div><div class="sgf-setting"><label>Dificuldade</label><select id="sgfDiff"><option value="easy">Fácil</option><option value="normal">Normal</option><option value="hard">Difícil</option></select></div><div class="sgf-setting"><label>Pixel Perfect</label><input id="sgfPixel" type="checkbox" '+(g.pixelPerfect?'checked':'')+'></div>';p.appendChild(form);form.querySelector('#sgfDiff').value=g.difficulty;form.querySelector('#sgfMusic').oninput=e=>{g.music=+e.target.value;applyAudio();savePreferences()};form.querySelector('#sgfSfx').oninput=e=>{g.sfx=+e.target.value;applyAudio();savePreferences()};form.querySelector('#sgfDiff').onchange=e=>{g.difficulty=e.target.value;savePreferences()};form.querySelector('#sgfPixel').onchange=e=>{g.pixelPerfect=e.target.checked;canvas.style.imageRendering=g.pixelPerfect?'pixelated':'auto';savePreferences()};const m=menuBox(p);m.appendChild(button('CONTROLES',()=>controls(fromPause)));m.appendChild(button('TELA CHEIA',()=>{document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen()}));m.appendChild(button('VOLTAR',fromPause?pause:mainMenu));}
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
  function start(){defaults(project);applyTheme();const prefs=loadPreferences(project);if(prefs){if(prefs.settings)project.game.settings=Object.assign(project.game.settings,prefs.settings);if(prefs.controls)project.game.controls=Object.assign(clone(DEFAULT_CONTROLS),prefs.controls)}if(global.SNESInput&&global.SNESInput.setKeyMap)global.SNESInput.setKeyMap(project.game.controls);applyAudio();if(project.game.startMode==='scene')playScene(project.game.startScene);else splash()}
  function destroy(){stopGameplay(false);root.remove();hud.remove();window.removeEventListener('keydown',keyCapture,true)}
  function keyCapture(e){const key=(e.key||'').toLowerCase(),pauseKeys=(project.game.controls&&project.game.controls.pause)||['escape','p'];if(!pauseKeys.map(String).map(k=>k.toLowerCase()).includes(key))return;if(state.screen==='gameplay'){e.preventDefault();e.stopImmediatePropagation();pause()}else if(state.screen==='pause'){e.preventDefault();e.stopImmediatePropagation();resume()}}
  window.addEventListener('keydown',keyCapture,true);
  return {state,start,destroy,mainMenu,newGame,continueLatest,showSlots,playScene,pause,resume,saveSlot,gameOver,victory,credits,options,controls,intro,ending,runTimeline,defaults:()=>defaults(project)};
}

let active=null;
function start(project,canvas,env){if(active)active.destroy();active=create(project,canvas,env);active.start();return active}
function stop(){if(active){active.destroy();active=null}}
function getActive(){return active}

function previewCutscene(project,key,canvas){defaults(project);const c=project.game.cutscenes||{},list=(key==='intro'||key==='ending')?(c[key]||[]):((c.scenes||{})[key]||[]);if(!list.length)return false;injectStyle();const root=document.createElement('div');root.className='sgf-root';root.style.display='flex';document.body.appendChild(root);const p=document.createElement('div');p.className='sgf-screen';const h=document.createElement('div');h.className='sgf-title';h.textContent='PREVIEW CUTSCENE';const t=document.createElement('div');t.className='sgf-credits';p.append(h,t);root.appendChild(p);const timers=[];for(const a of list.slice().sort((a,b)=>a.time-b.time)){timers.push(setTimeout(()=>{if(a.type==='dialog'||a.type==='objective')t.textContent=a.value||'';if(a.type==='fade')root.animate([{opacity:1},{opacity:0},{opacity:1}],{duration:Math.max(200,(+a.duration||1)*1000)});if(a.type==='shake')p.animate([{transform:'translateX(0)'},{transform:'translateX(7px)'},{transform:'translateX(-7px)'},{transform:'translateX(0)'}],{duration:350,iterations:2})},Math.max(0,(+a.time||0)*1000)))}const end=Math.max(...list.map(a=>(+a.time||0)+(+a.duration||0)),0);timers.push(setTimeout(()=>root.remove(),end*1000+1000));root.onclick=()=>{timers.forEach(clearTimeout);root.remove()};return true}
global.SNESGameFlow={defaults,create,start,stop,getActive,loadAll,saveAll,loadPreferences,savePreferences:savePreferencesFor,previewCutscene,DEFAULT_CONTROLS};
})(typeof window!=='undefined'?window:globalThis);
