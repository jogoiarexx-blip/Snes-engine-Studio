/**
 * SNES Engine Studio 0.9 — Otimização Canvas 2D
 * - Cache offscreen de tilemaps por camada
 * - Dirty flags (só redesenha o que mudou)
 * - Tile atlas em memória (pré-raster 16×16)
 * - Culling básico de entidades fora da tela
 * - Configuração única de contexto (pixel art)
 */
(function (global) {
  'use strict';

  const TILE = 16;
  const mapCaches = new WeakMap(); // scene/layers object -> cache
  const tileAtlases = new WeakMap(); // tiles array -> { canvas, byId }

  function setupCtx(ctx) {
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'low';
  }

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    setupCtx(ctx);
    return { canvas: c, ctx: ctx };
  }

  /** Pré-renderiza tiles do tema em um atlas simples (uma linha) */
  function getTileAtlas(tiles) {
    if (!tiles || !tiles.length) return null;
    let entry = tileAtlases.get(tiles);
    if (entry) return entry;
    const n = tiles.length;
    const off = makeCanvas(n * TILE, TILE);
    const ctx = off.ctx;
    for (let i = 0; i < n; i++) {
      const t = tiles[i] || { color: '#000' };
      ctx.fillStyle = t.color || '#333';
      if (t.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(i * TILE + 8, 8, 7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(i * TILE, 0, TILE, TILE);
      }
      // highlight top edge for solid look
      if (t.solid) {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(i * TILE, 0, TILE, 2);
      }
    }
    entry = { canvas: off.canvas, count: n };
    tileAtlases.set(tiles, entry);
    return entry;
  }

  function invalidateTileAtlas(tiles) {
    if (tiles) tileAtlases.delete(tiles);
  }

  /**
   * Cache de mapa em camadas.
   * key: string estável da cena (ou objeto layers)
   */
  function getMapCache(owner, w, h) {
    let c = mapCaches.get(owner);
    if (!c || c.w !== w || c.h !== h) {
      const layers = {};
      ['background', 'ground', 'decoration', 'foreground', 'collision', 'main'].forEach(function (name) {
        layers[name] = makeCanvas(w, h);
      });
      c = {
        w: w, h: h,
        layers: layers,
        dirty: { background: true, ground: true, decoration: true, foreground: true, collision: true, main: true },
        version: 0
      };
      mapCaches.set(owner, c);
    }
    return c;
  }

  function markDirty(owner, layer) {
    const c = mapCaches.get(owner);
    if (!c) return;
    if (layer) c.dirty[layer] = true;
    else {
      Object.keys(c.dirty).forEach(function (k) { c.dirty[k] = true; });
    }
    c.version++;
  }

  function markAllDirty(owner) {
    markDirty(owner, null);
  }

  /**
   * Rasteriza uma matriz de tiles [row][col] = id no offscreen layer
   * só se dirty[layerName]
   */
  function bakeLayer(owner, layerName, map, tiles, cols, rows) {
    if (!map || !tiles) return null;
    const cache = getMapCache(owner, cols * TILE, rows * TILE);
    if (!cache.dirty[layerName] && cache.layers[layerName]) {
      return cache.layers[layerName].canvas;
    }
    const layer = cache.layers[layerName] || (cache.layers[layerName] = makeCanvas(cols * TILE, rows * TILE));
    const ctx = layer.ctx;
    ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    const atlas = getTileAtlas(tiles);
    for (let y = 0; y < rows; y++) {
      const row = map[y];
      if (!row) continue;
      for (let x = 0; x < cols; x++) {
        const id = row[x] | 0;
        if (!id) continue;
        if (atlas && id < atlas.count) {
          ctx.drawImage(atlas.canvas, id * TILE, 0, TILE, TILE, x * TILE, y * TILE, TILE, TILE);
        } else {
          const t = tiles[id] || tiles[0];
          ctx.fillStyle = (t && t.color) || '#444';
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        }
      }
    }
    cache.dirty[layerName] = false;
    return layer.canvas;
  }

  /** Desenha camadas baked no ctx destino */
  function blitLayer(ctx, owner, layerName, map, tiles, cols, rows, alpha) {
    const baked = bakeLayer(owner, layerName, map, tiles, cols, rows);
    if (!baked) return;
    setupCtx(ctx);
    const prev = ctx.globalAlpha;
    if (alpha != null && alpha < 1) ctx.globalAlpha = alpha;
    ctx.drawImage(baked, 0, 0);
    ctx.globalAlpha = prev;
  }

  function inView(x, y, w, h, camX, camY, vw, vh, margin) {
    margin = margin || 32;
    return x + w > camX - margin && x < camX + vw + margin &&
           y + h > camY - margin && y < camY + vh + margin;
  }

  /** FPS meter simples */
  function createFpsMeter() {
    let frames = 0, last = 0, fps = 0;
    return {
      tick: function (now) {
        frames++;
        if (!last) last = now;
        if (now - last >= 1000) {
          fps = frames;
          frames = 0;
          last = now;
        }
      },
      value: function () { return fps; }
    };
  }

  /**
   * Editor helper: redesenha só se dirty flag global
   */
  function createDirtyFlag() {
    let dirty = true;
    return {
      mark: function () { dirty = true; },
      consume: function () {
        if (!dirty) return false;
        dirty = false;
        return true;
      },
      isDirty: function () { return dirty; }
    };
  }

  global.SNESRender = {
    setupCtx: setupCtx,
    getTileAtlas: getTileAtlas,
    invalidateTileAtlas: invalidateTileAtlas,
    getMapCache: getMapCache,
    markDirty: markDirty,
    markAllDirty: markAllDirty,
    bakeLayer: bakeLayer,
    blitLayer: blitLayer,
    inView: inView,
    createFpsMeter: createFpsMeter,
    createDirtyFlag: createDirtyFlag,
    TILE: TILE
  };
})(typeof window !== 'undefined' ? window : globalThis);
