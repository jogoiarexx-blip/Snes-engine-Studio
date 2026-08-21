/**
 * SNES Engine Studio 0.9 — Correções de edição
 * - Seletor de tema/estilo visível e funcional
 * - Colocar entidades/itens clicando no mapa
 * - Pré-visualizações clicáveis (objetos, inimigos, itens)
 * - Subtipos de itens e objetos
 */
(function () {
  'use strict';

  const ITEM_PRESETS = [
    { id: 'coin', name: 'Moeda', item: 'coin' },
    { id: 'heart', name: 'Coração', item: 'heart' },
    { id: 'key', name: 'Chave', item: 'key' },
    { id: 'potion', name: 'Poção', item: 'potion_small' },
    { id: 'gem', name: 'Gema', item: 'gem' },
    { id: 'energy', name: 'Éter', item: 'energy' },
    { id: 'checkpoint', name: 'Checkpoint', type: 'checkpoint' },
    { id: 'door', name: 'Porta', type: 'door' },
    { id: 'ability_dj', name: 'Hab: Pulo Duplo', type: 'ability', ability: 'double_jump' },
    { id: 'ability_dash', name: 'Hab: Dash', type: 'ability', ability: 'dash' }
  ];

  function init() {
    const A = window.SNESStudio;
    if (!A || A._placementFixes) return;
    A._placementFixes = true;

    // Estado de colocação
    A.placeMode = null; // { type, sub, name, item, ability, ... }
    A.placeGhost = null;

    const canvas = document.getElementById('editor');
    if (!canvas) return;

    function worldFromEvent(e) {
      if (A.canvasToWorld) return A.canvasToWorld(e);
      const r = canvas.getBoundingClientRect();
      const scaleX = 512 / Math.max(1, r.width);
      const scaleY = 288 / Math.max(1, r.height);
      const x = Math.round((e.clientX - r.left) * scaleX);
      const y = Math.round((e.clientY - r.top) * scaleY);
      return {
        x: Math.max(0, Math.min(511, x)),
        y: Math.max(0, Math.min(287, y)),
        tx: Math.max(0, Math.min(31, Math.floor(x / 16))),
        ty: Math.max(0, Math.min(17, Math.floor(y / 16)))
      };
    }

    // Snap ao grid de 16px (canto do tile) — entidades centradas no tile
    function snapEntity(x, y, snap) {
      if (snap === false) return { x: x, y: y };
      const tx = Math.max(0, Math.min(31, Math.floor(x / 16)));
      const ty = Math.max(0, Math.min(17, Math.floor(y / 16)));
      // canto superior-esquerdo do tile + pequeno offset visual
      return { x: tx * 16 + 1, y: ty * 16 + 1 };
    }

    function hitEntity(wx, wy) {
      const ents = (A.scene().entities || []);
      // de cima para baixo (última desenhada primeiro)
      for (let i = ents.length - 1; i >= 0; i--) {
        const en = ents[i];
        const ew = en.w || 16, eh = en.h || 16;
        if (wx >= en.x - 2 && wx <= en.x + ew + 2 && wy >= en.y - 2 && wy <= en.y + eh + 2) {
          return en;
        }
      }
      return null;
    }

    // Clique: colocar OU selecionar/arrastar
    canvas.addEventListener('pointerdown', function (e) {
      if (A.playing || A.view !== 'map') return;
      if (e.button !== 0) return;

      const w = worldFromEvent(e);

      // 1) Modo colocação
      if (A.placeMode) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const sn = snapEntity(w.x, w.y, A.placeSnap !== false);
        placeAt(A, sn.x, sn.y);
        return;
      }

      // 2) Selecionar entidade existente e iniciar drag
      const hit = hitEntity(w.x, w.y);
      if (hit) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        A.selectedEntity = hit.id;
        A._entityDrag = {
          id: hit.id,
          ox: w.x - hit.x,
          oy: w.y - hit.y
        };
        A.pushHistory();
        if (A.drawGrid) A.drawGrid();
        return;
      }
    }, true);

    canvas.addEventListener('pointermove', function (e) {
      if (A.playing) return;
      const w = worldFromEvent(e);

      // Fantasma colocação
      if (A.placeMode) {
        const sn = snapEntity(w.x, w.y, A.placeSnap !== false);
        A.placeGhost = { x: sn.x, y: sn.y };
        if (A.drawGrid) A.drawGrid();
        return;
      }

      // Arrastar entidade
      if (A._entityDrag) {
        const s = A.scene();
        const en = (s.entities || []).find(function (x) { return x.id === A._entityDrag.id; });
        if (en) {
          let nx = w.x - A._entityDrag.ox;
          let ny = w.y - A._entityDrag.oy;
          if (A.placeSnap !== false) {
            const sn = snapEntity(nx, ny, true);
            nx = sn.x; ny = sn.y;
          }
          en.x = Math.max(0, Math.min(496, nx));
          en.y = Math.max(0, Math.min(272, ny));
          if (A.drawGrid) A.drawGrid();
        }
      }
    }, true);

    canvas.addEventListener('pointerup', function () {
      if (A._entityDrag) {
        A._entityDrag = null;
        if (A.renderRight) A.renderRight();
      }
    }, true);

    canvas.addEventListener('pointerleave', function () {
      A._entityDrag = null;
    }, true);

    // ESC cancela place mode
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && A.placeMode) {
        A.placeMode = null;
        A.placeGhost = null;
        A.toast('Colocação cancelada');
        if (A.drawGrid) A.drawGrid();
      }
    });

    // Hook drawGrid para fantasma
    const prevDraw = A.drawGrid;
    A.drawGrid = function () {
      prevDraw.call(A);
      if (A.placeMode && A.placeGhost && !A.playing) {
        const ctx = canvas.getContext('2d');
        const g = A.placeGhost;
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = '#f7b32b';
        ctx.lineWidth = 2;
        ctx.strokeRect(g.x - 2, g.y - 2, 18, 18);
        ctx.fillStyle = '#f7b32b88';
        ctx.fillRect(g.x, g.y, 14, 14);
        ctx.fillStyle = '#fff';
        ctx.font = '9px monospace';
        ctx.fillText((A.placeMode.name || A.placeMode.type || '?').slice(0, 10), g.x, g.y - 4);
        ctx.restore();
      }
    };

    // Melhorar renderRight
    const prevRight = A.renderRight;
    // Não podemos substituir renderRight facilmente se for fechado - sobrescrevemos após ready
    enhanceRightPanel(A);

    // Botão de tema rápido na toolbar
    injectThemeToolbar(A);

    A.toast('Editor: clique para colocar · Esc cancela · Temas na barra');
  }

  function placeAt(A, x, y) {
    const mode = A.placeMode;
    if (!mode) return;
    A.pushHistory();
    const s = A.scene();
    if (!s.entities) s.entities = [];

    const id = (mode.type || 'item') + '_' + Date.now();
    let e = {
      id: id,
      type: mode.type || 'item',
      name: mode.name || mode.type || 'Item',
      x: Math.max(0, Math.min(496, x)),
      y: Math.max(0, Math.min(272, y))
    };

    if (mode.type === 'enemy') {
      e.sub = mode.sub;
      e.hp = mode.hp || 2;
      e.speed = mode.speed || 40;
    } else if (mode.type === 'object') {
      e.sub = mode.sub;
    } else if (mode.type === 'item') {
      e.item = mode.item || 'coin';
      e.sub = mode.item || 'coin';
      e.hp = 1;
    } else if (mode.type === 'ability') {
      e.type = 'ability';
      e.ability = mode.ability;
      e.name = mode.name;
    } else if (mode.type === 'door') {
      e.type = 'door';
      e.target = mode.target || '';
      e.dir = mode.dir || 'right';
    } else if (mode.type === 'checkpoint') {
      e.type = 'checkpoint';
    } else if (mode.type === 'npc') {
      e.dialog = mode.dialog || 'Olá!';
    } else if (mode.type === 'player') {
      e.hp = 3;
      e.speed = 120;
      e.jump = 300;
    }

    e.x = e.x | 0;
    e.y = e.y | 0;
    s.entities.push(e);
    A.selectedEntity = id;
    if (A.mark) A.mark();
    A.toast('Colocado: ' + e.name + ' @ ' + e.x + ',' + e.y);

    // Mantém place mode para colocar vários (exceto player)
    if (mode.type === 'player') {
      A.placeMode = null;
      A.placeGhost = null;
    }

    if (A.renderAll) A.renderAll();
    else if (A.drawGrid) A.drawGrid();
  }

  function injectThemeToolbar(A) {
    const bar = document.getElementById('toolbar');
    if (!bar || document.getElementById('themeQuick')) return;
    const sel = document.createElement('select');
    sel.id = 'themeQuick';
    sel.title = 'Estilo / tema da cena';
    sel.style.maxWidth = '140px';
    function refresh() {
      const THEMES = A.THEMES || window.THEMES || {};
      const ids = Object.keys(THEMES);
      const cur = A.scene().themeId || 'floresta';
      sel.innerHTML = ids.map(function (id) {
        const t = THEMES[id];
        return '<option value="' + id + '"' + (id === cur ? ' selected' : '') + '>' +
          (t.emoji || '') + ' ' + (t.name || id) + '</option>';
      }).join('');
    }
    refresh();
    sel.onchange = function () {
      const id = sel.value;
      if (id === A.scene().themeId) return;
      A.pushHistory();
      A.scene().themeId = id;
      A.selectedTile = 1;
      A.renderAll();
      A.toast('Tema: ' + ((A.THEMES[id] || {}).name || id));
    };
    bar.appendChild(sel);
    // Atualiza ao trocar cena
    const prevRender = A.renderAll;
    A.renderAll = function () {
      prevRender.call(A);
      refresh();
      enhanceRightPanel(A);
    };
  }

  function enhanceRightPanel(A) {
    // Após renderRight do core, enriquecer painel
    const p = document.getElementById('rightPanel');
    if (!p) return;

    // Se estamos em map: adicionar seletor de tema + modo de colocação
    if (A.view === 'map') {
      injectMapExtras(A, p);
    }
    if (A.view === 'entities') {
      injectEntityPlaceButtons(A, p);
    }
    if (A.view === 'tilesets') {
      wireTilesetClicks(A, p);
    }
  }

  function injectMapExtras(A, p) {
    if (p.querySelector('#placeBar')) return;
    const THEMES = A.THEMES || {};
    const theme = A.curTheme();

    const box = document.createElement('div');
    box.className = 'card';
    box.id = 'placeBar';
    box.innerHTML =
      '<h3>ESTILO DA CENA</h3>' +
      '<select id="themeSelectMap" style="width:100%;margin-bottom:8px"></select>' +
      '<h3>COLOCAR NO MAPA</h3>' +
      '<p class="badge">Selecione e clique no mapa · Esc cancela</p>' +
      '<div id="placeBtns" style="display:flex;flex-wrap:wrap;gap:4px"></div>' +
      '<div id="placeStatus" class="badge" style="margin-top:6px"></div>';

    // Inserir no topo
    p.insertBefore(box, p.firstChild);

    const sel = box.querySelector('#themeSelectMap');
    Object.keys(THEMES).forEach(function (id) {
      const t = THEMES[id];
      const o = document.createElement('option');
      o.value = id;
      o.textContent = (t.emoji || '') + ' ' + (t.name || id);
      if (id === A.scene().themeId) o.selected = true;
      sel.appendChild(o);
    });
    sel.onchange = function () {
      A.pushHistory();
      A.scene().themeId = sel.value;
      A.selectedTile = 1;
      A.renderAll();
    };

    const btns = box.querySelector('#placeBtns');
    const presets = [
      { label: '🪙 Moeda', mode: { type: 'item', item: 'coin', name: 'Moeda' } },
      { label: '❤ Coração', mode: { type: 'item', item: 'heart', name: 'Coração' } },
      { label: '🔑 Chave', mode: { type: 'item', item: 'key', name: 'Chave' } },
      { label: '👾 Inimigo', mode: null, special: 'enemy' },
      { label: '📦 Objeto', mode: null, special: 'object' },
      { label: '💬 NPC', mode: { type: 'npc', name: 'NPC', dialog: 'Olá!' } },
      { label: '🏁 Check', mode: { type: 'checkpoint', name: 'Checkpoint' } },
      { label: '🚪 Porta', mode: { type: 'door', name: 'Porta', dir: 'right' } },
      { label: '🧍 Player', mode: { type: 'player', name: 'Player' } }
    ];
    presets.forEach(function (pr) {
      const b = document.createElement('button');
      b.textContent = pr.label;
      b.style.fontSize = '11px';
      b.onclick = function () {
        if (pr.special === 'enemy') {
          const list = (window.ENEMY_VARIANTS && window.ENEMY_VARIANTS[A.scene().themeId]) ||
            (A.ENEMY_VARIANTS && A.ENEMY_VARIANTS[A.scene().themeId]) ||
            [{ id: 'slime', name: 'Inimigo' }];
          const v = list[0];
          A.placeMode = { type: 'enemy', sub: v.id, name: v.name, hp: 2, speed: 40 };
        } else if (pr.special === 'object') {
          const objs = (theme.objects || []);
          const o = objs[0] || { id: 'box', name: 'Objeto' };
          A.placeMode = { type: 'object', sub: o.id, name: o.name };
        } else {
          A.placeMode = pr.mode;
        }
        updatePlaceStatus(A);
        A.toast('Clique no mapa para colocar: ' + (A.placeMode.name || ''));
      };
      btns.appendChild(b);
    });
    updatePlaceStatus(A);
  }

  function updatePlaceStatus(A) {
    const el = document.getElementById('placeStatus');
    if (!el) return;
    el.textContent = A.placeMode
      ? 'Modo: ' + (A.placeMode.name || A.placeMode.type) + ' — clique no mapa'
      : 'Nenhum modo de colocação';
  }

  function injectEntityPlaceButtons(A, p) {
    // Substituir botões + para ativar place mode
    ['addPlayer', 'addEnemy', 'addItem', 'addNpc', 'addObject'].forEach(function (id) {
      const btn = document.getElementById(id);
      if (!btn || btn._placeWired) return;
      btn._placeWired = true;
      const type = id.replace('add', '').toLowerCase();
      btn.addEventListener('click', function (e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        const theme = A.curTheme();
        if (type === 'player') {
          A.placeMode = { type: 'player', name: 'Player' };
        } else if (type === 'enemy') {
          const list = (A.ENEMY_VARIANTS || window.ENEMY_VARIANTS || {})[A.scene().themeId] || [{ id: 'e1', name: 'Inimigo' }];
          const v = list[0];
          A.placeMode = { type: 'enemy', sub: v.id, name: v.name, hp: 2, speed: 40 };
        } else if (type === 'item') {
          A.placeMode = { type: 'item', item: 'coin', name: 'Moeda' };
        } else if (type === 'npc') {
          A.placeMode = { type: 'npc', name: 'NPC', dialog: 'Olá, viajante!' };
        } else if (type === 'object') {
          const o = (theme.objects || [])[0] || { id: 'obj', name: 'Objeto' };
          A.placeMode = { type: 'object', sub: o.id, name: o.name };
        }
        // Mudar para view map para colocar
        A.view = 'map';
        document.querySelectorAll('.nav').forEach(function (n) {
          n.classList.toggle('active', n.dataset.view === 'map');
        });
        A.renderAll();
        A.toast('Clique no mapa para posicionar · Esc cancela');
      }, true);
    });

    // Lista de presets de itens
    if (!p.querySelector('#itemPresets')) {
      const card = document.createElement('div');
      card.className = 'card';
      card.id = 'itemPresets';
      card.innerHTML = '<h3>ITENS RÁPIDOS</h3><div id="itemPresetBtns" style="display:flex;flex-wrap:wrap;gap:4px"></div>';
      p.appendChild(card);
      const box = card.querySelector('#itemPresetBtns');
      ITEM_PRESETS.forEach(function (it) {
        const b = document.createElement('button');
        b.textContent = it.name;
        b.style.fontSize = '11px';
        b.onclick = function () {
          A.placeMode = {
            type: it.type || 'item',
            item: it.item,
            ability: it.ability,
            name: it.name,
            sub: it.item
          };
          A.view = 'map';
          document.querySelectorAll('.nav').forEach(function (n) {
            n.classList.toggle('active', n.dataset.view === 'map');
          });
          A.renderAll();
          A.toast('Clique no mapa: ' + it.name);
        };
        box.appendChild(b);
      });
    }
  }

  function wireTilesetClicks(A, p) {
    // Theme buttons already work in core - ensure objects/enemies clickable
    const op = document.getElementById('objPreview');
    if (op && !op._wired) {
      op._wired = true;
      const theme = A.curTheme();
      const children = op.querySelectorAll('.objBtn');
      (theme.objects || []).forEach(function (o, i) {
        const el = children[i];
        if (!el) return;
        el.style.cursor = 'pointer';
        el.title = 'Clique para colocar: ' + o.name;
        el.onclick = function () {
          A.placeMode = { type: 'object', sub: o.id, name: o.name };
          A.view = 'map';
          document.querySelectorAll('.nav').forEach(function (n) {
            n.classList.toggle('active', n.dataset.view === 'map');
          });
          A.renderAll();
          A.toast('Clique no mapa: ' + o.name);
        };
      });
    }
    const ep = document.getElementById('enemyPreview');
    if (ep && !ep._wired) {
      ep._wired = true;
      const list = (A.ENEMY_VARIANTS || window.ENEMY_VARIANTS || {})[A.scene().themeId] || [];
      const children = ep.querySelectorAll('.objBtn');
      list.forEach(function (v, i) {
        const el = children[i];
        if (!el) return;
        el.style.cursor = 'pointer';
        el.onclick = function () {
          A.placeMode = { type: 'enemy', sub: v.id, name: v.name, hp: 2, speed: 40 };
          A.view = 'map';
          document.querySelectorAll('.nav').forEach(function (n) {
            n.classList.toggle('active', n.dataset.view === 'map');
          });
          A.renderAll();
          A.toast('Clique no mapa: ' + v.name);
        };
      });
    }
  }

  // Re-enhance when nav changes
  document.addEventListener('click', function (e) {
    if (e.target && e.target.classList && e.target.classList.contains('nav')) {
      setTimeout(function () {
        if (window.SNESStudio) enhanceRightPanel(window.SNESStudio);
      }, 30);
    }
  });

  addEventListener('snesstudio:ready', init);
  if (window.SNESStudio) init();
})();
