/** SNES Engine Studio 1.0 — ponte única para componentes/legado */
(function(global){
  'use strict';
  function ensure(e){return global.SNESRuntimeSession?global.SNESRuntimeSession.normalizeEntity(e):e}
  function get(e,name,fallback){ensure(e);const c=e&&e.components&&e.components[name];return c==null?fallback:c}
  function sync(e){
    ensure(e); if(!e||!e.components)return e;
    const t=e.components.transform;if(t){e.x=t.x;e.y=t.y;}
    const h=e.components.health;if(h){e.hp=h.current;e.maxHp=h.max;}
    const c=e.components.combat;if(c&&c.damage!=null)e.damage=c.damage;
    const a=e.components.ai;if(a&&a.mode)e.ai=a.mode;
    const s=e.components.spriteRenderer;if(s&&s.assetId)e.spriteAsset=s.assetId;
    return e;
  }
  function setHealth(e,current,max){ensure(e);const h=e.components.health||(e.components.health={});if(max!=null)h.max=max;if(current!=null)h.current=current;sync(e);return h;}
  global.SNESEntityComponents={ensure,get,sync,setHealth};
})(typeof window!=='undefined'?window:globalThis);
