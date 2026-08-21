/**
 * SNES Engine Studio 0.8 — Editor visual de pistas (Kart)
 */
(function () {
  'use strict';

  function openTrackEditor(A) {
    if (!A.project.kartTrack) {
      A.project.kartTrack = globalThis.KartTrack.generateDemoTrack();
    }
    // Trabalha em cópia — só aplica ao confirmar
    const track = JSON.parse(JSON.stringify(A.project.kartTrack, function(k,v){
      if (v && v.buffer && v.BYTES_PER_ELEMENT) return Array.from(v);
      return v;
    }));
    if (track.road && !(track.road instanceof Uint8Array)) {
      if (Array.isArray(track.road)) track.road = new Uint8Array(track.road);
      else if (window.ProjectStore) {
        const d = window.ProjectStore.deserializeTrack(A.project.kartTrack);
        if (d) { track.road = d.road; track.size = d.size; }
      }
    }
    if (!(track.road instanceof Uint8Array) && A.project.kartTrack.road instanceof Uint8Array) {
      track.road = new Uint8Array(A.project.kartTrack.road);
    }
    const m = document.getElementById('modal');
    const b = document.getElementById('modalBody');
    b.innerHTML =
      '<h2>🏁 Track Editor</h2>' +
      '<p class="badge">Pinte a pista · ferramentas à esquerda · clique para aplicar</p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
      '<div id="teTools" style="display:flex;flex-direction:column;gap:4px;min-width:120px"></div>' +
      '<canvas id="teCanvas" width="320" height="320" style="background:#1a3a1a;border:1px solid #3b4665;image-rendering:pixelated;width:320px;height:320px"></canvas>' +
      '</div>' +
      '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">' +
      '<button id="teDemo">↺ Pista demo</button>' +
      '<button id="teClear">Limpar</button>' +
      '<button id="teApply">✓ Aplicar ao projeto</button>' +
      '</div>';
    m.classList.remove('hidden');

    const tools = [
      { id: 1, name: 'Asfalto' },
      { id: 2, name: 'Terra' },
      { id: 3, name: 'Turbo' },
      { id: 0, name: 'Grama (apagar)' },
      { id: 'cp', name: '+ Checkpoint' },
      { id: 'item', name: '+ Item box' },
      { id: 'obs', name: '+ Obstáculo' },
      { id: 'start', name: 'Grid largada' }
    ];
    let brush = 1;
    const toolBox = document.getElementById('teTools');
    tools.forEach(t => {
      const btn = document.createElement('button');
      btn.textContent = t.name;
      btn.onclick = () => { brush = t.id; };
      toolBox.appendChild(btn);
    });

    const canvas = document.getElementById('teCanvas');
    const ctx = canvas.getContext('2d');
    const size = track.size;
    const scale = 320 / size;

    function redraw() {
      const img = ctx.createImageData(320, 320);
      // nearest sample
      for (let y = 0; y < 320; y++) {
        for (let x = 0; x < 320; x++) {
          const tx = Math.floor(x / scale);
          const ty = Math.floor(y / scale);
          const cell = track.road[ty * size + tx];
          const p = (y * 320 + x) * 4;
          if (cell === 1) { img.data[p] = 70; img.data[p + 1] = 72; img.data[p + 2] = 80; }
          else if (cell === 2) { img.data[p] = 140; img.data[p + 1] = 120; img.data[p + 2] = 60; }
          else if (cell === 3) { img.data[p] = 40; img.data[p + 1] = 180; img.data[p + 2] = 220; }
          else { img.data[p] = 30; img.data[p + 1] = 110; img.data[p + 2] = 45; }
          img.data[p + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      // overlays
      ctx.fillStyle = '#f7b32b';
      (track.itemBoxes || []).forEach(b => {
        ctx.fillRect(b.x * scale - 2, b.y * scale - 2, 4, 4);
      });
      ctx.fillStyle = '#e74c3c';
      (track.obstacles || []).forEach(o => {
        ctx.beginPath();
        ctx.arc(o.x * scale, o.y * scale, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#fff';
      (track.checkpoints || []).forEach(c => {
        ctx.fillRect(c.x * scale - 3, c.y * scale - 3, 6, 6);
      });
      ctx.fillStyle = '#55d6a0';
      (track.startPositions || []).slice(0, 6).forEach(s => {
        ctx.fillRect(s.x * scale - 2, s.y * scale - 2, 4, 4);
      });
    }
    redraw();

    let painting = false;
    function paintTerrain(x, y) {
      if (typeof brush !== 'number') return;
      const rad = 10;
      for (let dy = -rad; dy <= rad; dy++)
        for (let dx = -rad; dx <= rad; dx++)
          if (dx * dx + dy * dy <= rad * rad) {
            const xx = x + dx, yy = y + dy;
            if (xx >= 0 && yy >= 0 && xx < size && yy < size)
              track.road[yy * size + xx] = brush;
          }
    }
    function placeObject(x, y) {
      if (brush === 'item') track.itemBoxes.push({ x: x, y: y, respawn: 0 });
      else if (brush === 'obs') track.obstacles.push({ x: x, y: y, r: 12 });
      else if (brush === 'cp') track.checkpoints.push({ x: x, y: y, index: track.checkpoints.length, radius: 50 });
      else if (brush === 'start') {
        track.startPositions = track.startPositions || [];
        track.startPositions.push({ x: x, y: y, angle: -Math.PI / 2 });
      }
    }
    function coords(e) {
      const r = canvas.getBoundingClientRect();
      return {
        x: Math.floor((e.clientX - r.left) * (size / r.width)),
        y: Math.floor((e.clientY - r.top) * (size / r.height))
      };
    }
    canvas.onpointerdown = e => {
      const c = coords(e);
      if (c.x < 0 || c.y < 0 || c.x >= size || c.y >= size) return;
      if (typeof brush === 'number') { painting = true; paintTerrain(c.x, c.y); }
      else placeObject(c.x, c.y);
      redraw();
    };
    canvas.onpointermove = e => {
      if (!painting || typeof brush !== 'number') return;
      const c = coords(e);
      paintTerrain(c.x, c.y);
      redraw();
    };
    canvas.onpointerup = () => { painting = false; };

    document.getElementById('teDemo').onclick = () => {
      A.project.kartTrack = globalThis.KartTrack.generateDemoTrack();
      openTrackEditor(A);
    };
    document.getElementById('teClear').onclick = () => {
      track.road.fill(0);
      track.itemBoxes = [];
      track.obstacles = [];
      redraw();
    };
    document.getElementById('teApply').onclick = () => {
      if (!track.waypoints || track.waypoints.length < 8) {
        const gen = globalThis.KartTrack.generateDemoTrack();
        track.waypoints = gen.waypoints;
      }
      // Validar checkpoints
      if (!track.checkpoints || track.checkpoints.length < 2) {
        A.toast('Adicione pelo menos 2 checkpoints');
        return;
      }
      A.project.kartTrack = track;
      if (track.road && !(track.road instanceof Uint8Array) && Array.isArray(track.road)) {
        A.project.kartTrack.road = new Uint8Array(track.road);
      }
      A.toast('Pista aplicada ao projeto');
      m.classList.add('hidden');
    };
    // Cancel discards temp
    const closeBtn = document.getElementById('modalClose') || document.querySelector('#modal .close');
    
  }

  function init() {
    window.KartTrackEditor = { open: openTrackEditor };
  }
  addEventListener('snesstudio:ready', init);
  if (window.SNESStudio) init();
})();

/** Extensão: editor visual de waypoints / racing line */
(function () {
  const origOpen = window.KartTrackEditor && window.KartTrackEditor.open;
  if (!origOpen) return;

  window.KartTrackEditor.openWaypoints = function (A) {
    if (!A.project.kartTrack) A.project.kartTrack = globalThis.KartTrack.generateDemoTrack();
    const track = JSON.parse(JSON.stringify(A.project.kartTrack, (k, v) =>
      (v && v.BYTES_PER_ELEMENT) ? Array.from(v) : v));
    if (Array.isArray(track.road)) track.road = new Uint8Array(track.road);
    else if (A.project.kartTrack.road instanceof Uint8Array)
      track.road = new Uint8Array(A.project.kartTrack.road);

    const m = document.getElementById('modal');
    const b = document.getElementById('modalBody');
    b.innerHTML =
      '<h2>Racing Line / Waypoints</h2>' +
      '<p class="badge">Clique: adicionar · Arraste: mover · Del: remover selecionado · G: gerar do centro</p>' +
      '<canvas id="wpCanvas" width="400" height="400" style="background:#1a3a1a;border:1px solid #3b4665;width:400px;height:400px"></canvas>' +
      '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">' +
      '<button id="wpGen">G Gerar rota</button>' +
      '<button id="wpClose">Fechar circuito</button>' +
      '<button id="wpDel">Del selecionado</button>' +
      '<button id="wpApply">✓ Aplicar</button>' +
      '<button id="wpCancel">Cancelar</button>' +
      '</div>';
    m.classList.remove('hidden');

    const canvas = document.getElementById('wpCanvas');
    const ctx = canvas.getContext('2d');
    const size = track.size || 1024;
    const scale = 400 / size;
    let sel = -1, drag = false;

    if (!track.waypoints) track.waypoints = [];

    function redraw() {
      ctx.fillStyle = '#1a3a1a';
      ctx.fillRect(0, 0, 400, 400);
      // road faint
      const step = 8;
      for (let y = 0; y < size; y += step) {
        for (let x = 0; x < size; x += step) {
          const c = track.road ? track.road[y * size + x] : 0;
          if (c === 1 || c === 3) {
            ctx.fillStyle = c === 3 ? '#2ec4e055' : '#5555';
            ctx.fillRect(x * scale, y * scale, 2, 2);
          }
        }
      }
      const wps = track.waypoints;
      ctx.strokeStyle = '#f7b32b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      wps.forEach((w, i) => {
        const x = w.x * scale, y = w.y * scale;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      if (wps.length > 2) ctx.closePath();
      ctx.stroke();
      wps.forEach((w, i) => {
        ctx.fillStyle = i === sel ? '#fff' : '#f7b32b';
        ctx.beginPath();
        ctx.arc(w.x * scale, w.y * scale, i === sel ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = '9px monospace';
        ctx.fillText(String(i), w.x * scale - 3, w.y * scale + 3);
      });
    }
    redraw();

    function hit(mx, my) {
      for (let i = 0; i < track.waypoints.length; i++) {
        const w = track.waypoints[i];
        if (Math.hypot(w.x * scale - mx, w.y * scale - my) < 10) return i;
      }
      return -1;
    }

    canvas.onpointerdown = e => {
      const r = canvas.getBoundingClientRect();
      const mx = (e.clientX - r.left) * (400 / r.width);
      const my = (e.clientY - r.top) * (400 / r.height);
      sel = hit(mx, my);
      if (sel < 0) {
        track.waypoints.push({
          x: mx / scale, y: my / scale,
          angle: 0
        });
        sel = track.waypoints.length - 1;
      } else drag = true;
      redraw();
    };
    canvas.onpointermove = e => {
      if (!drag || sel < 0) return;
      const r = canvas.getBoundingClientRect();
      track.waypoints[sel].x = ((e.clientX - r.left) * (400 / r.width)) / scale;
      track.waypoints[sel].y = ((e.clientY - r.top) * (400 / r.height)) / scale;
      redraw();
    };
    canvas.onpointerup = () => { drag = false; };

    document.getElementById('wpGen').onclick = () => {
      const gen = globalThis.KartTrack.generateDemoTrack();
      track.waypoints = gen.waypoints;
      sel = -1;
      redraw();
      A.toast('Rota gerada');
    };
    document.getElementById('wpClose').onclick = () => {
      if (track.waypoints.length > 2) {
        // recompute angles
        const wps = track.waypoints;
        for (let i = 0; i < wps.length; i++) {
          const n = wps[(i + 1) % wps.length];
          wps[i].angle = Math.atan2(n.y - wps[i].y, n.x - wps[i].x);
        }
        A.toast('Circuito fechado + ângulos');
      }
      redraw();
    };
    document.getElementById('wpDel').onclick = () => {
      if (sel >= 0) {
        track.waypoints.splice(sel, 1);
        sel = -1;
        redraw();
      }
    };
    document.getElementById('wpApply').onclick = () => {
      A.project.kartTrack.waypoints = track.waypoints;
      A.toast('Waypoints aplicados (' + track.waypoints.length + ')');
      m.classList.add('hidden');
    };
    document.getElementById('wpCancel').onclick = () => m.classList.add('hidden');
  };
})();
