/* Physical forks: geometry, collision, guardrails, saves and exported config. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const forks=require('../js/game/physical-forks.js');
const routes=require('../js/game/stage-routes.js');
const brief=require('../js/editor/gameforge-brief.js');
let pass=0;function t(name,fn){fn();pass++;console.log('PASS',name);}
function scene(id){
 const ground=Array.from({length:18},()=>Array(32).fill(0));
 return {id,name:id,themeId:'floresta',map:ground,layers:{ground},
 entities:[{id:'player',type:'player',x:32,y:220,hp:5},
 {id:'e',type:'enemy',x:210,y:205,hp:2,speed:36}]};
}
function project(type='topdown',stages=3){return {name:'Rotas físicas',gameType:type,
 settings:{},scenes:Array.from({length:stages},(_,i)=>scene('scene'+(i+1))),game:{}};}
function walkable(map,start,end){
 const dirs=[[0,1],[0,-1],[1,0],[-1,0]],q=[start],seen=new Set([start.join(',')]);
 while(q.length){const [x,y]=q.shift();if(x===end[0]&&y===end[1])return true;
  for(const [dx,dy] of dirs){const xx=x+dx,yy=y+dy,k=xx+','+yy;
   if(xx<=0||xx>=31||yy<=0||yy>=17||map[yy][xx]!==0||seen.has(k))continue;
   seen.add(k);q.push([xx,yy]);}}
 return false;
}
t('Parser exige mapa físico, sem alterar o comando antigo',()=>{
 assert.equal(forks.parse('3 caminhos diferentes',routes.parse('3 caminhos')),null);
 const c=forks.parse('3 caminhos no mesmo mapa e passagem secreta',routes.parse('3 caminhos e secreto'));
 assert.deepEqual(c.choices,['high','middle','low']);assert.equal(c.secret,true);
});
t('Top-down possui hall e 3 corredores atravessáveis fisicamente',()=>{
 const p=project();forks.build(p,forks.parse('3 bifurcações e segredo'));
 assert.equal(p.scenes.length,3);assert.equal(p.game.stageRoutes,undefined);
 assert.equal(p.game.physicalForks.groups.length,3);
 const s=p.scenes[0],col=s.layers.collision;
 for(const y of [2,6,10]){
  assert.ok(walkable(col,[2,6],[12,y]),'entrada da rota '+y);
  assert.ok(walkable(col,[12,y],[29,y]),'saída da rota '+y);
 }
 assert.equal(walkable(col,[2,6],[12,14]),false,'o segredo bloqueado tem parede de colisão');
 assert.equal(s.entities.filter(e=>e.event==='forkExit').length,4);
 assert.equal(s.entities.filter(e=>e.event==='forkCheckpoint').length,4);
 assert.ok(col[10][17]!==0,'obstáculo no centro da rota inferior');
});
t('Plataforma cria quatro corredores reais na mesma cena e portais de acesso',()=>{
 const p=project('platform',3);
 forks.build(p,forks.parse('3 caminhos no mesmo mapa e secreto'));
 assert.equal(p.scenes.length,3);
 const s=p.scenes[0],m=s.layers.ground;
 assert.ok(m[4][19]!==0&&m[8][19]!==0&&m[12][17]!==0);
 assert.equal(s.entities.filter(e=>e.event==='forkGate').length,4);
 assert.equal(s.entities.filter(e=>e.event==='forkExit').length,4);
 assert.ok(m.slice(0,18).every(row=>row[10]!==0));
});
t('Checkpoint bloqueia troca de rota, e portal leva fisicamente ao corredor',()=>{
 const p=project('platform');forks.build(p,forks.parse('3 caminhos no mesmo mapa'));
 const rt={project:p,sceneId:'scene1',player:{x:40,y:238,hp:5,routeChoice:null,vx:30,vy:20},__forkUnlockCount:0};
 const high=p.scenes[0].entities.find(e=>e.event==='forkGate'&&e.forkId==='high');
 assert.equal(forks.enter(rt,high),true);
 assert.equal(rt.player.routeChoice,'high');assert.equal(rt.player.x,182);
 assert.ok(rt.player.checkpoint?.sceneId==='scene1');
 const other=p.scenes[0].entities.find(e=>e.event==='forkCheckpoint'&&e.forkId==='middle');
 assert.equal(forks.checkpoint(rt,other),false);
 const exitHigh=p.scenes[0].entities.find(e=>e.event==='forkExit'&&e.forkId==='high');
 const exitLow=p.scenes[0].entities.find(e=>e.event==='forkExit'&&e.forkId==='low');
 assert.equal(forks.exit(rt,exitLow),false);
 assert.equal(forks.exit(rt,exitHigh),true);
 assert.equal(rt.won,true);
});
t('Segredo só desbloqueia após duas rotas concluídas em fases distintas',()=>{
 const p=project();forks.build(p,forks.parse('3 bifurcações e secreto'));
 const c=p.game.physicalForks,empty=forks.emptyState();
 let state=empty;
 assert.equal(forks.allowed(c,state,'scene1','secret'),false);
 let result=forks.complete(c,state,'scene1','high',100);
 assert.equal(result.awarded,80);state=result.state;
 assert.equal(forks.allowed(c,state,'scene2','secret'),false);
 result=forks.complete(c,state,'scene2','middle',180);
 assert.equal(result.awarded,150);state=forks.restore(c,JSON.parse(JSON.stringify(result.state)));
 assert.equal(forks.allowed(c,state,'scene3','secret'),true);
 const rt={project:p,sceneId:'scene3',player:{routeChoice:null,x:80,y:228},__forkUnlockCount:state.claimed.length};
 const portal=p.scenes[2].entities.find(e=>e.forkId==='secret'&&e.event==='forkGate');
 assert.equal(forks.enter(rt,portal),true);
 assert.equal(rt.player.routeChoice,'secret');
});
t('Pontuação e recompensas não duplicam após reload nem aceitam IDs forjados',()=>{
 const p=project();forks.build(p,forks.parse('3 caminhos no mesmo mapa'));
 const c=p.game.physicalForks;
 const a=forks.complete(c,forks.emptyState(),'scene1','high',1000);
 const b=forks.complete(c,a.state,'scene1','high',a.score);
 assert.equal(a.score,1080);assert.equal(b.score,1080);assert.equal(b.awarded,0);
 assert.equal(forks.complete(c,a.state,'scene1','not-found',200).awarded,0);
 assert.deepEqual(forks.restore(c,{version:1,claimed:['0:high','forged'],history:[{key:'forged'}]}).claimed,['0:high']);
});
t('Modo físico não é anunciado para gêneros sem runtime de portais',()=>{
 const p=brief.compile('shoot em up com 3 caminhos físicos no mesmo mapa');
 assert.equal(p.genre,'shooter');assert.ok(p.physical);
 assert.ok(p.pending.some(x=>x.includes('Bifurcações físicas')));
 const game=project('shooter');
 brief.apply(game,p);
 assert.equal(game.game.physicalForks,undefined);
 assert.equal(game.game.stageRoutes,undefined);
});
t('Runtime Plataforma e Top-down ativam portais/checkpoints/saídas de verdade',()=>{
 const oldInput=global.SNESInput;
 global.SNESInput={create:()=>({
  axisX:()=>0,axisY:()=>0,pressed:action=>action==='action',
  bind(){},dispose(){},touch:{}
 })};
 require('../js/engine/collision.js');
 require('../js/runtimes/platform/platform-runtime.js');
 require('../js/runtimes/topdown/topdown-runtime.js');
 const themes={floresta:{tiles:[
  {solid:false,name:'vazio'}, {solid:true,name:'grama'},
  {solid:true,name:'terra'}, {solid:true,name:'parede'}
 ]}};
 try{
  const a=project('platform',1);forks.build(a,forks.parse('3 caminhos no mesmo mapa'));
  const rt=global.PlatformRuntime.createState(a,'scene1');
  const gate=rt.entities.find(e=>e.event==='forkGate'&&e.forkId==='high');
  rt.player.x=gate.x;rt.player.y=gate.y;rt.__forkUnlockCount=0;
  global.PlatformRuntime.tick(rt,themes,{},1/60,1000);
  assert.equal(rt.player.routeChoice,'high');
  assert.equal(rt.player.x,182);
  assert.ok(rt.player.checkpoint);
  const door=rt.entities.find(e=>e.event==='forkExit'&&e.forkId==='high');
  rt.player.x=door.x;rt.player.y=door.y;rt.doorCooldown=0;
  global.PlatformRuntime.tick(rt,themes,{},1/60,1100);
  assert.equal(rt.won,true);
  const b=project('topdown',1);forks.build(b,forks.parse('3 bifurcações no mesmo mapa'));
  const rp=global.TopdownRuntime.createState(b,'scene1');
  const cp=rp.entities.find(e=>e.event==='forkCheckpoint'&&e.forkId==='middle');
  rp.player.x=cp.x;rp.player.y=cp.y;rp.__forkUnlockCount=0;
  global.TopdownRuntime.tick(rp,themes,{},1/60,1200);
  assert.equal(rp.player.routeChoice,'middle');
  assert.ok(rp.player.checkpoint);
  const exit=rp.entities.find(e=>e.event==='forkExit'&&e.forkId==='middle');
  rp.player.x=exit.x;rp.player.y=exit.y;rp.doorCooldown=0;
  global.TopdownRuntime.tick(rp,themes,{},1/60,1300);
  assert.equal(rp.won,true);
 }finally{global.SNESInput=oldInput;}
});
t('Integração do editor e exportador reconhece mapa físico',()=>{
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const exp=fs.readFileSync(path.join(root,'js/export/html-exporter.js'),'utf8');
 const bundle=fs.readFileSync(path.join(root,'js/export/export-sources.js'),'utf8');
 assert.ok(index.includes('js/game/physical-forks.js'));
 assert.ok(exp.includes("src.physicalForks || ''"));
 assert.ok(bundle.includes('"physicalForks"'));
 assert.ok(fs.readFileSync(path.join(root,'js/game/game-flow.js'),'utf8').includes('SNESPhysicalForks'));
});
console.log(pass+' testes de bifurcações físicas aprovados.');
