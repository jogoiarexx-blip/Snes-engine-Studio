/** SNES Engine Studio 1.0.1 — Animator Controller with typed parameters, triggers and frame hitboxes. */
(function(g){'use strict';
function defaultValue(def){return def?.type==='bool'?!!def.default:def?.type==='trigger'?false:Number.isFinite(+def?.default)?+def.default:(def?.default??0)}
function create(def){def=def||{states:{}};const params={};for(const [k,v] of Object.entries(def.parameters||{}))params[k]=defaultValue(v);return{def,state:def.entry||Object.keys(def.states||{})[0]||'',time:0,frame:-1,params,triggers:new Set(),activeHitboxes:[],finished:false}}
function set(r,k,v){const pd=r.def.parameters?.[k];if(pd?.type==='trigger'){if(v)r.triggers.add(k);return}r.params[k]=pd?.type==='bool'?!!v:pd?.type==='number'?Number(v)||0:v}
function trigger(r,k){r.triggers.add(k)}
function resetTrigger(r,k){r.triggers.delete(k)}
function compare(v,c,r){if(c.op==='trigger')return r.triggers.has(c.param);if(c.op==='>')return v>c.value;if(c.op==='<')return v<c.value;if(c.op==='>=')return v>=c.value;if(c.op==='<=')return v<=c.value;if(c.op==='!=')return v!=c.value;if(c.op==='===')return v===c.value;return v==c.value}
function stateFrames(r,st){if(Array.isArray(st.frames)&&st.frames.length)return st.frames;const anims=r.def.animations||{};const a=anims[st.animationId];return a?.frames||[]}
function enter(r,to,emit){const from=r.state;r.state=to;r.time=0;r.frame=-1;r.finished=false;r.activeHitboxes=[];(emit||g.SNESEvents?.emit)?.('animation:state',{from,to});}
function update(r,dt,emit){let st=r.def.states?.[r.state];if(!st)return;r.time+=Math.max(0,dt||0);for(const tr of st.transitions||[]){if(tr.hasExitTime&&r.frame>=0&&!r.finished)continue;const conds=tr.conditions||[];if(conds.every(c=>compare(r.params[c.param],c,r))){for(const c of conds)if(c.op==='trigger'||r.def.parameters?.[c.param]?.type==='trigger')r.triggers.delete(c.param);enter(r,tr.to,emit);st=r.def.states?.[r.state];break}}if(!st)return;const frames=stateFrames(r,st),fps=+st.fps||8;if(frames.length){const raw=Math.floor(r.time*fps),fi=st.loop===false?Math.min(frames.length-1,raw):raw%frames.length;r.finished=st.loop===false&&raw>=frames.length-1;if(fi!==r.frame){r.frame=fi;r.activeHitboxes=(st.hitboxes||[]).filter(h=>h.frame===fi).map(h=>Object.assign({},h));for(const ev of st.events||[])if(ev.frame===fi)(emit||g.SNESEvents?.emit)?.('animation:event',{event:ev,state:r.state,frame:fi});if(r.activeHitboxes.length)(emit||g.SNESEvents?.emit)?.('animation:hitboxes',{state:r.state,frame:fi,hitboxes:r.activeHitboxes})}}return r}
function current(r){return r.def.states?.[r.state]||null}
function animationId(r){return current(r)?.animationId||null}
g.SNESAnimatorController={create,set,trigger,resetTrigger,update,current,animationId};
})(typeof window!=='undefined'?window:globalThis);
