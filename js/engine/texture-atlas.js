/**
 * SNES Engine Studio 0.8 — Texture Atlas
 * Atlas nomeado, UV frames, batch draw, integração com SNESAssets.
 * Compatível com file:// (sem modules).
 */
(function (global) {
  'use strict';

  /**
   * Formato do atlas JSON:
   * {
   *   image: "assets/foo.png",
   *   width: 512, height: 512,
   *   frames: {
   *     "player/idle_0": { x, y, w, h, anchorX?, anchorY? },
   *     ...
   *   },
   *   animations: {
   *     "player/idle": { frames: ["player/idle_0", ...], fps: 8, loop: true }
   *   }
   * }
   */

  const registry = Object.create(null); // name -> Atlas instance

  function Atlas(name, def, image) {
    this.name = name;
    this.def = def || { frames: {}, animations: {} };
    this.image = image || null;
    this.frames = this.def.frames || {};
    this.animations = this.def.animations || {};
    this.ready = !!(image && image.complete && image.naturalWidth);
  }

  Atlas.prototype.setImage = function (img) {
    this.image = img;
    this.ready = !!(img && img.complete && img.naturalWidth);
  };

  Atlas.prototype.getFrame = function (id) {
    return this.frames[id] || null;
  };

  Atlas.prototype.has = function (id) {
    return !!this.frames[id];
  };

  /**
   * Desenha um frame do atlas.
   * opts: { x, y, scale, flipX, flipY, anchor: 'topleft'|'center'|'feet', alpha }
   */
  Atlas.prototype.draw = function (ctx, frameId, opts) {
    opts = opts || {};
    const fr = this.frames[frameId];
    if (!fr || !this.ready || !this.image) return false;

    const scale = opts.scale != null ? opts.scale : 1;
    const dw = (fr.w * scale) | 0;
    const dh = (fr.h * scale) | 0;
    let dx = opts.x || 0;
    let dy = opts.y || 0;

    const ax = fr.anchorX != null ? fr.anchorX : (fr.w / 2);
    const ay = fr.anchorY != null ? fr.anchorY : fr.h;

    if (opts.anchor === 'center') {
      dx -= dw / 2;
      dy -= dh / 2;
    } else if (opts.anchor === 'feet' || opts.anchor == null) {
      dx -= (ax / fr.w) * dw;
      dy -= (ay / fr.h) * dh;
    }
    // topleft: no adjust

    ctx.save();
    if (opts.alpha != null && opts.alpha < 1) ctx.globalAlpha = opts.alpha;
    ctx.imageSmoothingEnabled = false;

    if (opts.flipX || opts.flipY) {
      const cx = dx + dw / 2;
      const cy = dy + dh / 2;
      ctx.translate(cx, cy);
      ctx.scale(opts.flipX ? -1 : 1, opts.flipY ? -1 : 1);
      ctx.drawImage(this.image, fr.x, fr.y, fr.w, fr.h, -dw / 2, -dh / 2, dw, dh);
    } else {
      ctx.drawImage(this.image, fr.x, fr.y, fr.w, fr.h, Math.round(dx), Math.round(dy), dw, dh);
    }
    ctx.restore();
    return true;
  };

  /** Animator ligado a animações do atlas */
  Atlas.prototype.createAnimator = function (animName) {
    const anim = this.animations[animName];
    const frames = (anim && anim.frames) || [];
    const self = this;
    return {
      name: animName,
      frames: frames,
      fps: (anim && anim.fps) || 8,
      loop: !anim || anim.loop !== false,
      time: 0,
      index: 0,
      finished: false,
      setAnimation: function (name, force) {
        const a = self.animations[name];
        if (!a) return;
        if (!force && this.name === name) return;
        this.name = name;
        this.frames = a.frames || [];
        this.fps = a.fps || 8;
        this.loop = a.loop !== false;
        this.time = 0;
        this.index = 0;
        this.finished = false;
      },
      update: function (dt) {
        if (!this.frames.length) return;
        this.time += dt;
        const idx = Math.floor(this.time * this.fps);
        if (!this.loop) {
          this.index = Math.min(this.frames.length - 1, idx);
          this.finished = idx >= this.frames.length - 1;
        } else {
          this.index = idx % this.frames.length;
        }
      },
      currentFrameId: function () {
        return this.frames[this.index] || this.frames[0];
      },
      draw: function (ctx, opts) {
        return self.draw(ctx, this.currentFrameId(), opts);
      }
    };
  };

  // —— Registry ——

  function register(name, def, image) {
    const atlas = new Atlas(name, def, image);
    registry[name] = atlas;
    return atlas;
  }

  function get(name) {
    return registry[name] || null;
  }

  /**
   * Carrega atlas JSON + imagem via SNESAssets ou fetch/Image.
   * def pode ser objeto já parseado ou URL de .json
   */
  function load(name, jsonUrlOrDef, imageUrl) {
    const Assets = global.SNESAssets;

    function attach(def, img) {
      const atlas = register(name, def, img);
      return atlas;
    }

    if (typeof jsonUrlOrDef === 'object' && jsonUrlOrDef.frames) {
      const def = jsonUrlOrDef;
      const src = imageUrl || def.image;
      if (Assets) {
        return Assets.loadImage('atlas:' + name, src, { optional: true }).then(function (img) {
          return attach(def, img);
        });
      }
      return new Promise(function (resolve) {
        const img = new Image();
        img.onload = function () { resolve(attach(def, img)); };
        img.onerror = function () { resolve(attach(def, null)); };
        img.src = src;
      });
    }

    // load JSON from URL
    const url = jsonUrlOrDef;
    const loadJson = Assets
      ? fetch(url).then(function (r) { return r.json(); })
      : fetch(url).then(function (r) { return r.json(); });

    return loadJson.then(function (def) {
      const src = imageUrl || def.image;
      if (Assets) {
        return Assets.loadImage('atlas:' + name, src, { optional: true }).then(function (img) {
          return attach(def, img);
        });
      }
      return new Promise(function (resolve) {
        const img = new Image();
        img.onload = function () { resolve(attach(def, img)); };
        img.onerror = function () { resolve(attach(def, null)); };
        img.src = src;
      });
    }).catch(function () {
      return register(name, { frames: {}, animations: {} }, null);
    });
  }

  /**
   * Constrói definição de atlas a partir de lista linear de retângulos
   * (ex.: ninja kart frames detectados).
   * entries: [{ id, x, y, w, h, anchorX?, anchorY? }]
   */
  function fromRectList(imagePath, width, height, entries, animations) {
    const frames = {};
    (entries || []).forEach(function (e) {
      frames[e.id] = {
        x: e.x, y: e.y, w: e.w, h: e.h,
        anchorX: e.anchorX != null ? e.anchorX : e.w / 2,
        anchorY: e.anchorY != null ? e.anchorY : e.h
      };
    });
    return {
      image: imagePath,
      width: width,
      height: height,
      frames: frames,
      animations: animations || {}
    };
  }

  /**
   * Empacota vários canvas/Image pequenos num atlas runtime (shelf pack simples).
   * items: [{ id, source: HTMLCanvasElement|HTMLImageElement, anchorX?, anchorY? }]
   * Retorna { def, canvas }
   */
  function pack(items, opts) {
    opts = opts || {};
    const maxW = opts.maxWidth || 512;
    const pad = opts.pad != null ? opts.pad : 1;
    let x = pad, y = pad, rowH = 0, outW = maxW, outH = pad;

    const placed = [];
    items.forEach(function (it) {
      const sw = it.source.width || it.source.naturalWidth;
      const sh = it.source.height || it.source.naturalHeight;
      if (x + sw + pad > maxW) {
        x = pad;
        y += rowH + pad;
        rowH = 0;
      }
      placed.push({ id: it.id, x: x, y: y, w: sw, h: sh, source: it.source,
        anchorX: it.anchorX, anchorY: it.anchorY });
      x += sw + pad;
      if (sh > rowH) rowH = sh;
      if (y + sh + pad > outH) outH = y + sh + pad;
    });

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = Math.min(2048, outH);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const entries = [];
    placed.forEach(function (p) {
      if (p.y + p.h > canvas.height) return;
      ctx.drawImage(p.source, p.x, p.y);
      entries.push({
        id: p.id, x: p.x, y: p.y, w: p.w, h: p.h,
        anchorX: p.anchorX, anchorY: p.anchorY
      });
    });

    const def = fromRectList(null, canvas.width, canvas.height, entries, opts.animations);
    return { def: def, canvas: canvas };
  }

  /** Atalho: desenha frame de qualquer atlas registrado */
  function draw(ctx, atlasName, frameId, opts) {
    const a = registry[atlasName];
    if (!a) return false;
    return a.draw(ctx, frameId, opts);
  }

  // —— Built-in: Ninja Kart atlas from existing coordinates ——
  function buildNinjaKartDef() {
    const karts = [
      [21, 290, 146, 120],
      [200, 290, 158, 120],
      [394, 290, 163, 120],
      [561, 290, 174, 120],
      [752, 290, 130, 120],
      [883, 290, 153, 120],
      [1070, 290, 180, 120],
      [20, 410, 134, 120],
      [181, 410, 159, 120],
      [373, 410, 141, 120],
      [540, 410, 181, 120],
      [750, 410, 108, 120],
      [898, 410, 161, 120],
      [1086, 410, 164, 120]
    ];
    const entries = [
      { id: 'portrait', x: 9, y: 8, w: 191, h: 172, anchorX: 95, anchorY: 172 },
      { id: 'hero', x: 7, y: 530, w: 393, h: 390, anchorX: 196, anchorY: 390 }
    ];
    karts.forEach(function (r, i) {
      entries.push({
        id: 'kart_' + i,
        x: r[0], y: r[1], w: r[2], h: r[3],
        anchorX: r[2] / 2, anchorY: r[3]
      });
    });
    return fromRectList('assets/ninja-kart-sheet.png', 1500, 1000, entries, {
      'kart/idle': { frames: ['kart_1'], fps: 1, loop: true },
      'kart/lean_l': { frames: ['kart_0'], fps: 1, loop: true },
      'kart/lean_r': { frames: ['kart_2'], fps: 1, loop: true },
      'kart/boost': { frames: ['kart_7', 'kart_10', 'kart_12'], fps: 10, loop: true }
    });
  }

  function initBuiltins() {
    const def = buildNinjaKartDef();
    const atlas = register('ninjaKart', def, null);
    if (global.SNESAssets) {
      global.SNESAssets.loadImage('ninjaKart', def.image, {
        dataUrl: global.__NINJA_KART_SHEET_DATAURL || null,
        optional: true
      }).then(function (img) {
        if (img) atlas.setImage(img);
      });
    } else {
      const img = new Image();
      img.onload = function () { atlas.setImage(img); };
      img.src = def.image;
    }
    return atlas;
  }

  // auto init when DOM ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBuiltins);
    } else {
      setTimeout(initBuiltins, 0);
    }
  }

  global.SNESAtlas = {
    Atlas: Atlas,
    register: register,
    get: get,
    load: load,
    draw: draw,
    fromRectList: fromRectList,
    pack: pack,
    buildNinjaKartDef: buildNinjaKartDef,
    initBuiltins: initBuiltins,
    list: function () { return Object.keys(registry); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
