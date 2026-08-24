/** SNES Engine Studio 1.0 — canonical project model + migration gateway */
(function(g){'use strict';
const SCHEMA=10, VERSION='1.0.0';
function clone(v){try{return structuredClone(v)}catch(_){return JSON.parse(JSON.stringify(v))}}
function uid(prefix='id'){if(g.crypto&&crypto.randomUUID)return prefix+'_'+crypto.randomUUID();return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2)}
function ensureId(p){if(!p.id||p.id===p.name)p.id=uid('proj');return p.id}
function migrate(p){p=clone(p||{});const from=Number(p.schemaVersion||7);p.schemaVersion=SCHEMA;p.version=VERSION;ensureId(p);p.settings=p.settings||{};p.game=p.game||{};p.game.settings=p.game.settings||{};p.scenes=Array.isArray(p.scenes)?p.scenes:[];p.studio=p.studio||{};p.studio.assets=p.studio.assets||[];p.studio.prefabs=p.studio.prefabs||[];p.studio.animations=p.studio.animations||[];p.studio.events=p.studio.events||[];p.studio.triggers=p.studio.triggers||[];p.studio.flags=p.studio.flags||{};p.studio.variables=p.studio.variables||{};for(const s of p.scenes){s.id=s.id||uid('scene');s.entities=Array.isArray(s.entities)?s.entities:[];if(g.SNESTileMap)g.SNESTileMap.normalizeScene(s);for(const e of s.entities){e.id=e.id||uid('ent');if(g.SNESEntityComponents)g.SNESEntityComponents.ensure(e)}}return {project:p,from,to:SCHEMA,changed:from!==SCHEMA}}
function validate(p){const errors=[],warnings=[];if(!p||typeof p!=='object')errors.push('Projeto inválido');if(p&&p.schemaVersion!==SCHEMA)warnings.push('Schema diferente de '+SCHEMA);if(p&&!Array.isArray(p.scenes))errors.push('scenes deve ser array');const ids=new Set();for(const s of p?.scenes||[]){if(ids.has(s.id))errors.push('ID duplicado: '+s.id);ids.add(s.id);for(const e of s.entities||[]){if(ids.has(e.id))errors.push('ID duplicado: '+e.id);ids.add(e.id)}}return {ok:!errors.length,errors,warnings}}
g.SNESProjectModel={SCHEMA,VERSION,uid,clone,ensureId,migrate,validate};
})(typeof window!=='undefined'?window:globalThis);
