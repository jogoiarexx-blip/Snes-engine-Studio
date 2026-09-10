/** SNES Engine Studio 1.0.1 — unified keyboard, multi-gamepad and touch input. */
(function(global){'use strict';
const ACTIONS=['left','right','up','down','jump','attack','attack2','action','bomb','inventory','pause'];
const DEFAULT_KEYS={left:['arrowleft','a'],right:['arrowright','d'],up:['arrowup','w'],down:['arrowdown','s'],jump:['z',' '],attack:['x','c'],attack2:['v'],action:['e','enter'],bomb:['b'],inventory:['i'],pause:['p','escape']};
const GP={jump:[0],attack:[1,2],attack2:[3],action:[0],bomb:[4,5],inventory:[8],pause:[9],left:[14],right:[15],up:[12],down:[13]};
function createInput(opts={}){const keys=Object.create(null),touch={stickX:0,stickY:0},now=Object.create(null),prev=Object.create(null);for(const a of ACTIONS)touch[a]=false;let unbind=null;let playerIndex=opts.playerIndex||0,deadZone=opts.deadZone??0.25;
function bind(target){const down=e=>{const k=String(e.key).toLowerCase();keys[k]=true;if(['arrowleft','arrowright','arrowup','arrowdown',' ','z','x','c','e'].includes(k))e.preventDefault()},up=e=>{keys[String(e.key).toLowerCase()]=false};target.addEventListener('keydown',down);target.addEventListener('keyup',up);unbind=()=>{target.removeEventListener('keydown',down);target.removeEventListener('keyup',up)};return unbind}
function pads(){try{return [...(navigator.getGamepads?.()||[])].filter(Boolean)}catch(_){return[]}}
function pad(){const p=pads();return p[playerIndex]||p[0]||null}
function map(){return global.__SNES_KEYMAP||DEFAULT_KEYS}
function keyHit(name){return (map()[name]||DEFAULT_KEYS[name]||[]).some(k=>!!keys[String(k).toLowerCase()])}
function gpBtn(name){const p=pad();return !!(p&&(GP[name]||[]).some(i=>p.buttons[i]&&(p.buttons[i].pressed||p.buttons[i].value>.5)))}
function rawPressed(name){if(touch[name])return true;if(keyHit(name)||gpBtn(name))return true;const p=pad();if(p){if(name==='left'&&p.axes[0]<-deadZone)return true;if(name==='right'&&p.axes[0]>deadZone)return true;if(name==='up'&&p.axes[1]<-deadZone)return true;if(name==='down'&&p.axes[1]>deadZone)return true}return false}
function axis(axisIndex,neg,pos,touchAxis){let v=(rawPressed(pos)?1:0)-(rawPressed(neg)?1:0);const tv=touch[touchAxis]||0;if(Math.abs(tv)>deadZone)v=tv;const p=pad(),pv=p?.axes?.[axisIndex]||0;if(Math.abs(pv)>deadZone)v=pv;return Math.max(-1,Math.min(1,v))}
function axisX(){return axis(0,'left','right','stickX')}function axisY(){return axis(1,'up','down','stickY')}
function beginFrame(){for(const a of ACTIONS)now[a]=rawPressed(a)}function endFrame(){for(const a of ACTIONS)prev[a]=!!now[a]}
function pressed(a){return now[a]!==undefined?!!now[a]:rawPressed(a)}function justPressed(a){return !!now[a]&&!prev[a]}function justReleased(a){return !now[a]&&!!prev[a]}
function resetTouch(){for(const a of ACTIONS)touch[a]=false;touch.stickX=touch.stickY=0}
return{keys,touch,bind,axisX,axisY,pressed,rawPressed,justPressed,justReleased,beginFrame,endFrame,resetTouch,pads,setPlayerIndex:i=>playerIndex=Math.max(0,+i||0),setDeadZone:v=>deadZone=Math.max(0,Math.min(.95,+v||0)),dispose(){unbind?.();resetTouch()}}}
function setKeyMap(m){const out={};for(const a of ACTIONS)out[a]=Array.isArray(m?.[a])?m[a].map(x=>String(x).toLowerCase()):(DEFAULT_KEYS[a]||[]).slice();global.__SNES_KEYMAP=out;return out}
function getKeyMap(){return JSON.parse(JSON.stringify(global.__SNES_KEYMAP||DEFAULT_KEYS))}
global.SNESInput={ACTIONS,DEFAULT_KEYS,setKeyMap,getKeyMap,create:createInput};
})(typeof window!=='undefined'?window:globalThis);
