/** SNES Engine Studio 1.0 — adaptive runtime quality manager. */
(function(g){'use strict';
const PRESETS={
 low:{name:'Baixo',particleScale:.35,maxParticles:180,maxLights:2,maxParallax:2,fxEvery:2},
 balanced:{name:'Balanceado',particleScale:.7,maxParticles:360,maxLights:5,maxParallax:4,fxEvery:1},
 high:{name:'Alto',particleScale:1,maxParticles:600,maxLights:12,maxParallax:8,fxEvery:1}
};
const order=['low','balanced','high'];
function normalize(v){return PRESETS[v]?v:'balanced'}
function desired(project){const q=project?.game?.settings?.quality||'auto';return q==='auto'?'balanced':normalize(q)}
function create(project){return {mode:project?.game?.settings?.quality||'auto',level:desired(project),frames:0,lowStreak:0,highStreak:0,lastChange:0}}
function set(rt,level,reason){const st=rt.__quality||(rt.__quality=create(rt.project));level=normalize(level);if(st.level===level)return false;st.level=level;st.lastChange=performance.now();st.lowStreak=st.highStreak=0;g.SNESEvents?.emit('quality:changed',{rt,level,reason:reason||'manual',preset:PRESETS[level]});return true}
function update(rt){const st=rt.__quality||(rt.__quality=create(rt.project));st.mode=rt.project?.game?.settings?.quality||st.mode||'auto';if(st.mode!=='auto'){set(rt,normalize(st.mode),'setting');return PRESETS[st.level]}
 st.frames++;if(st.frames%90!==0)return PRESETS[st.level];const s=g.SNESProfiler?.summary?.();const fps=s?.fps||60;if(fps<48){st.lowStreak++;st.highStreak=0}else if(fps>58){st.highStreak++;st.lowStreak=0}else{st.lowStreak=Math.max(0,st.lowStreak-1);st.highStreak=Math.max(0,st.highStreak-1)}
 const i=order.indexOf(st.level);if(st.lowStreak>=2&&i>0)set(rt,order[i-1],'fps-low');else if(st.highStreak>=5&&i<order.length-1)set(rt,order[i+1],'fps-stable');return PRESETS[st.level]}
function get(rt){const st=rt.__quality||(rt.__quality=create(rt.project));return PRESETS[st.level]||PRESETS.balanced}
function info(rt){const st=rt.__quality||(rt.__quality=create(rt.project));return {mode:st.mode,level:st.level,preset:get(rt)}}
g.SNESQuality={PRESETS,create,set,update,get,info};
})(typeof window!=='undefined'?window:globalThis);
