/**
 * Painel de upgrades / habilidades no editor e durante o jogo
 */
(function () {
  'use strict';

  function openShop(rt, onClose) {
    const A = window.SNESStudio;
    const Up = window.SNESUpgrades;
    if (!Up || !rt) return;
    if (!rt.upgrades) rt.upgrades = Up.createState();

    const m = document.getElementById('modal');
    const b = document.getElementById('modalBody');
    const gt = rt.gameType || (A && A.project && A.project.gameType) || 'metroidvania';
    const list = Up.listForGenre(gt);

    function render() {
      let html = '<h2>⬆ Upgrades & Habilidades</h2>';
      html += '<p class="badge">Pontos: <b id="upPts">' + (rt.upgrades.points || 0) + '</b></p>';
      html += '<div style="display:flex;flex-direction:column;gap:6px;max-height:50vh;overflow:auto">';
      list.forEach(function (def) {
        const rank = Up.getRank(rt.upgrades, def.id);
        const maxed = rank >= def.maxRank;
        const cost = def.unlockOnly ? 'mundo' : (maxed ? 'MAX' : def.cost(rank));
        const can = !def.unlockOnly && Up.canBuy(rt.upgrades, def.id);
        html += '<div style="border:1px solid #3b4665;border-radius:8px;padding:8px;display:flex;justify-content:space-between;align-items:center;gap:8px">';
        html += '<div><b>' + def.icon + ' ' + def.label + '</b> <span class="badge">Nv.' + rank + '/' + def.maxRank + '</span>';
        html += '<br><span style="color:#aaa;font-size:11px">' + def.desc + '</span></div>';
        if (def.unlockOnly) {
          html += '<span class="badge">' + (rank ? '✓' : 'no mapa') + '</span>';
        } else {
          html += '<button data-buy="' + def.id + '" ' + (can ? '' : 'disabled') + '>' +
            (maxed ? 'MAX' : cost + ' pts') + '</button>';
        }
        html += '</div>';
      });
      html += '</div>';
      html += '<div style="margin-top:10px"><button id="upClose">Fechar</button></div>';
      b.innerHTML = html;
      m.classList.remove('hidden');

      b.querySelectorAll('[data-buy]').forEach(function (btn) {
        btn.onclick = function () {
          if (Up.buy(rt.upgrades, btn.getAttribute('data-buy'))) {
            if (rt.player) Up.applyAll(rt.upgrades, rt.player);
            if (A && A.toast) A.toast('Upgrade comprado!');
            render();
          }
        };
      });
      document.getElementById('upClose').onclick = function () {
        m.classList.add('hidden');
        if (onClose) onClose();
      };
    }
    render();
  }

  function openEditorPanel() {
    const A = window.SNESStudio;
    const Up = window.SNESUpgrades;
    if (!A || !Up) return;
    if (!A.project.upgrades) A.project.upgrades = Up.createState({ points: 100 });
    // Fake runtime-like object for shop
    const rt = {
      gameType: A.project.gameType,
      upgrades: A.project.upgrades,
      player: { speed: 100, jump: 290, maxHp: 5, hp: 5, abilities: {} }
    };
    openShop(rt, function () {
      A.project.upgrades = rt.upgrades;
      Up.applyAll(rt.upgrades, rt.player);
    });
  }

  function init() {
    window.UpgradesPanel = { openShop: openShop, openEditor: openEditorPanel };
    const top = document.querySelector('.top');
    if (top && !document.getElementById('upgradesBtn')) {
      const btn = document.createElement('button');
      btn.id = 'upgradesBtn';
      btn.textContent = '⬆';
      btn.title = 'Upgrades';
      btn.onclick = openEditorPanel;
      top.appendChild(btn);
    }
  }

  addEventListener('snesstudio:ready', init);
  if (window.SNESStudio) init();
})();
