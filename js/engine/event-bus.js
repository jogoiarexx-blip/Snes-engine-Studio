/** SNES Engine Studio 1.0 — Event Bus central */
(function(global){
  'use strict';
  const listeners = Object.create(null);
  function on(type, fn){ if(!type || typeof fn!=='function') return function(){}; (listeners[type]=listeners[type]||new Set()).add(fn); return ()=>off(type,fn); }
  function once(type, fn){ const dispose=on(type,function(payload){dispose();fn(payload)}); return dispose; }
  function off(type, fn){ const set=listeners[type]; if(set) set.delete(fn); }
  function emit(type, payload){ const set=listeners[type]; if(!set) return; Array.from(set).forEach(fn=>{try{fn(payload)}catch(e){console.error('[SNESEvents]',type,e)}}); }
  function clear(type){ if(type) delete listeners[type]; else Object.keys(listeners).forEach(k=>delete listeners[k]); }
  global.SNESEvents={on,once,off,emit,clear};
})(typeof window!=='undefined'?window:globalThis);
