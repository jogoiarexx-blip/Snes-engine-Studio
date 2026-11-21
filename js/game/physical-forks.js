/* GameForge → SNES: bifurcações dentro de um único mapa por fase.
 * Top-down: corredores conectados fisicamente a um hall comum.
 * Plataforma: portais de acesso a corredores com obstáculos no MESMO mapa.
 * Sem IA remota, sem scripts gerados e sem mutação de projetos existentes.
 */
(function(root){
'use strict';
const ROWS=18,COLS=32,T=16;
const NAMES={high:'Superior',middle:'Central',low:'Inferior',secret:'Secreto'};
const PROFILES={high:{count:.65,speed:.9,reward:80},
 middle:{count:1,speed:1,reward:150},low:{count:1.55,speed:1.16,reward:260},
 secret:{count:1.9,speed:1.28,reward:400}};
const POS={high:2,middle:6,low:10,secret:14};
const FLOORS={high:4,middle:8,low:12,secret:16};
const clone=x=>JSON.parse(JSON.stringify(x));
const blank=()=>Array.from({length:ROWS},()=>Array(COLS).fill(0));
function parse(text,route){
 const t=String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const wants=/\b(no mesmo mapa|dentro (?:do|de um|desse) mapa|rotas? fisicas?|bifurcac(?:ao|oes)|caminhos? exploraveis?|caminhos? dentro do mapa)\b/.test(t);
 if(!wants)return null;
 return {version:1,choices:(route?.choices||['high','middle','low']).filter(x=>x in POS&&x!=='secret'),
   secret:!!route?.secret||/\b(secret[ao]s?|escondid[ao]s?)\b/.test(t)};
}
function active(config){return [...config.choices,...(config.secret?['secret']:[])].filter(x=>x in POS);}
function baseEnemies(scene){return (scene.entities||[]).filter(e=>e.type==='enemy'&&!e.boss);}
function addEnemies(scene,id,stage,base,genre){
 const mult=PROFILES[id],count=base.length?Math.max(1,Math.min(5,Math.round(base.length*mult.count))):0;
 const y=genre==='platform' ? FLOORS[id]*T-15 : POS[id]*T+1;
 for(let i=0;i<count;i++){
   const source=base[i%base.length];
   scene.entities.push({...clone(source),id:'pf_enemy_'+stage+'_'+id+'_'+i,
     name:'Guardião '+NAMES[id],x:278+(i%3)*55,y,
     hp:Math.max(1,Math.round(+source.hp||2)),
     speed:Math.max(10,Math.round((+source.speed||35)*mult.speed))});
 }
}
function entity(scene,stage,id,type,x,y,extra={}){
 scene.entities.push({id:'pf_'+stage+'_'+id+'_'+type,type,x,y,name:NAMES[id],forkId:id,...extra});
}
function topdown(scene,stage,ids,base){
 const ground=blank(),collision=blank();
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)ground[y][x]=1;
 // Hall de entrada x=1..7, corredores paralelos de x=8..30.
 for(let x=8;x<COLS;x++)for(const y of [4,8,12,16]){ground[y][x]=3;collision[y][x]=3;}
 for(let x=0;x<COLS;x++){ground[0][x]=3;collision[0][x]=3;ground[17][x]=3;collision[17][x]=3;}
 for(let y=0;y<ROWS;y++)for(const x of [0,31]){ground[y][x]=3;collision[y][x]=3;}
 // Câmara secreta atrás de parede/portal: não é possível caminhar pelo bloqueio.
 for(const id of ['high','middle','low','secret'])if(!ids.includes(id)||id==='secret')
   for(const y of [POS[id]-1,POS[id],POS[id]+1]){ground[y][8]=3;collision[y][8]=3;}
 for(const id of ids){
   const lane=POS[id],cy=lane*T+1;
   // Pilares físicos em cada corredor, com contorno navegável.
   const obstacles=id==='high'?[[17,lane]]:id==='middle'?[[17,lane],[23,lane+1]]:
     id==='low'?[[17,lane],[23,lane-1]]:[[16,lane],[21,lane+1],[25,lane]];
   for(const [x,y] of obstacles){ground[y][x]=3;collision[y][x]=3;}
   if(id==='secret')entity(scene,stage,id,'door',105,cy,{event:'forkGate',targetX:164,targetY:cy});
   entity(scene,stage,id,'checkpoint',192,cy,{event:'forkCheckpoint'});
   entity(scene,stage,id,'door',468,cy,{event:'forkExit'});
   addEnemies(scene,id,stage,base,'topdown');
 }
 scene.layers={background:blank(),ground,decoration:blank(),foreground:blank(),collision};
 scene.map=ground;
 const player=scene.entities.find(e=>e.type==='player');
 if(player){player.x=40;player.y=106;}
}
function platform(scene,stage,ids,base){
 const ground=blank();
 for(let x=0;x<=10;x++)ground[16][x]=2; // hall esquerdo.
 for(let y=0;y<ROWS;y++)ground[y][10]=3; // parede do hall: acesso por portais.
 for(const id of ids){
   const fy=FLOORS[id],py=fy*T-15;
   for(let x=11;x<COLS;x++)ground[fy][x]=2;
   // Degraus ultrapassáveis com salto; rota secreta possui mais obstáculos.
   const obstacles=id==='high'?[19]:id==='middle'?[19,24]:id==='low'?[17,23]:[17,21,25];
   for(const x of obstacles)ground[fy-1][x]=3;
   const index=ids.indexOf(id);
   entity(scene,stage,id,'door',40+index*35,232,
     {event:'forkGate',targetX:182,targetY:py});
   entity(scene,stage,id,'checkpoint',240,py,{event:'forkCheckpoint'});
   entity(scene,stage,id,'door',468,py,{event:'forkExit'});
   addEnemies(scene,id,stage,base,'platform');
 }
 scene.layers={background:blank(),ground,decoration:blank(),foreground:blank(),collision:null};
 scene.map=ground;
 const player=scene.entities.find(e=>e.type==='player');
 if(player){player.x=28;player.y=230;}
}
function build(project,config){
 if(!project||!['platform','topdown'].includes(project.gameType)||
    !Array.isArray(project.scenes)||!project.scenes.length||config?.version!==1)
   throw Error('Bifurcações físicas disponíveis apenas para Plataforma e Top-down.');
 const ids=active(config);
 if(ids.length<2||ids.length>4)throw Error('São necessários de 2 a 4 corredores.');
 const stages=project.scenes.slice(),groups=[],byScene={};
 for(let i=0;i<stages.length;i++){
   const scene=stages[i],enemy=baseEnemies(scene);
   scene.entities=(scene.entities||[]).filter(e=>e.type==='player');
   if(project.gameType==='topdown')topdown(scene,i,ids,enemy);
   else platform(scene,i,ids,enemy);
   const options=ids.map(id=>({id,name:NAMES[id],reward:PROFILES[id].reward,secret:id==='secret'}));
   groups.push({sceneId:scene.id,stage:i,options});
   byScene[scene.id]=i;
 }
 project.game=project.game||{};
 project.game.physicalForks={version:1,groups,byScene,unlockAfter:2};
 project.game.campaign=stages.map(s=>s.id);
 project.game.startScene=stages[0].id;
 project.game.flowGraph={nodes:project.game.campaign.map((id,i)=>({id,x:40+i*150,y:60})),
   edges:project.game.campaign.slice(0,-1).map((id,i)=>({from:id,to:project.game.campaign[i+1],condition:{type:'always'}}))};
 project.game.objectives=Object.fromEntries(stages.map(s=>[s.id,'Explore as rotas, ative o checkpoint e alcance a saída.']));
 project.scenes=stages;
 project.currentScene=stages[0].id;
 return project;
}
function emptyState(){return {version:1,claimed:[],history:[]};}
function key(config,sceneId,routeId){
 const stage=config?.byScene?.[sceneId];
 return Number.isInteger(stage)&&config?.groups?.[stage]?.options?.some(o=>o.id===routeId)
   ?String(stage)+':'+routeId:null;
}
function restore(config,saved){
 const fresh=emptyState();
 if(!config||config.version!==1||!saved||saved.version!==1)return fresh;
 const all=new Set((config.groups||[]).flatMap(group=>group.options.map(o=>group.stage+':'+o.id)));
 fresh.claimed=[...new Set(Array.isArray(saved.claimed)?saved.claimed:[])].filter(x=>all.has(x)).slice(0,48);
 fresh.history=(Array.isArray(saved.history)?saved.history:[]).filter(x=>x&&all.has(x.key)).slice(0,48)
   .map(x=>({key:x.key}));
 return fresh;
}
function unlocked(config,state){
 return restore(config,state).claimed.length >= (config?.unlockAfter??2);
}
function allowed(config,state,sceneId,id){
 const k=key(config,sceneId,id);
 return !!k&&(id!=='secret'||unlocked(config,state));
}
function complete(config,state,sceneId,routeId,score){
 const saved=restore(config,state),k=key(config,sceneId,routeId);
 const valid=Number.isFinite(score)&&score>=0?score:0;
 if(!k||saved.claimed.includes(k))return {state:saved,score:valid,awarded:0};
 if(routeId==='secret'&&!unlocked(config,saved))return {state:saved,score:valid,awarded:0};
 const reward=PROFILES[routeId].reward;
 saved.claimed.push(k);saved.history.push({key:k});
 return {state:saved,score:valid+reward,awarded:reward};
}
function enter(rt,e){
 const config=rt?.project?.game?.physicalForks,p=rt?.player;
 if(!p||!key(config,rt.sceneId,e.forkId)||p.routeChoice&&p.routeChoice!==e.forkId)return false;
 if(e.forkId==='secret'&&(rt.__forkUnlockCount||0)<(config.unlockAfter||2))return false;
 if(!p.routeChoice)p.routeChoice=e.forkId;
 if(Number.isFinite(e.targetX)&&Number.isFinite(e.targetY)){
   p.x=e.targetX;p.y=e.targetY;p.vx=0;p.vy=0;
 }
 p.checkpoint={x:p.x,y:p.y,sceneId:rt.sceneId};
 e.activated=true;
 return true;
}
function checkpoint(rt,e){
 const p=rt?.player,config=rt?.project?.game?.physicalForks;
 if(!p||!key(config,rt.sceneId,e.forkId))return false;
 if(p.routeChoice&&p.routeChoice!==e.forkId)return false;
 if(e.forkId==='secret'&&(rt.__forkUnlockCount||0)<(config.unlockAfter||2))return false;
 p.routeChoice=e.forkId;
 p.checkpoint={x:e.x,y:e.y,sceneId:rt.sceneId};
 e.activated=true;
 return true;
}
function exit(rt,e){
 const p=rt?.player;
 if(!p||p.routeChoice!==e.forkId||
    !key(rt.project?.game?.physicalForks,rt.sceneId,e.forkId))return false;
 rt.won=true;return true;
}
const api={parse,build,emptyState,restore,unlocked,allowed,complete,enter,checkpoint,exit,key,NAMES};
root.SNESPhysicalForks=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
