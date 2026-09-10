#!/usr/bin/env python3
"""Deterministic real-Chromium E2E using CDP. No file:// navigation required."""
import json, os, subprocess, tempfile, time, urllib.request
import websocket
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..')); port=9333
profile=tempfile.mkdtemp(prefix='snes-chrome-')
p=subprocess.Popen(['chromium','--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-allow-origins=*',f'--remote-debugging-port={port}',f'--user-data-dir={profile}','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True)
ws=None
try:
  pages=None; deadline=time.time()+8
  while time.time()<deadline:
    try: pages=json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json',timeout=.5)); break
    except Exception: time.sleep(.1)
  if not pages: raise RuntimeError('Chromium DevTools indisponível')
  os.environ['NO_PROXY']='127.0.0.1,localhost';os.environ['no_proxy']='127.0.0.1,localhost'
  ws=websocket.create_connection(pages[0]['webSocketDebuggerUrl'],timeout=20,origin='http://localhost');seq=0
  def call(method,params=None):
    global seq;seq+=1;mid=seq;ws.send(json.dumps({'id':mid,'method':method,'params':params or {}}))
    while True:
      m=json.loads(ws.recv())
      if m.get('id')==mid:return m
  call('Runtime.enable')
  files=['js/engine/event-bus.js','js/storage/storage-hub.js','js/engine/project-model.js','js/engine/tilemap.js','js/engine/entity-components.js','js/engine/entity-world.js','js/engine/animator-controller.js','js/engine/input-manager.js','js/engine/camera.js','js/engine/collision.js','js/engine/animation.js','js/engine/quality-manager.js','js/engine/profiler.js','js/engine/runtime-session.js','js/engine/studio-runtime.js','js/engine/save-manager.js','js/game/quest-system.js','js/game/state-machine.js','js/game/game-flow.js','js/engine/upgrades.js','js/engine/inventory.js','js/genres/kart-racing/track-data.js','js/genres/kart-racing/items.js','js/runtimes/platform/platform-runtime.js','js/runtimes/topdown/topdown-runtime.js','js/runtimes/shooter/shooter-runtime.js','js/genres/kart-racing/kart-runtime.js','js/runtimes/metroidvania/metroidvania-runtime.js','js/runtimes/beat-em-up/beat-em-up-runtime.js','js/engine/engine.js','js/export/export-sources.js','js/export/html-exporter.js']
  # Browser is the JS engine under test: inject exact project sources.
  for f in files:
    src=open(os.path.join(ROOT,f),encoding='utf-8').read()+f'\n//# sourceURL={f}'
    r=call('Runtime.evaluate',{'expression':src})
    if r.get('result',{}).get('exceptionDetails'): raise RuntimeError(f+' load failed: '+str(r['result']['exceptionDetails']))
  expr=r'''(async()=>{const steps=[],ok=(n,c)=>{if(!c)throw Error(n);steps.push(n)};
const blank=()=>Array.from({length:18},()=>Array(32).fill(0)),mkScene=(id)=>({id,name:id,themeId:'test',entities:[],tilemap:{tileSize:16,chunkCols:32,chunkRows:18,chunks:{'0,0':{x:0,y:0,layers:{background:blank(),ground:blank(),decoration:blank(),foreground:blank(),collision:null}}}}});
let raw={name:'E2E Project',gameType:'platform',settings:{type:'platform'},scenes:[mkScene('scene1'),mkScene('scene2')],currentScene:'scene1',studio:{assets:[],animations:[],prefabs:[]},game:{}};let p=SNESProjectModel.migrate(raw).project;ok('project_migration',p.schemaVersion===10&&p.version==='1.0.1');
let s=p.scenes[0];SNESTileMap.set(s,'ground',528,32,7);ok('tilemap_chunk_paint',SNESTileMap.at(s,'ground',528,32).value===7&&!!s.tilemap.chunks['1,0']);
const player={id:'player1',type:'player',x:32,y:180,hp:3,speed:120,jump:280},enemy={id:'enemy1',type:'enemy',x:100,y:180,hp:2,damage:1,speed:20};SNESEntityComponents.ensure(player);SNESEntityComponents.ensure(enemy);s.entities.push(player,enemy);ok('canonical_components',player.components.health.current===3&&enemy.components.combat.damage===1);
const w=SNESEntityWorld.create({entities:s.entities});ok('entityworld_query',w.queryComponent('health').length===2);w.destroy(enemy.id);w.flush();ok('entityworld_destroy',!w.get(enemy.id));
const ctrl={initial:'Idle',parameters:{moving:{type:'bool',default:false},attack:{type:'trigger'}},states:{Idle:{animationId:'idle',transitions:[{to:'Walk',conditions:[{param:'moving',op:'==',value:true}]}]},Walk:{animationId:'walk',transitions:[{to:'Attack',conditions:[{param:'attack',op:'trigger'}]}]},Attack:{animationId:'attack',frames:[0,1],fps:10,loop:false,hitboxes:[{frame:1,type:'attack',x:8,y:0,w:12,h:10}]}}};const ar=SNESAnimatorController.create(ctrl);SNESAnimatorController.set(ar,'moving',true);SNESAnimatorController.update(ar,.02);SNESAnimatorController.trigger(ar,'attack');SNESAnimatorController.update(ar,.02);SNESAnimatorController.update(ar,.11);ok('animator_controller',ar.state==='Attack'&&ar.activeHitboxes.length===1);
SNESSave.saveEditor(p);const loaded=SNESSave.loadEditor();ok('save_reload',loaded.scenes.length===2&&loaded.version==='1.0.1');SNESSave.saveGameSlot(p,1,{sceneId:'scene1',position:{x:32,y:180},inventory:{coin:2},flags:{gate:true},quests:{q1:'active'},playTimeMs:1234});ok('save_game_slot',SNESSave.loadGameSlot(p,1).inventory.coin===2);
const theme={tiles:[{solid:false},{solid:true},{solid:false},{solid:false},{solid:false},{solid:false},{solid:false},{solid:false}]},themes={test:theme};for(let x=0;x<32;x++)SNESTileMap.set(s,'ground',x*16,17*16,1);
const prt=PlatformRuntime.createState(p,'scene1');const x0=prt.player.x;prt.input.touch.right=true;for(let i=0;i<12;i++){prt.input.beginFrame?.();PlatformRuntime.tick(prt,themes,{},1/60,performance.now());prt.input.endFrame?.()}prt.input.touch.right=false;ok('platform_move',prt.player.x>x0);prt.paused=true;const px=prt.player.x;PlatformRuntime.tick(prt,themes,{},1/30,performance.now());ok('pause_resume',prt.player.x===px);prt.paused=false;PlatformRuntime.switchScene(prt,'scene2');ok('scene_switch',prt.sceneId==='scene2');prt.player.checkpoint={x:55,y:66,sceneId:'scene2'};prt.player.x=55;prt.player.y=400;prt.player.hp=0;PlatformRuntime.tick(prt,themes,{},1/60,performance.now());ok('checkpoint_respawn',prt.player.hp>0&&prt.player.checkpoint.sceneId==='scene2');
SNESGameFlow.defaults(p);p.game.campaign=['scene1','scene2'];p.game.flowGraph={nodes:[{id:'scene1'},{id:'scene2'}],edges:[{from:'scene1',to:'scene2',condition:{type:'flag',key:'gate',value:true}}]};p.game.flags={gate:true};ok('game_flow_graph',p.game.flowGraph.edges[0].condition.type==='flag');
const genres={platform:PlatformRuntime,topdown:TopdownRuntime,shooter:ShooterRuntime,kart:KartRuntime,metroidvania:MetroidvaniaRuntime,'beat-em-up':BeatEmUpRuntime};for(const [name,R] of Object.entries(genres)){const gp=SNESProjectModel.clone(p);gp.gameType=name==='kart'?'kart-racing':name;gp.settings.type=gp.gameType;let rt=R.createState(gp,'scene1');ok('genre_'+name,!!rt&&!!rt.player)}
const cam=SNESCamera.create({worldW:1000,worldH:600,viewW:512,viewH:288,zoom:1,regions:[{id:'r',x:0,y:0,w:700,h:400}]});SNESCamera.panTo(cam,300,200,.2);for(let i=0;i<20;i++)SNESCamera.update(cam,{x:32,y:32},.02);ok('camera_cinematic',Number.isFinite(cam.x)&&cam.zoom===1);
const prof=SNESProfiler;prof.begin();prof.startSpan('physics');for(let i=0;i<10000;i++)Math.sqrt(i);prof.endSpan('physics');prof.counter('entities',2);const ps=prof.end({entities:2});ok('profiler',ps.spans.physics>=0&&ps.counters.entities===2);
const canvas=document.createElement('canvas');canvas.width=512;canvas.height=288;document.body.appendChild(canvas);const ctx=canvas.getContext('2d');PlatformRuntime.drawFrame(ctx,prt,themes,{},null);ok('render',canvas.width===512);
const exported=HTMLExporter.build(p,themes,{});ok('html_export_build',exported.includes('SNESGameFlow')&&exported.includes('EntityWorld'));const frame=document.createElement('iframe');let exportErr='';frame.addEventListener('load',()=>{try{frame.contentWindow.addEventListener('error',e=>{exportErr=String(e.message||e.error||'error')})}catch(_){}});frame.srcdoc=exported;document.body.appendChild(frame);await new Promise(r=>setTimeout(r,900));ok('html_export_open',!!frame.contentWindow.SNESEngine&&!!frame.contentDocument.querySelector('#game')&&!exportErr);frame.remove();
return {pass:true,steps,genres:Object.keys(genres).length};})()'''
  r=call('Runtime.evaluate',{'expression':expr,'awaitPromise':True,'returnByValue':True});res=r.get('result',{});rr=res.get('result',{})
  if res.get('exceptionDetails'): raise RuntimeError(rr.get('description') or str(res['exceptionDetails']))
  val=rr.get('value');
  if not val or not val.get('pass'): raise RuntimeError('E2E não retornou PASS')
  print('BROWSER_E2E_PASS '+json.dumps(val,ensure_ascii=False))
finally:
  try:
    if ws:ws.close()
  except:pass
  p.terminate()
  try:p.wait(timeout=3)
  except:p.kill()
