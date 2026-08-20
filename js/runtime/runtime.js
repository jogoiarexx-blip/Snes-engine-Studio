/**
 * SNES Engine Studio 0.6 — Runtime unificado
 * Usado tanto no botão Testar quanto no HTML exportado.
 * Scripts globais (sem modules) para funcionar em file://
 */
(function (global) {
  'use strict';

  const T = 16, COLS = 32, ROWS = 18, W = 512, H = 288;

  // ---------- Helpers de mapa / camadas ----------
  function ensureLayers(scene) {
    if (!scene.layers) {
      const map = scene.map || blankMap();
      scene.layers = {
        background: blankMap(),
        ground: clone2d(map),
        foreground: blankMap()
      };
    }
    // Manter scene.map como alias da ground (compat)
    scene.map = scene.layers.ground;
    return scene.layers;
  }

  function blankMap() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  function clone2d(m) {
    return m.map(r => r.slice());
  }

  function getCollisionMap(scene) {
    ensureLayers(scene);
    return scene.layers.ground;
  }

  function isSolidAt(tiles, map, px, py) {
    const gx = Math.floor(px / T), gy = Math.floor(py / T);
    if (gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS) return true;
    const t = tiles[map[gy][gx]] || tiles[0];
    return !!(t && t.solid);
  }

  // ---------- Física / colisão AABB com tiles ----------
  function moveAndCollide(body, map, tiles, dt) {
    // body: {x,y,vx,vy,w,h,onGround}
    const w = body.w || 12, h = body.h || 14;
    body.onGround = false;

    // Horizontal
    let nx = body.x + body.vx * dt;
    if (body.vx > 0) {
      if (isSolidAt(tiles, map, nx + w, body.y + 2) || isSolidAt(tiles, map, nx + w, body.y + h - 2)) {
        nx = Math.floor((nx + w) / T) * T - w - 0.01;
        body.vx = 0;
      }
    } else if (body.vx < 0) {
      if (isSolidAt(tiles, map, nx, body.y + 2) || isSolidAt(tiles, map, nx, body.y + h - 2)) {
        nx = Math.floor(nx / T) * T + T + 0.01;
        body.vx = 0;
      }
    }
    body.x = Math.max(0, Math.min(W - w, nx));

    // Vertical
    let ny = body.y + body.vy * dt;
    if (body.vy >= 0) {
      if (isSolidAt(tiles, map, body.x + 2, ny + h) || isSolidAt(tiles, map, body.x + w - 2, ny + h)) {
        ny = Math.floor((ny + h) / T) * T - h;
        body.vy = 0;
        body.onGround = true;
      }
    } else {
      if (isSolidAt(tiles, map, body.x + 2, ny) || isSolidAt(tiles, map, body.x + w - 2, ny)) {
        ny = Math.floor(ny / T) * T + T;
        body.vy = 0;
      }
    }
    body.y = ny;
    // Queda no void
    if (body.y > H + 40) {
      body.dead = true;
    }
  }

  // ---------- Estado do runtime ----------
  function createRuntimeState(project, sceneId) {
    const scene = project.scenes.find(s => s.id === sceneId) || project.scenes[0];
    ensureLayers(scene);
    const playerEnt = scene.entities.find(e => e.type === 'player') || {
      x: 32, y: 200, hp: 3, speed: 120, jump: 300
    };
    // Snapshot imutável das entidades para não poluir o editor
    const entities = JSON.parse(JSON.stringify(scene.entities)).map(e => ({
      ...e,
      maxHp: e.maxHp || e.hp || 1,
      vx: 0,
      vy: 0,
      w: e.w || (e.sprite === 'skeleton' ? 22 : 14),
      h: e.h || (e.sprite === 'skeleton' ? 46 : 14),
      onGround: false,
      dead: false,
      facing: e.facing || 'right',
      state: 'idle',
      animStarted: performance.now(),
      nextAttack: 0,
      hurtUntil: 0,
      attackUntil: 0,
      invUntil: 0,
      patrolMin: e.patrolMin != null ? e.patrolMin : e.x - 48,
      patrolMax: e.patrolMax != null ? e.patrolMax : e.x + 48,
      patrolDir: e.facing === 'left' ? -1 : 1,
      opened: !!e.opened,
      activated: !!e.activated
    }));

    return {
      project,
      sceneId: scene.id,
      scene,
      entities,
      player: {
        x: playerEnt.x,
        y: playerEnt.y,
        vx: 0,
        vy: 0,
        w: 12,
        h: 14,
        hp: playerEnt.hp || 3,
        maxHp: playerEnt.hp || 3,
        speed: playerEnt.speed || 120,
        jump: playerEnt.jump || 300,
        onGround: false,
        facing: 'right',
        score: 0,
        invUntil: 0,
        coyote: 0,
        jumpBuf: 0,
        attackUntil: 0,
        dead: false,
        checkpoint: { x: playerEnt.x, y: playerEnt.y, sceneId: scene.id }
      },
      shots: [],
      keys: Object.create(null),
      touch: { left: false, right: false, jump: false, attack: false, action: false },
      time: 0,
      dialog: null,
      paused: false,
      gameOver: false,
      won: false,
      camera: { x: 0, y: 0 },
      doorCooldown: 0
    };
  }

  // ---------- Input ----------
  function bindInput(rt, target) {
    const down = e => {
      const k = e.key.toLowerCase();
      rt.keys[k] = true;
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'z', 'x', 'c'].includes(k)) e.preventDefault();
    };
    const up = e => { rt.keys[e.key.toLowerCase()] = false; };
    target.addEventListener('keydown', down);
    target.addEventListener('keyup', up);
    return () => {
      target.removeEventListener('keydown', down);
      target.removeEventListener('keyup', up);
    };
  }

  function axisX(rt) {
    let v = 0;
    if (rt.keys.arrowleft || rt.keys.a || rt.touch.left) v -= 1;
    if (rt.keys.arrowright || rt.keys.d || rt.touch.right) v += 1;
    return v;
  }

  function wantJump(rt) {
    return !!(rt.keys.z || rt.keys[' '] || rt.touch.jump);
  }

  function wantAttack(rt) {
    return !!(rt.keys.x || rt.keys.c || rt.touch.attack);
  }

  function wantAction(rt) {
    return !!(rt.keys.e || rt.keys.enter || rt.touch.action);
  }

  // ---------- Player update ----------
  function updatePlayer(rt, map, tiles, dt) {
    const p = rt.player;
    if (p.dead) return;

    const ax = axisX(rt);
    p.vx = ax * p.speed;
    if (ax < 0) p.facing = 'left';
    if (ax > 0) p.facing = 'right';

    if (p.onGround) p.coyote = 0.1;
    else p.coyote = Math.max(0, p.coyote - dt);

    if (wantJump(rt)) p.jumpBuf = 0.12;
    else p.jumpBuf = Math.max(0, p.jumpBuf - dt);

    if (p.jumpBuf > 0 && p.coyote > 0) {
      p.vy = -p.jump;
      p.onGround = false;
      p.coyote = 0;
      p.jumpBuf = 0;
    }

    p.vy += 650 * dt;
    if (p.vy > 520) p.vy = 520;

    moveAndCollide(p, map, tiles, dt);

    // Ataque corpo a corpo / projétil
    if (wantAttack(rt) && performance.now() > (p.nextShot || 0)) {
      p.nextShot = performance.now() + 220;
      const dir = p.facing === 'left' ? -1 : 1;
      rt.shots.push({
        x: p.x + (dir > 0 ? p.w : -6),
        y: p.y + 6,
        vx: 280 * dir,
        life: 0.55,
        damage: 1
      });
      p.attackUntil = performance.now() + 180;
    }

    // Queda / morte
    if (p.y > H + 20 || p.hp <= 0) {
      p.hp = 0;
      // Respawn no checkpoint
      const cp = p.checkpoint;
      if (cp && cp.sceneId === rt.sceneId) {
        p.x = cp.x;
        p.y = cp.y;
        p.vx = 0;
        p.vy = 0;
        p.hp = p.maxHp;
        p.invUntil = performance.now() + 1500;
      } else {
        p.dead = true;
        rt.gameOver = true;
      }
    }
  }

  // ---------- Inimigos ----------
  function solidAhead(map, tiles, e, dir) {
    const footX = e.x + (dir > 0 ? e.w + 2 : -2);
    const footY = e.y + e.h + 2;
    const midY = e.y + e.h * 0.5;
    const wall = isSolidAt(tiles, map, footX, midY);
    const edge = !isSolidAt(tiles, map, footX, footY);
    return { wall, edge };
  }

  function updateEnemies(rt, map, tiles, dt, now) {
    const p = rt.player;
    for (const e of rt.entities) {
      if (e.type !== 'enemy' || e.dead) continue;

      if (e.hurtUntil > now) {
        e.vx *= 0.9;
        e.vy += 650 * dt;
        moveAndCollide(e, map, tiles, dt);
        continue;
      }

      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.hypot(dx, dy);
      const vision = e.vision || 160;
      const attackRange = e.attackRange || 28;

      // Gravidade
      e.vy += 650 * dt;
      if (e.vy > 480) e.vy = 480;

      let ai = 'patrol';
      if (dist < attackRange && Math.abs(dy) < 24) ai = 'attack';
      else if (dist < vision) ai = 'chase';

      if (ai === 'attack') {
        e.vx = 0;
        e.facing = dx < 0 ? 'left' : 'right';
        if (now > (e.nextAttack || 0) && now > p.invUntil) {
          e.attackUntil = now + 420;
          e.animStarted = now;
          e.nextAttack = now + (e.boss ? 900 : 1100);
          p.hp = Math.max(0, p.hp - (e.damage || 1));
          p.invUntil = now + 800;
          p.vx += (dx < 0 ? -1 : 1) * 80;
          if (p.hp <= 0) {
            // handled in player
          }
        }
      } else if (ai === 'chase') {
        e.facing = dx < 0 ? 'left' : 'right';
        const dir = dx < 0 ? -1 : 1;
        const spd = (e.speed || 35) * (e.boss ? 1.15 : 1);
        const { wall, edge } = solidAhead(map, tiles, e, dir);
        if (wall || edge) e.vx = 0;
        else e.vx = dir * spd;
      } else {
        // Patrulha
        const dir = e.patrolDir || 1;
        const { wall, edge } = solidAhead(map, tiles, e, dir);
        if (wall || edge || e.x <= e.patrolMin || e.x >= e.patrolMax) {
          e.patrolDir = -dir;
        }
        e.vx = (e.patrolDir || 1) * (e.speed || 28) * 0.7;
        e.facing = e.vx < 0 ? 'left' : 'right';
      }

      moveAndCollide(e, map, tiles, dt);

      // Contato físico player-inimigo
      if (!e.dead && now > p.invUntil) {
        if (Math.abs(p.x - e.x) < (e.w + p.w) * 0.45 && Math.abs(p.y - e.y) < (e.h + p.h) * 0.45) {
          p.hp = Math.max(0, p.hp - (e.damage || 1));
          p.invUntil = now + 900;
          p.vx += (p.x < e.x ? -1 : 1) * 120;
          p.vy = -120;
        }
      }
    }
  }

  // ---------- Projéteis ----------
  function updateShots(rt, dt, now) {
    for (let i = rt.shots.length - 1; i >= 0; i--) {
      const s = rt.shots[i];
      s.x += s.vx * dt;
      s.life -= dt;
      let hit = false;
      for (const e of rt.entities) {
        if (e.type !== 'enemy' || e.dead) continue;
        if (Math.abs(e.x + e.w / 2 - s.x) < e.w * 0.6 && Math.abs(e.y + e.h / 2 - s.y) < e.h * 0.6) {
          e.hp = (e.hp || 1) - (s.damage || 1);
          e.hurtUntil = now + 280;
          e.animStarted = now;
          e.vx += Math.sign(s.vx) * 40;
          hit = true;
          if (e.hp <= 0) {
            e.dead = true;
            e.vx = 0;
            e.animStarted = now;
            rt.player.score += e.boss ? 1000 : e.sprite === 'skeleton' ? 300 : 100;
            // Evento ao derrotar
            if (e.event === 'onDefeat') {
              // placeholder
            }
          }
          break;
        }
      }
      if (hit || s.life <= 0 || s.x < -20 || s.x > W + 20) rt.shots.splice(i, 1);
    }
    // Remover cadáveres após animação
    rt.entities = rt.entities.filter(e => {
      if (e.type === 'enemy' && e.dead) {
        const elapsed = now - (e.animStarted || now);
        return elapsed < 1100;
      }
      return true;
    });
  }

  // ---------- Itens, portas, baús, checkpoints, NPCs ----------
  function updateInteractables(rt, dt, now) {
    const p = rt.player;
    rt.doorCooldown = Math.max(0, rt.doorCooldown - dt);

    for (const e of rt.entities) {
      if (e.dead) continue;
      const near = Math.abs(e.x - p.x) < 16 && Math.abs(e.y - p.y) < 18;

      if (e.type === 'item' && near) {
        if (e.itemKind === 'health' || e.name === 'Coração') {
          p.hp = Math.min(p.maxHp, p.hp + 1);
        } else if (e.itemKind === 'key') {
          p.keys = (p.keys || 0) + 1;
        } else {
          p.score += 100;
        }
        e.dead = true;
        continue;
      }

      // Checkpoint
      if ((e.type === 'checkpoint' || e.sub === 'checkpoint') && near && !e.activated) {
        e.activated = true;
        p.checkpoint = { x: e.x, y: e.y, sceneId: rt.sceneId };
      }

      // Baú
      if ((e.type === 'chest' || e.sub === 'bau' || /bau/i.test(e.name || '')) && near && !e.opened && wantAction(rt)) {
        e.opened = true;
        if (e.itemKind === 'health') p.hp = Math.min(p.maxHp, p.hp + 1);
        else if (e.loot === 'key') p.keys = (p.keys || 0) + 1;
        else p.score += 250;
      }

      // Porta
      if ((e.type === 'door' || e.event === 'nextScene' || e.event === 'door') && near && rt.doorCooldown <= 0) {
        if (e.locked && !(p.keys > 0)) continue;
        if (e.locked) p.keys--;
        const destId = e.targetScene || null;
        let next = null;
        if (destId) next = rt.project.scenes.find(s => s.id === destId);
        else {
          const idx = rt.project.scenes.findIndex(s => s.id === rt.sceneId);
          next = rt.project.scenes[idx + 1] || null;
        }
        if (next) {
          rt.doorCooldown = 1.0;
          switchScene(rt, next.id, e.targetX, e.targetY);
        }
      }

      // NPC diálogo
      if (e.type === 'npc' && near && wantAction(rt) && !rt.dialog) {
        rt.dialog = { text: e.dialog || '…', until: now + 2500 };
      }
    }

    if (rt.dialog && now > rt.dialog.until) rt.dialog = null;
  }

  function switchScene(rt, sceneId, spawnX, spawnY) {
    const scene = rt.project.scenes.find(s => s.id === sceneId);
    if (!scene) return;
    ensureLayers(scene);
    rt.sceneId = scene.id;
    rt.scene = scene;
    rt.entities = JSON.parse(JSON.stringify(scene.entities)).map(e => ({
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
      opened: !!e.opened,
      activated: !!e.activated
    }));
    const pl = scene.entities.find(e => e.type === 'player');
    rt.player.x = spawnX != null ? spawnX : (pl ? pl.x : 32);
    rt.player.y = spawnY != null ? spawnY : (pl ? pl.y : 200);
    rt.player.vx = 0;
    rt.player.vy = 0;
    rt.player.checkpoint = { x: rt.player.x, y: rt.player.y, sceneId: scene.id };
    rt.shots = [];
  }

  // ---------- Desenho ----------
  function drawTileAt(ctx, tile, x, y, size) {
    if (!tile) return;
    const s = size / 16;
    ctx.fillStyle = tile.color;
    ctx.fillRect(x, y, size, size);
    (tile.decos || []).forEach(d => {
      if (d.outline) {
        ctx.strokeStyle = d.outline;
        ctx.lineWidth = Math.max(1, s);
        ctx.strokeRect(x + d.x * s + s / 2, y + d.y * s + s / 2, Math.max(0, d.w * s - s), Math.max(0, d.h * s - s));
      } else {
        ctx.fillStyle = d.color;
        ctx.fillRect(x + d.x * s, y + d.y * s, d.w * s, d.h * s);
      }
    });
  }

  function px(c, x, y, w, h, color) {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function drawEnemyFallback(c, e, variants, themeId) {
    const list = variants[themeId] || variants.floresta || [];
    const v = list.find(q => q.id === e.sub) || list[0] || { color: '#c84c72', accent: '#fff', style: 'beast' };
    const x = e.x, y = e.y, b = v.color, a = v.accent;
    if (v.style === 'slime') {
      px(c, x + 2, y + 5, 10, 7, b); px(c, x + 4, y + 3, 6, 3, b);
    } else if (v.style === 'flying') {
      px(c, x + 4, y + 4, 6, 7, b); px(c, x, y + 2, 5, 3, b); px(c, x + 9, y + 2, 5, 3, b);
    } else if (v.style === 'crawler') {
      px(c, x + 3, y + 5, 8, 6, b); px(c, x, y + 4, 4, 2, a); px(c, x + 10, y + 4, 4, 2, a);
    } else if (v.style === 'humanoid') {
      px(c, x + 3, y, 8, 5, b); px(c, x + 2, y + 5, 10, 6, b); px(c, x + 3, y + 11, 3, 3, b); px(c, x + 8, y + 11, 3, 3, b);
    } else {
      px(c, x + 2, y + 4, 10, 7, b); px(c, x + 9, y + 1, 4, 5, b);
    }
    px(c, x + 5, y + 5, 2, 2, '#fff');
    px(c, x + 9, y + 5, 2, 2, '#18131e');
  }

  function drawEntity(ctx, e, theme, enemyVariants, skeletonDraw) {
    if (e.dead && e.type !== 'enemy') return;
    if (e.type === 'enemy' && e.sprite === 'skeleton' && skeletonDraw) {
      skeletonDraw(ctx, e);
      // HP bar
      if (e.hp < e.maxHp && !e.dead) {
        ctx.fillStyle = '#0008';
        ctx.fillRect(e.x - 4, e.y - 54, 28, 4);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(e.x - 4, e.y - 54, 28 * Math.max(0, e.hp / e.maxHp), 4);
      }
      return;
    }
    if (e.type === 'enemy') {
      drawEnemyFallback(ctx, e, enemyVariants, theme && theme._id);
      if (e.hp < e.maxHp && !e.dead) {
        ctx.fillStyle = '#0008';
        ctx.fillRect(e.x, e.y - 6, 14, 3);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(e.x, e.y - 6, 14 * Math.max(0, e.hp / e.maxHp), 3);
      }
    } else if (e.type === 'item') {
      px(ctx, e.x + 4, e.y + 1, 5, 12, '#f7b32b');
      px(ctx, e.x + 2, e.y + 4, 9, 6, '#ffe17a');
      px(ctx, e.x + 5, e.y + 4, 3, 6, '#c88418');
    } else if (e.type === 'npc') {
      px(ctx, e.x + 3, e.y, 7, 5, '#ffd88a');
      px(ctx, e.x + 2, e.y + 5, 9, 8, '#4aa0e0');
    } else if (e.type === 'checkpoint') {
      px(ctx, e.x + 6, e.y, 3, 16, e.activated ? '#62d38b' : '#888');
      px(ctx, e.x + 9, e.y, 8, 6, e.activated ? '#62d38b' : '#aaa');
    } else if (e.type === 'chest' || e.type === 'door' || e.type === 'object') {
      const o = (theme.objects || []).find(q => q.id === e.sub) || (theme.objects || [])[0];
      const col = o ? o.color : '#8a5a2f';
      if (e.type === 'door' || e.event === 'nextScene') {
        px(ctx, e.x + 2, e.y, 12, 18, '#5b3a22');
        px(ctx, e.x + 4, e.y + 2, 8, 14, '#3d2716');
        px(ctx, e.x + 10, e.y + 8, 2, 2, '#f7b32b');
      } else if (e.type === 'chest' || /bau/i.test(e.name || '') || e.sub === 'bau') {
        px(ctx, e.x + 1, e.y + 4, 14, 10, e.opened ? '#5d3b28' : col);
        px(ctx, e.x + 1, e.y + 4, 14, 3, '#d0a45e');
      } else if (o) {
        px(ctx, e.x + 2, e.y + 2, 11, 12, col);
      }
    }
  }

  function drawPlayer(ctx, p, now) {
    if (now < p.invUntil && Math.floor(now / 80) % 2 === 0) return; // flash
    px(ctx, p.x + 3, p.y, 7, 5, '#ffd88a');
    px(ctx, p.x + 2, p.y + 5, 9, 7, '#55d6a0');
    px(ctx, p.x + 2, p.y + 12, 3, 2, '#31435c');
    px(ctx, p.x + 8, p.y + 12, 3, 2, '#31435c');
    if (p.facing === 'left') {
      px(ctx, p.x + 4, p.y + 2, 1, 1, '#222');
      px(ctx, p.x + 7, p.y + 2, 1, 1, '#222');
    } else {
      px(ctx, p.x + 5, p.y + 2, 1, 1, '#222');
      px(ctx, p.x + 8, p.y + 2, 1, 1, '#222');
    }
  }

  function drawHUD(ctx, rt) {
    const p = rt.player;
    ctx.fillStyle = '#0b0b12aa';
    ctx.fillRect(6, 6, 170, 28);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    const hearts = '❤'.repeat(Math.max(0, Math.min(9, p.hp))) + '♡'.repeat(Math.max(0, Math.min(9, p.maxHp - p.hp)));
    ctx.fillText(hearts + '  ' + p.score, 12, 24);
    if (p.keys) {
      ctx.fillText('🔑' + p.keys, 140, 24);
    }
    if (rt.dialog) {
      ctx.fillStyle = '#0b0b12ee';
      ctx.fillRect(40, H - 60, W - 80, 48);
      ctx.strokeStyle = '#f7b32b';
      ctx.strokeRect(40, H - 60, W - 80, 48);
      ctx.fillStyle = '#fff';
      ctx.fillText(rt.dialog.text.slice(0, 48), 52, H - 32);
    }
    if (rt.gameOver) {
      ctx.fillStyle = '#000000bb';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '20px monospace';
      ctx.fillText('GAME OVER', W / 2 - 55, H / 2);
    }
  }

  function drawFrame(ctx, rt, themes, enemyVariants, skeletonDraw) {
    const scene = rt.scene;
    const layers = ensureLayers(scene);
    const theme = themes[scene.themeId] || themes.floresta;
    theme._id = scene.themeId;
    const tiles = theme.tiles;

    ctx.clearRect(0, 0, W, H);

    // 1 Background
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        drawTileAt(ctx, tiles[layers.background[y][x]] || tiles[0], x * T, y * T, T);

    // 2 Ground
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const id = layers.ground[y][x];
        if (id) drawTileAt(ctx, tiles[id] || tiles[0], x * T, y * T, T);
      }

    // 3 Entidades (exceto player)
    const sorted = rt.entities.slice().sort((a, b) => (a.y + (a.h || 0)) - (b.y + (b.h || 0)));
    for (const e of sorted) {
      if (e.type === 'player') continue;
      drawEntity(ctx, e, theme, enemyVariants, skeletonDraw);
    }

    // 4 Player
    drawPlayer(ctx, rt.player, performance.now());

    // 5 Shots
    for (const s of rt.shots) {
      ctx.fillStyle = '#ffe36a';
      ctx.fillRect(s.x, s.y, 7, 3);
      ctx.fillStyle = '#fff';
      ctx.fillRect(s.x + 5, s.y, 2, 3);
    }

    // 6 Foreground
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const id = layers.foreground[y][x];
        if (id) drawTileAt(ctx, tiles[id] || tiles[0], x * T, y * T, T);
      }

    // 7 HUD
    drawHUD(ctx, rt);
  }

  // ---------- Loop principal ----------
  function tick(rt, themes, enemyVariants, dt, now) {
    if (rt.paused || rt.gameOver) return;
    const scene = rt.scene;
    const layers = ensureLayers(scene);
    const theme = themes[scene.themeId] || themes.floresta;
    const map = layers.ground;
    const tiles = theme.tiles;

    updatePlayer(rt, map, tiles, dt);
    updateEnemies(rt, map, tiles, dt, now);
    updateShots(rt, dt, now);
    updateInteractables(rt, dt, now);
    rt.time += dt;
  }

  // ---------- API pública ----------
  global.SNESRuntime = {
    T, COLS, ROWS, W, H,
    blankMap,
    ensureLayers,
    createRuntimeState,
    bindInput,
    tick,
    drawFrame,
    drawTileAt,
    switchScene,
    isSolidAt,
    moveAndCollide
  };
})(typeof window !== 'undefined' ? window : globalThis);
