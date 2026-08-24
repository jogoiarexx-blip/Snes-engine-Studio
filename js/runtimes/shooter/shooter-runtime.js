/**
 * SNES Engine Studio V7 — Runtime SHOOTER / NAVINHA
 * Movimento livre, tiros, ondas, power-ups, boss.
 */
(function (global) {
  'use strict';

  const W = 512, H = 288;

  function ensureLayers(scene) {
    if (!scene.layers) {
      const blank = () => Array.from({ length: 18 }, () => Array(32).fill(0));
      const map = scene.map || blank();
      scene.layers = {
        background: blank(),
        ground: map.map ? map.map(r => r.slice()) : blank(),
        decoration: blank(),
        foreground: blank(),
        collision: null
      };
    }
    scene.map = scene.layers.ground;
    return scene.layers;
  }

  function createState(project, sceneId) {
    const scene = project.scenes.find(s => s.id === sceneId) || project.scenes[0];
    ensureLayers(scene);
    const settings = Object.assign({
      scrollDir: 'none', // none | left | up
      scrollSpeed: 40,
      shipSpeed: 160,
      fireRate: 0.18,
      bulletSpeed: 320
    }, project.settings && project.settings.shooter || {});

    const playerEnt = scene.entities.find(e => e.type === 'player') || { x: 40, y: 130, hp: 5 };
    const entities = JSON.parse(JSON.stringify(scene.entities)).map(e => ({
      ...e,
      maxHp: e.maxHp || e.hp || 1,
      vx: 0, vy: 0, dead: false,
      w: e.w || (e.boss ? 28 : 16),
      h: e.h || (e.boss ? 28 : 16),
      pathT: 0, fireCD: 0
    }));

    // Build waves from spawners
    const waves = [];
    entities.filter(e => e.type === 'spawner').forEach(s => {
      waves.push({
        id: s.waveId || s.id,
        enemyType: s.enemyType || 'enemy',
        count: s.count || 5,
        interval: s.interval || 0.8,
        path: s.path || 'sine',
        spawned: 0,
        timer: 0,
        done: false,
        x: s.x, y: s.y
      });
    });
    if (!waves.length) {
      waves.push({
        id: 'auto', enemyType: 'enemy', count: 8, interval: 1.0,
        path: 'sine', spawned: 0, timer: 0.5, done: false, x: W + 20, y: H / 2
      });
    }

    return {
      gameType: 'shooter',
      project, sceneId: scene.id, scene, entities,
      settings,
      player: {
        x: playerEnt.x, y: playerEnt.y, vx: 0, vy: 0, w: 16, h: 12,
        hp: playerEnt.hp || 5, maxHp: playerEnt.hp || 5,
        speed: settings.shipSpeed,
        score: 0, invUntil: 0, dead: false,
        fireCD: 0, fireRate: settings.fireRate,
        shotMode: 'single', // single | double | triple
        damage: 1, bombs: 1
      },
      bullets: [],
      enemyBullets: [],
      waves, waveIndex: 0,
      input: global.SNESInput.create(),
      time: 0, paused: false, gameOver: false, won: false,
      scroll: 0,
      camera: { x: 0, y: 0 }
    };
  }

  function spawnEnemy(rt, wave) {
    const path = wave.path || 'sine';
    const y = wave.y != null ? wave.y + (Math.random() - 0.5) * 80 : 40 + Math.random() * (H - 80);
    const e = {
      id: 'e' + Date.now() + Math.random(),
      type: 'enemy',
      name: 'Inimigo',
      x: W + 10,
      y: Math.max(10, Math.min(H - 20, y)),
      w: 16, h: 14,
      hp: 2, maxHp: 2,
      speed: 70 + Math.random() * 30,
      damage: 1,
      path, pathT: Math.random() * Math.PI * 2,
      baseY: y,
      fireCD: 1 + Math.random(),
      dead: false,
      score: 100
    };
    rt.entities.push(e);
  }

  function tick(rt, themes, enemyVariants, dt, now) {
    if (rt.paused || rt.gameOver || rt.won) return;
    const p = rt.player;
    const input = rt.input;
    const set = rt.settings;

    // Scroll
    if (set.scrollDir === 'left') rt.scroll += set.scrollSpeed * dt;

    // Player movement free
    p.vx = input.axisX() * p.speed;
    p.vy = input.axisY() * p.speed;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.x = Math.max(4, Math.min(W * 0.55, p.x));
    p.y = Math.max(4, Math.min(H - p.h - 4, p.y));

    // Fire
    p.fireCD = Math.max(0, p.fireCD - dt);
    if (input.pressed('attack') && p.fireCD <= 0) {
      p.fireCD = p.fireRate;
      const mk = (ox, oy, vx, vy) => rt.bullets.push({
        x: p.x + p.w, y: p.y + p.h / 2 + oy, vx: vx || set.bulletSpeed, vy: vy || 0,
        life: 1.2, damage: p.damage, friendly: true
      });
      if (p.shotMode === 'triple') { mk(0, -6, set.bulletSpeed, -40); mk(0, 0); mk(0, 6, set.bulletSpeed, 40); }
      else if (p.shotMode === 'double') { mk(0, -5); mk(0, 5); }
      else mk(0, 0);
    }

    // Bomb
    if (input.pressed('bomb') && p.bombs > 0 && now > (p.bombCD || 0)) {
      p.bombs--;
      p.bombCD = now + 1000;
      rt.entities.forEach(e => {
        if (e.type === 'enemy' && !e.dead && !e.boss) {
          e.hp -= 5;
          if (e.hp <= 0) { e.dead = true; p.score += e.score || 100; }
        }
      });
      rt.enemyBullets.length = 0;
    }

    // Waves
    const wave = rt.waves[rt.waveIndex];
    if (wave && !wave.done) {
      wave.timer -= dt;
      if (wave.timer <= 0 && wave.spawned < wave.count) {
        spawnEnemy(rt, wave);
        wave.spawned++;
        wave.timer = wave.interval;
      }
      if (wave.spawned >= wave.count) {
        const alive = rt.entities.some(e => e.type === 'enemy' && !e.dead);
        if (!alive) {
          wave.done = true;
          if (rt.waveIndex < rt.waves.length - 1) {
            rt.waveIndex++;
            rt.waves[rt.waveIndex].timer = 1.2;
          }
        }
      }
    }

    // Boss from entities marked boss — activate after waves or immediately if present
    // Enemy movement
    for (const e of rt.entities) {
      if (e.type !== 'enemy' || e.dead) continue;
      e.pathT = (e.pathT || 0) + dt;
      if (e.boss) {
        // Boss pattern: horizontal weave + shoot
        e.x = W - 80 + Math.sin(e.pathT * 0.8) * 30;
        e.y = H / 2 + Math.sin(e.pathT * 1.2) * 80;
        e.fireCD = (e.fireCD || 0) - dt;
        if (e.fireCD <= 0) {
          e.fireCD = e.hp < e.maxHp * 0.4 ? 0.35 : 0.7;
          const n = e.hp < e.maxHp * 0.4 ? 5 : 3;
          for (let i = 0; i < n; i++) {
            const a = -0.6 + (1.2 * i) / (n - 1 || 1);
            rt.enemyBullets.push({
              x: e.x, y: e.y + e.h / 2,
              vx: -160, vy: a * 120, life: 3, damage: e.damage || 1
            });
          }
        }
      } else {
        const path = e.path || 'sine';
        e.x -= (e.speed || 70) * dt;
        if (path === 'sine') e.y = e.baseY + Math.sin(e.pathT * 3) * 40;
        else if (path === 'zigzag') e.y = e.baseY + ((Math.floor(e.pathT * 2) % 2) ? 30 : -30);
        else if (path === 'chase') {
          e.y += Math.sign(p.y - e.y) * 40 * dt;
        }
        e.fireCD = (e.fireCD || 0) - dt;
        if (e.fireCD <= 0 && e.x < W - 20) {
          e.fireCD = 2.2;
          rt.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vx: -180, vy: 0, life: 2.5, damage: 1 });
        }
        if (e.x < -30) e.dead = true;
      }
    }

    // Player bullets
    for (let i = rt.bullets.length - 1; i >= 0; i--) {
      const b = rt.bullets[i];
      b.x += b.vx * dt; b.y += (b.vy || 0) * dt; b.life -= dt;
      let hit = false;
      for (const e of rt.entities) {
        if (e.type !== 'enemy' || e.dead) continue;
        if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
          e.hp -= b.damage || 1;
          hit = true;
          if (e.hp <= 0) {
            e.dead = true;
            p.score += e.boss ? 5000 : (e.score || 100);
            if (e.boss) rt.won = true;
            // drop powerup chance
            if (!e.boss && Math.random() < 0.15) {
              rt.entities.push({
                id: 'pu' + Date.now(), type: 'powerup',
                x: e.x, y: e.y, w: 12, h: 12,
                power: ['double', 'triple', 'health', 'shield'][Math.floor(Math.random() * 4)],
                dead: false
              });
            }
          }
          break;
        }
      }
      if (hit || b.life <= 0 || b.x > W + 20) rt.bullets.splice(i, 1);
    }

    // Enemy bullets
    for (let i = rt.enemyBullets.length - 1; i >= 0; i--) {
      const b = rt.enemyBullets[i];
      b.x += b.vx * dt; b.y += (b.vy || 0) * dt; b.life -= dt;
      if (now > p.invUntil && b.x > p.x && b.x < p.x + p.w && b.y > p.y && b.y < p.y + p.h) {
        p.hp -= b.damage || 1;
        p.invUntil = now + 1000;
        rt.enemyBullets.splice(i, 1);
        if (p.hp <= 0) { p.dead = true; rt.gameOver = true; }
        continue;
      }
      if (b.life <= 0 || b.x < -20) rt.enemyBullets.splice(i, 1);
    }

    // Powerups
    for (const e of rt.entities) {
      if (e.type !== 'powerup' || e.dead) continue;
      e.x -= 40 * dt;
      if (global.SNESCollision.aabbOverlap(p, e)) {
        e.dead = true;
        if (e.power === 'double') p.shotMode = 'double';
        else if (e.power === 'triple') p.shotMode = 'triple';
        else if (e.power === 'health') p.hp = Math.min(p.maxHp, p.hp + 1);
        else if (e.power === 'shield') p.invUntil = now + 4000;
        else if (e.power === 'rate') p.fireRate = Math.max(0.08, p.fireRate * 0.75);
      }
      if (e.x < -20) e.dead = true;
    }

    // Collision ship-enemy
    for (const e of rt.entities) {
      if (e.type !== 'enemy' || e.dead) continue;
      if (now > p.invUntil && global.SNESCollision.aabbOverlap(p, e)) {
        p.hp -= e.damage || 1;
        p.invUntil = now + 1000;
        if (!e.boss) e.dead = true;
        if (p.hp <= 0) { p.dead = true; rt.gameOver = true; }
      }
    }

    rt.entities = rt.entities.filter(e => !e.dead || (e.type === 'enemy' && e.boss));
    rt.time += dt;
  }

  function drawTileAt(ctx, tile, x, y, size) {
    if (globalThis.SNESBuiltinTiles?.draw(ctx, tile, x, y, size)) return;
    if (!tile) return;
    ctx.fillStyle = tile.color;
    ctx.fillRect(x, y, size, size);
  }
  function px(c, x, y, w, h, color) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h); }

  function drawFrame(ctx, rt, themes) {
    const scene = rt.scene;
    const L = ensureLayers(scene);
    const theme = themes[scene.themeId] || themes.espaco || themes.floresta;
    const tiles = theme.tiles;
    const T = 16;
    if (!rt.__skipClear) ctx.clearRect(0, 0, W, H);

    // Parallax background via tile layer + scroll
    const ox = Math.floor(rt.scroll) % T;
    for (let y = 0; y < 18; y++)
      for (let x = -1; x < 33; x++) {
        const tx = (x + 32) % 32;
        const id = L.background[y] ? L.background[y][tx] : 0;
        drawTileAt(ctx, tiles[id] || tiles[0], x * T - ox, y * T, T);
      }

    // Stars overlay for space feel
    ctx.fillStyle = '#ffffff33';
    for (let i = 0; i < 30; i++) {
      const sx = ((i * 97 + rt.scroll * (0.5 + (i % 3) * 0.3)) % W);
      const sy = (i * 53) % H;
      ctx.fillRect(sx, sy, 1 + (i % 2), 1);
    }

    // Powerups
    for (const e of rt.entities) {
      if (e.type === 'powerup') {
        px(ctx, e.x, e.y, 12, 12, e.power === 'health' ? '#e74c3c' : '#f7b32b');
      }
    }

    // Enemies
    for (const e of rt.entities) {
      if (e.type !== 'enemy' || e.dead) continue;
      if (e.boss) {
        px(ctx, e.x, e.y, e.w, e.h, '#9b59b6');
        px(ctx, e.x + 4, e.y + 4, e.w - 8, e.h - 8, '#e056fd');
        // boss HP bar
        ctx.fillStyle = '#0008'; ctx.fillRect(W / 2 - 80, 12, 160, 8);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(W / 2 - 80, 12, 160 * Math.max(0, e.hp / e.maxHp), 8);
      } else {
        px(ctx, e.x, e.y, e.w, e.h, '#c84c72');
        px(ctx, e.x + 2, e.y + 3, 4, 3, '#fff');
      }
    }

    // Bullets
    for (const b of rt.bullets) {
      px(ctx, b.x, b.y - 1, 6, 3, '#7bed9f');
    }
    for (const b of rt.enemyBullets) {
      px(ctx, b.x, b.y - 1, 5, 3, '#ff6b81');
    }

    // Player ship
    const p = rt.player;
    const customPlayer = !!(rt.scene && rt.scene.entities && rt.scene.entities.find(e => e.type === 'player' && e.spriteAsset));
    const now = performance.now();
    if (!customPlayer && !(now < p.invUntil && Math.floor(now / 60) % 2 === 0)) {
      px(ctx, p.x, p.y + 2, 14, 8, '#55d6a0');
      px(ctx, p.x + 10, p.y, 8, 12, '#3dc18a');
      px(ctx, p.x + 4, p.y + 4, 4, 4, '#fff');
    }

    // HUD nativo (oculto quando Game Flow fornece UI externa)
    if (!(rt.__externalUi || rt.__cameraPipeline)) {
      ctx.fillStyle = '#0b0b12aa'; ctx.fillRect(6, 6, 200, 28);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
      ctx.fillText('❤' + p.hp + '  💣' + p.bombs + '  ' + p.score + '  ' + (p.shotMode || ''), 12, 24);
    }

    if (rt.gameOver && !(rt.__externalUi || rt.__cameraPipeline)) {
      ctx.fillStyle = '#000000bb'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.font = '20px monospace';
      ctx.fillText('GAME OVER', W / 2 - 55, H / 2);
    }
    if (rt.won && !(rt.__externalUi || rt.__cameraPipeline)) {
      ctx.fillStyle = '#000000bb'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f7b32b'; ctx.font = '20px monospace';
      ctx.fillText('VOCÊ VENCEU!', W / 2 - 70, H / 2);
    }
  }

  function start(rt, target) { rt.input.bind(target || window); }
  function stop(rt) { rt.input.dispose(); }

  global.ShooterRuntime = {
    id: 'shooter',
    label: 'Shooter / Navinha',
    createState, tick, drawFrame, start, stop, ensureLayers,
    mobileButtons: ['left', 'right', 'up', 'down', 'attack', 'bomb', 'pause']
  };
})(typeof window !== 'undefined' ? window : globalThis);
