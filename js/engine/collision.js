/**
 * SNES Engine Studio 1.0 — colisão compartilhada
 */
(function (global) {
  'use strict';

  const T = 16;

  function isSolidTile(tiles, map, px, py, cols, rows) {
    if (map && map.__studioChunk && global.SNESStudioRuntime) {
      const q = global.SNESStudioRuntime.tileAtWorld(map, px, py);
      if (q && !q.outside) { const t = tiles[q.cell] || tiles[0]; return !!(t && t.solid); }
      if (q && q.outside) return false;
    }
    const gx = Math.floor(px / T), gy = Math.floor(py / T);
    if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) return true;
    const cell = map[gy] && map[gy][gx];
    const t = tiles[cell] || tiles[0];
    return !!(t && t.solid);
  }

  /** Colisão AABB com mapa de tiles (platform / topdown) */
  function moveAABB(body, map, tiles, dt, opts) {
    opts = opts || {};
    const cols = opts.cols || 32, rows = opts.rows || 18;
    const w = body.w || 12, h = body.h || 14;
    const gravity = opts.gravity != null ? opts.gravity : 0;
    const maxFall = opts.maxFall != null ? opts.maxFall : 520;

    if (gravity) {
      body.vy = (body.vy || 0) + gravity * dt;
      if (body.vy > maxFall) body.vy = maxFall;
    }

    body.onGround = false;

    // Horizontal
    let nx = body.x + (body.vx || 0) * dt;
    if ((body.vx || 0) > 0) {
      if (isSolidTile(tiles, map, nx + w, body.y + 2, cols, rows) ||
          isSolidTile(tiles, map, nx + w, body.y + h - 2, cols, rows)) {
        nx = Math.floor((nx + w) / T) * T - w - 0.01;
        body.vx = 0;
      }
    } else if ((body.vx || 0) < 0) {
      if (isSolidTile(tiles, map, nx, body.y + 2, cols, rows) ||
          isSolidTile(tiles, map, nx, body.y + h - 2, cols, rows)) {
        nx = Math.floor(nx / T) * T + T + 0.01;
        body.vx = 0;
      }
    }
    body.x = nx;

    // Vertical (só se houver gravidade ou vy)
    if (gravity || body.vy) {
      let ny = body.y + (body.vy || 0) * dt;
      if ((body.vy || 0) >= 0) {
        if (isSolidTile(tiles, map, body.x + 2, ny + h, cols, rows) ||
            isSolidTile(tiles, map, body.x + w - 2, ny + h, cols, rows)) {
          ny = Math.floor((ny + h) / T) * T - h;
          body.vy = 0;
          body.onGround = true;
        }
      } else {
        if (isSolidTile(tiles, map, body.x + 2, ny, cols, rows) ||
            isSolidTile(tiles, map, body.x + w - 2, ny, cols, rows)) {
          ny = Math.floor(ny / T) * T + T;
          body.vy = 0;
        }
      }
      body.y = ny;
    } else {
      // Top-down: colisão nos 4 lados
      let ny = body.y + (body.vy || 0) * dt;
      if ((body.vy || 0) > 0) {
        if (isSolidTile(tiles, map, body.x + 2, ny + h, cols, rows) ||
            isSolidTile(tiles, map, body.x + w - 2, ny + h, cols, rows)) {
          ny = Math.floor((ny + h) / T) * T - h - 0.01;
          body.vy = 0;
        }
      } else if ((body.vy || 0) < 0) {
        if (isSolidTile(tiles, map, body.x + 2, ny, cols, rows) ||
            isSolidTile(tiles, map, body.x + w - 2, ny, cols, rows)) {
          ny = Math.floor(ny / T) * T + T + 0.01;
          body.vy = 0;
        }
      }
      body.y = ny;
    }
  }

  function aabbOverlap(a, b) {
    if (a?.components?.collider && b?.components?.collider && global.SNESCollisionLayers && !global.SNESCollisionLayers.can(a,b)) return false;
    return a.x < b.x + (b.w || 12) && a.x + (a.w || 12) > b.x &&
           a.y < b.y + (b.h || 12) && a.y + (a.h || 12) > b.y;
  }

  global.SNESCollision = { T, isSolidTile, moveAABB, aabbOverlap };
})(typeof window !== 'undefined' ? window : globalThis);
