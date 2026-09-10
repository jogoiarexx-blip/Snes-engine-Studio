/**
 * SNES Engine Studio 0.6 — Editor de camadas, auto-tile, balde, seleção
 * Camadas reais: background, ground, foreground (todas visíveis)
 */
(function () {
  'use strict';

  function init() {
    const A = window.SNESStudio;
    if (!A) return;
    const bar = document.getElementById('toolbar');
    const canvas = document.getElementById('editor');
    if (!bar || !canvas) return;

    // Evitar dupla inicialização
    if (document.getElementById('v4layer')) return;

    const group = document.createElement('span');
    group.className = 'v4tools';
    group.innerHTML =
      '<select id="v4layer" title="Camada ativa">' +
      '<option value="background">Fundo</option>' +
      '<option value="ground" selected>Terreno</option>' +
      '<option value="decoration">Decoração</option>' +
      '<option value="foreground">Frente</option>' +
      '<option value="collision">Colisão</option>' +
      '</select>' +
      '<button id="v4visBg" title="Mostrar/ocultar fundo" class="layerVis active">B</button>' +
      '<button id="v4visGr" title="Mostrar/ocultar terreno" class="layerVis active">G</button>' +
      '<button id="v4visDe" title="Mostrar/ocultar decoração" class="layerVis active">D</button>' +
      '<button id="v4visFg" title="Mostrar/ocultar frente" class="layerVis active">F</button>' +
      '<button id="v4visCo" title="Mostrar/ocultar colisão" class="layerVis">C</button>' +
      '<button id="v4lock" title="Bloquear camada ativa">🔓</button>' +
      '<button id="v4auto" title="Auto-tile (vizinhos)">Auto-tile</button>' +
      '<button id="v4autoToggle" title="Auto-tile ao pintar" class="">AT</button>' +
      '<button id="v4fill" title="Preencher área (clique)">▧ Balde</button>' +
      '<button id="v4select" title="Selecionar região">▣ Seleção</button>' +
      '<button id="v4rect" title="Retângulo">▭ Retângulo</button>' +
      '<button id="v4line" title="Linha">╱ Linha</button>' +
      '<button id="v4eye" title="Conta-gotas">◉ Conta-gotas</button>' +
      '<button id="v4stamp" title="Carimbo da seleção copiada">◆ Stamp</button>' +
      '<button id="v4copy">Copiar</button>' +
      '<button id="v4paste">Colar</button>' +
      '<button id="v4minus">−</button>' +
      '<span id="v4zoom">100%</span>' +
      '<button id="v4plus">＋</button>';
    bar.insertBefore(group, bar.querySelector('.spacer'));

    let active = 'ground';
    let zoom = 1;
    let mode = 'paint'; // paint | fill | select | rect | line | eye | stamp
    let start = null;
    let selection = null;
    let clip = null;
    let autoOnPaint = false;
    const locked = { background: false, ground: false, decoration: false, foreground: false, collision: false };
    const visible = { background: true, ground: true, decoration: true, foreground: true, collision: false };

    function ensure(s) {
      if (window.PlatformRuntime && window.PlatformRuntime.ensureLayers) {
        const L = window.PlatformRuntime.ensureLayers(s);
        if (!L.decoration) L.decoration = A.blankMap();
        if (L.collision === undefined) L.collision = null;
        return L;
      }
      if (!s.layers) {
        const map = s.map || A.blankMap();
        s.layers = {
          background: A.blankMap(),
          ground: map.map ? map.map(r => r.slice()) : A.blankMap(),
          decoration: A.blankMap(),
          foreground: A.blankMap(),
          collision: null
        };
      }
      if (!s.layers.decoration) s.layers.decoration = A.blankMap();
      if (s.layers.collision === undefined) s.layers.collision = null;
      // collision layer as optional separate map
      if (active === 'collision') {
        if (!s.layers.collision) s.layers.collision = A.blankMap();
      }
      s.map = s.layers.ground;
      if(window.SNESTileMap){const tm=window.SNESTileMap.ensure(s);tm.layersMeta=tm.layersMeta||{};for(const k of Object.keys(visible)){tm.layersMeta[k]=Object.assign({visible:visible[k],locked:locked[k],opacity:1},tm.layersMeta[k]||{});visible[k]=tm.layersMeta[k].visible!==false;locked[k]=!!tm.layersMeta[k].locked;}}
      return s.layers;
    }

    function activeMap() {
      const s = A.scene();
      ensure(s);
      if (active === 'collision') {
        if (!s.layers.collision) s.layers.collision = A.blankMap();
        return s.layers.collision;
      }
      return s.layers[active] || s.layers.ground;
    }

    // ---- Auto-tile por 8 vizinhos ----
    // Índices típicos: 0 vazio, 1 superfície/grama, 2 miolo/terra, 3+ especiais (não tocados)
    function isFilled(m, x, y) {
      if (x < 0 || y < 0 || x >= 32 || y >= 18) return true;
      const v = m[y][x];
      return v !== 0 && v < 3; // só tiles auto-tileáveis
    }

    // Auto-tile por bitmask 4-vizinhos + diagonais → índices 1 (topo) e 2 (miolo)
    // Com temas de 8 tiles: usa 1=topo/aresta, 2=centro; especiais >=3 intactos
    function autoTileCell(m, x, y) {
      if (x < 0 || y < 0 || x >= 32 || y >= 18) return;
      const cur = m[y][x];
      if (cur === 0) return;
      const theme=A.curTheme?.()||{};
      const tile=theme.tiles?.[cur]||{};
      // Explicit rule map wins. This supports full bitmask autotile packs.
      if(window.SNESAutotile && (tile.autotileGroup||theme.autotileRules)){
        const group=tile.autotileGroup||'default';
        const get=(gx,gy)=>{if(gx<0||gy<0||gx>=32||gy>=18)return cur;const v=m[gy]?.[gx]||0;const t=theme.tiles?.[v];return t?.autotileGroup===group?group:(v===cur?group:null)};
        const mask=window.SNESAutotile.mask(get,x,y,group,!!theme.autotileDiagonal);
        const rules=tile.autotileRules||theme.autotileRules?.[group]||theme.autotileRules;
        m[y][x]=window.SNESAutotile.resolve(rules,mask,cur);
        return;
      }
      // Compatibility for classic 0/1/2 themes, still using the canonical mask helper.
      if (cur >= 3) return;
      const get=(gx,gy)=>isFilled(m,gx,gy)?1:0;
      const mask=window.SNESAutotile?window.SNESAutotile.mask(get,x,y,1,true):0;
      const N=!!(mask&1),E=!!(mask&2),S=!!(mask&4),W=!!(mask&8),NE=!!(mask&16),SE=!!(mask&32),SW=!!(mask&64),NW=!!(mask&128);
      if(!N&&!S&&!W&&!E){m[y][x]=1;return}if(!N){m[y][x]=1;return}if(N&&S&&W&&E&&(!NW||!NE||!SW||!SE)){m[y][x]=2;return}if(N&&S&&W&&E){m[y][x]=2;return}if(!S||!W||!E){m[y][x]=1;return}m[y][x]=2;
    }

    function autoTileRegion(m, cells) {
      const set = new Set();
      cells.forEach(([x, y]) => {
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++)
            set.add((x + dx) + ',' + (y + dy));
      });
      set.forEach(k => {
        const [x, y] = k.split(',').map(Number);
        autoTileCell(m, x, y);
      });
    }

    // ---- UI handlers ----
    document.getElementById('v4layer').onchange = e => {
      active = e.target.value;
      A.toast('Camada ativa: ' + e.target.options[e.target.selectedIndex].text);
      updateLockBtn();
      A.drawGrid();
    };

    function updateLockBtn() {
      const b = document.getElementById('v4lock');
      b.textContent = locked[active] ? '🔒' : '🔓';
      b.classList.toggle('active', locked[active]);
    }

    document.getElementById('v4lock').onclick = () => {
      locked[active] = !locked[active];
      const tm=window.SNESTileMap?.ensure?.(A.scene());if(tm?.layersMeta?.[active])tm.layersMeta[active].locked=locked[active];
      updateLockBtn();
      A.toast(locked[active] ? 'Camada bloqueada' : 'Camada desbloqueada');
    };

    function toggleVis(key, btnId) {
      visible[key] = !visible[key];
      const tm=window.SNESTileMap?.ensure?.(A.scene());if(tm?.layersMeta?.[key])tm.layersMeta[key].visible=visible[key];
      document.getElementById(btnId).classList.toggle('active', visible[key]);
      A.drawGrid();
    }
    document.getElementById('v4visBg').onclick = () => toggleVis('background', 'v4visBg');
    document.getElementById('v4visGr').onclick = () => toggleVis('ground', 'v4visGr');
    const vd=document.getElementById('v4visDe'); if(vd) vd.onclick = () => toggleVis('decoration', 'v4visDe');
    document.getElementById('v4visFg').onclick = () => toggleVis('foreground', 'v4visFg');
    const vc=document.getElementById('v4visCo'); if(vc) vc.onclick = () => toggleVis('collision', 'v4visCo');

    document.getElementById('v4autoToggle').onclick = e => {
      autoOnPaint = !autoOnPaint;
      e.target.classList.toggle('active', autoOnPaint);
      A.toast(autoOnPaint ? 'Auto-tile ao pintar: ON' : 'Auto-tile ao pintar: OFF');
    };

    document.getElementById('v4auto').onclick = () => {
      if (locked[active]) return A.toast('Camada bloqueada');
      const m = activeMap();
      A.pushHistory();
      const cells = [];
      for (let y = 0; y < 18; y++)
        for (let x = 0; x < 32; x++)
          if (m[y][x] !== 0 && m[y][x] < 3) cells.push([x, y]);
      autoTileRegion(m, cells);
      A.drawGrid();
      A.toast('Auto-tile aplicado na camada ativa');
    };

    let zoomFit = () => {
      canvas.style.width = Math.round(Math.min(innerWidth * 0.72, 960) * zoom) + 'px';
      document.getElementById('v4zoom').textContent = Math.round(zoom * 100) + '%';
    };
    document.getElementById('v4minus').onclick = () => { zoom = Math.max(0.5, zoom - 0.25); zoomFit(); };
    document.getElementById('v4plus').onclick = () => { zoom = Math.min(3, zoom + 0.25); zoomFit(); };

    document.getElementById('v4fill').onclick = () => {
      mode = mode === 'fill' ? 'paint' : 'fill';
      document.getElementById('v4fill').classList.toggle('active', mode === 'fill');
      document.getElementById('v4select').classList.remove('active');
      if (mode === 'select') mode = 'fill';
      A.toast(mode === 'fill' ? 'Balde: clique no mapa' : 'Pincel ativado');
    };

    document.getElementById('v4select').onclick = () => {
      mode = mode === 'select' ? 'paint' : 'select';
      document.getElementById('v4select').classList.toggle('active', mode === 'select');
      document.getElementById('v4fill').classList.remove('active');
      A.toast(mode === 'select' ? 'Arraste para selecionar' : 'Pincel ativado');
    };

    function chooseMode(next,msg){mode=mode===next?'paint':next;['fill','select','rect','line','eye','stamp'].forEach(k=>document.getElementById('v4'+(k==='eye'?'eye':k))?.classList.toggle('active',mode===k));A.toast(mode===next?msg:'Pincel ativado')}
    document.getElementById('v4rect').onclick=()=>chooseMode('rect','Retângulo: arraste no mapa');
    document.getElementById('v4line').onclick=()=>chooseMode('line','Linha: arraste início → fim');
    document.getElementById('v4eye').onclick=()=>chooseMode('eye','Conta-gotas: clique em um tile');
    document.getElementById('v4stamp').onclick=()=>chooseMode('stamp','Stamp: clique para aplicar a região copiada');

    function paintRect(m,a,b,value){const cells=[];for(let y=Math.min(a.y,b.y);y<=Math.max(a.y,b.y);y++)for(let x=Math.min(a.x,b.x);x<=Math.max(a.x,b.x);x++){m[y][x]=value;cells.push([x,y])}return cells}
    function paintLine(m,a,b,value){const cells=[],dx=Math.abs(b.x-a.x),sx=a.x<b.x?1:-1,dy=-Math.abs(b.y-a.y),sy=a.y<b.y?1:-1;let x=a.x,y=a.y,err=dx+dy;for(;;){m[y][x]=value;cells.push([x,y]);if(x===b.x&&y===b.y)break;const e2=2*err;if(e2>=dy){err+=dy;x+=sx}if(e2<=dx){err+=dx;y+=sy}}return cells}
    function pasteAt(m,x,y){if(!clip)return [];const cells=[];clip.forEach((r,dy)=>r.forEach((v,dx)=>{if(m[y+dy]&&m[y+dy][x+dx]!=null){m[y+dy][x+dx]=v;cells.push([x+dx,y+dy])}}));return cells}

    function pos(e) {
      const r = canvas.getBoundingClientRect();
      const scaleX = 512 / Math.max(1, r.width);
      const scaleY = 288 / Math.max(1, r.height);
      return {
        x: Math.max(0, Math.min(31, Math.floor((e.clientX - r.left) * scaleX / 16))),
        y: Math.max(0, Math.min(17, Math.floor((e.clientY - r.top) * scaleY / 16)))
      };
    }

    function canvasToWorld(e) {
      const r = canvas.getBoundingClientRect();
      const scaleX = 512 / Math.max(1, r.width);
      const scaleY = 288 / Math.max(1, r.height);
      return {
        x: Math.max(0, Math.min(511, Math.round((e.clientX - r.left) * scaleX))),
        y: Math.max(0, Math.min(287, Math.round((e.clientY - r.top) * scaleY))),
        tx: Math.max(0, Math.min(31, Math.floor((e.clientX - r.left) * scaleX / 16))),
        ty: Math.max(0, Math.min(17, Math.floor((e.clientY - r.top) * scaleY / 16)))
      };
    }
    A.canvasToWorld = canvasToWorld;
    A.tilePos = pos;

    function floodFill(m, sx, sy, to) {
      const from = m[sy][sx];
      if (from === to) return;
      const q = [[sx, sy]];
      const seen = new Set();
      while (q.length) {
        const [x, y] = q.pop();
        const k = x + ',' + y;
        if (x < 0 || y < 0 || x >= 32 || y >= 18 || seen.has(k) || m[y][x] !== from) continue;
        seen.add(k);
        m[y][x] = to;
        q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      return [...seen].map(k => k.split(',').map(Number));
    }

    // Interceptar pintura na camada ativa
    canvas.addEventListener('mousedown', e => {
      if (A.playing || A.view !== 'map') return;
      // Modo colocar entidade: não pintar tile
      if (A.placeMode) return;
      // Arrastar entidade selecionada
      if (A._entityDrag) return;
      if (locked[active]) {
        if (mode === 'paint' || mode === 'fill') {
          e.stopImmediatePropagation();
          A.toast('Camada bloqueada');
          return;
        }
      }
      const p = pos(e);

      if(mode==='eye'&&e.button===0){e.stopImmediatePropagation();A.selectedTile=activeMap()[p.y][p.x]||0;mode='paint';document.getElementById('v4eye').classList.remove('active');A.renderRight?.();A.toast('Tile '+A.selectedTile+' selecionado');return}
      if(mode==='stamp'&&e.button===0){e.stopImmediatePropagation();if(!clip)return A.toast('Copie uma região antes de usar Stamp');A.pushHistory();const cells=pasteAt(activeMap(),p.x,p.y);if(autoOnPaint)autoTileRegion(activeMap(),cells);A.drawGrid();return}
      if((mode==='rect'||mode==='line')&&e.button===0){e.stopImmediatePropagation();start=p;return}

      if (mode === 'fill' && e.button === 0) {
        e.stopImmediatePropagation();
        const m = activeMap();
        A.pushHistory();
        const cells = floodFill(m, p.x, p.y, A.selectedTile);
        if (autoOnPaint && cells) autoTileRegion(m, cells);
        if (window.SNESRender) {
          const sc = A.scene();
          window.SNESRender.markDirty(sc.layers || sc, active);
        }
        A.drawGrid();
        return;
      }

      if (mode === 'select') {
        e.stopImmediatePropagation();
        start = p;
        return;
      }

      // Pintura normal: aplicar na camada ativa
      if (e.button === 0) {
        e.stopImmediatePropagation();
        const m = activeMap();
        if (m[p.y][p.x] !== A.selectedTile) {
          A.pushHistory();
          m[p.y][p.x] = A.selectedTile;
          if (autoOnPaint) autoTileRegion(m, [[p.x, p.y]]);
          if (window.SNESRender) { const sc=A.scene(); window.SNESRender.markDirty(sc.layers || sc, active); }
          A.drawGrid();
        }
        // Continuar arrasto
        const onMove = ev => {
          if (A.placeMode || A._entityDrag) return;
          const q = pos(ev);
          if (m[q.y] && m[q.y][q.x] !== A.selectedTile) {
            m[q.y][q.x] = A.selectedTile;
            if (autoOnPaint) autoTileRegion(m, [[q.x, q.y]]);
            if (window.SNESRender) { const sc=A.scene(); window.SNESRender.markDirty(sc.layers || sc, active); }
            A.drawGrid();
          }
        };
        const onUp = () => {
          canvas.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        };
        canvas.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      }
    }, true);

    canvas.addEventListener('contextmenu', e => {
      if (A.playing || A.view !== 'map') return;
      if (locked[active]) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      const p = pos(e);
      const m = activeMap();
      A.pushHistory();
      m[p.y][p.x] = 0;
      if (autoOnPaint) autoTileRegion(m, [[p.x, p.y]]);
      if (window.SNESRender) {
        const sc = A.scene();
        window.SNESRender.markDirty(sc.layers || sc, active);
      }
      A.drawGrid();
    }, true);

    canvas.addEventListener('mouseup', e => {
      if (!start || !['select','rect','line'].includes(mode)) return;
      e.stopImmediatePropagation();const p=pos(e),origin=start;start=null;
      if(mode==='select'){selection={x1:Math.min(origin.x,p.x),y1:Math.min(origin.y,p.y),x2:Math.max(origin.x,p.x),y2:Math.max(origin.y,p.y)};A.toast('Seleção '+(selection.x2-selection.x1+1)+'×'+(selection.y2-selection.y1+1));return}
      if(locked[active])return A.toast('Camada bloqueada');const m=activeMap();A.pushHistory();const cells=mode==='rect'?paintRect(m,origin,p,A.selectedTile):paintLine(m,origin,p,A.selectedTile);if(autoOnPaint)autoTileRegion(m,cells);A.drawGrid();A.toast(mode==='rect'?'Retângulo aplicado':'Linha aplicada');
    }, true);

    document.getElementById('v4copy').onclick = () => {
      if (!selection) return A.toast('Faça uma seleção primeiro');
      const m = activeMap();
      clip = [];
      for (let y = selection.y1; y <= selection.y2; y++)
        clip.push(m[y].slice(selection.x1, selection.x2 + 1));
      A.toast('Seleção copiada');
    };

    document.getElementById('v4paste').onclick = () => {
      if (!clip) return A.toast('Nada copiado');
      if (locked[active]) return A.toast('Camada bloqueada');
      const x = selection ? selection.x1 : 0;
      const y = selection ? selection.y1 : 0;
      const m = activeMap();
      A.pushHistory();
      clip.forEach((r, dy) => r.forEach((v, dx) => {
        if (m[y + dy] && m[y + dy][x + dx] != null) m[y + dy][x + dx] = v;
      }));
      A.drawGrid();
      A.toast('Seleção colada');
    };

    // Redesenhar grid com todas as camadas
    const R = window.SNESRuntime;
    const oldDraw = A.drawGrid;
    A.drawGrid = function () {
      if (A.playing) return; // runtime desenha durante play
      const s = A.scene();
      ensure(s);
      const ctx = canvas.getContext('2d');
      const theme = A.curTheme();
      const tiles = theme.tiles;
      ctx.clearRect(0, 0, 512, 288);
      if (window.SNESRender) window.SNESRender.setupCtx(ctx);

      const order = [
        ['background', visible.background !== false, 1],
        ['ground', visible.ground !== false, 1],
        ['decoration', visible.decoration !== false, 1],
        ['foreground', visible.foreground !== false, 0.95],
        ['collision', visible.collision, 0.35]
      ];
      const cols = 32, rows = 18;
      const owner = s.layers || s;
      order.forEach(function (entry) {
        const name = entry[0], vis = entry[1], alpha = entry[2];
        if (!vis) return;
        let map = null;
        if (s.layers && s.layers[name]) map = s.layers[name];
        else if (name === 'ground') map = s.map;
        if (!map) return;
        if (window.SNESRender) {
          window.SNESRender.blitLayer(ctx, owner, name, map, tiles, cols, rows, alpha);
        } else {
          ctx.globalAlpha = alpha;
          for (let y = 0; y < rows; y++)
            for (let x = 0; x < cols; x++) {
              const id = map[y][x];
              if (!id) continue;
              if (R) R.drawTileAt(ctx, tiles[id] || tiles[0], x * 16, y * 16, 16);
              else {
                const tt = tiles[id] || tiles[0];
                ctx.fillStyle = tt.color;
                ctx.fillRect(x * 16, y * 16, 16, 16);
              }
            }
          ctx.globalAlpha = 1;
        }
      });

      // Entidades
      if (!A.playing) {
        const drawEnt = A._drawEntityAt || null;
        s.entities.forEach(e => {
          if (e.type === 'enemy' && e.sprite === 'skeleton' && window.SkeletonSprite) {
            window.SkeletonSprite.draw(ctx, e);
          } else if (drawEnt) {
            drawEnt(ctx, e, theme);
          } else {
            ctx.fillStyle = e.type === 'player' ? '#55d6a0' : e.type === 'enemy' ? '#c84c72' : '#f7b32b';
            ctx.fillRect(e.x, e.y, 14, 14);
          }
        });
        if (A.selectedEntity) {
          const sel = s.entities.find(e => e.id === A.selectedEntity);
          if (sel) {
            ctx.strokeStyle = '#f7b32b';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 2]);
            ctx.strokeRect(sel.x - 3, sel.y - 3, 20, 20);
            ctx.setLineDash([]);
          }
        }
      }

      // Overlay seleção
      if (selection && mode === 'select') {
        ctx.strokeStyle = '#4aa0e0';
        ctx.lineWidth = 1;
        ctx.strokeRect(selection.x1 * 16, selection.y1 * 16,
          (selection.x2 - selection.x1 + 1) * 16, (selection.y2 - selection.y1 + 1) * 16);
      }
    };

    // Expor camada ativa e visibilidade para o core
    A._editorLayers = { get active() { return active; }, visible, locked, ensure };

    // Migrar cenas ao renderizar
    const oldRender = A.renderAll;
    A.renderAll = function () {
      A.project.scenes.forEach(function(sc) {
        ensure(sc);
        if (window.SNESRender) window.SNESRender.markAllDirty(sc.layers || sc);
      });
      oldRender();
    };

    // Garantir layers antes de play/export
    document.addEventListener('click', e => {
      if (['playBtn', 'exportBtn', 'exportSnesBtn'].includes(e.target.id)) {
        A.project.scenes.forEach(ensure);
      }
    }, true);

    // Primeira migração
    A.project.scenes.forEach(ensure);
    A.drawGrid();
  }

  window.addEventListener('snesstudio:ready', init);
  if (window.SNESStudio) init();
})();
