/**
 * SNES Engine Studio 0.8 — Kart Racing 2.5D (pseudo-3D / Mode7-like)
 * Pista 2D projetada em perspectiva por scanlines. Original, sem assets de franquias.
 */
(function (global) {
  'use strict';

  const W = 512, H = 288;
  const HORIZON = 88;
  const DRAW_DIST = 180;

  function defaultKartStats() {
    return {
      maxSpeed: 220,
      accel: 140,
      brake: 200,
      reverse: 70,
      turnRate: 2.4,
      grip: 0.92,
      driftGrip: 0.78,
      weight: 1,
      turboMult: 1.35
    };
  }

  function createRacer(id, name, start, isPlayer, difficulty) {
    const stats = defaultKartStats();
    if (!isPlayer) {
      // AI variation
      const f = difficulty === 'hard' ? 1.05 : difficulty === 'easy' ? 0.88 : 0.96;
      stats.maxSpeed *= f * (0.95 + Math.random() * 0.08);
      stats.accel *= f;
      stats.turnRate *= 0.9 + Math.random() * 0.15;
    }
    return {
      id, name, isPlayer, stats,
      x: start.x, y: start.y, angle: start.angle,
      speed: 0, radius: 12,
      lap: 0, checkpoint: 0, progress: 1,
      finished: false, finishTime: 0,
      item: null, wpIndex: 0,
      boostUntil: 0, shieldUntil: 0, invUntil: 0, spinUntil: 0,
      drifting: false, driftTime: 0, miniTurbo: 0,
      color: isPlayer ? '#55d6a0' : ['#e74c3c', '#3498db', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#fd79a8'][id % 7],
      offTrack: false
    };
  }


  function cloneTrack(src) {
    if (!src) return global.KartTrack.generateDemoTrack();
    const road = src.road;
    let roadCopy;
    if (road instanceof Uint8Array) {
      roadCopy = new Uint8Array(road);
    } else if (Array.isArray(road)) {
      roadCopy = new Uint8Array(road);
    } else if (road && typeof road === 'object') {
      // JSON-deserialized sparse object
      const size = src.size || 1024;
      roadCopy = new Uint8Array(size * size);
      Object.keys(road).forEach(function (k) {
        const i = parseInt(k, 10);
        if (!isNaN(i) && i >= 0 && i < roadCopy.length) roadCopy[i] = road[k] & 0xff;
      });
    } else {
      roadCopy = new Uint8Array((src.size || 1024) * (src.size || 1024));
    }
    return {
      size: src.size || 1024,
      name: src.name || 'Pista',
      laps: src.laps || 3,
      road: roadCopy,
      waypoints: JSON.parse(JSON.stringify(src.waypoints || [])),
      checkpoints: JSON.parse(JSON.stringify(src.checkpoints || [])),
      itemBoxes: JSON.parse(JSON.stringify(src.itemBoxes || [])).map(function (b) {
        return { x: b.x, y: b.y, respawn: 0 };
      }),
      obstacles: JSON.parse(JSON.stringify(src.obstacles || [])),
      startPositions: JSON.parse(JSON.stringify(src.startPositions || [])),
      altLines: JSON.parse(JSON.stringify(src.altLines || []))
    };
  }

  function makeRng(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function createState(project) {
    const Track = global.KartTrack;
    const Items = global.KartItems;
    const settings = (project.settings && project.settings.kart) || {};
    // Cópia profunda da pista — NÃO mutar project.kartTrack
    const srcTrack = project.kartTrack || Track.generateDemoTrack();
    const track = cloneTrack(srcTrack);
    const difficulty = settings.difficulty || 'normal';
    const laps = track.laps || 3;
    const starts = track.startPositions || [];
    // Seed RNG for AI reproducibility
    const seed = settings.seed != null ? settings.seed : 12345;
    const racers = [];
    const defaultStart = { x: track.size / 2, y: track.size / 2 + 200, angle: -Math.PI / 2 };
    for (let i = 0; i < 6; i++) {
      const sp = (starts[i] || starts[0] || defaultStart);
      const safe = {
        x: sp.x != null ? sp.x : defaultStart.x + (i % 2) * 28,
        y: sp.y != null ? sp.y : defaultStart.y + Math.floor(i / 2) * 36,
        angle: sp.angle != null ? sp.angle : defaultStart.angle
      };
      racers.push(createRacer(i, i === 0 ? 'Você' : 'CPU ' + i, safe, i === 0, difficulty));
    }
    return {
      gameType: 'kart-racing',
      project,
      track,
      racers,
      player: racers[0],
      items: Items.createItemManager(),
      input: global.SNESInput.create(),
      race: {
        phase: 'countdown', // countdown | racing | finished
        countdown: 3,
        countdownTimer: 1,
        time: 0,
        bestLap: null,
        lapStart: 0,
        totalLaps: laps,
        results: []
      },
      camera: { x: 0, y: 0, angle: 0 },
      paused: false,
      gameOver: false,
      won: false,
      difficulty,
      rng: makeRng(seed),
      missedCpWarn: 0,
      // mode7 surface colors cache
      _surf: null
    };
  }

  function buildSurfaceCanvas(track) {
    const s = track.size;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(s, s);
    const d = img.data;
    for (let i = 0; i < track.road.length; i++) {
      const v = track.road[i];
      const p = i * 4;
      if (v === 1) { d[p] = 60; d[p + 1] = 62; d[p + 2] = 70; d[p + 3] = 255; }
      else if (v === 2) { d[p] = 120; d[p + 1] = 100; d[p + 2] = 55; d[p + 3] = 255; }
      else if (v === 3) { d[p] = 40; d[p + 1] = 160; d[p + 2] = 200; d[p + 3] = 255; }
      else if (v === 4) { d[p] = 90; d[p + 1] = 90; d[p + 2] = 95; d[p + 3] = 255; }
      else { d[p] = 34; d[p + 1] = 120; d[p + 2] = 50; d[p + 3] = 255; } // grass
      // checker near edges of road for depth cue
      if (v === 1) {
        const x = i % s, y = (i / s) | 0;
        if ((x ^ y) & 16) { d[p] += 8; d[p + 1] += 8; d[p + 2] += 8; }
      }
    }
    ctx.putImageData(img, 0, 0);
    // draw item boxes / start line markers
    ctx.fillStyle = '#f7b32b';
    track.itemBoxes.forEach(b => {
      ctx.fillRect(b.x - 6, b.y - 6, 12, 12);
    });
    return c;
  }

  function updateRacerPhysics(r, track, input, dt, now, isPlayer) {
    const st = r.stats;
    if (r.finished) return;
    if (now < r.spinUntil) {
      r.angle += 8 * dt;
      r.speed *= 0.92;
      return;
    }

    let throttle = 0, steer = 0, brake = false, drift = false, useItem = false;
    if (isPlayer && input) {
      throttle = 0;
      if (input.keys['arrowup'] || input.keys['w'] || input.touch.up) throttle = 1;
      if (input.keys['arrowdown'] || input.keys['s'] || input.touch.down) brake = true;
      steer = input.axisX();
      drift = !!(input.keys[' '] || input.touch.jump);
      useItem = input.pressed('action') || input.pressed('attack');
      // gamepad accel
      try {
        const gp = navigator.getGamepads && navigator.getGamepads()[0];
        if (gp) {
          if (gp.buttons[7] && gp.buttons[7].value > 0.1) throttle = gp.buttons[7].value;
          if (gp.buttons[6] && gp.buttons[6].value > 0.1) brake = true;
          if (gp.buttons[0] && gp.buttons[0].pressed) drift = true;
          if (gp.buttons[2] && gp.buttons[2].pressed) useItem = true;
        }
      } catch (_) {}
    }

    // surface
    const surface = global.KartTrack.sampleRoad(track, r.x, r.y);
    r.offTrack = surface === 0;
    if (r.offTrack) r.stuckTime = (r.stuckTime || 0) + dt; else r.stuckTime = 0;
    if (r.stuckTime > 4) {
      const wi = global.KartTrack.nearestWaypoint(track, r.x, r.y);
      const wp = track.waypoints[wi] || track.waypoints[0];
      if (wp) { r.x = wp.x; r.y = wp.y; r.angle = wp.angle || r.angle; r.speed = 40; r.stuckTime = 0; }
    }
    let grip = st.grip;
    let maxSp = st.maxSpeed;
    if (surface === 0) { grip *= 0.35; maxSp *= 0.45; }
    else if (surface === 2) { grip *= 0.7; maxSp *= 0.75; }
    else if (surface === 3) { maxSp *= 1.2; }

    const boosting = now < r.boostUntil;
    if (boosting) maxSp *= st.turboMult;

    // drift
    r.drifting = drift && Math.abs(steer) > 0.2 && r.speed > 80;
    if (r.drifting) {
      grip = st.driftGrip;
      r.driftTime += dt;
      if (r.driftTime > 0.85) r.miniTurbo = Math.min(1, r.miniTurbo + dt);
    } else {
      if (r.miniTurbo > 0.5 && r.driftTime > 0.5) {
        r.boostUntil = now + 400 + r.miniTurbo * 600;
        if (r.isPlayer && global.SNESAudio) global.SNESAudio.play('kart_boost');
      }
      r.driftTime = 0;
      r.miniTurbo = Math.max(0, r.miniTurbo - dt);
    }

    // accel / brake
    if (brake) {
      if (r.speed > 0) r.speed = Math.max(-st.reverse, r.speed - st.brake * dt);
      else r.speed = Math.max(-st.reverse, r.speed - st.reverse * dt);
    } else if (throttle > 0) {
      r.speed += st.accel * throttle * dt;
    } else {
      r.speed *= Math.pow(0.5, dt); // coast
    }
    if (r.speed > maxSp) r.speed += (maxSp - r.speed) * Math.min(1, 4 * dt);
    if (r.speed < -st.reverse) r.speed = -st.reverse;

    // steering scales with speed
    const turnScale = Math.min(1, Math.abs(r.speed) / 60);
    const turn = steer * st.turnRate * turnScale * (r.drifting ? 1.35 : 1) * dt;
    r.angle += turn * (r.speed >= 0 ? 1 : -1);

    // integrate
    const slip = 1 - grip;
    r.x += Math.cos(r.angle) * r.speed * dt;
    r.y += Math.sin(r.angle) * r.speed * dt;
    // soft pull when off completely
    if (r.offTrack && surface === 0) {
      // find nearest waypoint and pull
      const wi = global.KartTrack.nearestWaypoint(track, r.x, r.y);
      const wp = track.waypoints[wi];
      r.x += (wp.x - r.x) * 0.4 * dt;
      r.y += (wp.y - r.y) * 0.4 * dt;
      r.speed *= 0.98;
    }

    // obstacles
    for (const o of track.obstacles || []) {
      const dx = r.x - o.x, dy = r.y - o.y;
      const d2 = dx * dx + dy * dy;
      const rr = (o.r + r.radius);
      if (d2 < rr * rr && d2 > 0) {
        const d = Math.sqrt(d2);
        r.x = o.x + dx / d * rr;
        r.y = o.y + dy / d * rr;
        r.speed *= 0.5;
      }
    }

    if (useItem && r.item) {
      // handled outside with item manager
      r._wantItem = true;
    }
  }

  function updateAI(r, track, dt, now, difficulty, rng) {
    if (r.finished || r.isPlayer) return;
    rng = rng || Math.random;
    // target next waypoint
    let wi = global.KartTrack.nearestWaypoint(track, r.x, r.y);
    // look ahead
    const look = difficulty === 'hard' ? 3 : difficulty === 'easy' ? 1 : 2;
    wi = (wi + look) % track.waypoints.length;
    const wp = track.waypoints[wi];
    const desired = Math.atan2(wp.y - r.y, wp.x - r.x);
    let diff = desired - r.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    // fake input
    const steer = Math.max(-1, Math.min(1, diff * 1.8));
    const curve = Math.abs(diff);
    let throttle = 1;
    if (curve > 0.85) throttle = 0.25;
    else if (curve > 0.55) throttle = 0.5;
    else if (curve > 0.3) throttle = 0.75;
    // random mistakes use seeded rng
    const fakeInput = {
      keys: {},
      touch: {},
      axisX: () => steer + (rng() - 0.5) * 0.05,
      axisY: () => 0,
      pressed: () => false
    };
    if (throttle > 0.5) fakeInput.keys['arrowup'] = true;
    if (curve > 0.5 && r.speed > 100 && rng() < 0.3) fakeInput.keys[' '] = true;
    if (r.item && rng() < 0.008) r._wantItem = true;

    fakeInput._throttle = throttle;
    updateRacerPhysics(r, track, fakeInput, dt, now, false);
    if (throttle < 1 && r.speed > r.stats.maxSpeed * throttle) {
      r.speed *= (0.96 + throttle * 0.03);
    }
    if (curve > 0.7) r.speed *= 0.98;
    r.wpIndex = wi;
  }

  function updateRaceProgress(rt, now) {
    const track = rt.track;
    const cps = track.checkpoints || [];
    if (!cps.length) return;
    // Ensure checkpoint indices are sequential 0..n-1
    cps.forEach(function (c, i) { if (c.index == null) c.index = i; if (c.radius == null) c.radius = 50; });
    for (const r of rt.racers) {
      if (r.finished) continue;
      const nextIdx = r.checkpoint % cps.length;
      const cp = cps[nextIdx];
      if (!cp) continue;
      const rad = cp.radius || 50;
      const dx = r.x - cp.x, dy = r.y - cp.y;
      if (dx * dx + dy * dy < rad * rad) {
        // Only accept the NEXT expected checkpoint (no || true)
        if (cp.index === nextIdx || cps.findIndex(function (c) { return c === cp; }) === nextIdx) {
          r.checkpoint++;
          r.lastCpTime = rt.race.time;
          // Completed a full cycle of checkpoints = one lap
          // Finish line is checkpoint 0 after having passed all others
          const isFinish = (r.checkpoint % cps.length) === 0 && r.checkpoint > 0;
          if (isFinish) {
            r.lap++;
            if (r.isPlayer) {
              const lapT = rt.race.time - rt.race.lapStart;
              if (rt.race.bestLap == null || lapT < rt.race.bestLap) rt.race.bestLap = lapT;
              rt.race.lapStart = rt.race.time;
            }
            if (r.lap >= rt.race.totalLaps) {
              r.finished = true;
              r.finishTime = rt.race.time;
              rt.race.results.push({ id: r.id, name: r.name, time: r.finishTime });
              if (r.isPlayer) {
                rt.won = rt.race.results.length > 0 && rt.race.results[0].id === r.id;
              }
            }
          }
        }
      }
      // Warn player if far past expected CP without hitting it (missed)
      if (r.isPlayer && cps.length >= 2) {
        const expected = cps[nextIdx];
        const dMiss = Math.hypot(r.x - expected.x, r.y - expected.y);
        if (dMiss > 220 && rt.race.time - (r.lastCpTime || 0) > 3) {
          r.missedCp = true;
          rt.missedCpWarn = now + 1500;
        }
      }
    }
    // positions by progress metric
    const scored = rt.racers.map(r => ({
      r,
      score: r.lap * 10000 + r.checkpoint * 100 - Math.hypot(
        r.x - (cps[r.checkpoint % cps.length] || cps[0]).x,
        r.y - (cps[r.checkpoint % cps.length] || cps[0]).y
      ) * 0.01
    }));
    scored.sort((a, b) => b.score - a.score);
    scored.forEach((s, i) => { s.r.position = i + 1; });

    if (rt.player.finished && rt.race.phase === 'racing') {
      rt.race.phase = 'finished';
    }
  }

  function tick(rt, themes, enemyVariants, dt, now) {
    if (rt.paused) return;
    const track = rt.track;
    if (!rt._surf) rt._surf = buildSurfaceCanvas(track);

    // countdown
    if (rt.race.phase === 'countdown') {
      rt.race.countdownTimer -= dt;
      if (rt.race.countdownTimer <= 0) {
        rt.race.countdown--;
        rt.race.countdownTimer = 1;
        if (global.SNESAudio) {
          if (rt.race.countdown < 0) global.SNESAudio.play('race_go');
          else global.SNESAudio.play('race_countdown');
        }
        if (rt.race.countdown < 0) {
          rt.race.phase = 'racing';
          rt.race.lapStart = 0;
        }
      }
      // still allow slight camera follow
      const p = rt.player;
      rt.camera.x = p.x;
      rt.camera.y = p.y;
      rt.camera.angle = p.angle;
      return;
    }

    if (rt.race.phase === 'racing') {
      rt.race.time += dt;
      updateRacerPhysics(rt.player, track, rt.input, dt, now, true);
      if (rt.player._wantItem) {
        rt.items.use(rt.player, rt.racers);
        rt.player._wantItem = false;
      }
      for (const r of rt.racers) {
        if (!r.isPlayer) {
          updateAI(r, track, dt, now, rt.difficulty, rt.rng);
          if (r._wantItem) {
            rt.items.use(r, rt.racers);
            r._wantItem = false;
          }
        }
      }
      // item boxes
      for (const box of track.itemBoxes) {
        if (box.respawn > 0) { box.respawn -= dt; continue; }
        for (const r of rt.racers) {
          if (r.item || r.finished) continue;
          const dx = r.x - box.x, dy = r.y - box.y;
          if (dx * dx + dy * dy < 20 * 20) {
            r.item = global.KartItems.randomItem();
            box.respawn = 5;
            if (r.isPlayer && global.SNESAudio) global.SNESAudio.play('item_get');
          }
        }
      }
      rt.items.update(dt, rt.racers, (racer, type) => {
        if (now < racer.shieldUntil) return;
        racer.spinUntil = now + (type === 'mine' ? 900 : 700);
        racer.speed *= 0.3;
        racer.invUntil = now + 400;
      });
      // racer-racer soft collision
      for (let i = 0; i < rt.racers.length; i++) {
        for (let j = i + 1; j < rt.racers.length; j++) {
          const a = rt.racers[i], b = rt.racers[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          const min = a.radius + b.radius;
          if (d2 < min * min && d2 > 0) {
            const d = Math.sqrt(d2);
            const nx = dx / d, ny = dy / d;
            const push = (min - d) * 0.5;
            a.x -= nx * push; a.y -= ny * push;
            b.x += nx * push; b.y += ny * push;
            const avg = (a.speed + b.speed) * 0.5;
            a.speed = avg * 0.9; b.speed = avg * 0.9;
          }
        }
      }
      updateRaceProgress(rt, now);
    }

    const p = rt.player;
    rt.camera.x = p.x;
    rt.camera.y = p.y;
    rt.camera.angle = p.angle;
  }

  /** Render Mode7-like: project ground from camera */
  function drawMode7(ctx, rt) {
    const track = rt.track;
    const surf = rt._surf;
    if (!surf) return;
    const cam = rt.camera;
    const fov = 1.0;
    const camHeight = 48;
    const scale = 180;

    // sky
    const grd = ctx.createLinearGradient(0, 0, 0, HORIZON);
    grd.addColorStop(0, '#1a3a6e');
    grd.addColorStop(1, '#6eb5e0');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, HORIZON);
    // sun
    ctx.fillStyle = '#ffeaa7';
    ctx.beginPath();
    ctx.arc(W - 80, 36, 18, 0, Math.PI * 2);
    ctx.fill();

    const cos = Math.cos(cam.angle);
    const sin = Math.sin(cam.angle);
    const s = track.size;

    for (let screenY = HORIZON; screenY < H; screenY++) {
      const row = screenY - HORIZON + 1;
      const z = (camHeight * scale) / row;
      const halfW = z * fov;
      // world span for this scanline
      const leftX = -halfW;
      const rightX = halfW;
      // sample step
      for (let screenX = 0; screenX < W; screenX++) {
        const t = screenX / W;
        const localX = leftX + (rightX - leftX) * t;
        const worldX = cam.x + cos * z - sin * localX;
        const worldY = cam.y + sin * z + cos * localX;
        const ix = Math.floor(worldX);
        const iy = Math.floor(worldY);
        if (ix < 0 || iy < 0 || ix >= s || iy >= s) {
          ctx.fillStyle = '#228b3a';
          ctx.fillRect(screenX, screenY, 1, 1);
        } else {
          // sample surface pixel
          // faster: use road type
          const cell = track.road[iy * s + ix];
          if (cell === 1) ctx.fillStyle = ((ix ^ iy) & 16) ? '#4a4e58' : '#3d414a';
          else if (cell === 2) ctx.fillStyle = '#9a8040';
          else if (cell === 3) ctx.fillStyle = '#2ec4e0';
          else ctx.fillStyle = ((ix * 3 + iy) & 8) ? '#2d8a3e' : '#267a36';
          ctx.fillRect(screenX, screenY, 1, 1);
        }
      }
    }
  }

  /** Faster Mode7 using image sampling per scanline strip */
  function drawMode7Fast(ctx, rt) {
    const track = rt.track;
    const surf = rt._surf;
    if (!surf) return;
    const cam = rt.camera;
    const fov = 1.05;
    const camHeight = 52;
    const scale = 200;

    const grd = ctx.createLinearGradient(0, 0, 0, HORIZON);
    grd.addColorStop(0, '#152848');
    grd.addColorStop(0.6, '#3d7ab5');
    grd.addColorStop(1, '#87c5e8');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, HORIZON);
    ctx.fillStyle = '#ffeaa7';
    ctx.beginPath();
    ctx.arc(W - 70, 40, 16, 0, Math.PI * 2);
    ctx.fill();

    const cos = Math.cos(cam.angle);
    const sin = Math.sin(cam.angle);
    const s = track.size;

    // draw in horizontal strips of 2px for speed
    for (let screenY = HORIZON; screenY < H; screenY += 2) {
      const row = screenY - HORIZON + 4;
      const z = (camHeight * scale) / row;
      const halfW = z * fov;
      // 4 sample points across width, interpolate colors via segments
      const samples = 64;
      for (let i = 0; i < samples; i++) {
        const t0 = i / samples;
        const t1 = (i + 1) / samples;
        const lx = -halfW + 2 * halfW * ((t0 + t1) / 2);
        const worldX = cam.x + cos * z - sin * lx;
        const worldY = cam.y + sin * z + cos * lx;
        const ix = worldX | 0;
        const iy = worldY | 0;
        let col = '#228b3a';
        if (ix >= 0 && iy >= 0 && ix < s && iy < s) {
          const cell = track.road[iy * s + ix];
          if (cell === 1) col = ((ix ^ iy) & 16) ? '#525660' : '#3a3e48';
          else if (cell === 2) col = '#a08848';
          else if (cell === 3) col = '#2ec4e0';
          else col = ((ix + iy) & 8) ? '#2f9140' : '#267a34';
        }
        ctx.fillStyle = col;
        ctx.fillRect((t0 * W) | 0, screenY, Math.ceil(W / samples) + 1, 2);
      }
    }

    // hills silhouette
    ctx.fillStyle = '#1a4a2a';
    ctx.beginPath();
    ctx.moveTo(0, HORIZON);
    for (let x = 0; x < W; x += 8) {
      const h = 6 + Math.sin(x * 0.04 + cam.angle) * 4 + Math.sin(x * 0.01) * 8;
      ctx.lineTo(x, HORIZON - h);
    }
    ctx.lineTo(W, HORIZON);
    ctx.fill();
  }

  function projectSprite(rt, x, y) {
    const cam = rt.camera;
    const dx = x - cam.x;
    const dy = y - cam.y;
    const cos = Math.cos(-cam.angle);
    const sin = Math.sin(-cam.angle);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    if (ry < 8 || ry > 500) return null;
    const scale = 180 / ry;
    const sx = W / 2 + rx * scale;
    const sy = HORIZON + 40 * scale;
    const sz = Math.max(4, 18 * scale);
    if (sx < -40 || sx > W + 40 || sy < HORIZON - 10 || sy > H + 20) return null;
    return { sx, sy, sz, depth: ry };
  }

  function drawFrame(ctx, rt) {
    drawMode7Fast(ctx, rt);

    // sprites: item boxes, obstacles, other racers
    const sprites = [];
    for (const box of rt.track.itemBoxes) {
      if (box.respawn > 0) continue;
      const p = projectSprite(rt, box.x, box.y);
      if (p) sprites.push({ ...p, type: 'box' });
    }
    for (const o of rt.track.obstacles) {
      const p = projectSprite(rt, o.x, o.y);
      if (p) sprites.push({ ...p, type: 'obs' });
    }
    for (const r of rt.racers) {
      if (r.isPlayer) continue;
      const p = projectSprite(rt, r.x, r.y);
      if (p) sprites.push({ ...p, type: 'kart', color: r.color, racer: r });
    }
    for (const tr of rt.items.traps) {
      const p = projectSprite(rt, tr.x, tr.y);
      if (p) sprites.push({ ...p, type: 'trap' });
    }
    for (const pr of rt.items.projectiles) {
      const p = projectSprite(rt, pr.x, pr.y);
      if (p) sprites.push({ ...p, type: 'proj' });
    }
    sprites.sort((a, b) => b.depth - a.depth);
    for (const s of sprites) {
      if (s.type === 'box') {
        ctx.fillStyle = '#f7b32b';
        ctx.fillRect(s.sx - s.sz / 2, s.sy - s.sz, s.sz, s.sz);
        ctx.fillStyle = '#fff';
        ctx.fillRect(s.sx - s.sz / 4, s.sy - s.sz * 0.75, s.sz / 2, s.sz / 2);
      } else if (s.type === 'obs') {
        ctx.fillStyle = '#555';
        ctx.fillRect(s.sx - s.sz / 2, s.sy - s.sz, s.sz, s.sz);
      } else if (s.type === 'trap') {
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(s.sx, s.sy - 4, s.sz / 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (s.type === 'proj') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(s.sx - 2, s.sy - 2, 4, 4);
      } else if (s.type === 'kart') {
        const Spr = global.NinjaKartSprites;
        let ok = false;
        if (Spr && Spr.isReady()) {
          const angDiff = s.racer ? (s.racer.angle - rt.camera.angle) : 0;
          let steerAI = 0;
          if (angDiff > 0.15) steerAI = 1;
          else if (angDiff < -0.15) steerAI = -1;
          ok = Spr.drawRacerSprite(ctx, s.sx, s.sy, s.sz, steerAI);
        }
        if (!ok) {
          ctx.fillStyle = s.color;
          ctx.fillRect(s.sx - s.sz / 2, s.sy - s.sz * 0.7, s.sz, s.sz * 0.55);
          ctx.fillStyle = '#ffd88a';
          ctx.fillRect(s.sx - s.sz / 4, s.sy - s.sz * 0.9, s.sz / 2, s.sz / 3);
        }
      }
    }

    // player kart at bottom center (ninja sprites)
    const p = rt.player;
    const steer = p.isPlayer ? (rt.input ? rt.input.axisX() : 0) : 0;
    const lean = p.drifting ? steer * 14 : steer * 7;
    const nowD = performance.now();
    const boosting = nowD < p.boostUntil;
    const Spr = global.NinjaKartSprites;
    const px = W / 2 + lean;
    const py = H - 18;
    let drew = false;
    if (Spr && Spr.isReady()) {
      drew = Spr.drawPlayer(ctx, px, py, 0.55, steer, boosting, p.drifting);
    }
    if (!drew) {
      ctx.save();
      ctx.translate(px, py - 24);
      ctx.fillStyle = p.color;
      ctx.fillRect(-14, -10, 28, 16);
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-16, 2, 8, 6);
      ctx.fillRect(8, 2, 8, 6);
      ctx.fillStyle = '#ffd88a';
      ctx.fillRect(-6, -16, 12, 8);
      ctx.restore();
    }
    if (nowD < p.shieldUntil) {
      ctx.strokeStyle = '#7bed9f';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 28, py - 52, 56, 44);
    }

    // HUD
    drawHUD(ctx, rt);

    // minimap
    drawMinimap(ctx, rt);

    // countdown / finish
    if (rt.race.phase === 'countdown') {
      ctx.fillStyle = '#00000088';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      const n = rt.race.countdown;
      ctx.fillText(n < 0 ? 'VAI!' : String(Math.max(0, n)), W / 2, H / 2);
      ctx.textAlign = 'left';
    }
    if (rt.race.phase === 'finished') {
      ctx.fillStyle = '#00000099';
      ctx.fillRect(W / 2 - 120, 60, 240, 140);
      ctx.strokeStyle = '#f7b32b';
      ctx.strokeRect(W / 2 - 120, 60, 240, 140);
      ctx.fillStyle = '#fff';
      ctx.font = '18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(rt.won ? '1º LUGAR!' : 'CORRIDA ENCERRADA', W / 2, 95);
      ctx.font = '12px monospace';
      rt.race.results.slice(0, 6).forEach((r, i) => {
        ctx.fillText((i + 1) + '. ' + r.name + '  ' + formatTime(r.time), W / 2, 120 + i * 14);
      });
      ctx.textAlign = 'left';
    }
  }

  function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s + '.' + (ms < 10 ? '0' : '') + ms;
  }

  function drawHUD(ctx, rt) {
    const p = rt.player;
    const itemDef = p.item && global.KartItems.ITEM_TYPES[p.item];
    ctx.fillStyle = '#0b0b12cc';
    ctx.fillRect(8, 8, 200, 54);
    const SprH = global.NinjaKartSprites;
    if (SprH && SprH.isReady()) SprH.drawPortrait(ctx, 12, 12, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    const hx = (SprH && SprH.isReady()) ? 58 : 16;
    ctx.fillText('POS: ' + p.position + '/' + rt.racers.length, hx, 24);
    ctx.fillText('VOLTA: ' + Math.min(p.lap + 1, rt.race.totalLaps) + '/' + rt.race.totalLaps, hx, 40);
    ctx.fillText('TEMPO: ' + formatTime(rt.race.time), hx, 56);
    ctx.fillStyle = '#0b0b12cc';
    ctx.fillRect(W - 100, 8, 92, 40);
    ctx.fillStyle = '#f7b32b';
    ctx.font = '11px monospace';
    ctx.fillText('ITEM', W - 90, 24);
    ctx.font = '16px monospace';
    ctx.fillText(itemDef ? itemDef.icon + ' ' + itemDef.label.slice(0, 6) : '—', W - 90, 42);
    if (p.drifting) {
      ctx.fillStyle = '#74b9ff';
      ctx.fillText('DRIFT', W / 2 - 20, 24);
    }
    if (rt.missedCpWarn > performance.now()) {
      ctx.fillStyle = '#e74c3c';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CHECKPOINT PERDIDO!', W / 2, 40);
      ctx.textAlign = 'left';
    }
  }

  function drawMinimap(ctx, rt) {
    const mapS = 88;
    const ox = W - mapS - 10;
    const oy = H - mapS - 10;
    const track = rt.track;
    const scale = mapS / track.size;
    ctx.fillStyle = '#0b0b12ee';
    ctx.fillRect(ox - 4, oy - 4, mapS + 8, mapS + 8);
    // downsample road
    const step = 8;
    for (let y = 0; y < track.size; y += step) {
      for (let x = 0; x < track.size; x += step) {
        const c = track.road[y * track.size + x];
        if (c === 0) continue;
        ctx.fillStyle = c === 1 ? '#555' : c === 3 ? '#2ec4e0' : '#888';
        ctx.fillRect(ox + x * scale, oy + y * scale, 2, 2);
      }
    }
    for (const r of rt.racers) {
      ctx.fillStyle = r.isPlayer ? '#55d6a0' : r.color;
      ctx.beginPath();
      ctx.arc(ox + r.x * scale, oy + r.y * scale, r.isPlayer ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function start(rt, target) {
    rt.input.bind(target || window);
  }
  function stop(rt) {
    rt.input.dispose();
  }

  global.KartRuntime = {
    id: 'kart-racing',
    label: 'Kart Racing 2.5D',
    createState,
    tick,
    drawFrame,
    start,
    stop,
    ensureLayers: function (s) { return s.layers || {}; },
    mobileButtons: ['left', 'right', 'up', 'down', 'jump', 'action']
  };

  // Register with engine when available
  if (global.SNESEngine && global.SNESEngine.register) {
    global.SNESEngine.register(global.KartRuntime);
  }
})(typeof window !== 'undefined' ? window : globalThis);
