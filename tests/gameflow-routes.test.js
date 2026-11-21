/* Teste sem browser: o Game Flow oferece rotas, salva recompensa e retoma no destino. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const routes=require('../js/game/stage-routes.js');
function element(tag='div') {
 return {tag,style:{},children:[],classList:{add(){},remove(){}},
   appendChild(e){this.children.push(e);return e},remove(){this.removed=true},
   setAttribute(){},querySelector(){return null},querySelectorAll(){return[]},
   addEventListener(){},removeEventListener(){},insertBefore(e){this.children.unshift(e)},
   set innerHTML(x){this.html=x;this.children=[]},get innerHTML(){return this.html||''}};
}
const doc={body:element('body'),head:element('head'),getElementById(){return null},
  createElement:element,addEventListener(){},removeEventListener(){}};
const saves=new Map();
let active=null,hooks=null;
const fakeWindow={
 SNESStageRoutes:routes,
 SNESStorage:{saves:{get:key=>saves.get(key),set:(key,v)=>saves.set(key,v)},
   preferences:{get:()=>null,set(){}}},
 SNESEngine:{
   play(project,canvas,themes,variants,draw,newHooks){
     hooks=newHooks;
     const scene=project.scenes.find(s=>s.id===project.currentScene);
     const spawn=scene.entities.find(e=>e.type==='player');
     active={rt:{scene,sceneId:scene.id,player:{
       x:spawn.x,y:spawn.y,hp:spawn.hp,maxHp:spawn.hp,score:0,coins:0,keys:0},score:0}};
     return active;
   },
   getActive(){return active},
   stop(){active=null}
 },
 addEventListener(){},removeEventListener(){}
};
const source=fs.readFileSync(path.join(__dirname,'../js/game/game-flow.js'),'utf8');
vm.runInNewContext(source,{window:fakeWindow,document:doc,SNESStorage:fakeWindow.SNESStorage,performance:{now:()=>4000},
  setTimeout,clearTimeout,console,navigator:{},structuredClone});
const project={
 id:'route-gameflow-test',name:'Rotas',gameType:'platform',
 scenes:[0,1,2].map(i=>({id:'scene'+(i+1),name:'Fase '+(i+1),map:[[0]],
   entities:[{id:'player',type:'player',x:32,y:210,hp:3},{id:'enemy',type:'enemy',x:200,y:210}]})),
 game:{settings:{transition:'none'},loading:{sceneEnabled:false},intro:{enabled:false}}
};
routes.build(project,routes.parse('3 caminhos com passagem secreta'));
async function flush(){for(let i=0;i<8;i++)await Promise.resolve();}
(async()=>{
 const flow=fakeWindow.SNESGameFlow.create(project,element('canvas'),{});
 flow.newGame(1);
 assert.equal(flow.state.screen,'routes');
 assert.equal(flow.selectRoute(0,'secret'),false);
 assert.equal(flow.selectRoute(0,'high'),true);
 await flush();
 assert.equal(flow.state.screen,'gameplay');
 assert.equal(flow.state.project.currentScene,'scene1__high');
 hooks.onWon();
 assert.equal(flow.state.screen,'victory');
 assert.equal(flow.state.routeState.claimed.length,1);
 assert.equal(flow.state.lastSnapshot.player.score,80);
 const before=flow.state.lastSnapshot.player.score;
 flow.victory(); // teste de idempotência
 assert.equal(flow.state.lastSnapshot.player.score,before);
 assert.equal(flow.state.routeState.claimed.length,1);
 flow.routeMenu(1);
 assert.equal(flow.state.screen,'routes');
 assert.equal(flow.selectRoute(1,'secret'),false);
 assert.equal(flow.selectRoute(1,'middle'),true);
 await flush();
 assert.equal(flow.state.project.currentScene,'scene2__middle');
 assert.equal(flow.state.handle.rt.player.score,80);
 flow.saveSlot(1);
 flow.destroy();
 const restored=fakeWindow.SNESGameFlow.create(project,element('canvas'),{});
 restored.continueLatest();
 await flush();
 assert.equal(restored.state.project.currentScene,'scene2__middle');
 assert.equal(restored.state.handle.rt.player.score,80);
 assert.equal(restored.state.routeState.claimed.length,1);
 restored.destroy();
 console.log('PASS início -> escolha -> vitória -> recompensa única -> save -> retomada');
})().catch(err=>{console.error(err);process.exitCode=1});
