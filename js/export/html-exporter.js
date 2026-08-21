/**
 * SNES Engine Studio V7 — Exportador HTML multi-runtime
 * Usa fontes embutidas em window.__SNES_EXPORT_SOURCES
 */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function buildHTML(project, themes, enemyVariants) {
    const type = project.gameType || project.settings?.type || 'platform';
    const src = window.__SNES_EXPORT_SOURCES || {};
    // Core always
    const parts = [
      src.assetManager || '',
      src.audioManager || '',
      src.textureAtlas || '',
      src.combat || '',
      src.upgrades || '',
      src.inventory || '',
      src.collision || '',
      src.renderCache || '',
      src.loadWorker || '',
      src.camera || '',
      src.animation || '',
      src.input || '',
      src.renderCache || '',
      src.loadWorker || '',
      src.projectStore || ''
    ];
    // Runtime only for this genre
    if (type === 'platform') parts.push(src.platform || '');
    else if (type === 'topdown' || type === 'action-rpg') parts.push(src.topdown || '');
    else if (type === 'shooter') parts.push(src.shooter || '');
    else if (type === 'kart-racing' || type === 'kart') {
      parts.push(src.trackData || '', src.kartItems || '', src.ninjaSprites || '', src.ninjaEmbed || '', src.kart || '');
    } else if (type === 'metroidvania') {
      parts.push(src.upgrades || '',
      src.inventory || '', src.platform || '', src.metroidvania || '');
    } else if (type === 'beat-em-up') {
      parts.push(src.upgrades || '',
      src.inventory || '', src.beatEmUp || '');
    } else {
      parts.push(src.platform || '');
    }
    parts.push(src.engine || '');
    const partsJoined = parts.join('\n');

    const skClips = window.SkeletonSprite ? JSON.stringify(window.SkeletonSprite.clips) : '{}';
    const skData = (type === 'platform' || type === 'metroidvania') ? (window.SKELETON_SHEET_DATA || '') : '';
    const mobile = {
      platform: ['left', 'right', 'jump', 'attack', 'action'],
      topdown: ['left', 'right', 'up', 'down', 'attack', 'action', 'inventory'],
      shooter: ['left', 'right', 'up', 'down', 'attack', 'bomb'],
      'kart-racing': ['left', 'right', 'up', 'down', 'jump', 'action'],
      metroidvania: ['left', 'right', 'up', 'down', 'jump', 'attack', 'attack2', 'action'],
      'beat-em-up': ['left', 'right', 'up', 'down', 'attack', 'attack2', 'action']
    }[type] || ['left', 'right', 'attack'];

    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>${esc(project.name || 'Jogo')}</title>
<style>
html,body{margin:0;background:#080912;color:#fff;height:100%;display:grid;place-items:center;font-family:monospace;overflow:hidden;touch-action:none}
canvas{width:min(96vw,1024px);height:auto;image-rendering:pixelated;border:2px solid #353a5d;max-height:75vh}
#pad{position:fixed;left:0;right:0;bottom:0;height:150px;pointer-events:none;display:none}
.pad-btn{pointer-events:auto;position:absolute;width:52px;height:52px;border-radius:50%;background:#ffffff33;border:2px solid #fff6;color:#fff;font-size:16px;display:grid;place-items:center;user-select:none}
.pad-left{left:20px;bottom:40px}.pad-right{left:84px;bottom:40px}
.pad-up{left:52px;bottom:90px}.pad-down{left:52px;bottom:10px}
.pad-jump,.pad-attack{right:20px;bottom:40px}.pad-action{right:84px;bottom:40px}
.pad-bomb{right:20px;bottom:100px}.pad-inventory{right:84px;bottom:100px}
@media(pointer:coarse){#pad{display:block}}
</style></head><body>
<canvas id="game" width="512" height="288"></canvas>
<div id="pad"></div>
<script>
(function(){
const PROJECT=${JSON.stringify(project).replace(/</g, '\\u003c')};
const THEMES=${JSON.stringify(themes).replace(/</g, '\\u003c')};
const ENEMY_VARIANTS=${JSON.stringify(enemyVariants).replace(/</g, '\\u003c')};
const SK_CLIPS=${skClips};
const SK_DATA=${JSON.stringify(skData)};
${partsJoined}
const skImg=new Image();if(SK_DATA)skImg.src=SK_DATA;
const rates={idle:5,walk:9,run:12,attack:13,hurt:9,death:8};
function skState(e){if(e.dead)return'death';if(e.hurtUntil>Date.now())return'hurt';if(e.attackUntil>Date.now())return'attack';if(Math.abs(e.vx||0)>55)return'run';if(Math.abs(e.vx||0)>2)return'walk';return'idle'}
function skDraw(c,e){if(!skImg.complete||!skImg.naturalWidth){c.fillStyle='#b8a477';c.fillRect(e.x,e.y-30,22,46);return}
const st=skState(e),arr=SK_CLIPS[st]||SK_CLIPS.idle;if(!arr)return;
const elapsed=e.animStarted?performance.now()-e.animStarted:performance.now();
const i=st==='death'?Math.min(arr.length-1,Math.floor(elapsed/120)):Math.floor(elapsed/(1000/(rates[st]||8)))%arr.length;
const f=arr[i];c.save();c.imageSmoothingEnabled=false;const flip=e.facing==='left',dw=52,dh=64,dx=e.x-17,dy=e.y-48;
if(flip){c.translate(dx+dw,0);c.scale(-1,1);c.drawImage(skImg,f[0],f[1],f[2],f[3],0,dy,dw,dh)}
else c.drawImage(skImg,f[0],f[1],f[2],f[3],dx,dy,dw,dh);c.restore()}
if(window.SNESEngine)window.SNESEngine.autoRegister();
const canvas=document.getElementById('game');
const type=PROJECT.gameType||'platform';
const handle=SNESEngine.play(PROJECT,canvas,THEMES,ENEMY_VARIANTS,skDraw);
const pad=document.getElementById('pad');
const buttons=${JSON.stringify(mobile)};
if(handle&&handle.rt)SNESEngine.attachMobilePad(pad,handle.rt,buttons);
const SAVE_KEY='snes_v7_player_'+type;
try{const raw=localStorage.getItem(SAVE_KEY);if(raw&&handle){const sv=JSON.parse(raw);if(sv.score!=null)handle.rt.player.score=sv.score}}catch(_){}
setInterval(function(){if(!handle)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify({score:handle.rt.player.score,hp:handle.rt.player.hp}))}catch(_){}},4000);
})();
<\/script></body></html>`;
  }

  function init() {
    const A = window.SNESStudio;
    if (!A) return;
    // Override buildExport
    A.buildExport = function () {
      A.project.scenes.forEach(s => {
        if (window.PlatformRuntime) window.PlatformRuntime.ensureLayers(s);
      });
      return buildHTML(A.project, A.THEMES, A.ENEMY_VARIANTS);
    };
    window.HTMLExporter = { build: buildHTML };
  }

  addEventListener('snesstudio:ready', init);
  if (window.SNESStudio) init();
})();
