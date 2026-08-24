/** Lightweight ECS world used as the canonical runtime entity API. */
(function(g){'use strict';
function norm(e){return g.SNESEntityComponents?g.SNESEntityComponents.ensure(e):e}
class EntityWorld{
 constructor(scene){this.scene=scene||{entities:[]};this.entities=this.scene.entities||(this.scene.entities=[]);this.collections=new Map();this.index=new Map();this.reindex()}
 attachCollection(name,array,reindex=true){if(Array.isArray(array)){const changed=this.collections.get(name)!==array;this.collections.set(name,array);if(changed)for(const e of array)norm(e);if(reindex)this.reindex()}return this}
 detachCollection(name){this.collections.delete(name);this.reindex();return this}
 all(){const out=[],seen=new Set();const add=a=>{for(const e of a||[]){if(!e||seen.has(e))continue;seen.add(e);norm(e);out.push(e)}};add(this.entities);for(const a of this.collections.values())add(a);return out}
 reindex(){this.index.clear();for(const e of this.all()){if(e.id)this.index.set(e.id,e)}return this}
 get(id){return this.index.get(id)||null}
 spawn(def,collection){const e=(g.SNESProjectModel?g.SNESProjectModel.clone(def):JSON.parse(JSON.stringify(def||{})));e.id=e.id||(g.SNESProjectModel?g.SNESProjectModel.uid('ent'):'ent_'+Date.now());norm(e);const target=collection&&this.collections.get(collection)||this.entities;target.push(e);this.index.set(e.id,e);g.SNESEvents?.emit('entity:spawned',{entity:e,world:this,collection:collection||'entities'});return e}
 destroy(id){const e=this.get(id);if(!e)return false;for(const a of [this.entities,...this.collections.values()]){const i=a.indexOf(e);if(i>=0)a.splice(i,1)}this.index.delete(id);g.SNESEvents?.emit('entity:destroyed',{entity:e,world:this});return true}
 query(){const req=[...arguments];return this.all().filter(e=>req.every(k=>k===e.type||!!e.components?.[k]))}
 forEach(fn){this.all().forEach(fn)}
}
g.SNESEntityWorld={create:scene=>new EntityWorld(scene),EntityWorld};
})(typeof window!=='undefined'?window:globalThis);
