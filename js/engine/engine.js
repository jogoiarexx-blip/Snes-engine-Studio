/**
 * SNES Engine Studio V7 — Núcleo: seleciona runtime e roda o loop
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
    RT.start(rt, window);
    active = { rt, RT, canvas, themes, enemyVariants, skeletonDraw };
    playing = true;
    last = 0;
    hooks = hooks || {};
    onStop = hooks.onStop || null;

    // Mobile pad overlay for editor test
    let pad = document.getElementById('editorPad');
    if (!pad) {
      pad = document.createElement('div');
      pad.id = 'editorPad';
      pad.className = 'editorPad';
      document.body.appendChild(pad);
    }
    pad.style.display = '';
    attachMobilePad(pad, rt, RT.mobileButtons || ['left','right','jump','attack','action']);

    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (global.SNESRender) global.SNESRender.setupCtx(ctx);
    else ctx.imageSmoothingEnabled = false;
    const fpsMeter = global.SNESRender ? global.SNESRender.createFpsMeter() : null;
    let _showFps = false;

    function loop(now) {
      if (!playing) return;
      const dt = Math.min(0.033, last ? (now - last) / 1000 : 1 / 60);
      last = now;
      const Studio = global.SNESStudioRuntime;
      if (Studio) { rt.__studioThemes = themes; Studio.beginFrame(rt, dt); }
      RT.tick(rt, themes, enemyVariants, dt, now);
      if (Studio) Studio.afterTick(rt);
      if (Studio) Studio.beforeDraw(rt);
      const sh = Studio ? Studio.applyShake && Studio.applyShake(ctx, rt) : null;
      if (sh && (sh.x || sh.y)) { ctx.save(); ctx.translate(sh.x, sh.y); }
      RT.drawFrame(ctx, rt, themes, enemyVariants, skeletonDraw);
      if (sh && (sh.x || sh.y)) ctx.restore();
      if (Studio) Studio.afterDraw(ctx, rt);
      if (Studio) Studio.endFrame(rt);
      if (rt.gameOver || rt.won) {
        // keep drawing for a moment
      }
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
