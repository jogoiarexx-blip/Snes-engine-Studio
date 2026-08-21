/**
 * SNES Engine Studio V7 — Runtime PLATAFORMA
 * Baseado no runtime 0.6, integrado à arquitetura multiestilo.
 */
(function (global) {
  'use strict';

  const W = 512, H = 288, T = 16, COLS = 32, ROWS = 18;

  function ensureLayers(scene) {
    if (!scene.layers) {
      const map = scene.map || blankMap();
      scene.layers = {
        background: blankMap(),
        ground: clone2d(map),
        decoration: blankMap(),
        foreground: blankMap(),
        collision: null // usa ground se null
      };
    }
    if (!scene.layers.decoration) scene.layers.decoration = blankMap();
    if (!scene.layers.collision) scene.layers.collision = null;
    scene.map = scene.layers.ground;
    return scene.layers;
  }

  function blankMap() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }
  function clone2d(m) { return (m || blankMap()).map(r => r.slice()); }

  function collisionMap(scene) {
    const L = ensureLayers(scene);
    return L.collision || L.ground;
  }

  function createState(project, sceneId) {
    const scene = project.scenes.find(s => s.id === sceneId) || project.scenes[0];
    ensureLayers(scene);
    const playerEnt = scene.entities.find(e => e.type === 'player') || { x: 32, y: 200, hp: 3, speed: 120, jump: 300 };
    const entities = JSON.parse(JSON.stringify(scene.entities)).map(e => ({
      ...e,
      maxHp: e.maxHp || e.hp || 1,
      vx: 0, vy: 0,
      w: e.w || (e.sprite === 'skeleton' ? 22 : 14),
      h: e.h || (e.sprite === 'skeleton' ? 46 : 14),
      onGround: false, dead: false,
      facing: e.facing || 'right',
      animStarted: performance.now(),
      nextAttack: 0, hurtUntil: 0, attackUntil: 0,
      patrolMin: e.patrolMin != null ? e.patrolMin : e.x - 48,
      patrolMax: e.patrolMax != null ? e.patrolMax : e.x + 48,
      patrolDir: e.facing === 'left' ? -1 : 1,
      opened: !!e.opened, activated: !!e.activated,
      anim: null
    }));

    return {
      gameType: 'platform',
      project, sceneId: scene.id, scene, entities,
      player: {
        x: playerEnt.x, y: playerEnt.y, vx: 0, vy: 0, w: 12, h: 14,
        hp: playerEnt.hp || 3, maxHp: playerEnt.hp || 3,
        speed: playerEnt.speed || 120, jump: playerEnt.jump || 300,
        onGround: false, facing: 'right', score: 0, keys: 0,
        invUntil: 0, coyote: 0, jumpBuf: 0, nextShot: 0, attackUntil: 0, dead: false,
        checkpoint: { x: playerEnt.x, y: playerEnt.y, sceneId: scene.id },
        anim: null
      },
      shots: [],
      input: global.SNESInput.create(),
      time: 0, dialog: null, paused: false, gameOver: false,
      doorCooldown: 0,
      camera: (global.SNESCamera ? global.SNESCamera.create({
        mode: 'follow', worldW: W, worldH: H, viewW: W, viewH: H, lookAhead: 28
      }) : { x: 0, y: 0 })
    };
  }

  function solidAhead(map, tiles, e, dir) {
    const Col = global.SNESCollision;
    const footX = e.x + (dir > 0 ? e.w + 2 : -2);
    const footY = e.y + e.h + 2;
    const midY = e.y + e.h * 0.5;
    return {
      wall: Col.isSolidTile(tiles, map, footX, midY, COLS, ROWS),
      edge: !Col.isSolidTile(tiles, map, footX, footY, COLS, ROWS)
    };
  }

  function tick(rt, themes, enemyVariants, dt, now) {
    if (rt.paused || rt.gameOver) return;
    const scene = rt.scene;
    const map = collisionMap(scene);
    const theme = themes[scene.themeId] || themes.floresta;
    const tiles = theme.tiles;
    const Col = global.SNESCollision;
    const Anim = global.SNESAnim;
    const p = rt.player;
    const input = rt.input;

    // Ensure animators
    if (Anim) {
      if (!p.anim) p.anim = Anim.createAnimator(Anim.DEFS.player);
      for (const e of rt.entities) {
        if (e.type === 'enemy' && e.sprite !== 'skeleton' && !e.anim)
          e.anim = Anim.createAnimator(Anim.DEFS.enemy);
      }
    }

    // Moving platforms — update first so player can ride
    for (const e of rt.entities) {
      if (e.type !== 'moving_platform') continue;
      const axis = e.axis || 'x';
      const spd = e.speed || 40;
      if (e.dir == null) e.dir = 1;
      if (axis === 'x') {
        e.x += e.dir * spd * dt;
        const mn = e.min != null ? e.min : e.x - 40;
        const mx = e.max != null ? e.max : e.x + 40;
        if (e.x <= mn) { e.x = mn; e.dir = 1; }
        if (e.x >= mx) { e.x = mx; e.dir = -1; }
        e.vx = e.dir * spd; e.vy = 0;
      } else {
        e.y += e.dir * spd * dt;
        const mn = e.min != null ? e.min : e.y - 40;
        const mx = e.max != null ? e.max : e.y + 40;
        if (e.y <= mn) { e.y = mn; e.dir = 1; }
        if (e.y >= mx) { e.y = mx; e.dir = -1; }
        e.vy = e.dir * spd; e.vx = 0;
      }
    }

    // Player
    if (!p.dead) {
      // Ladder detection
      let onLadder = null;
      for (const e of rt.entities) {
        if (e.type !== 'ladder') continue;
        if (p.x + p.w > e.x && p.x < e.x + (e.w || 16) &&
            p.y + p.h > e.y && p.y < e.y + (e.h || 64)) {
          onLadder = e; break;
        }
      }
      p.onLadder = !!onLadder;

      const ax = input.axisX();
      const ay = input.axisY();
      p.vx = ax * p.speed;
      if (ax < 0) p.facing = 'left';
      if (ax > 0) p.facing = 'right';

      if (onLadder) {
        p.vy = ay * (p.speed * 0.7);
        p.onGround = true;
        p.coyote = 0.1;
        // climb without normal gravity
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.x = Math.max(0, Math.min(W - p.w, p.x));
        p.y = Math.max(onLadder.y - 4, Math.min(onLadder.y + (onLadder.h || 64) - p.h, p.y));
        if (input.pressed('jump')) {
          p.vy = -p.jump * 0.7;
          p.onLadder = false;
          p.onGround = false;
        }
      } else {
        if (p.onGround) p.coyote = 0.1;
        else p.coyote = Math.max(0, p.coyote - dt);
        if (input.pressed('jump')) p.jumpBuf = 0.12;
        else p.jumpBuf = Math.max(0, p.jumpBuf - dt);
        if (p.jumpBuf > 0 && p.coyote > 0) {
          p.vy = -p.jump; p.onGround = false; p.coyote = 0; p.jumpBuf = 0;
        }
        Col.moveAABB(p, map, tiles, dt, { gravity: 650, cols: COLS, rows: ROWS });

        // Ride moving platforms
        for (const e of rt.entities) {
          if (e.type !== 'moving_platform') continue;
          const feetY = p.y + p.h;
          if (p.vy >= 0 &&
              p.x + p.w > e.x + 2 && p.x < e.x + (e.w || 48) - 2 &&
              feetY >= e.y - 2 && feetY <= e.y + 8) {
            p.y = e.y - p.h;
            p.vy = 0;
            p.onGround = true;
            p.x += (e.vx || 0) * dt;
            p.y += (e.vy || 0) * dt;
          }
        }
      }

      if (input.pressed('attack') && now > (p.nextShot || 0)) {
        p.nextShot = now + 220;
        const dir = p.facing === 'left' ? -1 : 1;
        rt.shots.push({ x: p.x + (dir > 0 ? p.w : -6), y: p.y + 6, vx: 280 * dir, life: 0.55, damage: 1 });
        p.attackUntil = now + 180;
      }
      if (p.y > H + 20 || p.hp <= 0) {
        p.hp = 0;
        const cp = p.checkpoint;
        if (cp && cp.sceneId === rt.sceneId) {
          p.x = cp.x; p.y = cp.y; p.vx = 0; p.vy = 0; p.hp = p.maxHp; p.invUntil = now + 1500;
        } else { p.dead = true; rt.gameOver = true; }
      }
    }

    // Update player animation state
    if (Anim && p.anim) {
      const st = Anim.resolvePlatformState(p, { now: now });
      p.anim.setState(st === 'death' ? 'hurt' : st);
      p.anim.update(dt);
    }

    // Enemies
    for (const e of rt.entities) {
      if (e.type !== 'enemy' || e.dead) continue;
      if (e.hurtUntil > now) {
        e.vx *= 0.9;
        Col.moveAABB(e, map, tiles, dt, { gravity: 650, cols: COLS, rows: ROWS });
        continue;
      }
      const dx = p.x - e.x, dy = p.y - e.y;
      const dist = Math.hypot(dx, dy);
      const vision = e.vision || 160, attackRange = e.attackRange || 28;
      e.vy = (e.vy || 0);
      let ai = 'patrol';
      if (dist < attackRange && Math.abs(dy) < 24) ai = 'attack';
      else if (dist < vision) ai = 'chase';

      if (ai === 'attack') {
        e.vx = 0; e.facing = dx < 0 ? 'left' : 'right';
        if (now > (e.nextAttack || 0) && now > p.invUntil) {
          e.attackUntil = now + 420; e.animStarted = now; e.nextAttack = now + (e.boss ? 900 : 1100);
          p.hp = Math.max(0, p.hp - (e.damage || 1)); p.invUntil = now + 800;
        }
      } else if (ai === 'chase') {
        e.facing = dx < 0 ? 'left' : 'right';
        const dir = dx < 0 ? -1 : 1;
        const { wall, edge } = solidAhead(map, tiles, e, dir);
        e.vx = (wall || edge) ? 0 : dir * (e.speed || 35) * (e.boss ? 1.15 : 1);
      } else {
        const dir = e.patrolDir || 1;
        const { wall, edge } = solidAhead(map, tiles, e, dir);
        if (wall || edge || e.x <= e.patrolMin || e.x >= e.patrolMax) e.patrolDir = -dir;
        e.vx = (e.patrolDir || 1) * (e.speed || 28) * 0.7;
        e.facing = e.vx < 0 ? 'left' : 'right';
      }
      Col.moveAABB(e, map, tiles, dt, { gravity: 650, cols: COLS, rows: ROWS });
      if (!e.dead && now > p.invUntil && Col.aabbOverlap(p, e)) {
        p.hp = Math.max(0, p.hp - (e.damage || 1));
        p.invUntil = now + 900;
        p.vx += (p.x < e.x ? -1 : 1) * 120; p.vy = -120;
      }
      if (Anim && e.anim && e.sprite !== 'skeleton') {
        const st = Anim.resolvePlatformState(e, { now: now });
        e.anim.setState(st === 'death' ? 'hurt' : (st === 'jump' || st === 'fall' ? 'walk' : st));
        e.anim.update(dt);
      }
    }

    // Shots
    for (let i = rt.shots.length - 1; i >= 0; i--) {
      const s = rt.shots[i];
      s.x += s.vx * dt; s.life -= dt;
      let hit = false;
      for (const e of rt.entities) {
        if (e.type !== 'enemy' || e.dead) continue;
        if (Math.abs(e.x + e.w / 2 - s.x) < e.w * 0.6 && Math.abs(e.y + e.h / 2 - s.y) < e.h * 0.6) {
          e.hp = (e.hp || 1) - (s.damage || 1);
          e.hurtUntil = now + 280; e.animStarted = now; e.vx += Math.sign(s.vx) * 40;
          hit = true;
          if (e.hp <= 0) {
            e.dead = true; e.vx = 0; e.animStarted = now;
            p.score += e.boss ? 1000 : e.sprite === 'skeleton' ? 300 : 100;
          }
          break;
        }
      }
      if (hit || s.life <= 0 || s.x < -20 || s.x > W + 20) rt.shots.splice(i, 1);
    }
    rt.entities = rt.entities.filter(e => {
      if (e.type === 'enemy' && e.dead) return (now - (e.animStarted || now)) < 1100;
      return !e.dead || e.type === 'enemy';
    });


    // Spikes / hazard tiles (tile name contains espinho|spike|lava|espinhos)
    if (!p.dead && now > p.invUntil) {
      const feet = [
        [p.x + 2, p.y + p.h + 1],
        [p.x + p.w - 2, p.y + p.h + 1],
        [p.x + p.w / 2, p.y + p.h / 2]
      ];
      for (const [px, py] of feet) {
        const gx = Math.floor(px / T), gy = Math.floor(py / T);
        if (gx < 0 || gy < 0 || gx >= COLS || gy >= ROWS) continue;
        const cell = map[gy][gx];
        const tile = tiles[cell];
        if (tile && /espinho|spike|lava|espinhos|espinhos/i.test(tile.name || '')) {
          p.hp = Math.max(0, p.hp - 1);
          p.invUntil = now + 800;
          p.vy = -180;
          break;
        }
      }
    }

    // Camera follow
    if (global.SNESCamera && rt.camera) global.SNESCamera.update(rt.camera, p, dt);

    // Interactables
    rt.doorCooldown = Math.max(0, rt.doorCooldown - dt);
    for (const e of rt.entities) {
      if (e.dead) continue;
      const near = Math.abs(e.x - p.x) < 16 && Math.abs(e.y - p.y) < 18;
      if (e.type === 'item' && near) {
        if (e.itemKind === 'health') p.hp = Math.min(p.maxHp, p.hp + 1);
        else if (e.itemKind === 'key') p.keys = (p.keys || 0) + 1;
        else p.score += 100;
        e.dead = true;
      }
      if ((e.type === 'checkpoint') && near && !e.activated) {
        e.activated = true;
        p.checkpoint = { x: e.x, y: e.y, sceneId: rt.sceneId };
      }
      if ((e.type === 'chest') && near && !e.opened && input.pressed('action')) {
        e.opened = true;
        p.score += 250;
      }
      if ((e.type === 'door' || e.event === 'nextScene') && near && rt.doorCooldown <= 0) {
        if (e.locked && !(p.keys > 0)) continue;
        if (e.locked) p.keys--;
        const idx = rt.project.scenes.findIndex(s => s.id === rt.sceneId);
        const next = e.targetScene
          ? rt.project.scenes.find(s => s.id === e.targetScene)
          : rt.project.scenes[idx + 1];
        if (next) {
          rt.doorCooldown = 1;
          switchScene(rt, next.id, e.targetX, e.targetY);
        }
      }
      if (e.type === 'npc' && near && input.pressed('action') && !rt.dialog) {
        rt.dialog = { text: e.dialog || '…', until: now + 2500 };
      }
    }
    if (rt.dialog && now > rt.dialog.until) rt.dialog = null;
    rt.time += dt;
  }

  function switchScene(rt, sceneId, spawnX, spawnY) {
    const scene = rt.project.scenes.find(s => s.id === sceneId);
    if (!scene) return;
    ensureLayers(scene);
    rt.sceneId = scene.id; rt.scene = scene;
    rt.entities = JSON.parse(JSON.stringify(scene.entities)).map(e => ({
      ...e, maxHp: e.maxHp || e.hp || 1, vx: 0, vy: 0,
      w: e.w || (e.sprite === 'skeleton' ? 22 : 14),
      h: e.h || (e.sprite === 'skeleton' ? 46 : 14),
      onGround: false, dead: false, facing: e.facing || 'right',
      animStarted: performance.now(), nextAttack: 0, hurtUntil: 0, attackUntil: 0,
      patrolMin: e.patrolMin != null ? e.patrolMin : e.x - 48,
      patrolMax: e.patrolMax != null ? e.patrolMax : e.x + 48,
      patrolDir: e.facing === 'left' ? -1 : 1,
      opened: !!e.opened, activated: !!e.activated,
      anim: null
    }));
    const pl = scene.entities.find(e => e.type === 'player');
    rt.player.x = spawnX != null ? spawnX : (pl ? pl.x : 32);
    rt.player.y = spawnY != null ? spawnY : (pl ? pl.y : 200);
    rt.player.vx = 0; rt.player.vy = 0;
    rt.player.checkpoint = { x: rt.player.x, y: rt.player.y, sceneId: scene.id };
    rt.shots = [];
  }

  // Drawing helpers (shared style with previous runtime)
  function drawTileAt(ctx, tile, x, y, size) {
    if (!tile) return;
    const s = size / 16;
    ctx.fillStyle = tile.color;
    ctx.fillRect(x, y, size, size);
    (tile.decos || []).forEach(d => {
      if (d.outline) {
        ctx.strokeStyle = d.outline; ctx.lineWidth = Math.max(1, s);
        ctx.strokeRect(x + d.x * s + s / 2, y + d.y * s + s / 2, Math.max(0, d.w * s - s), Math.max(0, d.h * s - s));
      } else {
        ctx.fillStyle = d.color;
        ctx.fillRect(x + d.x * s, y + d.y * s, d.w * s, d.h * s);
      }
    });
  }
  function px(c, x, y, w, h, color) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h); }

  function drawEntity(ctx, e, theme, enemyVariants, skeletonDraw) {
    if (e.dead && e.type !== 'enemy') return;
    if (e.type === 'enemy' && e.sprite === 'skeleton' && skeletonDraw) {
      skeletonDraw(ctx, e);
      if (e.hp < e.maxHp && !e.dead) {
        ctx.fillStyle = '#0008'; ctx.fillRect(e.x - 4, e.y - 54, 28, 4);
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(e.x - 4, e.y - 54, 28 * Math.max(0, e.hp / e.maxHp), 4);
      }
      return;
    }
    if (e.type === 'enemy') {
      if (global.SNESAnim && e.anim) {
        const fr = e.anim.current();
        global.SNESAnim.drawSprite(ctx, global.SNESAnim.enemySheet(), fr, e.x + (e.w || 14) / 2, e.y + (e.h || 14), {
          dw: 16, dh: 16, anchor: 'feet', flip: e.facing === 'left'
        });
      } else {
        const list = enemyVariants[theme._id] || enemyVariants.floresta || [];
        const v = list.find(q => q.id === e.sub) || list[0] || { color: '#c84c72', accent: '#fff', style: 'beast' };
        px(ctx, e.x + 2, e.y + 4, 10, 7, v.color);
        px(ctx, e.x + 5, e.y + 5, 2, 2, '#fff');
      }
    } else if (e.type === 'item') {
      px(ctx, e.x + 2, e.y + 4, 9, 6, '#ffe17a');
    } else if (e.type === 'npc') {
      px(ctx, e.x + 3, e.y, 7, 5, '#ffd88a'); px(ctx, e.x + 2, e.y + 5, 9, 8, '#4aa0e0');
    } else if (e.type === 'checkpoint') {
      px(ctx, e.x + 6, e.y, 3, 16, e.activated ? '#62d38b' : '#888');
    } else if (e.type === 'door') {
      px(ctx, e.x + 2, e.y, 12, 18, '#5b3a22'); px(ctx, e.x + 4, e.y + 2, 8, 14, '#3d2716');
    } else if (e.type === 'chest') {
      px(ctx, e.x + 1, e.y + 4, 14, 10, e.opened ? '#5d3b28' : '#8a5a2f');
    } else if (e.type === 'moving_platform') {
      px(ctx, e.x, e.y, e.w || 48, e.h || 8, '#8a9bb0');
      px(ctx, e.x, e.y, e.w || 48, 2, '#c5d0e0');
    } else if (e.type === 'ladder') {
      const h = e.h || 64, w = e.w || 16;
      px(ctx, e.x + 2, e.y, 2, h, '#a67c52');
      px(ctx, e.x + w - 4, e.y, 2, h, '#a67c52');
      for (let yy = e.y + 4; yy < e.y + h; yy += 8) px(ctx, e.x + 2, yy, w - 4, 2, '#c4a574');
    }
  }

  function drawFrame(ctx, rt, themes, enemyVariants, skeletonDraw) {
    const scene = rt.scene;
    const L = ensureLayers(scene);
    const theme = themes[scene.themeId] || themes.floresta;
    theme._id = scene.themeId;
    const tiles = theme.tiles;
    ctx.clearRect(0, 0, W, H);
    if (global.SNESRender) global.SNESRender.setupCtx(ctx);
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        drawTileAt(ctx, tiles[L.background[y][x]] || tiles[0], x * T, y * T, T);
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (L.ground[y][x]) drawTileAt(ctx, tiles[L.ground[y][x]] || tiles[0], x * T, y * T, T);
    if (L.decoration)
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++)
          if (L.decoration[y][x]) drawTileAt(ctx, tiles[L.decoration[y][x]] || tiles[0], x * T, y * T, T);
    const sorted = rt.entities.slice().sort((a, b) => (a.y + (a.h || 0)) - (b.y + (b.h || 0)));
    for (const e of sorted) {
      if (e.type === 'player') continue;
      drawEntity(ctx, e, theme, enemyVariants, skeletonDraw);
    }
    const p = rt.player;
    const now = performance.now();
    if (!(now < p.invUntil && Math.floor(now / 80) % 2 === 0)) {
      if (global.SNESAnim && p.anim) {
        const fr = p.anim.current();
        global.SNESAnim.drawSprite(ctx, global.SNESAnim.playerSheet(), fr, p.x + p.w / 2, p.y + p.h, {
          dw: 16, dh: 16, anchor: 'feet', flip: p.facing === 'left', ox: 0, oy: 0
        });
      } else {
        px(ctx, p.x + 3, p.y, 7, 5, '#ffd88a');
        px(ctx, p.x + 2, p.y + 5, 9, 7, '#55d6a0');
        px(ctx, p.x + 2, p.y + 12, 3, 2, '#31435c');
        px(ctx, p.x + 8, p.y + 12, 3, 2, '#31435c');
      }
    }
    for (const s of rt.shots) {
      ctx.fillStyle = '#ffe36a'; ctx.fillRect(s.x, s.y, 7, 3);
    }
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (L.foreground[y][x]) drawTileAt(ctx, tiles[L.foreground[y][x]] || tiles[0], x * T, y * T, T);
    // HUD
    ctx.fillStyle = '#0b0b12aa'; ctx.fillRect(6, 6, 170, 28);
    ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
    ctx.fillText('❤'.repeat(Math.max(0, Math.min(9, p.hp))) + '  ' + p.score, 12, 24);
    if (rt.dialog) {
      ctx.fillStyle = '#0b0b12ee'; ctx.fillRect(40, H - 60, W - 80, 48);
      ctx.strokeStyle = '#f7b32b'; ctx.strokeRect(40, H - 60, W - 80, 48);
      ctx.fillStyle = '#fff'; ctx.fillText(rt.dialog.text.slice(0, 48), 52, H - 32);
    }
    if (rt.gameOver) {
      ctx.fillStyle = '#000000bb'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.font = '20px monospace';
      ctx.fillText('GAME OVER', W / 2 - 55, H / 2);
    }
  }

  function start(rt, target) {
    rt.input.bind(target || window);
  }
  function stop(rt) {
    rt.input.dispose();
  }

  global.PlatformRuntime = {
    id: 'platform',
    label: 'Plataforma 2D',
    createState, tick, drawFrame, start, stop, ensureLayers, switchScene,
    mobileButtons: ['left', 'right', 'jump', 'attack', 'action', 'pause']
  };
})(typeof window !== 'undefined' ? window : globalThis);
