/**
 * SNES Engine Studio 0.9 — Runtime BEAT 'EM UP
 */
(function (global) {
  'use strict';

  const W = 512, H = 288;
  const GROUND_Y0 = 160, GROUND_Y1 = 260; // depth range

  function createState(project) {
    const beu = project.beatEmUp || {};
    const state = {
      gameType: 'beat-em-up',
      project: project,
      upgrades: (global.SNESUpgrades ? global.SNESUpgrades.fromJSON(project.upgrades || { points: 50 }) : { points: 50, unlocked: {} }),
      inventory: (global.SNESInventory ? global.SNESInventory.fromJSON(project.inventory || { slots: [{ id: 'potion_small', qty: 1 }] }) : { slots: [], equipped: {} }),
      player: {
        x: 80, y: 200, z: 0, w: 20, h: 32,
        vx: 0, vy: 0, speed: 90,
        hp: 10, maxHp: 10, energy: 0, maxEnergy: 100,
        facing: 'right',
        state: 'idle', // idle walk attack hit down special
        combo: 0, attackTimer: 0, hitstun: 0, downTimer: 0,
        invUntil: 0, dead: false,
        weapon: null
      },
      enemies: [],
      objects: [
        { type: 'crate', x: 220, y: 210, w: 20, h: 18, hp: 2 },
        { type: 'crate', x: 400, y: 195, w: 20, h: 18, hp: 2 }
      ],
      items: [],
      wave: 0,
      waves: beu.waves || [
        [{ type: 'grunt', x: 400, y: 200 }, { type: 'grunt', x: 450, y: 220 }],
        [{ type: 'grunt', x: 420, y: 190 }, { type: 'runner', x: 460, y: 230 }, { type: 'grunt', x: 380, y: 210 }],
        [{ type: 'heavy', x: 440, y: 200 }, { type: 'grunt', x: 400, y: 220 }, { type: 'grunt', x: 470, y: 230 }, { type: 'runner', x: 360, y: 190 }],
        [{ type: 'boss', x: 400, y: 200, hp: 24, maxHp: 24, name: 'Chefão' }]
      ],
      score: 0,
      comboCount: 0,
      comboTimer: 0,
      particles: [],
      arenaLocked: false,
      scrollX: 0,
      maxScroll: 800,
      barrierX: 480,
      input: global.SNESInput.create(),
      attackTokens: global.SNESCombat ? global.SNESCombat.AttackTokenQueue(2) : { request: () => true, release: () => {} },
      comboCtrl: global.SNESCombat ? global.SNESCombat.ComboController([
        { name: 'punch', damage: 1, range: 0.2, range: 28 },
        { name: 'punch2', damage: 1, range: 0.2, range: 28 },
        { name: 'kick', damage: 2, range: 0.35, range: 32 }
      ]) : null,
      paused: false, gameOver: false, won: false,
      msg: '', msgUntil: 0, time: 0,
      result: null
    };
    state.player.baseSpeed = state.player.speed;
    state.player.baseMaxHp = state.player.maxHp;
    if (global.SNESUpgrades) global.SNESUpgrades.applyAll(state.upgrades, state.player);
    if (global.SNESInventory && state.inventory) global.SNESInventory.reapplyEquipment(state.inventory, state.player);
    return state;
  }
  

  function spawnWave(rt) {
    if (rt.wave >= rt.waves.length) {
      rt.won = true;
      rt.result = { time: rt.time, hp: rt.player.hp };
      return;
    }
    const list = rt.waves[rt.wave];
    list.forEach((def, i) => {
      const tp = def.type || 'grunt';
      const speeds = { grunt: 58, runner: 95, heavy: 38, boss: 52 };
      const hps = { grunt: 3, runner: 2, heavy: 7, boss: 24 };
      rt.enemies.push({
        id: 'e' + rt.wave + '_' + i,
        type: tp,
        x: def.x, y: def.y,
        w: tp === 'heavy' || tp === 'boss' ? 28 : 16,
        h: tp === 'boss' ? 42 : tp === 'heavy' ? 34 : 28,
        hp: def.hp || hps[tp] || 3,
        maxHp: def.hp || hps[tp] || 3,
        vx: 0, vy: 0, speed: speeds[tp] || 55,
        facing: 'left', state: 'idle',
        attackTimer: 0, hitstun: 0, downTimer: 0, invUntil: 0, dead: false,
        phase: 0, timer: 0, flash: 0
      });
      rt.msg = 'ONDA ' + (rt.wave + 1); rt.msgUntil = performance.now() + 1200;
    });
    rt.arenaLocked = true;
    rt.wave++;
  }

  function clampDepth(e) {
    e.y = Math.max(GROUND_Y0, Math.min(GROUND_Y1, e.y));
  }

  function tick(rt, themes, enemyVariants, dt, now) {
    const input = rt.input;
    if (input && input.pressed && input.pressed('inventory')) {
      if (global.InventoryPanel) global.InventoryPanel.open(rt);
    }
    if (input && input.pressed && input.pressed('pause')) { rt.paused = !rt.paused; }
    if (rt.paused) return;
    if (rt.gameOver || rt.won) return;
    rt.time += dt;
    const Combat = global.SNESCombat;
    const p = rt.player;
    if (rt.comboTimer > 0) { rt.comboTimer -= dt; if (rt.comboTimer <= 0) rt.comboCount = 0; }
    // particles
    for (let i = (rt.particles||[]).length - 1; i >= 0; i--) {
      const q = rt.particles[i];
      q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
      if (q.life <= 0) rt.particles.splice(i, 1);
    }

    if (p.dead) return;

    // Spawn first wave
    if (rt.wave === 0 && rt.enemies.length === 0) spawnWave(rt);

    // Player control
    if (p.hitstun > 0) { p.hitstun -= dt; p.vx *= 0.9; }
    else if (p.downTimer > 0) {
      p.downTimer -= dt;
      p.state = 'down';
      if (p.downTimer <= 0) p.state = 'idle';
    } else if (p.attackTimer > 0) {
      p.attackTimer -= dt;
    } else {
      const ax = input.axisX();
      const ay = input.axisY();
      p.vx = ax * p.speed;
      p.vy = ay * p.speed * 0.7;
      if (ax < 0) p.facing = 'left';
      if (ax > 0) p.facing = 'right';
      p.state = (Math.abs(ax) > 0.1 || Math.abs(ay) > 0.1) ? 'walk' : 'idle';

      // Attacks
      if (input.pressed('attack')) {
        const move = rt.comboCtrl ? rt.comboCtrl.tryAttack(dt) : { damage: 1, range: 0.25, range: 28 };
        p.attackTimer = move.duration;
        p.state = 'attack';
        p.combo = (p.combo + 1) % 3;
        // Hit enemies
        const range = (move.range || 28) + (p.weaponRange ? 6 : 0);
        rt.enemies.forEach(e => {
          if (e.dead || e.downTimer > 0) return;
          const dx = e.x - p.x, dy = e.y - p.y;
          const facingOk = (p.facing === 'right' && dx > 0) || (p.facing === 'left' && dx < 0);
          if (facingOk && Math.abs(dx) < range && Math.abs(dy) < 18) {
            let dmg = move.damage + (rt.comboCount >= 2 ? 1 : 0) + (p.weaponDamage || 0);
            if (global.SNESUpgrades) dmg = global.SNESUpgrades.rollDamage(p, dmg);
            if (Combat) Combat.takeDamage(e, dmg, { now: now, knockback: 90, from: p, iFrames: 150 });
            else { e.hp -= dmg; if (e.hp <= 0) e.dead = true; }
            e.hitstun = 0.22;
            e.flash = 0.1;
            e.facing = p.facing === 'left' ? 'right' : 'left';
            p.energy = Math.min(p.maxEnergy, p.energy + 10 * (p.energyMult || 1));
            rt.comboCount++;
            rt.comboTimer = 1.2;
            rt.score += 50 * Math.min(rt.comboCount, 5);
            if (!rt.particles) rt.particles = [];
            for (let k = 0; k < 4; k++) rt.particles.push({ x: e.x, y: e.y - 16, vx: (Math.random()-0.5)*80, vy: -40-Math.random()*40, life: 0.25, color: '#ffeaa7' });
            if (global.SNESAudio) global.SNESAudio.play('hit');
            if (e.hp <= 0) {
              e.downTimer = 0.7; e.dead = true; rt.score += 100;
              if (global.SNESUpgrades && rt.upgrades) {
                global.SNESUpgrades.onKill(p, rt.upgrades);
                global.SNESUpgrades.addPoints(rt.upgrades, 8);
              }
              if (global.SNESInventory && rt.inventory) {
                const table = e.type === 'boss' ? 'boss' : e.type === 'heavy' ? 'enemy_heavy' : 'enemy_basic';
                global.SNESInventory.rollDrop(table).forEach(function(d) {
                  global.SNESInventory.add(rt.inventory, d.id, d.qty);
                });
              }
            }
          }
        });
        // Break crates
        rt.objects.forEach(o => {
          if (o.hp <= 0) return;
          if (Math.abs(o.x - p.x) < 30 && Math.abs(o.y - p.y) < 20) {
            o.hp--;
            if (o.hp <= 0) {
              if (global.SNESInventory && rt.inventory) {
                global.SNESInventory.rollDrop('crate').forEach(function(d) {
                  global.SNESInventory.add(rt.inventory, d.id, d.qty);
                });
                rt.msg = 'Loot!'; rt.msgUntil = performance.now() + 800;
              } else if (Math.random() < 0.6) {
                rt.items.push({ type: 'health', x: o.x, y: o.y });
              }
            }
          }
        });
      }
      // Grab / throw (action)
      if (input.pressed('action')) {
        rt.enemies.forEach(e => {
          if (e.dead || e.type === 'boss') return;
          if (Math.abs(e.x - p.x) < 24 && Math.abs(e.y - p.y) < 16) {
            e.vx = (p.facing === 'right' ? 1 : -1) * 200;
            e.hitstun = 0.5;
            e.downTimer = 0.6;
            if (Combat) Combat.takeDamage(e, 2, { now: now, from: p });
            p.energy = Math.min(p.maxEnergy, p.energy + 12);
          }
        });
      }
      // Special
      if (input.pressed('attack2') && p.energy >= 50) {
        p.energy -= 50;
        p.attackTimer = 0.4;
        p.state = 'special';
        rt.enemies.forEach(e => {
          if (e.dead) return;
          if (Math.abs(e.x - p.x) < 80 && Math.abs(e.y - p.y) < 40) {
            if (Combat) Combat.takeDamage(e, 3, { now: now, knockback: 150, from: p });
            e.hitstun = 0.4;
          }
        });
      }
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    clampDepth(p);
    // scroll
    if (!rt.arenaLocked) {
      if (p.x > W * 0.55) {
        const d = p.x - W * 0.55;
        p.x -= d;
        rt.scrollX = Math.min(rt.maxScroll, rt.scrollX + d);
      }
    }
    p.x = Math.max(20, Math.min(((rt.__studio&&rt.__studio.world.w)||W) - 20, p.x));

    // Enemy AI
    rt.enemies.forEach(e => {
      if (e.dead) {
        rt.attackTokens.release(e.id);
        return;
      }
      e.timer = (e.timer || 0) + dt;
      if (e.hitstun > 0) { e.hitstun -= dt; e.x += (e.vx || 0) * dt * 0.3; return; }
      if (e.downTimer > 0) { e.downTimer -= dt; return; }

      const dx = p.x - e.x, dy = p.y - e.y;
      const dist = Math.hypot(dx, dy);
      e.facing = dx < 0 ? 'left' : 'right';

      const canAttack = rt.attackTokens.request(e.id);
      if (canAttack && dist < 30 && Math.abs(dy) < 16) {
        e.attackTimer = 0.3;
        e.state = 'attack';
        if (now > p.invUntil && Combat) {
          Combat.takeDamage(p, e.type === 'boss' ? 2 : 1, { now: now, knockback: 100, from: e, iFrames: 600 });
          if (p.hp <= 0) { p.dead = true; rt.gameOver = true; }
        }
        setTimeout(function () { rt.attackTokens.release(e.id); }, 400);
      } else if (dist > 28) {
        // approach with depth
        e.x += Math.sign(dx) * e.speed * dt * (canAttack ? 1 : 0.5);
        e.y += Math.sign(dy) * e.speed * 0.5 * dt;
        e.state = 'walk';
        if (!canAttack) {
          // circle / wait
          e.y += Math.sin(e.timer * 3) * 10 * dt;
        }
      }
      // Boss phases
      if (e.type === 'boss') {
        if (e.hp < e.maxHp * 0.5) e.speed = 75;
        if (e.hp < e.maxHp * 0.25 && e.timer % 3 < 0.05) {
          // summon-like charge
          e.x += Math.sign(dx) * 40;
        }
      }
      clampDepth(e);
      e.x = Math.max(30, Math.min(((rt.__studio&&rt.__studio.world.w)||W) - 30, e.x));
    });

    // Items
    rt.items.forEach(it => {
      if (Math.abs(it.x - p.x) < 16 && Math.abs(it.y - p.y) < 16) {
        if (it.type === 'health') p.hp = Math.min(p.maxHp, p.hp + 3);
        it.dead = true;
        if (global.SNESAudio) global.SNESAudio.play('coin');
      }
    });
    rt.items = rt.items.filter(i => !i.dead);
    rt.objects = rt.objects.filter(o => o.hp > 0);

    // Wave clear
    if (rt.arenaLocked && rt.enemies.every(e => e.dead)) {
      rt.arenaLocked = false;
      rt.msg = rt.wave >= rt.waves.length ? 'FASE COMPLETA!' : 'Área limpa! [I] upgrades · Avance →';
      rt.msgUntil = now + 2500;
      if (global.SNESUpgrades && rt.upgrades) global.SNESUpgrades.addPoints(rt.upgrades, 20);
      if (rt.wave >= rt.waves.length) {
        rt.won = true;
        rt.result = { time: rt.time, hp: p.hp };
      }
    }
    // Advance trigger
    if (!rt.arenaLocked && !rt.won && p.x > W - 40 && rt.wave < rt.waves.length) {
      p.x = 80;
      spawnWave(rt);
    }
  }

  function drawFrame(ctx, rt) {
    // Background parallax
    ctx.fillStyle = '#1a1520';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2a2035';
    ctx.fillRect(0, 0, W, 140);
    // Buildings silhouette
    ctx.fillStyle = '#151018';
    for (let i = 0; i < 8; i++) {
      const bx = ((i * 90 - rt.scrollX * 0.3) % (W + 90));
      ctx.fillRect(bx, 60 + (i % 3) * 10, 70, 80);
    }
    // Ground
    ctx.fillStyle = '#3d3545';
    ctx.fillRect(0, GROUND_Y0 - 10, W, H - GROUND_Y0 + 10);
    ctx.fillStyle = '#2d2835';
    ctx.fillRect(0, GROUND_Y0 - 10, W, 4);

    // Depth-sort all actors
    const sprites = [];
    rt.objects.forEach(o => sprites.push({ y: o.y, draw: function () {
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(o.x - 10, o.y - 18, 20, 18);
    }}));
    rt.items.forEach(it => sprites.push({ y: it.y, draw: function () {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath(); ctx.arc(it.x, it.y - 6, 6, 0, Math.PI * 2); ctx.fill();
    }}));
    rt.enemies.forEach(e => {
      if (e.dead && e.downTimer <= 0) return;
      sprites.push({ y: e.y, draw: function () {
        // shadow
        ctx.fillStyle = '#0005';
        ctx.beginPath(); ctx.ellipse(e.x, e.y, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
        const col = e.type === 'boss' ? '#8e44ad' : e.type === 'heavy' ? '#c0392b' : e.type === 'runner' ? '#f1c40f' : '#e67e22';
        ctx.fillStyle = (e.flash > 0 || e.hitstun > 0) ? '#fff' : col;
        if (e.flash > 0) e.flash -= 0.016;
        ctx.fillRect(e.x - e.w / 2, e.y - e.h, e.w, e.h);
        if (e.type === 'boss') {
          ctx.fillStyle = '#e74c3c';
          ctx.fillRect(e.x - 20, e.y - e.h - 10, 40 * (e.hp / e.maxHp), 4);
        }
      }});
    });
    const p = rt.player;
    const customPlayer = !!(rt.scene && rt.scene.entities && rt.scene.entities.find(e => e.type === 'player' && e.spriteAsset));
    if (!customPlayer) sprites.push({ y: p.y, draw: function () {
      ctx.fillStyle = '#0005';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = (p.invUntil > performance.now() && Math.floor(performance.now() / 60) % 2) ? '#fff' : '#55d6a0';
      ctx.fillRect(p.x - 10, p.y - 32, 20, 32);
      ctx.fillStyle = '#ffd88a';
      ctx.fillRect(p.x - 6, p.y - 32, 12, 8);
      if (p.state === 'attack') {
        ctx.fillStyle = '#ffeaa7';
        ctx.fillRect(p.facing === 'right' ? p.x + 8 : p.x - 24, p.y - 24, 16, 8);
      }
    }});
    sprites.sort((a, b) => a.y - b.y);
    sprites.forEach(s => s.draw());

    // HUD
    ctx.fillStyle = '#0b0b12cc';
    ctx.fillRect(8, 8, 180, 40);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(16, 16, 140 * (p.hp / p.maxHp), 10);
    ctx.strokeStyle = '#fff3';
    ctx.strokeRect(16, 16, 140, 10);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(16, 30, 140 * (p.energy / p.maxEnergy), 6);
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.fillText('Onda ' + Math.min(rt.wave, rt.waves.length) + '/' + rt.waves.length, W - 100, 24);
    ctx.fillText('PTS ' + (rt.score || 0), W - 100, 40);
    ctx.fillText('★' + (rt.upgrades && rt.upgrades.points || 0), W - 100, 54);
    if (rt.comboCount > 1) {
      ctx.fillStyle = '#f7b32b';
      ctx.font = '16px monospace';
      ctx.fillText(rt.comboCount + 'x COMBO', W / 2 - 40, 50);
    }
    // particles
    (rt.particles || []).forEach(q => {
      ctx.globalAlpha = Math.max(0, q.life * 3);
      ctx.fillStyle = q.color || '#fff';
      ctx.fillRect(q.x, q.y, 3, 3);
      ctx.globalAlpha = 1;
    });
    if (rt.paused) {
      ctx.fillStyle = '#0008';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSA', W / 2, H / 2);
      ctx.textAlign = 'left';
    }

    if (rt.msg && performance.now() < rt.msgUntil) {
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(rt.msg, W / 2, 70);
      ctx.textAlign = 'left';
    }
    if (rt.won) {
      ctx.fillStyle = '#000b';
      ctx.fillRect(W / 2 - 120, 80, 240, 100);
      ctx.fillStyle = '#f7b32b';
      ctx.font = '18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VITÓRIA!', W / 2, 120);
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.fillText('Tempo: ' + rt.time.toFixed(1) + 's  HP: ' + p.hp + '  PTS: ' + (rt.score||0), W / 2, 150);
      ctx.textAlign = 'left';
    }
    if (rt.gameOver) {
      ctx.fillStyle = '#000b';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e74c3c';
      ctx.font = '22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DERROTA', W / 2, H / 2);
      ctx.textAlign = 'left';
    }
  }

  function start(rt, t) { rt.input.bind(t || window); }
  function stop(rt) {
    rt.input.dispose();
    if (rt.project && rt.upgrades && global.SNESUpgrades) {
      rt.project.upgrades = global.SNESUpgrades.toJSON(rt.upgrades);
    }
    if (rt.project && rt.inventory && global.SNESInventory) {
      rt.project.inventory = global.SNESInventory.toJSON(rt.inventory);
    }
  }

  global.BeatEmUpRuntime = {
    id: 'beat-em-up',
    label: "Beat 'em Up",
    createState: createState,
    tick: tick,
    drawFrame: drawFrame,
    start: start,
    stop: stop,
    ensureLayers: function (s) { return s.layers || {}; },
    mobileButtons: ['left', 'right', 'up', 'down', 'attack', 'attack2', 'action']
  };
  if (global.SNESEngine && global.SNESEngine.register) {
    global.SNESEngine.register(global.BeatEmUpRuntime);
  }
})(typeof window !== 'undefined' ? window : globalThis);
