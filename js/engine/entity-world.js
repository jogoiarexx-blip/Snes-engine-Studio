/** SNES Engine Studio 1.0.1 — canonical ECS world. */
(function(g){'use strict';
function norm(e){return g.SNESEntityComponents?g.SNESEntityComponents.ensure(e):e}
class EntityWorld{
 constructor(scene){this.scene=scene||{entities:[]};this.entities=this.scene.entities||(this.scene.entities=[]);this.collections=new Map();this.index=new Map();this.byComponent=new Map();this.pendingDestroy=new Set();this.reindex()}
 attachCollection(name,array,reindex=true){if(Array.isArray(array)){this.collections.set(name,array);for(const e of array)norm(e);if(reindex)this.reindex()}return this}
 detachCollection(name){this.collections.delete(name);this.reindex();return this}
 all(){const out=[],seen=new Set();const add=a=>{for(const e of a||[]){if(!e||seen.has(e)||this.pendingDestroy.has(e.id))continue;seen.add(e);norm(e);out.push(e)}};add(this.entities);for(const a of this.collections.values())add(a);return out}
 reindex(){this.index.clear();this.byComponent.clear();for(const e of this.all()){if(e.id)this.index.set(e.id,e);for(const k of Object.keys(e.components||{})){if(!this.byComponent.has(k))this.byComponent.set(k,new Set());this.byComponent.get(k).add(e)}}return this}
 get(id){return this.index.get(id)||null}
 has(id){return this.index.has(id)}
 spawn(def,collection){const clone=g.SNESProjectModel?.clone||((v)=>JSON.parse(JSON.stringify(v||{})));const e=clone(def||{});e.id=e.id||(g.SNESProjectModel?.uid?.('ent')||'ent_'+Date.now());norm(e);const target=(collection&&this.collections.get(collection))||this.entities;target.push(e);this.index.set(e.id,e);for(const k of Object.keys(e.components||{})){if(!this.byComponent.has(k))this.byComponent.set(k,new Set());this.byComponent.get(k).add(e)}g.SNESEvents?.emit('entity:spawned',{entity:e,world:this,collection:collection||'entities'});return e}
 destroy(id,deferred=false){const e=this.get(id);if(!e)return false;if(deferred){this.pendingDestroy.add(id);return true}for(const a of [this.entities,...this.collections.values()]){const i=a.indexOf(e);if(i>=0)a.splice(i,1)}this.index.delete(id);for(const set of this.byComponent.values())set.delete(e);g.SNESEvents?.emit('entity:destroyed',{entity:e,world:this});return true}
 flush(){for(const id of [...this.pendingDestroy]){this.pendingDestroy.delete(id);this.destroy(id,false)}return this}
 addComponent(id,name,data={}){const e=this.get(id);if(!e)return null;e.components=e.components||{};e.components[name]=Object.assign({},e.components[name]||{},data);this.reindex();g.SNESEvents?.emit('entity:component-added',{entity:e,name,component:e.components[name]});return e.components[name]}
 removeComponent(id,name){const e=this.get(id);if(!e||!e.components?.[name])return false;delete e.components[name];this.reindex();g.SNESEvents?.emit('entity:component-removed',{entity:e,name});return true}
 query(){const req=[...arguments];if(req.length===1&&typeof req[0]==='function')return this.all().filter(req[0]);if(req.length===1&&typeof req[0]==='object'&&!Array.isArray(req[0])){const f=req[0];return this.all().filter(e=>(!f.type||e.type===f.type)&&(!f.components||f.components.every(k=>e.components?.[k]))&&(!f.tags||f.tags.every(t=>(e.tags||[]).includes(t))))}return this.all().filter(e=>req.every(k=>k===e.type||!!e.components?.[k]))}
 queryComponent(name){return [...(this.byComponent.get(name)||[])].filter(e=>!this.pendingDestroy.has(e.id))}
 forEach(fn){for(const e of this.all())fn(e)}
 snapshot(){return this.all().map(e=>g.SNESProjectModel?.clone?g.SNESProjectModel.clone(e):JSON.parse(JSON.stringify(e)))}
 dispose(){this.pendingDestroy.clear();this.collections.clear();this.index.clear();this.byComponent.clear();this.entities.length=0}
}
g.SNESEntityWorld={create:scene=>new EntityWorld(scene),EntityWorld};
})(typeof window!=='undefined'?window:globalThis);
