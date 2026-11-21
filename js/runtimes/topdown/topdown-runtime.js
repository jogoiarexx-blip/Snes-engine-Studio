/**
 * SNES Engine Studio V7 — Runtime TOP-DOWN / RPG
 * Sem gravidade. Movimento 4/8 direções, NPCs, diálogos, inventário simples.
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
        collision: null
      };
    }
    if (!scene.layers.decoration) scene.layers.decoration = blankMap();
    scene.map = scene.layers.ground;
    return scene.layers;
  }
  function blankMap() { return Array.from({ length: ROWS }, () => Array(COLS).fill(0)); }
  function clone2d(m) { return (m || blankMap()).map(r => r.slice()); }
  function collisionMap(scene) {
    const L = ensureLayers(scene);
    return L.collision || L.ground;
  }

  function createState(project, sceneId) {
    const scene = project.scenes.find(s => s.id === sceneId) || project.scenes[0];
    ensureLayers(scene);
    const playerEnt = scene.entities.find(e => e.type === 'player') || { x: 64, y: 64, hp: 5, speed: 90 };
    const entities = JSON.parse(JSON.stringify(scene.entities)).map(e => ({
      ...e,
      maxHp: e.maxHp || e.hp || 1,
      vx: 0, vy: 0,
      w: e.w || 14, h: e.h || 16,
      dead: false, facing: e.facing || 'down',
      animStarted: performance.now(),
      patrolDir: 1, patrolT: 0,
      opened: !!e.opened, activated: !!e.activated
    }));

    return {
      gameType: 'topdown',
      project, sceneId: scene.id, scene, entities,
      player: {
        x: playerEnt.x, y: playerEnt.y, vx: 0, vy: 0, w: 12, h: 14,
        hp: playerEnt.hp || 5, maxHp: playerEnt.hp || 5,
        speed: playerEnt.speed || 90,
        facing: 'down', score: 0, keys: 0,
        invUntil: 0, dead: false,
        inventory: [],
        eightWay: project.settings && project.settings.eightWay !== false
      },
      input: global.SNESInput.create(),
      time: 0, dialog: null, dialogPage: 0, paused: false, gameOver: false,
      doorCooldown: 0, showInv: false,
      camera: (global.SNESCamera ? global.SNESCamera.create({
        mode: 'follow', worldW: W, worldH: H, viewW: W, viewH: H, deadZoneX: 20, deadZoneY: 20, lookAhead: 0
      }) : { x: 0, y: 0 }),
      variables: Object.assign({}, project.variables || {}),
      missions: Object.assign({}, project.missions || {})
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
    if (Anim && !p.anim) p.anim = Anim.createAnimator(Anim.DEFS.player);

    if (input.pressed('inventory')) {
      // toggle once per press would need edge detect; simple hold-open
      rt.showInv = true;
    } else {
      rt.showInv = false;
    }

    if (rt.dialog) {
      const d = rt.dialog;
      const pages = d.pages || [d.text];
      const onLast = (rt.dialogPage || 0) >= pages.length - 1;
      const hasChoices = onLast && d.choices && d.choices.length;

      if (hasChoices) {
        if (input.axisY() < -0.5 && now > (d.navAt || 0)) { d.choiceSel = Math.max(0, (d.choiceSel || 0) - 1); d.navAt = now + 180; }
        if (input.axisY() > 0.5 && now > (d.navAt || 0)) { d.choiceSel = Math.min(d.choices.length - 1, (d.choiceSel || 0) + 1); d.navAt = now + 180; }
        if (input.pressed('action') && now > (d.nextAt || 0)) {
          const ch = d.choices[d.choiceSel || 0];
          rt.dialog = null;
          if (ch && ch.action) {
            if (ch.action.startsWith('set:')) {
              const body = ch.action.slice(4);
              const eq = body.split('=');
              rt.variables[eq[0]] = eq[1] !== undefined ? eq[1] : true;
            } else if (ch.action.startsWith('goto:')) {
              switchScene(rt, ch.action.slice(5).trim());
            } else if (ch.action.startsWith('give:')) {
              const item = ch.action.slice(5).trim();
              if (item === 'key') p.keys = (p.keys || 0) + 1;
              p.inventory.push({ id: item, name: item });
            } else if (ch.action === 'close') {
              /* nop */
            }
          }
        }
      } else if (input.pressed('action') && now > (d.nextAt || 0)) {
        rt.dialogPage++;
        if (rt.dialogPage >= pages.length) {
          if (d.choices && d.choices.length) {
            rt.dialogPage = pages.length - 1; // stay for choices
            d.nextAt = now + 200;
          } else rt.dialog = null;
        } else d.nextAt = now + 280;
      }
      rt.time += dt;
      return;
    }

    // Player 4/8-dir
    let ax = input.axisX(), ay = input.axisY();
    if (!p.eightWay) {
      if (Math.abs(ax) > Math.abs(ay)) ay = 0;
      else ax = 0;
    }
    const len = Math.hypot(ax, ay) || 1;
    p.vx = (ax / len) * p.speed;
    p.vy = (ay / len) * p.speed;
    if (ay < -0.3) p.facing = 'up';
    else if (ay > 0.3) p.facing = 'down';
    else if (ax < -0.3) p.facing = 'left';
    else if (ax > 0.3) p.facing = 'right';

    Col.moveAABB(p, map, tiles, dt, { gravity: 0, cols: COLS, rows: ROWS });
    p.x = Math.max(0, Math.min(((rt.__studio&&rt.__studio.world.w)||W) - p.w, p.x));
    p.y = Math.max(0, Math.min(((rt.__studio&&rt.__studio.world.h)||H) - p.h, p.y));

    // Optional attack (short range)
    if (input.pressed('attack') && now > (p.nextAttack || 0)) {
      p.nextAttack = now + 350;
      for (const e of rt.entities) {
        if (e.type !== 'enemy' || e.dead) continue;
        if (Col.aabbOverlap(
          { x: p.x + (p.facing === 'right' ? p.w : p.facing === 'left' ? -10 : 0), y: p.y + (p.facing === 'down' ? p.h : p.facing === 'up' ? -10 : 0), w: 12, h: 12 },
          e
        )) {
          e.hp = (e.hp || 1) - 1;
          if (e.hp <= 0) { e.dead = true; p.score += 100; }
        }
      }
    }

    // NPCs — idle / simple patrol
    for (const e of rt.entities) {
      if (e.type === 'npc' && e.patrol) {
        e.patrolT = (e.patrolT || 0) + dt;
        if (e.patrolT > 2) {
          e.patrolT = 0;
          e.patrolDir = -(e.patrolDir || 1);
        }
        e.vx = (e.patrolDir || 1) * 20;
        e.vy = 0;
        Col.moveAABB(e, map, tiles, dt, { gravity: 0, cols: COLS, rows: ROWS });
      }
      // Enemies top-down: chase slowly
      if (e.type === 'enemy' && !e.dead) {
        const dx = p.x - e.x, dy = p.y - e.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 140 && dist > 12) {
          e.vx = (dx / dist) * (e.speed || 40);
          e.vy = (dy / dist) * (e.speed || 40);
        } else { e.vx = 0; e.vy = 0; }
        Col.moveAABB(e, map, tiles, dt, { gravity: 0, cols: COLS, rows: ROWS });
        if (now > p.invUntil && Col.aabbOverlap(p, e)) {
          p.hp = Math.max(0, p.hp - (e.damage || 1));
          p.invUntil = now + 900;
          if (p.hp <= 0) { p.dead = true; rt.gameOver = true; }
        }
      }
    }

    // Interactables
    rt.doorCooldown = Math.max(0, rt.doorCooldown - dt);
    for (const e of rt.entities) {
      if (e.dead) continue;
      const near = Math.abs(e.x - p.x) < 18 && Math.abs(e.y - p.y) < 18;

      if (e.type==='checkpoint' && e.event==='forkCheckpoint') {
        if(near&&!e.activated) global.SNESPhysicalForks?.checkpoint?.(rt,e);
        continue;
      }
      if (e.type === 'item' && near) {
        if (e.itemKind === 'key') {
          p.keys++;
          p.inventory.push({ id: 'key', name: 'Chave' });
        } else if (e.itemKind === 'health') {
          p.hp = Math.min(p.maxHp, p.hp + 1);
        } else {
          p.score += 50;
          p.inventory.push({ id: e.itemKind || 'item', name: e.name || 'Item' });
        }
        e.dead = true;
      }

      if (e.type === 'chest' && near && !e.opened && input.pressed('action')) {
        e.opened = true;
        if (e.loot === 'key') { p.keys++; p.inventory.push({ id: 'key', name: 'Chave' }); }
        else p.score += 200; rt.variables.chestsOpened=(rt.variables.chestsOpened||0)+1; if(rt.missions) rt.missions.chest=true;
      }

      if(e.type==='door' && (e.event==='forkGate'||e.event==='forkExit')) {
        if(near&&rt.doorCooldown<=0&&input.pressed('action')){
          const ok=e.event==='forkGate'
            ?global.SNESPhysicalForks?.enter?.(rt,e)
            :global.SNESPhysicalForks?.exit?.(rt,e);
          if(ok)rt.doorCooldown=.65;
          else rt.dialog={text:'Caminho bloqueado ou outra rota ativa.',pages:['Caminho bloqueado ou outra rota ativa.'],nextAt:now+300};
        }
        continue;
      }
      if ((e.type === 'door' || e.event === 'nextScene' || e.event === 'teleport') && near && rt.doorCooldown <= 0) {
        if (e.locked && !(p.keys > 0)) {
          if (input.pressed('action')) {
            rt.dialog = { text: 'A porta está trancada.', pages: ['A porta está trancada.'], nextAt: now + 300 };
          }
          continue;
        }
        if (e.event === 'routeComplete' && rt.project.game?.stageRoutes?.sceneIndex?.[rt.sceneId]) {
          if (input.pressed('action')) {
            if (e.locked) p.keys--;
            rt.won = true;
            rt.doorCooldown = 1;
          }
          continue;
        }
        if (e.locked) p.keys--;
        const idx = rt.project.scenes.findIndex(s => s.id === rt.sceneId);
        const next = e.targetScene
          ? rt.project.scenes.find(s => s.id === e.targetScene)
          : rt.project.scenes[idx + 1];
        if (next && (input.pressed('action') || e.event === 'teleport')) {
          rt.doorCooldown = 0.8;
          switchScene(rt, next.id, e.targetX, e.targetY);
        }
      }

      if (e.type === 'npc' && near && input.pressed('action')) {
        // Formato: páginas separadas por | ; escolhas após || como "Rótulo=>set:var=1" ou "Rótulo=>goto:sceneId"
        const raw = e.dialog || '…';
        let pagesPart = raw, choicesPart = '';
        if (raw.includes('||')) {
          const sp = raw.split('||');
          pagesPart = sp[0];
          choicesPart = sp.slice(1).join('||');
        }
        const pages = pagesPart.split('|').map(s => s.trim()).filter(Boolean);
        const choices = [];
        if (choicesPart) {
          choicesPart.split('|').forEach(c => {
            const m = c.trim().match(/^(.+?)=>(.+)$/);
            if (m) choices.push({ label: m[1].trim(), action: m[2].trim() });
          });
        }
        if (e.choices && e.choices.length) {
          e.choices.forEach(c => choices.push(c));
        }
        rt.dialog = {
          text: pages[0], pages, name: e.name || 'NPC',
          choices: choices, choiceSel: 0, nextAt: now + 250
        };
        rt.dialogPage = 0;
      }

      if (e.type === 'event_area' && near && !e.triggered) {
        e.triggered = true;
        if (e.dialog) {
          rt.dialog = { text: e.dialog, pages: [e.dialog], nextAt: now + 300 };
        }
      }
    }

    if (Anim && p.anim) {
      const st = Anim.resolveTopdownState(p, { now: now });
      p.anim.setState(st === 'death' ? 'hurt' : st);
      p.anim.update(dt);
    }
    if (global.SNESCamera && rt.camera) global.SNESCamera.update(rt.camera, p, dt);
    rt.entities = rt.entities.filter(e => !e.dead || e.type === 'enemy');
    rt.time += dt;
  }

  function switchScene(rt, sceneId, spawnX, spawnY) {
    const scene = rt.project.scenes.find(s => s.id === sceneId);
    if (!scene) return;
    ensureLayers(scene);
    rt.sceneId = scene.id; rt.scene = scene;
    rt.entities = JSON.parse(JSON.stringify(scene.entities)).map(e => ({
      ...e, maxHp: e.maxHp || e.hp || 1, vx: 0, vy: 0,
      w: e.w || 14, h: e.h || 16, dead: false,
      facing: e.facing || 'down', animStarted: performance.now(),
      opened: !!e.opened, activated: !!e.activated, patrolDir: 1, patrolT: 0
    }));
    const pl = scene.entities.find(e => e.type === 'player');
    rt.player.x = spawnX != null ? spawnX : (pl ? pl.x : 64);
    rt.player.y = spawnY != null ? spawnY : (pl ? pl.y : 64);
    rt.player.vx = 0; rt.player.vy = 0;
  }

  function drawTileAt(ctx, tile, x, y, size) {
    if (globalThis.SNESBuiltinTiles?.draw(ctx, tile, x, y, size)) return;
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

  function drawFrame(ctx, rt, themes) {
    const scene = rt.scene;
    const L = ensureLayers(scene);
    const theme = themes[scene.themeId] || themes.floresta;
    const tiles = theme.tiles;
    if (!rt.__skipClear) ctx.clearRect(0, 0, W, H);
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        drawTileAt(ctx, tiles[L.background[y][x]] || tiles[0], x * T, y * T, T);
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (L.ground[y][x]) drawTileAt(ctx, tiles[L.ground[y][x]] || tiles[0], x * T, y * T, T);

    for (const e of rt.entities) {
      if (e.type === 'player' || e.dead) continue;
      if (e.type === 'npc') {
        px(ctx, e.x + 3, e.y, 7, 5, '#ffd88a');
        px(ctx, e.x + 2, e.y + 5, 9, 9, '#4aa0e0');
      } else if (e.type === 'enemy') {
        px(ctx, e.x + 2, e.y + 2, 10, 12, '#c84c72');
      } else if (e.type === 'chest') {
        px(ctx, e.x + 1, e.y + 4, 14, 10, e.opened ? '#5d3b28' : '#c9a227');
      } else if (e.type === 'door') {
        px(ctx,e.x+2,e.y,12,18,e.forkId==='secret'?'#9361d5':e.forkId?'#448bba':'#6b4a2f');
        if(e.forkId){ctx.fillStyle='#fff';ctx.font='8px monospace';ctx.fillText(
          ({high:'ALTO',middle:'MEIO',low:'BAIXO',secret:'?'})[e.forkId]||'',e.x-7,e.y-5);}
      } else if(e.type==='checkpoint'&&e.forkId){
        px(ctx,e.x+5,e.y,5,16,e.activated?'#62d38b':'#ffd45e');
        ctx.fillStyle='#fff';ctx.font='8px monospace';
        ctx.fillText(({high:'ALTO',middle:'MEIO',low:'BAIXO',secret:'SECR'})[e.forkId]||'',e.x-6,e.y-5);
      } else if (e.type === 'item') {
        px(ctx, e.x + 3, e.y + 3, 8, 8, '#ffe17a');
      } else if (e.type === 'event_area') {
        ctx.strokeStyle = '#f7b32b55';
        ctx.strokeRect(e.x, e.y, e.w || 32, e.h || 32);
      }
    }

    const p = rt.player;
    const customPlayer = !!(rt.scene && rt.scene.entities && rt.scene.entities.find(e => e.type === 'player' && e.spriteAsset));
    const now = performance.now();
    if (!customPlayer && !(now < p.invUntil && Math.floor(now / 80) % 2 === 0)) {
      if (global.SNESAnim && p.anim) {
        const fr = p.anim.current();
        global.SNESAnim.drawSprite(ctx, global.SNESAnim.playerSheet(), fr, p.x + p.w / 2, p.y + p.h, {
          dw: 16, dh: 16, anchor: 'feet', flip: p.facing === 'left'
        });
      } else {
        px(ctx, p.x + 2, p.y + 2, 10, 12, '#55d6a0');
        px(ctx, p.x + 3, p.y, 8, 5, '#ffd88a');
      }
    }

    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (L.foreground[y][x]) drawTileAt(ctx, tiles[L.foreground[y][x]] || tiles[0], x * T, y * T, T);

    // HUD nativo (oculto quando Game Flow fornece UI externa)
    if (!(rt.__externalUi || rt.__cameraPipeline)) {
      ctx.fillStyle = '#0b0b12aa'; ctx.fillRect(6, 6, 180, 28);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
      ctx.fillText('❤' + p.hp + '  🔑' + (p.keys || 0) + '  ' + p.score, 12, 24);
    }

    if (rt.showInv) {
      ctx.fillStyle = '#0b0b12ee'; ctx.fillRect(W - 160, 40, 150, 120);
      ctx.strokeStyle = '#f7b32b'; ctx.strokeRect(W - 160, 40, 150, 120);
      ctx.fillStyle = '#fff'; ctx.fillText('Inventário', W - 148, 58);
      (p.inventory || []).slice(0, 6).forEach((it, i) => {
        ctx.fillText('· ' + (it.name || it.id), W - 148, 78 + i * 14);
      });
    }

    if (rt.dialog) {
      const d = rt.dialog;
      const pages = d.pages || [d.text];
      const page = pages[Math.min(rt.dialogPage || 0, pages.length - 1)] || '';
      const onLast = (rt.dialogPage || 0) >= pages.length - 1;
      const hasChoices = onLast && d.choices && d.choices.length;
      const boxH = hasChoices ? 70 + d.choices.length * 16 : 58;
      ctx.fillStyle = '#0b0b12ee'; ctx.fillRect(30, H - boxH - 12, W - 60, boxH);
      ctx.strokeStyle = '#4aa0e0'; ctx.strokeRect(30, H - boxH - 12, W - 60, boxH);
      ctx.fillStyle = '#4aa0e0'; ctx.font = '11px monospace';
      ctx.fillText(d.name || '', 42, H - boxH + 6);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
      ctx.fillText(page.slice(0, 52), 42, H - boxH + 28);
      if (hasChoices) {
        d.choices.forEach((ch, i) => {
          const sel = i === (d.choiceSel || 0);
          ctx.fillStyle = sel ? '#f7b32b' : '#aaa';
          ctx.fillText((sel ? '▶ ' : '  ') + ch.label, 48, H - boxH + 48 + i * 16);
        });
      } else {
        ctx.fillStyle = '#888'; ctx.fillText('[E] continuar', W - 130, H - 20);
      }
    }

    if (rt.gameOver && !(rt.__externalUi || rt.__cameraPipeline)) {
      ctx.fillStyle = '#000000bb'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.font = '20px monospace';
      ctx.fillText('GAME OVER', W / 2 - 55, H / 2);
    }
  }

  function start(rt, target) { rt.input.bind(target || window); }
  function stop(rt) { rt.input.dispose(); }

  global.TopdownRuntime = {
    id: 'topdown',
    label: 'Aventura Top-down',
    createState, tick, drawFrame, start, stop, ensureLayers, switchScene,
    mobileButtons: ['left', 'right', 'up', 'down', 'attack', 'action', 'inventory', 'pause']
  };
})(typeof window !== 'undefined' ? window : globalThis);
