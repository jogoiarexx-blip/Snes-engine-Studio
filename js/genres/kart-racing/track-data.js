/**
 * SNES Engine Studio 0.8 — Dados de pista (malha 2D + waypoints)
 * Pista exemplo original (oval com atalhos).
 */
(function (global) {
  'use strict';

  const SIZE = 1024;

  function createBlankTrack(size) {
    size = size || SIZE;
    const road = new Uint8Array(size * size); // 0=off, 1=road, 2=dirt, 3=boost, 4=wall
    return { size, road, waypoints: [], checkpoints: [], itemBoxes: [], obstacles: [], startPositions: [] };
  }

  /** Gera oval jogável com reta e curvas */
  function generateDemoTrack() {
    const size = SIZE;
    const t = createBlankTrack(size);
    const cx = size / 2, cy = size / 2;
    const outerR = 420, innerR = 280;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx, dy = y - cy;
        const r = Math.sqrt(dx * dx + dy * dy);
        const idx = y * size + x;
        if (r >= innerR && r <= outerR) {
          // boost zones on straights (top/bottom)
          const ang = Math.atan2(dy, dx);
          if (Math.abs(Math.sin(ang)) < 0.25 && r > innerR + 20 && r < outerR - 20)
            t.road[idx] = 3; // boost
          else if (r < innerR + 18 || r > outerR - 18)
            t.road[idx] = 2; // dirt edge
          else
            t.road[idx] = 1; // asphalt
        } else if (r < innerR - 8 || r > outerR + 8) {
          t.road[idx] = 0;
        }
      }
    }

    // Waypoints clockwise around center line
    const midR = (innerR + outerR) / 2;
    const n = 48;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2; // start at top
      t.waypoints.push({
        x: cx + Math.cos(a) * midR,
        y: cy + Math.sin(a) * midR,
        angle: a + Math.PI / 2
      });
    }

    // Checkpoints every 1/4 lap
    for (let i = 0; i < 4; i++) {
      const wp = t.waypoints[Math.floor((i / 4) * n) % n];
      t.checkpoints.push({ x: wp.x, y: wp.y, index: i });
    }

    // Start grid (bottom of oval, facing up)
    const startA = Math.PI / 2;
    for (let i = 0; i < 8; i++) {
      const lane = (i % 2) * 28 - 14;
      const row = Math.floor(i / 2) * 36;
      t.startPositions.push({
        x: cx + Math.cos(startA) * (midR + lane),
        y: cy + Math.sin(startA) * midR + row,
        angle: -Math.PI / 2
      });
    }

    // Item boxes along track
    for (let i = 0; i < 6; i++) {
      const wp = t.waypoints[Math.floor((i + 0.5) / 6 * n) % n];
      t.itemBoxes.push({ x: wp.x, y: wp.y, respawn: 0 });
    }

    // A few obstacles
    for (let i = 0; i < 4; i++) {
      const wp = t.waypoints[8 + i * 10];
      t.obstacles.push({ x: wp.x + 40, y: wp.y, r: 12 });
    }

    t.name = 'Circuito Oval Demo';
    t.laps = 3;
    return t;
  }

  function sampleRoad(track, x, y) {
    const s = track.size;
    const ix = Math.floor(x), iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= s || iy >= s) return 0;
    return track.road[iy * s + ix];
  }

  function nearestWaypoint(track, x, y) {
    let best = 0, bestD = Infinity;
    for (let i = 0; i < track.waypoints.length; i++) {
      const w = track.waypoints[i];
      const d = (w.x - x) * (w.x - x) + (w.y - y) * (w.y - y);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  global.KartTrack = {
    SIZE, createBlankTrack, generateDemoTrack, sampleRoad, nearestWaypoint
  };
})(typeof window !== 'undefined' ? window : globalThis);
