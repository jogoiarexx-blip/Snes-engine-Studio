/**
 * SNES Engine Studio V7 — World Map visual + saves + import/export JSON
 */
(function () {
  'use strict';

  function init() {
    const A = window.SNESStudio;
    if (!A) return;
    const top = document.querySelector('.top');
    if (!top || document.getElementById('v6Btn')) return;
    const more = document.createElement('button');
    more.id = 'v6Btn';
    more.textContent = '🧰 V7';
    more.title = 'World Map, saves e projeto';
    top.insertBefore(more, document.getElementById('exportBtn'));

    function ensureWorld() {
      if (!A.project.world) A.project.world = { nodes: {}, start: A.project.currentScene, connections: [] };
      if (!A.project.world.nodes) A.project.world.nodes = {};
      if (!A.project.world.connections) A.project.world.connections = [];
      A.project.scenes.forEach((s, i) => {
        if (!A.project.world.nodes[s.id]) {
          A.project.world.nodes[s.id] = {
            id: s.id,
            x: 40 + (i % 4) * 120,
            y: 40 + Math.floor(i / 4) * 80,
            locked: i > 0,
            icon: (A.THEMES[s.themeId] || {}).emoji || '◆'
          };
        }
        A.project.world.nodes[s.id].name = s.name;
      });
      Object.keys(A.project.world.nodes).forEach(id => {
        if (!A.project.scenes.find(s => s.id === id)) delete A.project.world.nodes[id];
      });
      if (!A.project.world.start) A.project.world.start = A.project.currentScene;
    }

    let dragId = null, dragOff = { x: 0, y: 0 };
    let linkFrom = null;

    function renderWorld(container) {
      ensureWorld();
      const w = A.project.world;
      container.innerHTML = '';
      const canvas = document.createElement('canvas');
      canvas.width = 520;
      canvas.height = 280;
      canvas.className = 'worldCanvas';
      canvas.style.cssText = 'width:100%;max-width:520px;background:#0a0c16;border:1px solid #3b4665;border-radius:10px;cursor:grab';
      container.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      const tools = document.createElement('div');
      tools.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;align-items:center';
      tools.innerHTML =
        '<button id="wmLink">🔗 Conectar</button>' +
        '<button id="wmUnlink">✂ Remover ligação</button>' +
        '<button id="wmStart">⭐ Definir início</button>' +
        '<button id="wmLock">🔒 Trancar/destrancar</button>' +
        '<span class="badge" id="wmHint">Arraste nós · Conectar: clique A depois B</span>';
      container.appendChild(tools);

      let mode = 'drag';
      tools.querySelector('#wmLink').onclick = () => { mode = 'link'; linkFrom = null; tools.querySelector('#wmHint').textContent = 'Clique na fase de origem'; };
      tools.querySelector('#wmUnlink').onclick = () => { mode = 'unlink'; linkFrom = null; tools.querySelector('#wmHint').textContent = 'Clique em dois nós ligados'; };
      tools.querySelector('#wmStart').onclick = () => { mode = 'start'; tools.querySelector('#wmHint').textContent = 'Clique na fase inicial'; };
      tools.querySelector('#wmLock').onclick = () => { mode = 'lock'; tools.querySelector('#wmHint').textContent = 'Clique para trancar/destrancar'; };

      function nodeAt(mx, my) {
        for (const id of Object.keys(w.nodes)) {
          const n = w.nodes[id];
          if (mx >= n.x && mx <= n.x + 100 && my >= n.y && my <= n.y + 48) return id;
        }
        return null;
      }

      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#ffffff08';
        for (let x = 0; x < 520; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 280); ctx.stroke(); }
        for (let y = 0; y < 280; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(520, y); ctx.stroke(); }

        (w.connections || []).forEach(c => {
          const a = w.nodes[c.from], b = w.nodes[c.to];
          if (!a || !b) return;
          ctx.strokeStyle = '#f7b32b88';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(a.x + 50, a.y + 24);
          ctx.lineTo(b.x + 50, b.y + 24);
          ctx.stroke();
          const ang = Math.atan2(b.y - a.y, b.x - a.x);
          const ex = b.x + 50, ey = b.y + 24;
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - 8 * Math.cos(ang - 0.4), ey - 8 * Math.sin(ang - 0.4));
          ctx.lineTo(ex - 8 * Math.cos(ang + 0.4), ey - 8 * Math.sin(ang + 0.4));
          ctx.closePath();
          ctx.fillStyle = '#f7b32b';
          ctx.fill();
        });

        Object.keys(w.nodes).forEach(id => {
          const n = w.nodes[id];
          const active = id === A.project.currentScene;
          const isStart = id === w.start;
          ctx.fillStyle = active ? '#1a2740' : '#151b2b';
          ctx.strokeStyle = n.locked ? '#666' : isStart ? '#62d38b' : active ? '#f7b32b' : '#3b4665';
          ctx.lineWidth = 2;
          ctx.fillRect(n.x, n.y, 100, 48);
          ctx.strokeRect(n.x, n.y, 100, 48);
          ctx.fillStyle = '#fff';
          ctx.font = '12px monospace';
          ctx.fillText((n.icon || '◆') + ' ' + (n.name || id).slice(0, 10), n.x + 8, n.y + 20);
          ctx.fillStyle = '#888';
          ctx.font = '10px monospace';
          ctx.fillText(n.locked ? '🔒 trancada' : isStart ? '★ início' : id.slice(0, 10), n.x + 8, n.y + 36);
        });

        if (linkFrom && w.nodes[linkFrom]) {
          const n = w.nodes[linkFrom];
          ctx.strokeStyle = '#4aa0e0';
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(n.x - 2, n.y - 2, 104, 52);
          ctx.setLineDash([]);
        }
      }

      draw();

      canvas.onpointerdown = e => {
        const r = canvas.getBoundingClientRect();
        const mx = (e.clientX - r.left) * canvas.width / r.width;
        const my = (e.clientY - r.top) * canvas.height / r.height;
        const id = nodeAt(mx, my);

        if (mode === 'link' && id) {
          if (!linkFrom) {
            linkFrom = id;
            tools.querySelector('#wmHint').textContent = 'Agora clique no destino';
          } else if (linkFrom !== id) {
            const exists = (w.connections || []).some(c => c.from === linkFrom && c.to === id);
            if (!exists) {
              w.connections.push({ from: linkFrom, to: id });
              A.toast('Conexão criada');
            }
            linkFrom = null;
            mode = 'drag';
            tools.querySelector('#wmHint').textContent = 'Arraste nós';
          }
          draw();
          return;
        }

        if (mode === 'unlink' && id) {
          if (!linkFrom) linkFrom = id;
          else {
            w.connections = (w.connections || []).filter(c =>
              !((c.from === linkFrom && c.to === id) || (c.from === id && c.to === linkFrom))
            );
            linkFrom = null;
            mode = 'drag';
            A.toast('Ligação removida');
            tools.querySelector('#wmHint').textContent = 'Arraste nós';
          }
          draw();
          return;
        }

        if (mode === 'start' && id) {
          w.start = id;
          mode = 'drag';
          A.toast('Início: ' + (w.nodes[id].name || id));
          tools.querySelector('#wmHint').textContent = 'Arraste nós';
          draw();
          return;
        }

        if (mode === 'lock' && id) {
          w.nodes[id].locked = !w.nodes[id].locked;
          mode = 'drag';
          A.toast(w.nodes[id].locked ? 'Trancada' : 'Destrancada');
          tools.querySelector('#wmHint').textContent = 'Arraste nós';
          draw();
          return;
        }

        if (id && mode === 'drag') {
          dragId = id;
          dragOff = { x: mx - w.nodes[id].x, y: my - w.nodes[id].y };
          canvas.setPointerCapture(e.pointerId);
          canvas._down = { id, x: mx, y: my };
        }
      };

      canvas.onpointermove = e => {
        if (!dragId) return;
        const r = canvas.getBoundingClientRect();
        const mx = (e.clientX - r.left) * canvas.width / r.width;
        const my = (e.clientY - r.top) * canvas.height / r.height;
        const n = w.nodes[dragId];
        n.x = Math.max(0, Math.min(420, mx - dragOff.x));
        n.y = Math.max(0, Math.min(230, my - dragOff.y));
        draw();
      };

      canvas.onpointerup = e => {
        if (dragId && canvas._down) {
          const r = canvas.getBoundingClientRect();
          const mx = (e.clientX - r.left) * canvas.width / r.width;
          const my = (e.clientY - r.top) * canvas.height / r.height;
          if (Math.hypot(mx - canvas._down.x, my - canvas._down.y) < 5) {
            A.project.currentScene = canvas._down.id;
            A.renderAll();
            A.toast('Cena: ' + (w.nodes[canvas._down.id].name || canvas._down.id));
          }
        }
        dragId = null;
        canvas._down = null;
        draw();
      };
    }

    more.onclick = () => {
      const m = document.getElementById('modal');
      const b = document.getElementById('modalBody');
      const $ = id => document.getElementById(id);
      b.innerHTML =
        '<h2>V7 — World Map & Projeto</h2>' +
        '<div class="v6grid">' +
        '<button id="v6world">🗺 World Map</button>' +
        '<button id="v6save1">💾 Save 1</button>' +
        '<button id="v6save2">💾 Save 2</button>' +
        '<button id="v6load1">📂 Load 1</button>' +
        '<button id="v6load2">📂 Load 2</button>' +
        '<button id="v6json">⬇ Projeto JSON</button>' +
        '<button id="v6import">⬆ Importar JSON</button>' +
        '<button id="v6html">🌐 Jogo HTML</button>' +
        '</div>' +
        '<input id="v6file" type="file" accept="application/json" hidden>' +
        '<div id="v6map" class="worldmap"></div>' +
        '<p class="badge">Arraste fases · conecte com 🔗 · defina início · trancar progressão</p>';
      m.classList.remove('hidden');

      const save = n => {
        if (window.SNESSave) SNESSave.saveSlot(n, A.project);
        else if(window.SNESStorage?.legacy)SNESStorage.legacy.set('snes_v7_slot_' + n,JSON.stringify(A.project));else localStorage.setItem('snes_v7_slot_' + n, JSON.stringify(A.project));
        A.toast('Save ' + n + ' gravado');
      };
      const load = n => {
        let data = window.SNESSave ? SNESSave.loadSlot(n) : null;
        if (!data) {
          try { const st=window.SNESStorage?.legacy;const raw=st?(st.get('snes_v7_slot_'+n)||st.get('snes_v6_slot_'+n)):(localStorage.getItem('snes_v7_slot_' + n) || localStorage.getItem('snes_v6_slot_' + n)); data = JSON.parse(raw || 'null'); } catch (_) {}
        }
        if (!data) return A.toast('Slot vazio');
        A.project = A.migrateProject ? A.migrateProject(data) : data;
        A.renderAll();
        A.toast('Save ' + n + ' carregado');
        if (window.SNESStudioUI) window.SNESStudioUI.refreshGameTypeUI();
      };

      $('v6save1').onclick = () => save(1);
      $('v6save2').onclick = () => save(2);
      $('v6load1').onclick = () => load(1);
      $('v6load2').onclick = () => load(2);
      $('v6json').onclick = () => A.downloadFile((A.project.name || 'projeto') + '.json', JSON.stringify(A.project, null, 2), 'application/json');
      $('v6html').onclick = () => {
        const html = A.buildExport();
        A.downloadFile((A.project.name || 'jogo') + '.html', html, 'text/html');
      };
      $('v6import').onclick = () => $('v6file').click();
      $('v6file').onchange = e => {
        const f = e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          try {
            A.project = A.migrateProject ? A.migrateProject(JSON.parse(r.result)) : JSON.parse(r.result);
            A.renderAll();
            A.toast('Projeto importado');
            if (window.SNESStudioUI) window.SNESStudioUI.refreshGameTypeUI();
          } catch (_) { A.toast('JSON inválido'); }
        };
        r.readAsText(f);
      };
      $('v6world').onclick = () => renderWorld($('v6map'));
      renderWorld($('v6map'));
    };
  }

  addEventListener('snesstudio:ready', init);
  if (window.SNESStudio) init();
})();
