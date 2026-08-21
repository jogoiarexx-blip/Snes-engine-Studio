/**
 * SNES Engine Studio 0.7 — Sistema genérico de animação de sprites
 * Funciona em file:// sem modules.
 */
(function (global) {
  'use strict';

  /**
   * def = {
   *   defaultState: 'idle',
   *   states: {
   *     idle: { fps: 6, loop: true, frames: [[x,y,w,h], ...] },
   *     walk: { fps: 10, loop: true, frames: [...] },
   *     attack: { fps: 12, loop: false, frames: [...] }
   *   }
   * }
   */
  function createAnimator(def) {
    def = def || { defaultState: 'idle', states: { idle: { fps: 6, loop: true, frames: [[0, 0, 16, 16]] } } };
    const anim = {
      def: def,
      state: def.defaultState || 'idle',
      time: 0,
      frame: 0,
      finished: false,

      setState: function (name, force) {
        if (!def.states[name]) return;
        if (!force && this.state === name) return;
        this.state = name;
        this.time = 0;
        this.frame = 0;
        this.finished = false;
      },

      update: function (dt) {
        const st = def.states[this.state];
        if (!st || !st.frames || !st.frames.length) return;
        this.time += dt;
        const fps = st.fps || 8;
        const idx = Math.floor(this.time * fps);
        if (st.loop === false) {
          this.frame = Math.min(st.frames.length - 1, idx);
          if (idx >= st.frames.length - 1) this.finished = true;
        } else {
          this.frame = idx % st.frames.length;
          this.finished = false;
        }
      },

      current: function () {
        const st = def.states[this.state];
        if (!st || !st.frames.length) return [0, 0, 16, 16];
        return st.frames[this.frame] || st.frames[0];
      },

      /** Evento: true uma vez quando one-shot termina */
      justFinished: function () {
        return this.finished;
      }
    };
    return anim;
  }

  /**
   * Desenha frame do sheet com flip horizontal opcional.
   * anchor: 'feet' | 'center' — origem do desenho relativa a (x,y) da entidade
   */
  function drawSprite(ctx, img, frame, x, y, opts) {
    opts = opts || {};
    if (!img || !img.complete || !img.naturalWidth) {
      ctx.fillStyle = opts.fallback || '#888';
      ctx.fillRect(Math.round(x), Math.round(y), opts.dw || 16, opts.dh || 16);
      return;
    }
    const fx = frame[0], fy = frame[1], fw = frame[2], fh = frame[3];
    const dw = opts.dw != null ? opts.dw : fw;
    const dh = opts.dh != null ? opts.dh : fh;
    let dx = x + (opts.ox || 0);
    let dy = y + (opts.oy || 0);
    if (opts.anchor === 'feet') {
      dx = x - dw / 2 + (opts.ox || 0);
      dy = y - dh + (opts.oy || 0);
    } else if (opts.anchor === 'center') {
      dx = x - dw / 2 + (opts.ox || 0);
      dy = y - dh / 2 + (opts.oy || 0);
    }
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (opts.flip) {
      ctx.translate(dx + dw, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, fx, fy, fw, fh, 0, 0, dw, dh);
    } else {
      ctx.drawImage(img, fx, fy, fw, fh, Math.round(dx), Math.round(dy), dw, dh);
    }
    ctx.restore();
  }

  /**
   * Gera um spritesheet procedural em canvas (placeholder pixel-art)
   * para player/inimigos sem PNG externo.
   */
  function makeProceduralSheet(kind) {
    const c = document.createElement('canvas');
    const cols = 6, rows = 5, tw = 16, th = 16;
    c.width = cols * tw;
    c.height = rows * th;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;

    function rect(cx, cy, w, h, col) {
      x.fillStyle = col;
      x.fillRect(cx, cy, w, h);
    }

    const skin = kind === 'enemy' ? '#c84c72' : '#55d6a0';
    const skinDark = kind === 'enemy' ? '#8a2f4a' : '#3a9a6e';
    const head = '#ffd88a';

    // row 0 idle (2 frames)
    for (let f = 0; f < 2; f++) {
      const ox = f * tw, oy = 0;
      rect(ox + 4, oy + 1 + f, 8, 5, head);
      rect(ox + 3, oy + 6 + f, 10, 7, skin);
      rect(ox + 3, oy + 13, 3, 2, skinDark);
      rect(ox + 10, oy + 13, 3, 2, skinDark);
      rect(ox + 5, oy + 3, 1, 1, '#222');
      rect(ox + 9, oy + 3, 1, 1, '#222');
    }
    // row 1 walk (4 frames)
    for (let f = 0; f < 4; f++) {
      const ox = f * tw, oy = th;
      const leg = (f % 2) ? 1 : 0;
      rect(ox + 4, oy + 1, 8, 5, head);
      rect(ox + 3, oy + 6, 10, 6, skin);
      rect(ox + 2 + leg, oy + 12, 3, 3, skinDark);
      rect(ox + 10 - leg, oy + 12, 3, 3, skinDark);
      rect(ox + 5, oy + 3, 1, 1, '#222');
      rect(ox + 9, oy + 3, 1, 1, '#222');
    }
    // row 2 jump (1) + fall (1)
    for (let f = 0; f < 2; f++) {
      const ox = f * tw, oy = th * 2;
      rect(ox + 4, oy + (f ? 2 : 0), 8, 5, head);
      rect(ox + 3, oy + 5 + (f ? 1 : 0), 10, 6, skin);
      rect(ox + 4, oy + 12, 3, 2, skinDark);
      rect(ox + 9, oy + 12, 3, 2, skinDark);
    }
    // row 3 attack (3 frames)
    for (let f = 0; f < 3; f++) {
      const ox = f * tw, oy = th * 3;
      rect(ox + 4, oy + 1, 8, 5, head);
      rect(ox + 3, oy + 6, 10, 7, skin);
      rect(ox + 3, oy + 13, 3, 2, skinDark);
      rect(ox + 10, oy + 13, 3, 2, skinDark);
      // arm / slash
      rect(ox + 11, oy + 7, 4 + f, 2, '#ffe36a');
    }
    // row 4 hurt (2 frames)
    for (let f = 0; f < 2; f++) {
      const ox = f * tw, oy = th * 4;
      rect(ox + 4 + f, oy + 2, 8, 5, head);
      rect(ox + 3, oy + 7, 10, 6, skin);
      rect(ox + 5, oy + 4, 2, 1, '#e74c3c');
    }

    const img = new Image();
    img.src = c.toDataURL('image/png');
    return img;
  }

  /** Definições prontas para player e inimigo procedural */
  const DEFS = {
    player: {
      defaultState: 'idle',
      states: {
        idle: { fps: 4, loop: true, frames: [[0, 0, 16, 16], [16, 0, 16, 16]] },
        walk: {
          fps: 10, loop: true,
          frames: [[0, 16, 16, 16], [16, 16, 16, 16], [32, 16, 16, 16], [48, 16, 16, 16]]
        },
        jump: { fps: 8, loop: false, frames: [[0, 32, 16, 16]] },
        fall: { fps: 8, loop: false, frames: [[16, 32, 16, 16]] },
        attack: {
          fps: 14, loop: false,
          frames: [[0, 48, 16, 16], [16, 48, 16, 16], [32, 48, 16, 16]]
        },
        hurt: { fps: 8, loop: false, frames: [[0, 64, 16, 16], [16, 64, 16, 16]] }
      }
    },
    enemy: {
      defaultState: 'idle',
      states: {
        idle: { fps: 3, loop: true, frames: [[0, 0, 16, 16], [16, 0, 16, 16]] },
        walk: {
          fps: 8, loop: true,
          frames: [[0, 16, 16, 16], [16, 16, 16, 16], [32, 16, 16, 16], [48, 16, 16, 16]]
        },
        attack: {
          fps: 12, loop: false,
          frames: [[0, 48, 16, 16], [16, 48, 16, 16], [32, 48, 16, 16]]
        },
        hurt: { fps: 10, loop: false, frames: [[0, 64, 16, 16], [16, 64, 16, 16]] },
        death: { fps: 6, loop: false, frames: [[0, 64, 16, 16], [16, 64, 16, 16]] }
      }
    }
  };

  // Sheets gerados sob demanda
  let _playerSheet = null, _enemySheet = null;
  function playerSheet() {
    if (!_playerSheet) _playerSheet = makeProceduralSheet('player');
    return _playerSheet;
  }
  function enemySheet() {
    if (!_enemySheet) _enemySheet = makeProceduralSheet('enemy');
    return _enemySheet;
  }

  /**
   * Resolve estado de personagem de plataforma a partir de flags runtime.
   */
  function resolvePlatformState(body, opts) {
    opts = opts || {};
    if (body.dead) return 'death';
    if (body.hurtUntil && body.hurtUntil > (opts.now || 0)) return 'hurt';
    if (body.attackUntil && body.attackUntil > (opts.now || 0)) return 'attack';
    if (body.onLadder) return Math.abs(body.vy) > 10 ? 'walk' : 'idle';
    if (!body.onGround) return (body.vy || 0) < 0 ? 'jump' : 'fall';
    if (Math.abs(body.vx || 0) > 15) return 'walk';
    return 'idle';
  }

  function resolveTopdownState(body, opts) {
    opts = opts || {};
    if (body.dead) return 'death';
    if (body.hurtUntil && body.hurtUntil > (opts.now || 0)) return 'hurt';
    if (body.attackUntil && body.attackUntil > (opts.now || 0)) return 'attack';
    if (Math.abs(body.vx || 0) > 8 || Math.abs(body.vy || 0) > 8) return 'walk';
    return 'idle';
  }

  global.SNESAnim = {
    createAnimator,
    drawSprite,
    makeProceduralSheet,
    DEFS,
    playerSheet,
    enemySheet,
    resolvePlatformState,
    resolveTopdownState
  };
})(typeof window !== 'undefined' ? window : globalThis);
