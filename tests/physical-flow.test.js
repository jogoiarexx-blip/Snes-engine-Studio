/* Fluxo real de Game Flow com bifurcações dentro de cada mapa. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const forks=require('../js/game/physical-forks.js');
function element(tag='div'){
 return {tag,style:{},children:[],classList:{add(){},remove(){}},
   appendChild(e){this.children.push(e);return e},remove(){this.removed=true},
   setAttribute(){},querySelector(){return null},querySelectorAll(){return[]},
   addEventListener(){},removeEventListener(){},insertBefore(e){this.children.unshift(e)},
   set innerHTML(v){this.html=v;this.children=[]},get innerHTML(){return this.html||''}};
}
const doc={body:element('body'),head:element('head'),getElementById(){return null},
 createElement:element,addEventListener(){},removeEventListener(){}};
const saves=new Map();
let active=null,hooks=null;
const windowObject={
 SNESPhysicalForks:forks,
 SNESStorage:{saves:{get:key=>saves.get(key),set:(key,val)=>saves.set(key,val)},
  preferences:{get:()=>null,set(){}}},
 SNESEngine:{
  play(project,canvas,themes,variant,draw,callbacks){
    hooks=callbacks;
    const scene=project.scenes.find(s=>s.id===project.currentScene);
    const pl=scene.entities.find(e=>e.type==='player');
    active={rt:{project,scene,sceneId:scene.id,player:{
      x:pl.x,y:pl.y,hp:pl.hp,maxHp:pl.hp,score:0,coins:0,keys:0},
      score:0,paused:false}};
    return active;
  },
  getActive(){return active},stop(){active=null}
 },
 addEventListener(){},removeEventListener(){}
};
const src=fs.readFileSync(path.join(__dirname,'../js/game/game-flow.js'),'utf8');
vm.runInNewContext(src,{window:windowObject,document:doc,SNESStorage:windowObject.SNESStorage,
 performance:{now:()=>4500},setTimeout,clearTimeout,structuredClone,console,navigator:{}});
const project={id:'physical-test',name:'Fases',gameType:'platform',settings:{},
 scenes:[0,1,2].map(i=>({id:'scene'+(i+1),name:'Fase '+(i+1),themeId:'floresta',
  map:Array.from({length:18},()=>Array(32).fill(0)),
  entities:[{id:'player',type:'player',x:28,y:230,hp:5},
   {id:'enemy',type:'enemy',x:230,y:222,hp:2,speed:28}]})),
 game:{settings:{transition:'none'},loading:{sceneEnabled:false},intro:{enabled:false}}};
forks.build(project,forks.parse('3 caminhos físicos no mesmo mapa, secreto'));
async function flush(){for(let i=0;i<10;i++)await Promise.resolve();}
function button(root,label){
 const q=[root];
 while(q.length){const node=q.shift();if(node.textContent===label&&node.tag==='button')return node;
 q.push(...(node.children||[]));}
 throw Error('Botão não encontrado: '+label);
}
function clearStage(flow,routeId){
 const rt=flow.state.handle.rt,scene=flow.state.project.scenes.find(s=>s.id===rt.sceneId);
 const gate=scene.entities.find(e=>e.event==='forkGate'&&e.forkId===routeId);
 const exit=scene.entities.find(e=>e.event==='forkExit'&&e.forkId===routeId);
 assert.ok(gate&&exit);
 assert.equal(forks.enter(rt,gate),true);
 assert.equal(forks.exit(rt,exit),true);
 hooks.onWon();
 assert.equal(flow.state.screen,'victory');
}
(async()=>{
 const flow=windowObject.SNESGameFlow.create(project,element('canvas'),{});
 flow.newGame(1);await flush();
 assert.equal(flow.state.screen,'gameplay');
 assert.equal(flow.state.handle.rt.sceneId,'scene1');
 assert.equal(flow.state.handle.rt.__forkUnlockCount,0);
 clearStage(flow,'high');
 assert.equal(flow.state.forkState.claimed.length,1);
 assert.equal(flow.state.lastSnapshot.player.score,80);
 flow.victory();assert.equal(flow.state.lastSnapshot.player.score,80);
 button(flow.state.root,'PRÓXIMA FASE').onclick();await flush();
 assert.equal(flow.state.handle.rt.sceneId,'scene2');
 assert.equal(flow.state.handle.rt.player.score,80);
 clearStage(flow,'middle');
 assert.equal(flow.state.lastSnapshot.player.score,230);
 button(flow.state.root,'PRÓXIMA FASE').onclick();await flush();
 assert.equal(flow.state.handle.rt.sceneId,'scene3');
 assert.equal(flow.state.handle.rt.__forkUnlockCount,2);
 const secret=flow.state.handle.rt.scene.entities.find(e=>e.event==='forkGate'&&e.forkId==='secret');
 assert.equal(forks.enter(flow.state.handle.rt,secret),true);
 flow.saveSlot(1);flow.destroy();
 const resumed=windowObject.SNESGameFlow.create(project,element('canvas'),{});
 resumed.continueLatest();await flush();
 assert.equal(resumed.state.handle.rt.sceneId,'scene3');
 assert.equal(resumed.state.handle.rt.player.routeChoice,'secret');
 assert.equal(resumed.state.handle.rt.player.score,230);
 assert.equal(resumed.state.forkState.claimed.length,2);
 const rt=resumed.state.handle.rt;
 const end=rt.scene.entities.find(e=>e.event==='forkExit'&&e.forkId==='secret');
 assert.equal(forks.exit(rt,end),true);
 hooks.onWon();
 assert.equal(resumed.state.lastSnapshot.player.score,630);
 assert.equal(resumed.state.forkState.claimed.length,3);
 resumed.destroy();
 console.log('PASS Game Flow físico: campanha, portais, checkpoints, bônus, segredo e save/load');
})().catch(err=>{console.error(err);process.exitCode=1});
