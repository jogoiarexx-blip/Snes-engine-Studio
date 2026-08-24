/** SNES Engine Studio 1.0 — editor/player saves through unified StorageHub. */
(function(global){'use strict';
const EDITOR_KEY='snes_engine_studio_project_v10',RECENT_KEY='snes_v10_recent_projects',AUTOSAVE_KEY='snes_v10_autosave',SLOT_PREFIX='snes_v10_slot_',PLAYER_PREFIX='snes_v10_player_';
function store(){return global.SNESStorage?.legacy||{get:(k,d)=>{try{return localStorage.getItem(k)??d}catch(_){return d}},set:(k,v)=>{try{localStorage.setItem(k,v);return true}catch(_){return false}},remove:k=>{try{localStorage.removeItem(k);return true}catch(_){return false}}}}
function stripRuntimeState(project){const p=JSON.parse(JSON.stringify(project));(p.scenes||[]).forEach(s=>(s.entities||[]).forEach(e=>{for(const k of ['vx','vy','dead','hurtUntil','attackUntil','animStarted','nextAttack','onGround','fireCD','pathT','triggered'])delete e[k];if(e.components?.spriteRenderer)delete e.components.spriteRenderer.runtimeAnimationId}));return p}
function saveEditor(project){const clean=stripRuntimeState(project);clean.version='1.0.0';clean.schemaVersion=10;if(global.ProjectStore)global.ProjectStore.saveProject(clean).catch(()=>{});const st=store();let text='';try{text=JSON.stringify(clean);if(!st.set(EDITOR_KEY,text))throw 0;st.set(AUTOSAVE_KEY,JSON.stringify({t:Date.now(),project:clean}))}catch(_){const light=JSON.parse(JSON.stringify(clean));light.studio?.assets?.forEach(a=>{delete a.dataUrl;delete a.url});try{st.set(EDITOR_KEY,JSON.stringify(light));st.set(AUTOSAVE_KEY,JSON.stringify({t:Date.now(),project:light}))}catch(__){}}pushRecent(clean);return true}
function loadEditor(){const st=store();const raw=st.get(EDITOR_KEY)||st.get('snes_engine_studio_project_v7')||st.get('snes_engine_studio_project_v6')||st.get('snes_engine_studio_project_v3');if(!raw)return null;try{return JSON.parse(raw)}catch(_){return null}}
function loadAutosave(){try{const o=JSON.parse(store().get(AUTOSAVE_KEY,'null'));return o?.project?o:null}catch(_){return null}}
function saveSlot(n,project){return store().set(SLOT_PREFIX+n,JSON.stringify(stripRuntimeState(project)))}
function loadSlot(n){try{return JSON.parse(store().get(SLOT_PREFIX+n,'null'))}catch(_){return null}}
function savePlayer(gameType,data){return store().set(PLAYER_PREFIX+gameType,JSON.stringify(data))}
function loadPlayer(gameType){try{return JSON.parse(store().get(PLAYER_PREFIX+gameType,'null'))}catch(_){return null}}
function pushRecent(project){const st=store();let list=[];try{list=JSON.parse(st.get(RECENT_KEY,'[]'))}catch(_){}list=list.filter(r=>r.id!==project.id&&r.name!==project.name);list.unshift({id:project.id,name:project.name||'Sem nome',gameType:project.gameType||'platform',t:Date.now(),snapshot:stripRuntimeState(project)});st.set(RECENT_KEY,JSON.stringify(list.slice(0,8)))}
function listRecent(){try{return JSON.parse(store().get(RECENT_KEY,'[]'))}catch(_){return []}}
global.SNESSave={EDITOR_KEY,stripRuntimeState,saveEditor,loadEditor,loadAutosave,saveSlot,loadSlot,savePlayer,loadPlayer,pushRecent,listRecent};
})(typeof window!=='undefined'?window:globalThis);
