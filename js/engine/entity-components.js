/** SNES Engine Studio 1.0 — canonical entity components with live legacy accessors. */
(function(global){'use strict';
function defineBridge(e,key,getter,setter){
  try{
    const d=Object.getOwnPropertyDescriptor(e,key);
    if(d&&d.get&&d.set)return;
    Object.defineProperty(e,key,{enumerable:true,configurable:true,get:getter,set:setter});
  }catch(_){ }
}
function ensure(e){
  if(!e||typeof e!=='object')return e;
  const legacy={x:e.x,y:e.y,hp:e.hp,maxHp:e.maxHp,damage:e.damage,speed:e.speed,jump:e.jump,ai:e.ai,spriteAsset:e.spriteAsset,animationId:e.animationId};
  e.components=e.components||{};
  if(e.components.sprite&&!e.components.spriteRenderer){e.components.spriteRenderer=e.components.sprite;delete e.components.sprite}
  const t=e.components.transform||(e.components.transform={});if(t.x==null)t.x=Number(legacy.x)||0;if(t.y==null)t.y=Number(legacy.y)||0;
  if((legacy.spriteAsset||legacy.animationId)&&!e.components.spriteRenderer)e.components.spriteRenderer={};const sr=e.components.spriteRenderer;if(sr){if(sr.assetId==null&&legacy.spriteAsset)sr.assetId=legacy.spriteAsset;if(sr.animationId==null&&legacy.animationId)sr.animationId=legacy.animationId;if(sr.visible==null)sr.visible=true}
  if((legacy.hp!=null||legacy.maxHp!=null)&&!e.components.health)e.components.health={};const h=e.components.health;if(h){if(h.max==null)h.max=Number(legacy.maxHp!=null?legacy.maxHp:legacy.hp)||1;if(h.current==null)h.current=Number(legacy.hp!=null?legacy.hp:h.max)||h.max}
  if(legacy.damage!=null&&!e.components.combat)e.components.combat={damage:Number(legacy.damage)||1};
  if((legacy.speed!=null||legacy.jump!=null)&&!e.components.movement)e.components.movement={};const mv=e.components.movement;if(mv){if(mv.speed==null&&legacy.speed!=null)mv.speed=Number(legacy.speed)||0;if(mv.jump==null&&legacy.jump!=null)mv.jump=Number(legacy.jump)||0}
  if(legacy.ai&&!e.components.ai)e.components.ai={mode:typeof legacy.ai==='string'?legacy.ai:'patrol'};
  if(!e.components.collider)e.components.collider={w:e.w||e.width||16,h:e.h||e.height||16,solid:e.solid!==false};if(global.SNESCollisionLayers)global.SNESCollisionLayers.ensure(e);
  // Legacy fields are now live accessors into Components. Older runtimes can keep using
  // e.hp/e.x/etc while Components remains the single source of truth.
  defineBridge(e,'x',()=>e.components.transform.x,v=>{e.components.transform.x=Number(v)||0});
  defineBridge(e,'y',()=>e.components.transform.y,v=>{e.components.transform.y=Number(v)||0});
  defineBridge(e,'hp',()=>e.components.health?.current,v=>{const q=e.components.health||(e.components.health={max:Number(v)||1,current:Number(v)||0});q.current=Number(v)||0;if(q.max==null)q.max=Math.max(1,q.current)});
  defineBridge(e,'maxHp',()=>e.components.health?.max,v=>{const q=e.components.health||(e.components.health={current:Number(v)||0,max:Number(v)||1});q.max=Math.max(1,Number(v)||1)});
  defineBridge(e,'damage',()=>e.components.combat?.damage,v=>{(e.components.combat||(e.components.combat={})).damage=Number(v)||0});
  defineBridge(e,'speed',()=>e.components.movement?.speed,v=>{(e.components.movement||(e.components.movement={})).speed=Number(v)||0});
  defineBridge(e,'jump',()=>e.components.movement?.jump,v=>{(e.components.movement||(e.components.movement={})).jump=Number(v)||0});
  defineBridge(e,'ai',()=>e.components.ai?.mode,v=>{(e.components.ai||(e.components.ai={})).mode=typeof v==='string'?v:'patrol'});
  defineBridge(e,'spriteAsset',()=>e.components.spriteRenderer?.assetId||null,v=>{(e.components.spriteRenderer||(e.components.spriteRenderer={})).assetId=v||null});
  defineBridge(e,'animationId',()=>e.components.spriteRenderer?.runtimeAnimationId||e.components.spriteRenderer?.animationId||null,v=>{const q=e.components.spriteRenderer||(e.components.spriteRenderer={});q.animationId=v||null});
  return e;
}
function syncToLegacy(e){return ensure(e)}
function syncFromLegacy(e){return ensure(e)}
function get(e,name,fallback){ensure(e);return e.components[name]??fallback}
function setHealth(e,current,max){ensure(e);const h=e.components.health||(e.components.health={});if(max!=null)h.max=max;if(current!=null)h.current=current;return h}
global.SNESEntityComponents={ensure,get,setHealth,sync:syncFromLegacy,syncFromLegacy,syncToLegacy};
})(typeof window!=='undefined'?window:globalThis);
