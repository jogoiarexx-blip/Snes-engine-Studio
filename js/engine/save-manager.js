/** SNES Engine Studio 1.0.1 — editor/game save service via StorageHub. */
(function(global){'use strict';
const EDITOR_KEY='editor-current',RECENT_KEY='recent-projects',AUTOSAVE_KEY='editor-autosaves',SLOT_PREFIX='editor-slot-',PLAYER_PREFIX='player-';
function storage(){if(!global.SNESStorage)throw new Error('SNESStorage indisponível');return global.SNESStorage}
function clone(v){return global.SNESProjectModel?.clone?global.SNESProjectModel.clone(v):JSON.parse(JSON.stringify(v))}
function stripRuntimeState(project){const p=clone(project);(p.scenes||[]).forEach(s=>(s.entities||[]).forEach(e=>{for(const k of ['vx','vy','dead','hurtUntil','attackUntil','animStarted','nextAttack','onGround','fireCD','pathT','triggered'])delete e[k];if(e.components?.spriteRenderer)delete e.components.spriteRenderer.runtimeAnimationId;if(e.components?.animator){delete e.components.animator.runtimeFrame;delete e.components.animator.runtimeState}}));return p}
function rotateAutosave(clean,limit=5){const ns=storage().recovery,list=ns.get(AUTOSAVE_KEY,[]);list.unshift({t:Date.now(),project:clean});list.length=Math.min(limit,list.length);ns.set(AUTOSAVE_KEY,list);return list}
function saveEditor(project){const clean=stripRuntimeState(project);clean.version='1.0.1';clean.schemaVersion=10;storage().projects.set(EDITOR_KEY,clean);rotateAutosave(clean,5);if(global.ProjectStore)global.ProjectStore.saveProject(clean).catch(()=>{});pushRecent(clean);return true}
function migrateLegacyEditor(){const st=storage(),candidates=['snes_engine_studio_project_v10','snes_engine_studio_project_v7','snes_engine_studio_project_v6','snes_engine_studio_project_v3'];for(const k of candidates){const raw=st.legacy.get(k);if(!raw)continue;try{const p=JSON.parse(raw);st.projects.set(EDITOR_KEY,p);return p}catch(_){}}return null}
function loadEditor(){return storage().projects.get(EDITOR_KEY)||migrateLegacyEditor()}
function loadAutosave(index=0){const a=storage().recovery.get(AUTOSAVE_KEY,[]);return a[index]||null}
function listAutosaves(){return storage().recovery.get(AUTOSAVE_KEY,[])}
function saveSlot(n,project){return !!storage().projects.set(SLOT_PREFIX+n,stripRuntimeState(project))}
function loadSlot(n){return storage().projects.get(SLOT_PREFIX+n)}
function savePlayer(gameId,data){const d=Object.assign({savedAt:Date.now()},data||{});return !!storage().saves.set(PLAYER_PREFIX+gameId,d)}
function loadPlayer(gameId){return storage().saves.get(PLAYER_PREFIX+gameId)}
function saveGameSlot(project,slot,data){const pid=project.id||project.name||'game',key='game:'+pid+':slot:'+slot,prev=storage().saves.get(key);const out=Object.assign({version:1,savedAt:Date.now(),playTimeMs:0,sceneId:project.currentScene||null,position:null,inventory:{},quests:{},flags:{},upgrades:{},difficulty:project.game?.settings?.difficulty||'normal',settings:{}},prev||{},data||{});storage().saves.set(key,out);return out}
function loadGameSlot(project,slot){return storage().saves.get('game:'+(project.id||project.name||'game')+':slot:'+slot)}
function pushRecent(project){let list=storage().preferences.get(RECENT_KEY,[]);list=list.filter(r=>r.id!==project.id);list.unshift({id:project.id,name:project.name||'Sem nome',gameType:project.gameType||'platform',t:Date.now()});storage().preferences.set(RECENT_KEY,list.slice(0,12))}
function listRecent(){return storage().preferences.get(RECENT_KEY,[])}
global.SNESSave={EDITOR_KEY,stripRuntimeState,saveEditor,loadEditor,loadAutosave,listAutosaves,saveSlot,loadSlot,savePlayer,loadPlayer,saveGameSlot,loadGameSlot,pushRecent,listRecent};
})(typeof window!=='undefined'?window:globalThis);
