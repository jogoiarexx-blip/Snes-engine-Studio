/* GameForge -> SNES: rotas jogáveis com cenas distintas, dificuldades e save idempotente.
 * Contratos puros; nenhuma execução da descrição do usuário nem dependência de rede.
 */
(function(root){
'use strict';
const PROFILES=[
 {id:'high',name:'Caminho superior',factor:0.65,speed:0.92,reward:80,description:'Menos inimigos · recompensa menor'},
 {id:'middle',name:'Caminho central',factor:1,speed:1,reward:150,description:'Desafio equilibrado · recompensa média'},
 {id:'low',name:'Caminho inferior',factor:1.55,speed:1.15,reward:260,description:'Mais inimigos · maior recompensa'},
 {id:'secret',name:'Passagem secreta',factor:1.9,speed:1.25,reward:400,description:'Desafio extra · desbloqueio após 2 rotas concluídas',secret:true}
];
const SUPPORTED=['platform','topdown','shooter','metroidvania'];
const clone=o=>JSON.parse(JSON.stringify(o));
function parse(text){
 const t=String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const enabled=/\b(?:[23]|dois|tres)\s+(?:caminhos?|rotas?)\b|\b(?:caminhos?|rotas?)\s+(?:alternativos?|diferentes|ramificados?)\b|\b(?:escolher|escolha)\s+(?:um\s+)?(?:caminho|rota)\b/.test(t);
 if(!enabled)return null;
 const two=/\b(?:2|dois)\s+(?:caminhos?|rotas?)\b/.test(t)&&!/\b(?:3|tres)\s+(?:caminhos?|rotas?)\b/.test(t);
 return {version:1,choices:two?['high','low']:['high','middle','low'],
   secret:/\b(secret[ao]s?|escondid[ao]s?|passagem secreta)\b/.test(t)};
}
function varyEnemies(scene,profile,genre){
 const entities=scene.entities||[];
 if(genre==='shooter'){
   for(const e of entities)if(e.type==='spawner'){
     e.count=Math.min(30,Math.max(0,Math.round((+e.count||0)*profile.factor)));
     e.interval=Math.max(.2,Math.min(3,(+e.interval||.8)/profile.speed));
   }
   // Bosses especiais e sua vida permanecem inalterados.
   return;
 }
 const original=entities.filter(e=>e.type==='enemy'&&!e.boss);
 // Nunca criar inimigos artificialmente quando o pedido original determina nenhum.
 const target=original.length===0?0:Math.min(24,Math.max(0,Math.round(original.length*profile.factor)));
 const other=entities.filter(e=>e.type!=='enemy'||e.boss);
 const variants=[];
 for(let i=0;i<target;i++){
   const base=clone(original[i%original.length]);
   base.id='route_enemy_'+profile.id+'_'+i;
   base.name=(base.name||'Inimigo')+' '+(i+1);
   base.speed=Math.max(10,Math.round((+base.speed||35)*profile.speed));
   if(i>=original.length)base.x=Math.max(40,Math.min(464,(+base.x||160)+(i-original.length+1)*23));
   variants.push(base);
 }
 scene.entities=[...other,...variants];
}
function build(project,config){
 if(!project||!SUPPORTED.includes(project.gameType)||!Array.isArray(project.scenes)||!project.scenes.length||
    !config||config.version!==1)throw Error('Rotas indisponíveis neste gênero ou projeto.');
 const choices=PROFILES.filter(x=>config.choices.includes(x.id)||(x.secret&&config.secret));
 if(choices.length<2)throw Error('São necessários pelo menos dois caminhos.');
 const stages=project.scenes.slice();
 const scenes=[],groups=[],sceneIndex={};
 const objectives={...(project.game?.objectives||{})};
 for(let i=0;i<stages.length;i++){
   const stage=stages[i],options=[];
   for(const [j,profile] of choices.entries()){
     const scene=clone(stage),id=stage.id+'__'+profile.id;
     scene.id=id;
     scene.name='Fase '+(i+1)+' · '+profile.name;
     scene.route={version:1,stage:i,id:profile.id};
     varyEnemies(scene,profile,project.gameType);
     scenes.push(scene);
     sceneIndex[id]={stage:i,route:profile.id};
     options.push({id:profile.id,sceneId:id,name:profile.name,description:profile.description,reward:profile.reward,secret:!!profile.secret});
     objectives[id]=profile.description;
   }
   groups.push({stage:i,options});
 }
 project.scenes=scenes;
 project.currentScene=groups[0].options[0].sceneId;
 project.world={nodes:{},start:project.currentScene};
 project.game=project.game||{};
 project.game.startScene=project.currentScene;
 project.game.campaign=scenes.map(s=>s.id);
 project.game.objectives=objectives;
 const nodes=scenes.map((s,i)=>({id:s.id,x:30+((i%choices.length)*180),y:30+Math.floor(i/choices.length)*100}));
 const edges=[];
 for(let i=0;i<groups.length-1;i++){
   for(const previous of groups[i].options)for(const next of groups[i+1].options)
     edges.push({from:previous.sceneId,to:next.sceneId,condition:{type:'route',key:next.id,stage:i+1}});
 }
 project.game.flowGraph={nodes,edges};
 project.game.stageRoutes={version:1,groups,sceneIndex,secretUnlockCompletions:2};
 return project;
}
function emptyState(){return {version:1,claimed:[],history:[]};}
function restore(config,value){
 const fresh=emptyState();
 if(!config||config.version!==1||!value||value.version!==1)return fresh;
 const known=config.sceneIndex||{};
 const claims=Array.isArray(value.claimed)?value.claimed:[];
 fresh.claimed=[...new Set(claims.filter(x=>typeof x==='string'&&Object.prototype.hasOwnProperty.call(known,x)))].slice(0,100);
 const history=Array.isArray(value.history)?value.history:[];
 fresh.history=history.filter(x=>x&&Number.isInteger(x.stage)&&typeof x.id==='string'&&
   config.groups?.[x.stage]?.options?.some(o=>o.id===x.id)).slice(0,100).map(x=>({stage:x.stage,id:x.id}));
 return fresh;
}
function stageOf(config,sceneId){
 const info=config?.sceneIndex?.[sceneId];
 return info&&Number.isInteger(info.stage)?info.stage:-1;
}
function choicesFor(config,stage,state){
 if(!config||config.version!==1||!Number.isInteger(stage))return [];
 const saved=restore(config,state);
 const group=config.groups?.[stage];
 if(!group)return [];
 return group.options.map(o=>({...o,locked:!!o.secret&&saved.claimed.length<(config.secretUnlockCompletions||2)}));
}
function nextStage(config,sceneId){const n=stageOf(config,sceneId);return n<0?-1:n+1<(config?.groups?.length||0)?n+1:-1;}
function complete(config,state,sceneId,score){
 const saved=restore(config,state);
 const stage=stageOf(config,sceneId);
 const option=config?.groups?.[stage]?.options?.find(o=>o.sceneId===sceneId);
 const validScore=Number.isFinite(score)&&score>=0?score:0;
 if(!option||saved.claimed.includes(sceneId))return {state:saved,score:validScore,awarded:0};
 const reward=option.reward;
 saved.claimed.push(sceneId);
 saved.history.push({stage,id:option.id});
 return {state:saved,score:validScore+reward,awarded:reward};
}
function select(config,state,stage,id){
 const option=choicesFor(config,stage,state).find(o=>o.id===id&&!o.locked);
 return option||null;
}
const api={parse,build,emptyState,restore,stageOf,choicesFor,nextStage,complete,select,PROFILES,SUPPORTED};
root.SNESStageRoutes=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
