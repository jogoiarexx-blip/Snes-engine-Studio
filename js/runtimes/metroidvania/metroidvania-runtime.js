/**
 * SNES Engine Studio 0.9 — Runtime METROIDVANIA
 */
(function (global) {
  'use strict';

  const W = 512, H = 288, T = 16, COLS = 32, ROWS = 18;

  function blankMap() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  function demoRooms() {
    // 5 connected rooms
    const rooms = {};
    function groundRow(map, y, solid) {
      for (let x = 0; x < COLS; x++) map[y][x] = solid;
    }
    function platform(map, x, y, w) {
      for (let i = 0; i < w; i++) if (x + i < COLS) map[y][x + i] = 1;
    }
    // Room A - start
    const a = blankMap();
    groundRow(a, 16, 1); groundRow(a, 17, 2);
    platform(a, 8, 12, 6); platform(a, 18, 9, 5);
    rooms.room_a = {
      id: 'room_a', name: 'Entrada', map: a, themeId: 'caverna',
      entities: [
        { type: 'player', x: 48, y: 200, hp: 5 },
        { type: 'enemy', x: 280, y: 200, hp: 2, ai: 'patrol', patrolMin: 200, patrolMax: 360 },
        { type: 'checkpoint', x: 80, y: 232 },
        { type: 'npc', x: 130, y: 216, name: 'Ermitão', dialog: 'Habilidades abrem novos caminhos.|A chave está além do guardião.' },
        { type: 'save_crystal', x: 50, y: 232 },
        { type: 'ability', x: 320, y: 120, ability: 'double_jump', name: 'Pulo Duplo' },
        { type: 'door', x: 480, y: 216, target: 'room_b', dir: 'right' }
      ],
      doors: { right: 'room_b' }
    };
    // Room B
    const b = blankMap();
    groundRow(b, 16, 1); groundRow(b, 17, 2);
    platform(b, 4, 11, 4); platform(b, 14, 8, 8); platform(b, 24, 12, 4);
    for (let y = 0; y < 10; y++) b[y][16] = 1; // wall
    rooms.room_b = {
      id: 'room_b', name: 'Corredor', map: b, themeId: 'caverna',
      entities: [
        { type: 'enemy', x: 200, y: 100, hp: 2, ai: 'patrol', patrolMin: 160, patrolMax: 280 },
        { type: 'enemy', x: 400, y: 200, hp: 3, ai: 'chase', sub: 'heavy' },
        { type: 'breakable', x: 256, y: 120, w: 16, h: 16 },
        { type: 'door', x: 8, y: 216, target: 'room_a', dir: 'left' },
        { type: 'door', x: 480, y: 216, target: 'room_c', dir: 'right', requires: 'key' },
        { type: 'door', x: 240, y: 8, target: 'room_secret', dir: 'up', secret: true }
      ],
      doors: { left: 'room_a', right: 'room_c', up: 'room_secret' }
    };
    // Room C - boss
    const c = blankMap();
    groundRow(c, 16, 1); groundRow(c, 17, 2);
    platform(c, 10, 10, 12);
    rooms.room_c = {
      id: 'room_c', name: 'Arena', map: c, themeId: 'castelo',
      entities: [
        { type: 'boss', x: 300, y: 180, hp: 12, maxHp: 12, name: 'Guardião' },
        { type: 'door', x: 8, y: 216, target: 'room_b', dir: 'left' },
        { type: 'door', x: 480, y: 216, target: 'room_d', dir: 'right' },
        { type: 'ability', x: 400, y: 220, ability: 'dash', name: 'Dash', afterBoss: true }
      ],
      doors: { left: 'room_b', right: 'room_d' }
    };
    // Room D
    const d = blankMap();
    groundRow(d, 16, 1); groundRow(d, 17, 2);
    platform(d, 6, 13, 4); platform(d, 20, 10, 6);
    rooms.room_d = {
      id: 'room_d', name: 'Jardim', map: d, themeId: 'floresta',
      entities: [
        { type: 'enemy', x: 180, y: 200, hp: 2, ai: 'patrol', patrolMin: 100, patrolMax: 250 },
        { type: 'collectible', x: 360, y: 140, item: 'key', name: 'Chave' },
        { type: 'door', x: 8, y: 216, target: 'room_c', dir: 'left' },
        { type: 'checkpoint', x: 100, y: 232 }
      ],
      doors: { left: 'room_c' }
    };
    // Secret
    const s = blankMap();
    groundRow(s, 16, 1); groundRow(s, 17, 2);
    platform(s, 10, 12, 12);
    rooms.room_secret = {
      id: 'room_secret', name: 'Câmara Secreta', map: s, themeId: 'caverna',
      entities: [
        { type: 'collectible', x: 200, y: 160, item: 'heart', name: 'Vida Extra' },
        { type: 'ability', x: 280, y: 160, ability: 'wall_jump', name: 'Wall Jump' },
        { type: 'door', x: 240, y: 250, target: 'room_b', dir: 'down' }
      ],
      doors: { down: 'room_b' },
      secret: true
    };
    return rooms;
  }

  function createState(project) {
    const rooms = (project.metroidvania && project.metroidvania.rooms)
      ? JSON.parse(JSON.stringify(project.metroidvania.rooms))
      : demoRooms();
    const startId = (project.metroidvania && project.metroidvania.startRoom) || 'room_a';
    const room = rooms[startId] || rooms[Object.keys(rooms)[0]];
    const playerEnt = (room.entities || []).find(e => e.type === 'player') || { x: 48, y: 200, hp: 5 };
    const state = {
      gameType: 'metroidvania',
      project: project,
      upgrades: (global.SNESUpgrades ? global.SNESUpgrades.fromJSON((project.upgrades) || { points: 0 }) : { points: 0, unlocked: {} }),
      rooms: rooms,
      roomId: room.id,
      room: JSON.parse(JSON.stringify(room)),
      player: {
        x: playerEnt.x, y: playerEnt.y, w: 14, h: 22,
        vx: 0, vy: 0, speed: 110, jump: 290,
        hp: playerEnt.hp || 5, maxHp: 5,
        facing: 'right', onGround: false, coyote: 0, jumpBuf: 0,
        invUntil: 0, attackUntil: 0, dead: false,
        abilities: { double_jump: false, dash: false, wall_jump: false },
        canDouble: false, dashCd: 0, dashTimer: 0, wallSlide: false, attackAnim: 0,
        keys: 0, inventory: [],
        checkpoint: { roomId: room.id, x: playerEnt.x, y: playerEnt.y }
      },
      entities: JSON.parse(JSON.stringify(room.entities || [])).filter(e => e.type !== 'player')
        .map(e => Object.assign({ vx: 0, vy: 0, dead: false, w: 14, h: 16, facing: 'left' }, e)),
      discovered: { [room.id]: true },
      projectiles: global.SNESCombat ? global.SNESCombat.createProjectilePool(16) : { pool: [], spawn: () => null, update: () => {}, each: () => {} },
      input: global.SNESInput.create(),
      paused: false, gameOver: false, won: false,
      bossDefeated: {},
      camera: { x: 0, y: 0 },
      msg: '', msgUntil: 0,
      time: 0, kills: 0, particles: [], dialog: null
    };
    state.player.baseSpeed = state.player.speed;
    state.player.baseJump = state.player.jump;
    state.player.baseMaxHp = state.player.maxHp;
    if (global.SNESUpgrades) {
      global.SNESUpgrades.applyAll(state.upgrades, state.player);
    }
    if (global.SNESInventory && state.inventory) {
      global.SNESInventory.reapplyEquipment(state.inventory, state.player);
    }
    return state;
  }

  function solidAt(map, tiles, px, py) {
    const gx = Math.floor(px / T), gy = Math.floor(py / T);
    if (gx < 0 || gy < 0 || gx >= COLS || gy >= ROWS) return true;
    const id = map[gy][gx];
    if (!id) return false;
    const tile = tiles[id];
    return tile ? !!tile.solid : id > 0;
  }

  function moveActor(e, map, tiles, dt, gravity) {
    e.vy += gravity * dt;
    // X
    e.x += e.vx * dt;
    if (e.vx > 0 && (solidAt(map, tiles, e.x + e.w, e.y + 2) || solidAt(map, tiles, e.x + e.w, e.y + e.h - 2))) {
      e.x = Math.floor((e.x + e.w) / T) * T - e.w - 0.01; e.vx = 0;
    }
    if (e.vx < 0 && (solidAt(map, tiles, e.x, e.y + 2) || solidAt(map, tiles, e.x, e.y + e.h - 2))) {
      e.x = Math.floor(e.x / T) * T + T; e.vx = 0;
    }
    // Y
    e.y += e.vy * dt;
    e.onGround = false;
    if (e.vy > 0 && (solidAt(map, tiles, e.x + 2, e.y + e.h) || solidAt(map, tiles, e.x + e.w - 2, e.y + e.h))) {
      e.y = Math.floor((e.y + e.h) / T) * T - e.h - 0.01; e.vy = 0; e.onGround = true;
    }
    if (e.vy < 0 && (solidAt(map, tiles, e.x + 2, e.y) || solidAt(map, tiles, e.x + e.w - 2, e.y))) {
      e.y = Math.floor(e.y / T) * T + T; e.vy = 0;
    }
  }

  function switchRoom(rt, targetId, fromDir) {
    const room = rt.rooms[targetId];
    if (!room) return;
    rt.roomId = targetId;
    rt.room = JSON.parse(JSON.stringify(room));
    rt.entities = JSON.parse(JSON.stringify(room.entities || [])).filter(e => e.type !== 'player')
      .map(e => Object.assign({ vx: 0, vy: 0, dead: false, w: 14, h: 16 }, e));
    // Filter abilities already collected / boss gates
    rt.entities = rt.entities.filter(e => {
      if (e.type === 'ability' && rt.player.abilities[e.ability]) return false;
      if (e.afterBoss && !rt.bossDefeated[rt.roomId]) return false;
      return true;
    });
    rt.discovered[targetId] = true;
    const p = rt.player;
    if (fromDir === 'right') { p.x = 24; p.y = Math.min(p.y, 200); }
    else if (fromDir === 'left') { p.x = W - 40; }
    else if (fromDir === 'up') { p.y = H - 50; }
    else if (fromDir === 'down') { p.y = 40; }
    p.vx = 0; p.vy = 0;
  }

  function tick(rt, themes, enemyVariants, dt, now) {
    if (rt.paused || rt.gameOver) return;
    rt.time += dt;
    const Combat = global.SNESCombat;
    const theme = (themes && themes[rt.room.themeId]) || (themes && themes.floresta) || { tiles: [{ solid: false }, { solid: true }, { solid: true }] };
    const tiles = theme.tiles || [{}, { solid: true }, { solid: true }];
    const map = rt.room.map;
    const p = rt.player;
    const input = rt.input;

    if (input.pressed && input.pressed('inventory')) {
      if (global.UpgradesPanel) global.UpgradesPanel.openShop(rt);
      else if (global.SNESStudio && global.SNESStudio.toast) global.SNESStudio.toast('Upgrades: botão ⬆ no editor');
    }
    if (rt.dialog) {
      if (input.pressed('action') || input.pressed('attack') || input.pressed('jump')) {
        rt.dialog.page++;
        if (rt.dialog.page >= rt.dialog.pages.length) rt.dialog = null;
      }
      return;
    }

    if (p.dead) {
      if (input.pressed('jump') || input.pressed('action')) {
        p.dead = false;
        p.hp = p.maxHp;
        p.x = p.checkpoint.x; p.y = p.checkpoint.y;
        if (p.checkpoint.roomId !== rt.roomId) switchRoom(rt, p.checkpoint.roomId, 'right');
        p.invUntil = now + 1500;
      }
      return;
    }

    // Wall slide detect
    const wallL = solidAt(map, tiles, p.x - 2, p.y + 10);
    const wallR = solidAt(map, tiles, p.x + p.w + 2, p.y + 10);
    p.wallSlide = !p.onGround && p.abilities.wall_jump && ((wallL && input.axisX() < 0) || (wallR && input.axisX() > 0));

    const ax = input.axisX();
    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      p.vx = (p.facing === 'left' ? -1 : 1) * 270;
    } else {
      p.vx = ax * p.speed;
      if (ax < 0) p.facing = 'left';
      if (ax > 0) p.facing = 'right';
    }
    if (p.onGround) { p.coyote = 0.12; p.canDouble = p.abilities.double_jump; }
    else p.coyote = Math.max(0, p.coyote - dt);
    if (input.pressed('jump')) p.jumpBuf = 0.14;
    else p.jumpBuf = Math.max(0, p.jumpBuf - dt);
    if (p.jumpBuf > 0 && p.coyote > 0) {
      p.vy = -p.jump; p.onGround = false; p.coyote = 0; p.jumpBuf = 0;
      if (global.SNESAudio) global.SNESAudio.play('player_jump');
    } else if (p.jumpBuf > 0 && p.canDouble && !p.onGround && !p.wallSlide) {
      p.vy = -p.jump * 0.92; p.canDouble = false; p.jumpBuf = 0;
      if (global.SNESAudio) global.SNESAudio.play('player_jump');
    } else if (p.jumpBuf > 0 && p.wallSlide) {
      p.vy = -p.jump * 0.95;
      p.vx = wallL ? 150 : -150;
      p.facing = wallL ? 'right' : 'left';
      p.jumpBuf = 0;
    }
    if (p.wallSlide && p.vy > 45) p.vy = 45;
    // Dash
    p.dashCd = Math.max(0, p.dashCd - dt);
    if (p.abilities.dash && input.pressed('attack2') && p.dashCd <= 0 && p.dashTimer <= 0) {
      p.dashTimer = 0.15;
      p.dashCd = 0.7;
      p.invUntil = now + 160;
      if (global.SNESAudio) global.SNESAudio.play('kart_boost');
    }
    moveActor(p, map, tiles, dt, p.dashTimer > 0 ? 80 : 680);
    if (p.attackAnim > 0) p.attackAnim -= dt;

    // Attack
    if (input.pressed('attack') && now > p.attackUntil) {
      p.attackUntil = now + 220;
      p.attackAnim = 0.18;
      const hb = Combat ? Combat.attackHitbox(p, { range: 24, w: 22, h: 18 }) : null;
      if (hb) {
        rt.entities.forEach(e => {
          if (e.dead || (e.type !== 'enemy' && e.type !== 'boss' && e.type !== 'breakable')) return;
          const hurt = Combat.entityHurtbox(e);
          if (Combat.overlaps(hb, hurt)) {
            if (e.type === 'breakable') { e.dead = true; }
            else {
            const dmg = global.SNESUpgrades ? global.SNESUpgrades.rollDamage(p, 1) : 1;
            Combat.takeDamage(e, dmg, { now: now, knockback: 110, from: p, iFrames: 180 });
            if (e.dead) {
              rt.kills = (rt.kills||0)+1;
              if (global.SNESUpgrades && rt.upgrades) global.SNESUpgrades.onKill(p, rt.upgrades);
              if (global.SNESAudio) global.SNESAudio.play('hit');
            }
          }
          }
        });
      }
    }

    // Entities AI
    rt.entities.forEach(e => {
      if (e.dead) return;
      if (e.type === 'enemy') {
        const dx = p.x - e.x;
        if (e.ai === 'chase' && Math.abs(dx) < 160) {
          e.vx = (dx < 0 ? -1 : 1) * 40;
          e.facing = dx < 0 ? 'left' : 'right';
        } else {
          if (e.x < (e.patrolMin || 0)) e.facing = 'right';
          if (e.x > (e.patrolMax || 400)) e.facing = 'left';
          e.vx = (e.facing === 'left' ? -1 : 1) * 28;
        }
        moveActor(e, map, tiles, dt, 650);
        if (Combat && now > p.invUntil && Combat.overlaps(Combat.entityHurtbox(p), Combat.entityHurtbox(e))) {
          Combat.takeDamage(p, 1, { now: now, knockback: 140, from: e });
        }
      }
      if (e.type === 'boss' && !e.dead) {
        e.phase = e.phase || 0;
        e.timer = (e.timer || 0) + dt;
        if (e.hp < e.maxHp * 0.66) e.phase = 1;
        if (e.hp < e.maxHp * 0.33) e.phase = 2;
        if (e.phase === 0) {
          e.vx = Math.sin(e.timer * 2) * 50;
        } else if (e.phase === 1) {
          e.vx = (p.x < e.x ? -1 : 1) * 70;
          if (e.timer % 2 < 0.05) {
            rt.projectiles.spawn({ x: e.x, y: e.y + 8, vx: (p.x < e.x ? -1 : 1) * 160, vy: 0, damage: 1, faction: 1 });
          }
        } else {
          e.vx = (p.x < e.x ? -1 : 1) * 90;
        }
        moveActor(e, map, tiles, dt, 650);
        if (Combat && now > p.invUntil && Combat.overlaps(Combat.entityHurtbox(p), Combat.entityHurtbox(e))) {
          Combat.takeDamage(p, 1, { now: now, knockback: 160, from: e });
        }
        if (e.dead) {
          rt.bossDefeated[rt.roomId] = true;
          rt.msg = 'Boss derrotado!'; rt.msgUntil = now + 2000;
        }
      }
    });

    // Projectiles
    rt.projectiles.update(dt, function (proj) {
      if (proj.faction === 1 && Combat && now > p.invUntil) {
        if (Combat.overlaps(Combat.entityHurtbox(p), proj)) {
          Combat.takeDamage(p, proj.damage, { now: now, from: proj });
          proj.active = false;
        }
      }
    });

    // Interactables
    rt.entities.forEach(e => {
      if (e.dead) return;
      const near = Math.abs(e.x - p.x) < 20 && Math.abs(e.y - p.y) < 28;
      if (e.type === 'checkpoint' && near) {
        p.checkpoint = { roomId: rt.roomId, x: e.x, y: e.y };
        e._active = true;
      }
      if (e.type === 'save_crystal' && near && input.pressed('action')) {
        p.checkpoint = { roomId: rt.roomId, x: e.x, y: e.y };
        p.hp = p.maxHp;
        rt.msg = 'Salvo · Vida cheia'; rt.msgUntil = now + 2000;
        if (global.SNESAudio) global.SNESAudio.play('coin');
      }
      if (e.type === 'npc' && near && input.pressed('action')) {
        rt.dialog = { name: e.name || 'NPC', pages: (e.dialog || '…').split('|'), page: 0 };
      }
      if (e.type === 'ability' && near) {
        p.abilities[e.ability] = true;
        e.dead = true;
        if (global.SNESUpgrades && rt.upgrades) {
          global.SNESUpgrades.unlock(rt.upgrades, e.ability);
          global.SNESUpgrades.addPoints(rt.upgrades, 25);
          global.SNESUpgrades.applyAll(rt.upgrades, p);
        }
        rt.msg = '★ ' + (e.name || e.ability) + ' (+25pts)'; rt.msgUntil = now + 2500;
        if (global.SNESAudio) global.SNESAudio.play('item_get');
      }
      if (e.type === 'collectible' && near) {
        if (e.item === 'key') p.keys++;
        if (e.item === 'heart') { p.maxHp++; p.hp = p.maxHp; }
        e.dead = true;
        rt.msg = 'Obteve: ' + (e.name || e.item); rt.msgUntil = now + 2000;
        if (global.SNESAudio) global.SNESAudio.play('coin');
      }
      if (e.type === 'door' && near && (input.pressed('action') || input.pressed('up') || input.axisY() < -0.5 || input.axisY() > 0.5)) {
        if (e.requires === 'key' && p.keys <= 0) {
          rt.msg = 'Precisa de chave!'; rt.msgUntil = now + 1500;
        } else {
          if (e.requires === 'key') p.keys--;
          switchRoom(rt, e.target, e.dir === 'right' ? 'left' : e.dir === 'left' ? 'right' : e.dir === 'up' ? 'down' : 'up');
        }
      }
    });

    if (p.hp <= 0) { p.dead = true; }
    // Auto door at edges
    if (p.x > W - 8 && rt.room.doors && rt.room.doors.right) switchRoom(rt, rt.room.doors.right, 'left');
    if (p.x < 4 && rt.room.doors && rt.room.doors.left) switchRoom(rt, rt.room.doors.left, 'right');
  }

  function drawFrame(ctx, rt, themes) {
    const theme = (themes && themes[rt.room.themeId]) || { tiles: [{ color: '#1a1a2e' }, { color: '#4a5568' }, { color: '#2d3748' }], bg: '#0f0f1a' };
    ctx.fillStyle = theme.bg || '#0f0f1a';
    ctx.fillRect(0, 0, W, H);
    const tiles = theme.tiles || [];
    const map = rt.room.map;
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const id = map[y][x];
        if (!id) continue;
        ctx.fillStyle = (tiles[id] && tiles[id].color) || '#4a5568';
        ctx.fillRect(x * T, y * T, T, T);
      }
    // entities
    rt.entities.forEach(e => {
      if (e.dead) return;
      if (e.type === 'enemy') ctx.fillStyle = e.sub === 'heavy' ? '#c0392b' : '#e74c3c';
      else if (e.type === 'boss') ctx.fillStyle = '#8e44ad';
      else if (e.type === 'door') ctx.fillStyle = e.requires ? '#f39c12' : '#3498db';
      else if (e.type === 'checkpoint') ctx.fillStyle = '#2ecc71';
      else if (e.type === 'ability') ctx.fillStyle = '#f1c40f';
      else if (e.type === 'collectible') ctx.fillStyle = '#1abc9c';
      else if (e.type === 'breakable') ctx.fillStyle = '#795548';
      else if (e.type === 'npc') ctx.fillStyle = '#95a5a6';
      else if (e.type === 'save_crystal') ctx.fillStyle = '#74b9ff';
      else ctx.fillStyle = '#888';
      const w = e.type === 'boss' ? 30 : (e.w || 14);
      const h = e.type === 'boss' ? 34 : e.type === 'npc' ? 24 : (e.h || 16);
      if (e.type === 'save_crystal') {
        ctx.beginPath();
        ctx.moveTo(e.x+8, e.y-8); ctx.lineTo(e.x+16, e.y); ctx.lineTo(e.x+8, e.y+8); ctx.lineTo(e.x, e.y); ctx.fill();
      } else {
        ctx.fillRect(e.x, e.y, w, h);
      }
      if (e.type === 'npc') { ctx.fillStyle='#ffd88a'; ctx.fillRect(e.x+2,e.y,10,7); ctx.fillStyle='#fff'; ctx.fillText('!', e.x+4, e.y-2); }
      if (e.type === 'boss') {
        ctx.fillStyle='#0b0b12'; ctx.fillRect(e.x, e.y-8, w, 4);
        ctx.fillStyle='#e74c3c'; ctx.fillRect(e.x, e.y-8, w*(e.hp/e.maxHp), 4);
      }
    });
    // player
    const p = rt.player;
    const customPlayer = !!(rt.scene && rt.scene.entities && rt.scene.entities.find(e => e.type === 'player' && e.spriteAsset));
    if (!customPlayer && !(p.invUntil > performance.now() && Math.floor(performance.now() / 80) % 2 === 0)) {
      ctx.fillStyle = '#0004';
      ctx.beginPath(); ctx.ellipse(p.x + p.w/2, p.y + p.h, 7, 3, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = p.dashTimer > 0 ? '#a78bfa' : '#55d6a0';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#ffd88a';
      ctx.fillRect(p.x + 2, p.y, 10, 7);
      if (p.attackAnim > 0) {
        ctx.fillStyle = '#ffeaa7aa';
        ctx.fillRect(p.facing === 'right' ? p.x + p.w : p.x - 14, p.y + 6, 14, 7);
      }
    }
    // projectiles
    rt.projectiles.each(function (pr) {
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
    });
    // HUD
    ctx.fillStyle = '#0b0b12cc';
    ctx.fillRect(8, 8, 200, 48);
    ctx.fillStyle = '#e74c3c';
    for (let i = 0; i < p.maxHp; i++) {
      ctx.fillStyle = i < p.hp ? '#e74c3c' : '#333';
      ctx.fillRect(16 + i * 14, 16, 12, 10);
    }
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.fillText(rt.room.name || rt.roomId, 16, 42);
    ctx.fillText('Chaves:' + p.keys, 120, 42);
    const abs = [];
    if (p.abilities.double_jump) abs.push('2xPulo');
    if (p.abilities.dash) abs.push('Dash');
    if (p.abilities.wall_jump) abs.push('Wall');
    ctx.fillText('☠'+(rt.kills||0)+'  ★'+(rt.upgrades&&rt.upgrades.points||0), 150, 42);
    ctx.fillText(abs.join(' ') || '—', 16, 56);
    // minimap
    const ids = Object.keys(rt.rooms);
    ids.forEach((id, i) => {
      ctx.fillStyle = rt.discovered[id] ? (id === rt.roomId ? '#f7b32b' : '#555') : '#222';
      ctx.fillRect(W - 12 - ids.length * 14 + i * 14, 12, 12, 10);
    });
    if (input.pressed && input.pressed('inventory')) {
      if (global.UpgradesPanel) global.UpgradesPanel.openShop(rt);
      else if (global.SNESStudio && global.SNESStudio.toast) global.SNESStudio.toast('Upgrades: botão ⬆ no editor');
    }
    if (rt.dialog) {
      ctx.fillStyle = '#0b0b12ee'; ctx.fillRect(40, H-78, W-80, 66);
      ctx.strokeStyle = '#4aa0e0'; ctx.strokeRect(40, H-78, W-80, 66);
      ctx.fillStyle = '#4aa0e0'; ctx.font = '12px monospace';
      ctx.fillText(rt.dialog.name, 52, H-60);
      ctx.fillStyle = '#fff';
      ctx.fillText((rt.dialog.pages[rt.dialog.page]||'').slice(0,55), 52, H-40);
      ctx.fillStyle = '#888'; ctx.fillText('[E] continuar', W-150, H-22);
    }
    if (rt.msg && performance.now() < rt.msgUntil) {
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(rt.msg, W / 2, 80);
      ctx.textAlign = 'left';
    }
    if (p.dead) {
      ctx.fillStyle = '#000a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VOCÊ MORREU', W / 2, H / 2);
      ctx.font = '12px monospace';
      ctx.fillText('Z / Espaço para continuar', W / 2, H / 2 + 24);
      ctx.textAlign = 'left';
    }
  }

  function start(rt, target) { rt.input.bind(target || window); }
  function stop(rt) {
    rt.input.dispose();
    if (rt.project && rt.upgrades && global.SNESUpgrades) {
      rt.project.upgrades = global.SNESUpgrades.toJSON(rt.upgrades);
    }
    if (rt.project && rt.inventory && global.SNESInventory) {
      rt.project.inventory = global.SNESInventory.toJSON(rt.inventory);
    }
  }

  global.MetroidvaniaRuntime = {
    id: 'metroidvania',
    label: 'Metroidvania',
    createState: createState,
    tick: tick,
    drawFrame: drawFrame,
    start: start,
    stop: stop,
    ensureLayers: function (s) { return s.layers || {}; },
    mobileButtons: ['left', 'right', 'up', 'down', 'jump', 'attack', 'attack2', 'action']
  };
  if (global.SNESEngine && global.SNESEngine.register) {
    global.SNESEngine.register(global.MetroidvaniaRuntime);
  }
})(typeof window !== 'undefined' ? window : globalThis);
