/**
 * UI do inventário — editor e durante o jogo
 */
(function () {
  'use strict';

  function openInventory(rt, onClose) {
    const Inv = window.SNESInventory;
    const A = window.SNESStudio;
    if (!Inv || !rt) return;
    if (!rt.inventory) rt.inventory = Inv.create();

    const m = document.getElementById('modal');
    const b = document.getElementById('modalBody');
    const holder = rt.player || {};

    function render() {
      const inv = rt.inventory;
      let html = '<h2>🎒 Inventário</h2>';
      html += '<p class="badge">' + inv.slots.length + '/' + inv.capacity + ' slots</p>';

      // Equipment
      html += '<h3>Equipado</h3><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">';
      ['ring', 'boots', 'amulet', 'weapon'].forEach(function (slot) {
        const id = inv.equipped[slot];
        const def = id ? Inv.getDef(id) : null;
        html += '<button data-unequip="' + slot + '" style="min-width:90px">';
        html += '<small>' + slot + '</small><br>';
        html += def ? (def.icon + ' ' + def.name) : '—';
        html += '</button>';
      });
      html += '</div>';

      // Items
      html += '<h3>Itens</h3><div style="display:flex;flex-direction:column;gap:4px;max-height:40vh;overflow:auto">';
      if (!inv.slots.length) html += '<p class="badge">Vazio</p>';
      inv.slots.forEach(function (s, idx) {
        const def = Inv.getDef(s.id) || { name: s.id, icon: '❓', desc: '', category: '' };
        html += '<div style="display:flex;align-items:center;gap:8px;border:1px solid #3b4665;border-radius:6px;padding:6px">';
        html += '<span style="font-size:20px">' + def.icon + '</span>';
        html += '<div style="flex:1"><b>' + def.name + '</b> ×' + s.qty;
        html += '<br><span style="color:#aaa;font-size:11px">' + (def.desc || '') + '</span></div>';
        if (def.category === 'consumable') {
          html += '<button data-use="' + s.id + '">Usar</button>';
        }
        if (def.category === 'equip' || def.category === 'weapon') {
          html += '<button data-equip="' + s.id + '">Equipar</button>';
        }
        html += '</div>';
      });
      html += '</div>';

      html += '<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">';
      html += '<button id="invGems">💎 → pontos</button>';
      html += '<button id="invClose">Fechar</button>';
      html += '</div>';
      b.innerHTML = html;
      m.classList.remove('hidden');

      b.querySelectorAll('[data-use]').forEach(function (btn) {
        btn.onclick = function () {
          if (Inv.use(inv, btn.getAttribute('data-use'), holder)) {
            if (A && A.toast) A.toast('Item usado');
            if (window.SNESAudio) window.SNESAudio.play('coin');
            render();
          } else if (A && A.toast) A.toast('Não foi possível usar');
        };
      });
      b.querySelectorAll('[data-equip]').forEach(function (btn) {
        btn.onclick = function () {
          if (Inv.equip(inv, btn.getAttribute('data-equip'), holder)) {
            if (A && A.toast) A.toast('Equipado');
            render();
          }
        };
      });
      b.querySelectorAll('[data-unequip]').forEach(function (btn) {
        btn.onclick = function () {
          Inv.unequip(inv, btn.getAttribute('data-unequip'), holder);
          render();
        };
      });
      document.getElementById('invGems').onclick = function () {
        const n = Inv.convertGems(inv, rt.upgrades);
        if (A && A.toast) A.toast(n ? (n + ' gemas → ' + (n * 10) + ' pts') : 'Sem gemas');
        render();
      };
      document.getElementById('invClose').onclick = function () {
        m.classList.add('hidden');
        if (onClose) onClose();
      };
    }
    render();
  }

  function openEditor() {
    const A = window.SNESStudio;
    const Inv = window.SNESInventory;
    if (!A || !Inv) return;
    if (!A.project.inventory) A.project.inventory = Inv.create({
      slots: [{ id: 'potion_small', qty: 3 }, { id: 'coin', qty: 10 }]
    });
    openInventory({
      inventory: A.project.inventory,
      player: { hp: 5, maxHp: 5, energy: 0, maxEnergy: 100 },
      upgrades: A.project.upgrades
    }, function () {
      A.project.inventory = A.project.inventory;
    });
  }

  function init() {
    window.InventoryPanel = { open: openInventory, openEditor: openEditor };
    const top = document.querySelector('.top');
    if (top && !document.getElementById('invBtn')) {
      const btn = document.createElement('button');
      btn.id = 'invBtn';
      btn.textContent = '🎒';
      btn.title = 'Inventário';
      btn.onclick = openEditor;
      top.appendChild(btn);
    }
  }
  addEventListener('snesstudio:ready', init);
  if (window.SNESStudio) init();
})();
