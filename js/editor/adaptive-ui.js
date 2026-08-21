/**
 * SNES Engine Studio V7 — UI adaptável ao gameType
 */
(function () {
  'use strict';

  const LABELS = {
    platform: '🏃 Plataforma',
    topdown: '⚔️ Action RPG',
    shooter: "🚀 Shoot 'em Up",
    'kart-racing': '🏎️ Kart Racing',
    metroidvania: '🗡️ Metroidvania',
    'beat-em-up': "🥊 Beat 'em Up"
  };
  const HELP = {
    platform: 'Play: setas/A-D · Z pula · X ataca · E ação · ESC para',
    topdown: 'Play: setas/WASD · X ataca · E fala/porta · I inventário',
    shooter: 'Play: setas/WASD · X atira · B bomba · ESC para',
    'kart-racing': 'Play: setas/WASD acelera · Espaço drift · E item · ESC para',
    metroidvania: 'Play: setas · Z pula · X ataca · C dash · E porta',
    'beat-em-up': 'Play: setas · X combo · C especial · E agarrão'
  };

  function gameType() {
    const A = window.SNESStudio;
    return (A && (A.gameType || (A.project && A.project.gameType))) || 'platform';
  }

  function refreshGameTypeUI() {
    const t = gameType();
    const badge = document.getElementById('gameTypeBadge');
    if (badge) badge.textContent = LABELS[t] || t;
    const help = document.getElementById('helpControls');
    if (help) help.textContent = HELP[t] || '';
    // Filter entity buttons if panel open
    filterEntityButtons();
  }

  function filterEntityButtons() {
    const t = gameType();
    const reg = window.EntityRegistry;
    if (!reg) return;
    const allowed = new Set(reg.listForGameType(t).map(d => d.type));
    // Also allow skeleton as enemy for platform
    document.querySelectorAll('#rightPanel button[id^="add"]').forEach(btn => {
      const id = btn.id.toLowerCase();
      let show = true;
      if (id.includes('skeleton') && t !== 'platform') show = false;
      if (id.includes('checkpoint') && t !== 'platform') show = false;
      if ((id.includes('spawner') || id.includes('power')) && t !== 'shooter') show = false;
      if (id.includes('npc') && t === 'shooter') show = false;
      if (id.includes('chest') && t === 'shooter') show = false;
      if (id.includes('door') && t === 'shooter') show = false;
      btn.style.display = show ? '' : 'none';
    });
  }

  // Style panel extras by game type when entities view
  function injectStylePanel() {
    const A = window.SNESStudio;
    if (!A || A.view !== 'entities') return;
    const p = document.getElementById('rightPanel');
    if (!p || p.querySelector('.stylePanel')) return;
    const t = gameType();
    const card = document.createElement('div');
    card.className = 'card stylePanel';
    let html = '<h3>ESTILO — ' + (LABELS[t] || t) + '</h3>';
    if (t === 'platform') {
      html += '<div class="badge">Gravidade · Pulo · Coyote · Knockback · Caveira · Boss · Checkpoint</div>';
      html += '<button id="addSkeletonV5">＋ Caveira</button> ';
    } else if (t === 'topdown') {
      html += '<div class="badge">4/8 direções · NPC · Diálogo · Inventário · Porta · Baú</div>';
    } else if (t === 'kart-racing') {
      html += '<div class="badge">Mode7 · Drift · Itens · IA · Minimap</div>';
      html += '<button id="openTrackEditor">🏁 Track Editor</button>';
      html += '<button id="openWaypoints">📍 Racing Line</button>';
    } else if (t === 'metroidvania') {
      html += '<div class="badge">Salas · 3 habilidades · Boss · NPC · Cristal de save · Segredo</div>';
      html += '<p class="badge">Z pula · X ataca · C dash · E fala/porta · Wall jump na câmara secreta</p>';
    } else if (t === 'beat-em-up') {
      html += '<div class="badge">4 ondas · Runner/Heavy · Combo · Score · Pausa (P)</div>';
      html += '<p class="badge">X combo · C especial · E agarrão · PTS e combo na tela</p>';
    } else if (t === 'shooter') {
      html += '<div class="badge">Nave livre · Tiros · Ondas · Power-ups · Boss</div>';
      html += '<button id="addSpawnerV7">＋ Onda/Spawner</button> ';
      html += '<button id="addPowerV7">＋ Power-up</button> ';
      html += '<button id="addBossV5">＋ Boss</button>';
    }
    card.innerHTML = html;
    p.appendChild(card);
    const sp = document.getElementById('addSpawnerV7');
    if (sp) sp.onclick = () => {
      const ent = window.EntityRegistry.create('spawner');
      A.pushHistory(); A.scene().entities.push(ent); A.renderAll(); A.toast('Spawner adicionado');
    };
    const te = document.getElementById('openTrackEditor');
    if (te) te.onclick = () => window.KartTrackEditor && window.KartTrackEditor.open(A);
    const wp = document.getElementById('openWaypoints');
    if (wp) wp.onclick = () => window.KartTrackEditor && window.KartTrackEditor.openWaypoints && window.KartTrackEditor.openWaypoints(A);
    const pu = document.getElementById('addPowerV7');
    if (pu) pu.onclick = () => {
      const ent = window.EntityRegistry.create('powerup');
      A.pushHistory(); A.scene().entities.push(ent); A.renderAll(); A.toast('Power-up adicionado');
    };
    filterEntityButtons();
  }

  function init() {
    refreshGameTypeUI();
    const obs = new MutationObserver(() => {
      injectStylePanel();
      filterEntityButtons();
    });
    const rp = document.getElementById('rightPanel');
    if (rp) obs.observe(rp, { childList: true, subtree: true });

    // Change game type from project panel — intercept ptype
    document.addEventListener('change', e => {
      if (e.target && e.target.id === 'ptype') {
        const A = window.SNESStudio;
        const v = e.target.value;
        const mapped = v === 'topdown' || v === 'top-down' ? 'topdown' : v;
        if (!['platform', 'topdown', 'shooter'].includes(mapped)) {
          e.target.value = 'platform';
          A.toast('Use Novo Projeto para estilos oficiais');
          return;
        }
        if (A.project.gameType !== mapped) {
          const ok = confirm('Trocar o estilo do projeto para ' + mapped + '? Entidades incompatíveis podem precisar ajuste.');
          if (!ok) {
            e.target.value = A.project.gameType || 'platform';
            return;
          }
          A.project.gameType = mapped;
          A.project.settings.type = mapped;
          refreshGameTypeUI();
          A.renderAll();
        }
      }
    });

    // Update project panel options
    const oldRender = window.SNESStudio && window.SNESStudio.renderRight;
    // Badge click opens wizard tip
    const badge = document.getElementById('gameTypeBadge');
    if (badge) badge.onclick = () => window.ProjectWizard && window.ProjectWizard.open();

    window.SNESStudioUI = { refreshGameTypeUI };
    setInterval(refreshGameTypeUI, 2000);
  }

  addEventListener('snesstudio:ready', init);
  if (window.SNESStudio) init();
})();
