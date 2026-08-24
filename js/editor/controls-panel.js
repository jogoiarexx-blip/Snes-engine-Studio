/**
 * SNES Engine Studio 0.9 — Remap de controles + teste
 */
(function () {
  'use strict';

  const DEFAULTS = {
    left: ['ArrowLeft', 'a', 'A'],
    right: ['ArrowRight', 'd', 'D'],
    up: ['ArrowUp', 'w', 'W'],
    down: ['ArrowDown', 's', 'S'],
    jump: ['z', 'Z', ' '],
    attack: ['x', 'X'],
    attack2: ['c', 'C'],
    action: ['e', 'E', 'Enter'],
    bomb: ['b', 'B'],
    inventory: ['i', 'I'],
    pause: ['p', 'P', 'Escape']
  };

  const STORAGE_KEY = 'editor_controls';
  const pref=()=>window.SNESStorage?.preferences;

  function loadMap() {
    try {
      const raw=pref()?pref().get(STORAGE_KEY,null):(window.SNESStorage?.legacy?.get('snes_v09_controls')||localStorage.getItem('snes_v09_controls'));
      const o = typeof raw==='string'?JSON.parse(raw||'null'):raw;
      return o || JSON.parse(JSON.stringify(DEFAULTS));
    } catch (_) {
      return JSON.parse(JSON.stringify(DEFAULTS));
    }
  }

  function saveMap(map) {
    if(pref())pref().set(STORAGE_KEY,map);else (window.SNESStorage?.legacy?.set('snes_v09_controls',JSON.stringify(map))||localStorage.setItem('snes_v09_controls',JSON.stringify(map)));
    applyToInput(map);
  }

  function applyToInput(map) {
    // Patch SNESInput key maps if exposed
    if (window.SNESInput && window.SNESInput.setKeyMap) {
      window.SNESInput.setKeyMap(map);
    }
    window.__SNES_KEYMAP = map;
  }

  function open() {
    const A = window.SNESStudio;
    const map = loadMap();
    const m = document.getElementById('modal');
    const b = document.getElementById('modalBody');
    let listening = null;

    function render() {
      let html = '<h2>🎮 Controles</h2><p class="badge">Clique numa ação e pressione a tecla · M = mute áudio</p>';
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
      Object.keys(map).forEach(action => {
        html += '<button class="ctrlMap" data-act="' + action + '"><b>' + action + '</b>: ' +
          (map[action] || []).join(', ') + '</button>';
      });
      html += '</div>';
      html += '<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">';
      html += '<button id="ctrlReset">↺ Padrão</button>';
      html += '<button id="ctrlTest">▶ Testar teclas</button>';
      html += '<button id="ctrlSave">✓ Salvar</button>';
      html += '<span class="badge" id="ctrlListen"></span></div>';
      html += '<h3 style="margin-top:12px">Touch (export/teste)</h3>';
      html += '<label>Opacidade <input id="touchOp" type="range" min="20" max="100" value="' +
        ((pref()&&pref().get('touch_op',null)) || window.SNESStorage?.legacy?.get('snes_touch_op') || '55') + '"></label>';
      b.innerHTML = html;

      b.querySelectorAll('.ctrlMap').forEach(btn => {
        btn.onclick = () => {
          listening = btn.dataset.act;
          document.getElementById('ctrlListen').textContent = 'Pressione tecla para: ' + listening;
        };
      });
      document.getElementById('ctrlReset').onclick = () => {
        Object.assign(map, JSON.parse(JSON.stringify(DEFAULTS)));
        render();
      };
      document.getElementById('ctrlSave').onclick = () => {
        saveMap(map);
        const op = document.getElementById('touchOp').value;
        if(pref())pref().set('touch_op',op);else if(window.SNESStorage?.legacy)SNESStorage.legacy.set('snes_touch_op',op);else localStorage.setItem('snes_touch_op',op);
        A.toast('Controles salvos');
        m.classList.add('hidden');
      };
      document.getElementById('ctrlTest').onclick = () => {
        document.getElementById('ctrlListen').textContent = 'Pressione qualquer tecla…';
        listening = '__test';
      };
    }

    const onKey = e => {
      if (!listening) return;
      if (listening === '__test') {
        document.getElementById('ctrlListen').textContent = 'Detectado: ' + e.key;
        e.preventDefault();
        return;
      }
      e.preventDefault();
      const k = e.key;
      map[listening] = [k];
      listening = null;
      render();
    };
    addEventListener('keydown', onKey);
    const obs = new MutationObserver(() => {
      if (m.classList.contains('hidden')) {
        removeEventListener('keydown', onKey);
        obs.disconnect();
      }
    });
    obs.observe(m, { attributes: true, attributeFilter: ['class'] });

    m.classList.remove('hidden');
    render();
  }

  function init() {
    applyToInput(loadMap());
    window.ControlsPanel = { open: open, loadMap: loadMap };
    // Add button to top bar
    const top = document.querySelector('.top');
    if (top && !document.getElementById('ctrlBtn')) {
      const btn = document.createElement('button');
      btn.id = 'ctrlBtn';
      btn.textContent = '🎮';
      btn.title = 'Controles';
      btn.onclick = open;
      top.appendChild(btn);
    }
  }

  addEventListener('snesstudio:ready', init);
  if (window.SNESStudio) init();
})();
