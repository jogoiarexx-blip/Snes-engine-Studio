/**
 * SNES Engine Studio 0.6 — Extensões de entidades (Caveira, Boss, Porta, Evento, Vida)
 * O gameplay em si vive em js/runtime/runtime.js (unificado).
 */
(function () {
  'use strict';

  function init() {
    const A = window.SNESStudio;
    if (!A) return;

    function add(kind) {
      const s = A.scene();
      const base = { id: kind + Date.now(), x: 160, y: 160, hp: 1, speed: 0 };
      A.pushHistory();
      if (kind === 'boss') {
        const v = (A.ENEMY_VARIANTS[s.themeId] || [])[2];
        s.entities.push({
          ...base,
          type: 'enemy',
          name: 'Boss ' + (v?.name || ''),
          sub: v?.id,
          hp: 12,
          maxHp: 12,
          speed: 25,
          damage: 2,
          boss: true,
          vision: 200,
          attackRange: 32
        });
      }
      if (kind === 'skeleton') {
        s.entities.push({
          ...base,
          x: 360,
          y: 200,
          type: 'enemy',
          name: 'Caveira Espadachim',
          sprite: 'skeleton',
          hp: 6,
          maxHp: 6,
          speed: 38,
          damage: 1,
          facing: 'left',
          vision: 170,
          attackRange: 30,
          patrolMin: 300,
          patrolMax: 420
        });
      }
      if (kind === 'door') {
        s.entities.push({
          ...base,
          type: 'door',
          name: 'Porta',
          event: 'nextScene',
          locked: false
        });
      }
      if (kind === 'event') {
        s.entities.push({
          ...base,
          type: 'npc',
          name: 'Evento',
          dialog: 'Um novo caminho foi aberto!',
          event: 'dialog'
        });
      }
      if (kind === 'health') {
        s.entities.push({
          ...base,
          type: 'item',
          name: 'Coração',
          itemKind: 'health'
        });
      }
      if (kind === 'checkpoint') {
        s.entities.push({
          ...base,
          type: 'checkpoint',
          name: 'Checkpoint'
        });
      }
      if (kind === 'chest') {
        s.entities.push({
          ...base,
          type: 'chest',
          name: 'Baú',
          sub: 'bau',
          opened: false,
          loot: 'score'
        });
      }
      if (kind === 'moving_platform') {
        s.entities.push({
          ...base, type: 'moving_platform', name: 'Plataforma móvel',
          x: 160, y: 180, w: 48, h: 8, axis: 'x', min: 120, max: 280, speed: 40
        });
      }
      if (kind === 'ladder') {
        s.entities.push({
          ...base, type: 'ladder', name: 'Escada',
          x: 200, y: 120, w: 16, h: 64
        });
      }
      A.renderAll();
      A.toast(
        kind === 'skeleton'
          ? 'Caveira Espadachim adicionada'
          : kind + ' adicionado'
      );
    }

    const ob = new MutationObserver(() => {
      const p = document.getElementById('rightPanel');
      if (!p?.querySelector('#addEnemy') || p.querySelector('#addBossV5')) return;
      const c = p.querySelector('.card');
      if (!c) return;
      c.insertAdjacentHTML(
        'beforeend',
        '<div class="v5add">' +
          '<button id="addSkeletonV5">＋ Caveira</button>' +
          '<button id="addBossV5">＋ Boss</button>' +
          '<button id="addDoorV5">＋ Porta</button>' +
          '<button id="addCheckpointV5">＋ Checkpoint</button>' +
          '<button id="addChestV5">＋ Baú</button>' +
          '<button id="addEventV5">＋ Evento</button>' +
          '<button id="addHealthV5">＋ Vida</button>' +
          '<button id="addPlatformV7">＋ Plat. móvel</button>' +
          '<button id="addLadderV7">＋ Escada</button>' +
          '</div>'
      );
      document.getElementById('addSkeletonV5').onclick = () => add('skeleton');
      document.getElementById('addBossV5').onclick = () => add('boss');
      document.getElementById('addDoorV5').onclick = () => add('door');
      document.getElementById('addCheckpointV5').onclick = () => add('checkpoint');
      document.getElementById('addChestV5').onclick = () => add('chest');
      document.getElementById('addEventV5').onclick = () => add('event');
      document.getElementById('addHealthV5').onclick = () => add('health');
      const ap = document.getElementById('addPlatformV7'); if (ap) ap.onclick = () => add('moving_platform');
      const al = document.getElementById('addLadderV7'); if (al) al.onclick = () => add('ladder');
    });
    ob.observe(document.getElementById('rightPanel'), { childList: true, subtree: true });
  }

  addEventListener('snesstudio:ready', init);
  if (window.SNESStudio) init();
})();
