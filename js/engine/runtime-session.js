/** SNES Engine Studio 1.0 — separa definição do projeto do estado de execução */
(function(global){
  'use strict';
  function clone(v){try{return structuredClone(v)}catch(_){try{return JSON.parse(JSON.stringify(v))}catch(__){return v}}}
  function difficultyScale(project){
    const d=project&&project.game&&project.game.settings&&project.game.settings.difficulty||'normal';
    return d==='easy'?{enemyHp:.8,enemyDamage:.75,playerHp:1.25}:d==='hard'?{enemyHp:1.35,enemyDamage:1.25,playerHp:1}:{enemyHp:1,enemyDamage:1,playerHp:1};
  }
  function normalizeEntity(e){
    if(!e||typeof e!=='object') return e;
    e.components=e.components||{};
    const t=e.components.transform||(e.components.transform={});
    if(t.x==null)t.x=Number(e.x)||0;if(t.y==null)t.y=Number(e.y)||0;
    e.x=t.x;e.y=t.y;
    if(e.spriteAsset && !e.components.spriteRenderer) e.components.spriteRenderer={assetId:e.spriteAsset,visible:true};
    const h=e.components.health||(e.hp!=null||e.maxHp!=null?e.components.health={}:null);
    if(h){ if(h.max==null)h.max=Number(e.maxHp!=null?e.maxHp:e.hp)||1;if(h.current==null)h.current=Number(e.hp!=null?e.hp:h.max)||h.max;e.maxHp=h.max;e.hp=h.current; }
    const c=e.components.combat||(e.damage!=null?e.components.combat={}:null);if(c){if(c.damage==null)c.damage=Number(e.damage)||1;e.damage=c.damage;}
    const ai=e.components.ai||(e.ai?e.components.ai={}:null);if(ai){if(!ai.mode)ai.mode=typeof e.ai==='string'?e.ai:'patrol';e.ai=ai.mode;}
    return e;
  }
  function normalizeProject(project){(project.scenes||[]).forEach(s=>(s.entities||[]).forEach(normalizeEntity));return project;}
  function create(definition){
    const p=normalizeProject(clone(definition||{}));
    const scale=difficultyScale(p);
    (p.scenes||[]).forEach(s=>(s.entities||[]).forEach(e=>{
      if(e.type==='enemy'||e.boss){e.hp=Math.max(1,Math.round((e.hp||1)*scale.enemyHp));e.maxHp=Math.max(e.hp,Math.round((e.maxHp||e.hp||1)*scale.enemyHp));e.damage=Math.max(1,Math.round((e.damage||1)*scale.enemyDamage));if(e.components&&e.components.health){e.components.health.current=e.hp;e.components.health.max=e.maxHp;}if(e.components&&e.components.combat)e.components.combat.damage=e.damage;}
      if(e.type==='player'&&scale.playerHp!==1){e.hp=Math.max(1,Math.round((e.hp||3)*scale.playerHp));e.maxHp=Math.max(e.hp,Math.round((e.maxHp||e.hp)*scale.playerHp));if(e.components&&e.components.health){e.components.health.current=e.hp;e.components.health.max=e.maxHp;}}
    }));
    return {definition:definition,project:p,createdAt:Date.now(),id:'session_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)};
  }
  global.SNESRuntimeSession={clone,normalizeEntity,normalizeProject,create,difficultyScale};
})(typeof window!=='undefined'?window:globalThis);
