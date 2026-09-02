/** SNES Engine Studio 1.0 — quest/objective runtime shared by all genres. */
(function(g){'use strict';
const clone=v=>{try{return structuredClone(v)}catch(_){return JSON.parse(JSON.stringify(v))}};
function defs(project){project.game=project.game||{};project.game.quests=Array.isArray(project.game.quests)?project.game.quests:[];return project.game.quests}
function ensureObjective(o,i){return Object.assign({id:o?.id||('obj_'+i),type:'scene',target:'',count:1,text:''},o||{})}
function normalize(project){for(const q of defs(project)){q.id=q.id||('quest_'+Math.random().toString(36).slice(2,8));q.title=q.title||'Nova missão';q.description=q.description||'';q.autoStart=q.autoStart!==false;q.objectives=(q.objectives||[]).map(ensureObjective);q.rewards=q.rewards||{};}return project.game.quests}
function create(project,initial){normalize(project);const state=clone(initial||{});const api={project,state,offs:[]};for(const q of project.game.quests){if(!state[q.id])state[q.id]={status:q.autoStart?'active':'locked',objectives:{}};for(const o of q.objectives)if(state[q.id].objectives[o.id]==null)state[q.id].objectives[o.id]=0;}
 function emit(){g.SNESEvents?.emit('quest:changed',{questSystem:api,state:clone(state)});}
 function get(id){return project.game.quests.find(q=>q.id===id)}
 function start(id){const s=state[id];if(!s||s.status==='complete')return false;s.status='active';emit();return true}
 function progress(id,objId,amount=1){const q=get(id),s=state[id];if(!q||!s||s.status!=='active')return false;const o=q.objectives.find(x=>x.id===objId);if(!o)return false;const goal=Math.max(1,+o.count||1);s.objectives[objId]=Math.min(goal,(+s.objectives[objId]||0)+(+amount||1));check(id);emit();return true}
 function setProgress(id,objId,value){const q=get(id),s=state[id];if(!q||!s)return false;const o=q.objectives.find(x=>x.id===objId);if(!o)return false;s.objectives[objId]=Math.max(0,Math.min(Math.max(1,+o.count||1),+value||0));check(id);emit();return true}
 function check(id){const q=get(id),s=state[id];if(!q||!s||s.status!=='active')return false;const done=q.objectives.every(o=>(+s.objectives[o.id]||0)>=Math.max(1,+o.count||1));if(done){s.status='complete';applyRewards(q);g.SNESEvents?.emit('quest:completed',{quest:q,state:s});return true}return false}
 function applyRewards(q){const r=q.rewards||{},rt=g.SNESEngine?.getActive?.()?.rt;if(!rt)return;if(r.score)rt.player.score=(rt.player.score||0)+(+r.score||0);if(r.coins)rt.player.coins=(rt.player.coins||0)+(+r.coins||0);if(r.flag){const st=g.SNESStudioRuntime?.init?.(rt);if(st)st.flags[r.flag]=true;}}
 function complete(id){const q=get(id),s=state[id];if(!q||!s)return false;for(const o of q.objectives)s.objectives[o.id]=Math.max(1,+o.count||1);s.status='complete';applyRewards(q);emit();g.SNESEvents?.emit('quest:completed',{quest:q,state:s});return true}
 function active(){return project.game.quests.filter(q=>state[q.id]?.status==='active').map(q=>({quest:q,state:state[q.id]}))}
 function snapshot(){return clone(state)}
 function consume(type,target,amount=1){for(const q of project.game.quests){const s=state[q.id];if(!s||s.status!=='active')continue;for(const o of q.objectives){if(o.type!==type)continue;if(o.target&&String(o.target)!==String(target??''))continue;progress(q.id,o.id,amount);}}}
 const E=g.SNESEvents;if(E){api.offs.push(E.on('scene:entered',e=>consume('scene',e?.current||e?.scene?.id,1)));api.offs.push(E.on('checkpoint:activated',e=>consume('checkpoint',e?.checkpoint?.id||e?.checkpoint?.sceneId||'',1)));api.offs.push(E.on('trigger:entered',e=>consume('trigger',e?.trigger?.id||e?.triggerId||'',1)));api.offs.push(E.on('boss:defeated',e=>consume('boss',e?.boss?.id||e?.entity?.id||'',1)));api.offs.push(E.on('item:collected',e=>consume('collect',e?.item?.id||e?.item?.type||e?.id||'',e?.amount||1)));api.offs.push(E.on('quest:progress-request',e=>{if(e?.questId)progress(e.questId,e.objectiveId,e.amount||1)}));}
 Object.assign(api,{get,start,progress,setProgress,complete,active,snapshot,consume,destroy(){api.offs.forEach(f=>f?.());api.offs=[];}});return api;}
g.SNESQuestSystem={normalize,create};
})(typeof window!=='undefined'?window:globalThis);
