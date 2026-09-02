/**
 * SNES Engine Studio 1.0 — núcleo integrado de runtime.
 */
(function (global) {
  'use strict';

  const runtimes = Object.create(null);

  function register(rt) {
    if (rt && rt.id) runtimes[rt.id] = rt;
  }

  function get(id) {
    return runtimes[id] || runtimes.platform || null;
  }

  function list() {
    return Object.keys(runtimes).map(k => runtimes[k]);
  }

  // Auto-register if globals already exist
  function autoRegister() {
    if (global.PlatformRuntime) register(global.PlatformRuntime);
    if (global.TopdownRuntime) register(global.TopdownRuntime);
    if (global.ShooterRuntime) register(global.ShooterRuntime);
    if (global.KartRuntime) register(global.KartRuntime);
    if (global.BeatEmUpRuntime) register(global.BeatEmUpRuntime);
    if (global.MetroidvaniaRuntime) register(global.MetroidvaniaRuntime);
  }

  let active = null;
  let raf = 0;
  let last = 0;
  let playing = false;
  let onStop = null;
  let playToken = 0;

  function play(project, canvas, themes, enemyVariants, skeletonDraw, hooks) {
    autoRegister();
    stop();
    const type = (project.gameType || project.settings && project.settings.type || 'platform');
    const mapped = type === 'top-down' || type === 'action-rpg' ? 'topdown' : type === 'kart' ? 'kart-racing' : type === 'beat-em-up' || type === 'beatemup' ? 'beat-em-up' : type;
    const RT = get(mapped) || get('platform');
    if (!RT) {
      console.error('Runtime não encontrado:', mapped);
      return null;
    }
    const rt = RT.createState(project, project.currentScene);
    // Runtime entities are now the canonical EntityWorld collection. Legacy runtimes
    // still read direct fields, so components are synchronized at the frame boundary.
    if (global.SNESEntityComponents) {
      (rt.entities||[]).forEach(e=>global.SNESEntityComponents.ensure(e));
      const pe=(rt.scene?.entities||[]).find(e=>e.type==='player');
      if(pe){ rt.playerEntity=global.SNESProjectModel?global.SNESProjectModel.clone(pe):JSON.parse(JSON.stringify(pe)); global.SNESEntityComponents.ensure(rt.playerEntity); Object.assign(rt.playerEntity,{x:rt.player.x,y:rt.player.y,hp:rt.player.hp,maxHp:rt.player.maxHp,speed:rt.player.speed,jump:rt.player.jump}); global.SNESEntityComponents.syncFromLegacy(rt.playerEntity); }
    }
    rt.world = global.SNESEntityWorld ? global.SNESEntityWorld.create({entities:rt.entities||(rt.entities=[])}) : null;
    if(rt.world){
      rt.entities=rt.world.entities;
      // Legacy genre runtimes keep some gameplay collections outside rt.entities.
      // Attach them to EntityWorld so queries/debug/systems see one canonical world.
      for(const name of ['enemies','items','projectiles','bullets','pickups','npcs']){
        if(Array.isArray(rt[name]))rt.world.attachCollection(name,rt[name],false);
      }
      rt.world.reindex();
    }
    RT.start(rt, window);
    // Track checkpoint changes centrally so every genre can drive autosave.
    { const cp=rt.player&&rt.player.checkpoint; rt.__checkpointSignature=cp?[cp.sceneId||rt.sceneId||'',cp.x??'',cp.y??''].join('|'):''; rt.__engineSceneId=rt.sceneId||rt.scene?.id||project.currentScene||''; }
    const token = ++playToken;
    active = { rt, RT, canvas, themes, enemyVariants, skeletonDraw, token };
    playing = true;
    if (global.SNESEvents) global.SNESEvents.emit('runtime:started',{rt:rt,token:token,project:project});
    last = 0;
    hooks = hooks || {};
    onStop = hooks.onStop || null;
    let endState = '';

    // Mobile pad overlay for editor test
    let pad = document.getElementById('editorPad');
    if (!pad) {
      pad = document.createElement('div');
      pad.id = 'editorPad';
      pad.className = 'editorPad';
      document.body.appendChild(pad);
    }
    pad.style.display = '';
    { const padButtons=(RT.mobileButtons||['left','right','jump','attack','action']).slice();if(!padButtons.includes('pause'))padButtons.push('pause');attachMobilePad(pad,rt,padButtons); }

    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (global.SNESRender) global.SNESRender.setupCtx(ctx);
    else ctx.imageSmoothingEnabled = false;
    const fpsMeter = global.SNESRender ? global.SNESRender.createFpsMeter() : null;
    let _showFps = false;

    function loop(now) {
      if (!playing) return;
      if(global.SNESProfiler)global.SNESProfiler.begin();
      const dt = Math.min(0.033, last ? (now - last) / 1000 : 1 / 60);
      last = now;
      const Studio = global.SNESStudioRuntime;
      if(global.SNESEntityComponents){
        (rt.world?.entities||rt.entities||[]).forEach(e=>global.SNESEntityComponents.syncToLegacy(e));
        if(rt.playerEntity){global.SNESEntityComponents.syncToLegacy(rt.playerEntity);Object.assign(rt.player,{x:rt.playerEntity.x,y:rt.playerEntity.y,hp:rt.playerEntity.hp,maxHp:rt.playerEntity.maxHp,speed:rt.playerEntity.speed,jump:rt.playerEntity.jump});}
      }
      if(rt.input?.beginFrame)rt.input.beginFrame();
      if (Studio) { rt.__studioThemes = themes; Studio.beginFrame(rt, dt); }
      RT.tick(rt, themes, enemyVariants, dt, now);
      {
        const liveScene=rt.sceneId||rt.scene?.id||'';
        if(liveScene&&rt.__engineSceneId&&liveScene!==rt.__engineSceneId){
          const previous=rt.__engineSceneId;if(global.SNESEvents)global.SNESEvents.emit('scene:leaving',{rt:rt,token:token,project:project,previous:previous,current:liveScene});rt.__engineSceneId=liveScene;project.currentScene=liveScene;
          if(global.SNESEntityWorld){rt.world=global.SNESEntityWorld.create({entities:rt.entities||(rt.entities=[])});for(const name of ['enemies','items','projectiles','bullets','pickups','npcs'])if(Array.isArray(rt[name]))rt.world.attachCollection(name,rt[name],false);rt.world.reindex();}
          rt.__studio=null;
          if(global.SNESEvents){const payload={rt:rt,token:token,project:project,previous:previous,current:liveScene,scene:rt.scene};global.SNESEvents.emit('scene:changed',payload);global.SNESEvents.emit('scene:entered',payload);}
        }
      }
      {
        const cp=rt.player&&rt.player.checkpoint;
        const sig=cp?[cp.sceneId||rt.sceneId||'',cp.x??'',cp.y??''].join('|'):'';
        if(sig && rt.__checkpointSignature && sig!==rt.__checkpointSignature){
          const payload={rt:rt,token:token,project:project,checkpoint:Object.assign({},cp)};
          if(global.SNESEvents)global.SNESEvents.emit('checkpoint:activated',payload);
        }
        if(sig)rt.__checkpointSignature=sig;
      }
      if(global.SNESProfiler)global.SNESProfiler.mark('update');
      if(global.SNESEntityComponents){
        (rt.world?.entities||rt.entities||[]).forEach(e=>global.SNESEntityComponents.syncFromLegacy(e));
        if(rt.playerEntity){Object.assign(rt.playerEntity,{x:rt.player.x,y:rt.player.y,hp:rt.player.hp,maxHp:rt.player.maxHp,speed:rt.player.speed,jump:rt.player.jump});global.SNESEntityComponents.syncFromLegacy(rt.playerEntity);}
      }
      if(rt.world){for(const name of ['enemies','items','projectiles','bullets','pickups','npcs'])if(Array.isArray(rt[name]))rt.world.attachCollection(name,rt[name],false);rt.world.reindex();}
      if (Studio) Studio.afterTick(rt);
      if (Studio) Studio.beforeDraw(rt);
      const sh = Studio ? Studio.applyShake && Studio.applyShake(ctx, rt) : null;
      const genericCamera = (mapped==='platform'||mapped==='topdown'||mapped==='shooter') && rt.camera && (((rt.camera.worldW||512)>512)||((rt.camera.worldH||288)>288)||Math.abs(rt.camera.x||0)>0.01||Math.abs(rt.camera.y||0)>0.01);
      rt.__cameraPipeline=!!genericCamera;rt.__skipClear=!!genericCamera;
      if(genericCamera)ctx.clearRect(0,0,canvas.width,canvas.height);
      if (genericCamera || (sh && (sh.x || sh.y))) { ctx.save(); ctx.translate((sh?.x||0)-(genericCamera?(rt.camera.x||0):0),(sh?.y||0)-(genericCamera?(rt.camera.y||0):0)); }
      RT.drawFrame(ctx, rt, themes, enemyVariants, skeletonDraw);
      if (genericCamera || (sh && (sh.x || sh.y))) ctx.restore();
      if (Studio) Studio.afterDraw(ctx, rt);
      if (Studio) Studio.endFrame(rt);
      if(rt.input?.endFrame)rt.input.endFrame();
      if(global.SNESProfiler){global.SNESProfiler.mark('render');global.SNESProfiler.end({entities:rt.world?.entities?.length||0});}
      if (hooks.onFrame) { try { hooks.onFrame(rt, dt, now); } catch (e) { console.error('[SNESEngine] onFrame', e); } }
      if (global.SNESEvents) global.SNESEvents.emit('engine:frame', { rt: rt, token: token, dt: dt, now: now });
      const nextEnd = rt.gameOver ? 'gameover' : rt.won ? 'won' : '';
      if (nextEnd && nextEnd !== endState) {
        endState = nextEnd;
        const payload = { rt: rt, token: token, project: project };
        if (nextEnd === 'gameover') {
          if (hooks.onGameOver) { try { hooks.onGameOver(payload); } catch(e){ console.error(e); } }
          if (global.SNESEvents) global.SNESEvents.emit('game:over', payload);
        } else {
          if (hooks.onWon) { try { hooks.onWon(payload); } catch(e){ console.error(e); } }
          if (global.SNESEvents) global.SNESEvents.emit('game:won', payload);
        }
      } else if (!nextEnd) endState = '';
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return active;
  }

  function stop() {
    if (!playing) return;
    playing = false;
    if (raf) cancelAnimationFrame(raf);
    if (active && active.RT) active.RT.stop(active.rt);
    const pad = document.getElementById('editorPad');
    if (pad) pad.style.display = 'none';
    const was = active;
    active = null;
    if (onStop) onStop(was);
    onStop = null;
  }

  function isPlaying() { return playing; }
  function getActive() { return active; }

  // Mobile pad builder for export / play
  function attachMobilePad(container, rt, buttons) {
    if (!container) return;
    container.innerHTML = '';
    const map = {
      left: '◀', right: '▶', up: '▲', down: '▼',
      jump: 'A', attack: 'B', attack2: 'Y', action: 'X',
      bomb: '💣', inventory: 'I', pause: '⏸'
    };
    buttons = buttons || ['left', 'right', 'jump', 'attack', 'action'];
    buttons.forEach(k => {
      const b = document.createElement('div');
      b.className = 'pad-btn pad-' + k;
      b.textContent = map[k] || k;
      b.dataset.k = k;
      const on = e => { e.preventDefault(); if (rt.input && rt.input.touch) rt.input.touch[k] = true; };
      const off = e => { e.preventDefault(); if (rt.input && rt.input.touch) rt.input.touch[k] = false; };
      b.addEventListener('touchstart', on, { passive: false });
      b.addEventListener('touchend', off, { passive: false });
      b.addEventListener('touchcancel', off, { passive: false });
      b.addEventListener('mousedown', on);
      b.addEventListener('mouseup', off);
      b.addEventListener('mouseleave', off);
      container.appendChild(b);
    });
  }

  global.SNESEngine = {
    register, get, list, play, stop, isPlaying, getActive, attachMobilePad, autoRegister
  };

  // Register when DOM ready-ish
  if (global.PlatformRuntime) register(global.PlatformRuntime);
  if (global.TopdownRuntime) register(global.TopdownRuntime);
  if (global.ShooterRuntime) register(global.ShooterRuntime);
  if (global.KartRuntime) register(global.KartRuntime);
    if (global.BeatEmUpRuntime) register(global.BeatEmUpRuntime);
    if (global.MetroidvaniaRuntime) register(global.MetroidvaniaRuntime);
})(typeof window !== 'undefined' ? window : globalThis);
