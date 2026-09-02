/**
 * SNES Engine Studio 0.8 — AudioManager otimizado
 * - Web Audio API + fallback HTMLAudio
 * - Cache de buffers decodificados
 * - Pool de vozes SFX (sem new Audio por frame)
 * - BGM único com fade
 * - Volumes master/sfx/bgm + mute
 * - Sons procedurais (funciona em file:// sem arquivos)
 * - Preload paralelo + lazy load
 */
(function (global) {
  'use strict';

  const bufferCache = Object.create(null);  // id -> AudioBuffer | 'loading' | null
  const htmlCache = Object.create(null);    // id -> HTMLAudioElement template
  const waiters = Object.create(null);
  const sfxPool = [];                       // { el or source nodes }
  const POOL_SIZE = 8;

  let ctx = null;
  let masterGain = null;
  let sfxGain = null;
  let bgmGain = null;
  let unlocked = false;
  let muted = false;
  let volMaster = 1, volSfx = 1, volBgm = 0.7;
  let currentBgm = null; // { id, source, gain, html? }
  let enabled = true;

  function ensureContext() {
    if (ctx) return ctx;
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      masterGain = ctx.createGain();
      sfxGain = ctx.createGain();
      bgmGain = ctx.createGain();
      sfxGain.connect(masterGain);
      bgmGain.connect(masterGain);
      masterGain.connect(ctx.destination);
      applyVolumes();
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  function applyVolumes() {
    if (!masterGain) return;
    const m = muted ? 0 : volMaster;
    masterGain.gain.value = m;
    sfxGain.gain.value = volSfx;
    bgmGain.gain.value = volBgm;
  }

  /** Desbloqueia áudio após gesto do usuário (política dos browsers) */
  function unlock() {
    const c = ensureContext();
    if (!c) { unlocked = true; return Promise.resolve(); }
    if (c.state === 'running') { unlocked = true; return Promise.resolve(); }
    return c.resume().then(function () { unlocked = true; }).catch(function () {
      unlocked = true;
    });
  }

  // Auto-unlock on first pointer/key
  if (typeof document !== 'undefined') {
    const once = function () {
      unlock();
      document.removeEventListener('pointerdown', once, true);
      document.removeEventListener('keydown', once, true);
    };
    document.addEventListener('pointerdown', once, true);
    document.addEventListener('keydown', once, true);
  }

  function setMasterVolume(v) { volMaster = clamp01(v); applyVolumes(); }
  function setSfxVolume(v) { volSfx = clamp01(v); applyVolumes(); }
  function setBgmVolume(v) { volBgm = clamp01(v); applyVolumes(); }
  function setMuted(m) { muted = !!m; applyVolumes(); }
  function toggleMute() { setMuted(!muted); return muted; }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  // —— Procedural synth (sem arquivos) ——

  const PROC = {
    blip: function (c, t0, dest) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(660, t0);
      o.frequency.exponentialRampToValueAtTime(440, t0 + 0.08);
      g.gain.setValueAtTime(0.15, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
      o.connect(g); g.connect(dest);
      o.start(t0); o.stop(t0 + 0.12);
    },
    coin: function (c, t0, dest) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(988, t0);
      o.frequency.setValueAtTime(1319, t0 + 0.08);
      g.gain.setValueAtTime(0.12, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
      o.connect(g); g.connect(dest);
      o.start(t0); o.stop(t0 + 0.22);
    },
    hit: function (c, t0, dest) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(120, t0);
      o.frequency.exponentialRampToValueAtTime(40, t0 + 0.15);
      g.gain.setValueAtTime(0.2, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      o.connect(g); g.connect(dest);
      o.start(t0); o.stop(t0 + 0.2);
    },
    jump: function (c, t0, dest) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(200, t0);
      o.frequency.exponentialRampToValueAtTime(480, t0 + 0.12);
      g.gain.setValueAtTime(0.14, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
      o.connect(g); g.connect(dest);
      o.start(t0); o.stop(t0 + 0.16);
    },
    boost: function (c, t0, dest) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(80, t0);
      o.frequency.exponentialRampToValueAtTime(320, t0 + 0.25);
      g.gain.setValueAtTime(0.1, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
      o.connect(g); g.connect(dest);
      o.start(t0); o.stop(t0 + 0.32);
    },
    item: function (c, t0, dest) {
      [523, 659, 784].forEach(function (f, i) {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = 'square';
        o.frequency.value = f;
        const t = t0 + i * 0.05;
        g.gain.setValueAtTime(0.1, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        o.connect(g); g.connect(dest);
        o.start(t); o.stop(t + 0.12);
      });
    },
    countdown: function (c, t0, dest) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'square';
      o.frequency.value = 440;
      g.gain.setValueAtTime(0.15, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
      o.connect(g); g.connect(dest);
      o.start(t0); o.stop(t0 + 0.18);
    },
    go: function (c, t0, dest) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'square';
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.18, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
      o.connect(g); g.connect(dest);
      o.start(t0); o.stop(t0 + 0.4);
    },
    engine: function (c, t0, dest, opts) {
      // short engine blip — not continuous
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sawtooth';
      const f = 60 + (opts && opts.speed || 0) * 0.5;
      o.frequency.value = Math.min(180, f);
      g.gain.setValueAtTime(0.03, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
      o.connect(g); g.connect(dest);
      o.start(t0); o.stop(t0 + 0.09);
    },
    click: function (c, t0, dest) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'square';
      o.frequency.value = 1000;
      g.gain.setValueAtTime(0.08, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.04);
      o.connect(g); g.connect(dest);
      o.start(t0); o.stop(t0 + 0.05);
    }
  };

  function playProcedural(id, opts) {
    if (!enabled || muted) return;
    const c = ensureContext();
    if (!c || !PROC[id]) return;
    if (c.state === 'suspended') c.resume();
    const t0 = c.currentTime;
    PROC[id](c, t0, sfxGain, opts);
  }

  // —— Load / decode files ——

  function loadBuffer(id, url) {
    if (bufferCache[id] && bufferCache[id] !== 'loading') {
      return Promise.resolve(bufferCache[id]);
    }
    if (bufferCache[id] === 'loading') {
      return new Promise(function (resolve, reject) {
        (waiters[id] = waiters[id] || []).push({ resolve: resolve, reject: reject });
      });
    }
    bufferCache[id] = 'loading';
    const c = ensureContext();
    if (!c || !url) {
      bufferCache[id] = null;
      return Promise.resolve(null);
    }
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('audio ' + id);
      return r.arrayBuffer();
    }).then(function (ab) {
      return c.decodeAudioData(ab.slice(0));
    }).then(function (buf) {
      bufferCache[id] = buf;
      (waiters[id] || []).forEach(function (w) { w.resolve(buf); });
      waiters[id] = null;
      return buf;
    }).catch(function () {
      bufferCache[id] = null;
      (waiters[id] || []).forEach(function (w) { w.resolve(null); });
      waiters[id] = null;
      return null;
    });
  }

  function preload(list, onProgress) {
    list = list || [];
    let done = 0;
    const total = Math.max(1, list.length);
    return Promise.all(list.map(function (item) {
      return loadBuffer(item.id, item.src).then(function (b) {
        done++;
        if (onProgress) onProgress(done, list.length, done / total);
        return b;
      });
    }));
  }

  // —— Play SFX ——

  function playSfx(id, opts) {
    opts = opts || {};
    if (!enabled || muted) return;
    // Procedural aliases always available
    if (PROC[id] && !bufferCache[id]) {
      playProcedural(id, opts);
      return;
    }
    const c = ensureContext();
    const buf = bufferCache[id];
    if (c && buf && buf !== 'loading') {
      if (c.state === 'suspended') c.resume();
      const src = c.createBufferSource();
      src.buffer = buf;
      const g = c.createGain();
      g.gain.value = opts.volume != null ? opts.volume : 1;
      src.connect(g);
      g.connect(sfxGain);
      if (opts.rate) src.playbackRate.value = opts.rate;
      src.start(0);
      return;
    }
    // HTMLAudio pool fallback
    playHtmlSfx(id, opts);
  }

  function playHtmlSfx(id, opts) {
    const tpl = htmlCache[id];
    if (!tpl) {
      if (PROC[id]) playProcedural(id, opts);
      return;
    }
    let el = null;
    for (let i = 0; i < sfxPool.length; i++) {
      if (sfxPool[i].paused || sfxPool[i].ended) { el = sfxPool[i]; break; }
    }
    if (!el) {
      if (sfxPool.length >= POOL_SIZE) el = sfxPool[0];
      else {
        el = new Audio();
        sfxPool.push(el);
      }
    }
    el.src = tpl.src || tpl;
    el.volume = (opts && opts.volume != null ? opts.volume : 1) * volSfx * (muted ? 0 : volMaster);
    el.currentTime = 0;
    const p = el.play();
    if (p && p.catch) p.catch(function () {});
  }

  function registerHtml(id, src) {
    htmlCache[id] = src;
  }

  // —— BGM ——

  function playBgm(id, opts) {
    opts = opts || {};
    if (!enabled) return;
    stopBgm(0.05);
    const c = ensureContext();
    const buf = bufferCache[id];
    if (c && buf && buf !== 'loading') {
      if (c.state === 'suspended') c.resume();
      const src = c.createBufferSource();
      src.buffer = buf;
      src.loop = opts.loop !== false;
      const g = c.createGain();
      g.gain.value = 0;
      src.connect(g);
      g.connect(bgmGain);
      src.start(0);
      // fade in
      const t = c.currentTime;
      const target = opts.volume != null ? opts.volume : 1;
      g.gain.linearRampToValueAtTime(target, t + (opts.fade || 0.4));
      currentBgm = { id: id, source: src, gain: g };
      src.onended = function () {
        if (currentBgm && currentBgm.source === src) currentBgm = null;
      };
      return;
    }
    // HTML fallback
    if (htmlCache[id]) {
      const el = new Audio(htmlCache[id]);
      el.loop = opts.loop !== false;
      el.volume = 0;
      const p = el.play();
      if (p && p.catch) p.catch(function () {});
      // simple fade via interval
      const target = (opts.volume != null ? opts.volume : 1) * volBgm * (muted ? 0 : volMaster);
      let v = 0;
      const iv = setInterval(function () {
        v += 0.05;
        el.volume = Math.min(target, v);
        if (v >= target) clearInterval(iv);
      }, 40);
      currentBgm = { id: id, html: el, _fadeIv: iv };
    }
  }

  function stopBgm(fade) {
    fade = fade != null ? fade : 0.3;
    if (!currentBgm) return;
    const bgm = currentBgm;
    currentBgm = null;
    if (bgm.source && bgm.gain && ctx) {
      const t = ctx.currentTime;
      try {
        bgm.gain.gain.cancelScheduledValues(t);
        bgm.gain.gain.linearRampToValueAtTime(0, t + fade);
        bgm.source.stop(t + fade + 0.05);
      } catch (e) {}
    }
    if (bgm.html) {
      const el = bgm.html;
      let v = el.volume;
      const iv = setInterval(function () {
        v -= 0.05;
        el.volume = Math.max(0, v);
        if (v <= 0) {
          clearInterval(iv);
          el.pause();
        }
      }, 40);
    }
  }

  // —— Game-oriented helpers ——

  const GAME_SFX = {
    ui_click: 'click',
    player_jump: 'jump',
    player_hit: 'hit',
    coin: 'coin',
    item_get: 'item',
    kart_boost: 'boost',
    race_countdown: 'countdown',
    race_go: 'go',
    menu_blip: 'blip'
  };

  function play(id, opts) {
    const mapped = GAME_SFX[id] || id;
    playSfx(mapped, opts);
  }

  function stats() {
    let buffers = 0;
    Object.keys(bufferCache).forEach(function (k) {
      if (bufferCache[k] && bufferCache[k] !== 'loading') buffers++;
    });
    return {
      unlocked: unlocked,
      muted: muted,
      context: ctx ? ctx.state : 'none',
      buffers: buffers,
      pool: sfxPool.length,
      bgm: currentBgm ? currentBgm.id : null,
      volumes: { master: volMaster, sfx: volSfx, bgm: volBgm }
    };
  }


  function suspend() {
    const c = ensureContext();
    if (currentBgm && currentBgm.html) { try { currentBgm.html.pause(); currentBgm._pausedByEngine = true; } catch (_) {} }
    if (c && c.state === 'running' && c.suspend) return c.suspend().catch(function(){});
    return Promise.resolve();
  }

  function resume() {
    const c = ensureContext();
    const p = c && c.state === 'suspended' && c.resume ? c.resume().catch(function(){}) : Promise.resolve();
    if (currentBgm && currentBgm.html && currentBgm._pausedByEngine) { currentBgm._pausedByEngine = false; const r=currentBgm.html.play(); if(r&&r.catch)r.catch(function(){}); }
    return p;
  }

  function currentBgmId() { return currentBgm ? currentBgm.id : null; }

  function dispose() {
    stopBgm(0);
    if (ctx && ctx.close) {
      try { ctx.close(); } catch (e) {}
    }
    ctx = null;
    masterGain = sfxGain = bgmGain = null;
  }

  global.SNESAudio = {
    unlock: unlock,
    loadBuffer: loadBuffer,
    preload: preload,
    playSfx: playSfx,
    play: play,
    playProcedural: playProcedural,
    playBgm: playBgm,
    stopBgm: stopBgm,
    registerHtml: registerHtml,
    setMasterVolume: setMasterVolume,
    setSfxVolume: setSfxVolume,
    setBgmVolume: setBgmVolume,
    setMuted: setMuted,
    toggleMute: toggleMute,
    stats: stats,
    suspend: suspend,
    resume: resume,
    currentBgmId: currentBgmId,
    dispose: dispose,
    PROC_IDS: Object.keys(PROC),
    GAME_SFX: GAME_SFX
  };
})(typeof window !== 'undefined' ? window : globalThis);
