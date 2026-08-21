/**
 * SNES Engine Studio 0.8 — Sprites do Ninja Kart (sheet local)
 */
(function (global) {
  'use strict';

  // Coordenadas [x, y, w, h] na sheet 1500×1000
  const ATLAS = {
    sheet: 'assets/ninja-kart-sheet.png',
    w: 1500,
    h: 1000,
    portrait: [9, 8, 191, 172],
    hero: [7, 530, 393, 390],
    // Ângulos do kart (vista traseira / 3/4) — linha do meio da sheet
    // Índices usados: left lean, center, right lean, boost L/C/R
    karts: [
      [21, 290, 146, 120],   // 0  rear-left
      [200, 290, 158, 120],  // 1  rear
      [394, 290, 163, 120],  // 2  rear-right
      [561, 290, 174, 120],  // 3  side-ish
      [752, 290, 130, 120],  // 4  rear compact
      [883, 290, 153, 120],  // 5  rear-right 2
      [1070, 290, 180, 120], // 6  wide
      [20, 410, 134, 120],   // 7  boost-ish
      [181, 410, 159, 120],  // 8
      [373, 410, 141, 120],  // 9
      [540, 410, 181, 120],  // 10 boost trail
      [750, 410, 108, 120],  // 11
      [898, 410, 161, 120],  // 12
      [1086, 410, 164, 120]  // 13
    ],
    // Mapas semânticos
    player: {
      leanL: 0,
      center: 1,
      leanR: 2,
      boostL: 7,
      boostC: 10,
      boostR: 12
    }
  };

  let img = null;
  let ready = false;
  let failed = false;

  function load(basePath) {
    if (img && ready) return img;
    // Prefer AssetManager cache
    if (global.SNESAssets) {
      const cached = global.SNESAssets.get('ninjaKart');
      if (cached) {
        img = cached;
        ready = true;
        return img;
      }
      global.SNESAssets.loadImage('ninjaKart', 'assets/ninja-kart-sheet.png', {
        dataUrl: global.__NINJA_KART_SHEET_DATAURL || null,
        optional: true
      }).then(function (loaded) {
        if (loaded) { img = loaded; ready = true; }
        else failed = true;
      });
      // sync placeholder while loading
      if (!img) {
        img = new Image();
        img.src = (basePath || '') + 'assets/ninja-kart-sheet.png';
        img.onload = function () { ready = true; };
      }
      return img;
    }
    if (img) return img;
    img = new Image();
    img.onload = function () { ready = true; };
    img.onerror = function () {
      if (!img._tried2) {
        img._tried2 = true;
        img.src = 'assets/ninja-kart-sheet.png';
      } else if (global.__NINJA_KART_SHEET_DATAURL) {
        img.src = global.__NINJA_KART_SHEET_DATAURL;
      } else failed = true;
    };
    img.src = (basePath || '') + 'assets/ninja-kart-sheet.png';
    return img;
  }

  function isReady() {
    if (ready && img && img.naturalWidth > 0) return true;
    if (global.SNESAssets) {
      const c = global.SNESAssets.get('ninjaKart');
      if (c) { img = c; ready = true; return true; }
    }
    return !!(img && img.complete && img.naturalWidth > 0);
  }

  function frame(nameOrIndex) {
    if (typeof nameOrIndex === 'number') return ATLAS.karts[nameOrIndex] || ATLAS.karts[1];
    if (nameOrIndex === 'portrait') return ATLAS.portrait;
    if (nameOrIndex === 'hero') return ATLAS.hero;
    return ATLAS.karts[ATLAS.player[nameOrIndex] || 1];
  }

  /** Escolhe frame do piloto com base em steer e boost/drift */
  function pickPlayerFrame(steer, boosting, drifting) {
    const s = steer || 0;
    if (boosting) {
      if (s < -0.25) return frame('boostL');
      if (s > 0.25) return frame('boostR');
      return frame('boostC');
    }
    if (s < -0.2 || drifting && s < 0) return frame('leanL');
    if (s > 0.2 || drifting && s > 0) return frame('leanR');
    return frame('center');
  }

  function draw(ctx, fr, dx, dy, dw, dh, flip) {
    if (!isReady() || !fr) return false;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (flip) {
      ctx.translate(dx + dw, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, fr[0], fr[1], fr[2], fr[3], 0, 0, dw, dh);
    } else {
      ctx.drawImage(img, fr[0], fr[1], fr[2], fr[3], Math.round(dx), Math.round(dy), dw, dh);
    }
    ctx.restore();
    return true;
  }

  function frameIdFromSteer(steer, boosting, drifting) {
    const s = steer || 0;
    if (boosting) {
      if (s < -0.25) return 'kart_7';
      if (s > 0.25) return 'kart_12';
      return 'kart_10';
    }
    if (s < -0.2 || (drifting && s < 0)) return 'kart_0';
    if (s > 0.2 || (drifting && s > 0)) return 'kart_2';
    return 'kart_1';
  }

  function drawPlayer(ctx, x, y, scale, steer, boosting, drifting) {
    const Atlas = global.SNESAtlas && global.SNESAtlas.get('ninjaKart');
    if (Atlas && Atlas.ready) {
      const fid = frameIdFromSteer(steer, boosting, drifting);
      return Atlas.draw(ctx, fid, { x: x, y: y, scale: scale, anchor: 'feet' });
    }
    const fr = pickPlayerFrame(steer, boosting, drifting);
    const dw = (fr[2] * scale) | 0;
    const dh = (fr[3] * scale) | 0;
    return draw(ctx, fr, x - dw / 2, y - dh, dw, dh, false);
  }

  function drawRacerSprite(ctx, sx, sy, sz, steer) {
    const Atlas = global.SNESAtlas && global.SNESAtlas.get('ninjaKart');
    if (Atlas && Atlas.ready) {
      const fid = steer < -0.2 ? 'kart_0' : steer > 0.2 ? 'kart_2' : 'kart_1';
      const scale = (sz * 1.6) / 150;
      return Atlas.draw(ctx, fid, { x: sx, y: sy, scale: scale, anchor: 'feet' });
    }
    const idx = steer < -0.2 ? 0 : steer > 0.2 ? 2 : 1;
    const fr = ATLAS.karts[idx];
    const dw = sz * 1.6;
    const dh = sz * 1.2;
    return draw(ctx, fr, sx - dw / 2, sy - dh, dw, dh, false);
  }

  function drawPortrait(ctx, x, y, size) {
    const Atlas = global.SNESAtlas && global.SNESAtlas.get('ninjaKart');
    if (Atlas && Atlas.ready) {
      return Atlas.draw(ctx, 'portrait', { x: x, y: y, scale: size / 191, anchor: 'topleft' });
    }
    return draw(ctx, ATLAS.portrait, x, y, size, size, false);
  }

  // preload ASAP
  if (typeof document !== 'undefined') {
    load('');
  }

  global.NinjaKartSprites = {
    ATLAS, load, isReady, frame, pickPlayerFrame,
    draw, drawPlayer, drawRacerSprite, drawPortrait
  };
})(typeof window !== 'undefined' ? window : globalThis);
