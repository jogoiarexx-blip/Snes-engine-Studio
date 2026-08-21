/**
 * SNES Engine Studio V7 — Tela inicial com recentes / autosave
 */
(function () {
  'use strict';

  function openHome() {
    const A = window.SNESStudio;
    if (!A) return;
    const m = document.getElementById('modal');
    const b = document.getElementById('modalBody');
    if (!m || !b) return;

    const recent = (window.SNESSave && window.SNESSave.listRecent()) || [];
    const auto = window.SNESSave && window.SNESSave.loadAutosave();

    let html = '<div class="homeScreen"><h2>◆ SNES Engine Studio V7</h2>';
    html += '<p class="badge">Multi-Game Engine — Plataforma · Top-down · Shooter</p>';
    html += '<div class="homeActions">';
    html += '<button id="homeNew">＋ Novo projeto</button>';
    html += '<button id="homeOpen">📂 Abrir salvo</button>';
    if (auto) html += '<button id="homeAuto">↺ Restaurar autosave</button>';
    html += '</div>';

    if (recent.length) {
      html += '<h3>Projetos recentes</h3><div class="recentList">';
      recent.forEach((r, i) => {
        html += '<button class="recentItem" data-i="' + i + '"><b>' +
          (r.name || 'Sem nome') + '</b><span>' + (r.gameType || '') +
          ' · ' + new Date(r.t).toLocaleString() + '</span></button>';
      });
      html += '</div>';
    }
    html += '</div>';
    b.innerHTML = html;
    m.classList.remove('hidden');

    document.getElementById('homeNew').onclick = () => {
      m.classList.add('hidden');
      window.ProjectWizard && window.ProjectWizard.open();
    };
    document.getElementById('homeOpen').onclick = () => {
      m.classList.add('hidden');
      document.getElementById('loadBtn')?.click();
    };
    const ab = document.getElementById('homeAuto');
    if (ab) ab.onclick = () => {
      A.project = A.migrateProject ? A.migrateProject(auto.project) : auto.project;
      A.renderAll();
      m.classList.add('hidden');
      A.toast('Autosave restaurado');
    };
    b.querySelectorAll('.recentItem').forEach(btn => {
      btn.onclick = () => {
        const r = recent[+btn.dataset.i];
        if (r && r.snapshot) {
          A.project = A.migrateProject ? A.migrateProject(r.snapshot) : r.snapshot;
          A.renderAll();
          m.classList.add('hidden');
          A.toast('Projeto carregado: ' + r.name);
          if (window.SNESStudioUI) window.SNESStudioUI.refreshGameTypeUI();
        }
      };
    });
  }

  function init() {
    // Mostrar home só na primeira visita da sessão
    if (sessionStorage.getItem('snes_v7_home_seen')) return;
    sessionStorage.setItem('snes_v7_home_seen', '1');
    setTimeout(openHome, 200);
  }

  addEventListener('snesstudio:ready', init);
  window.HomeScreen = { open: openHome };
})();
