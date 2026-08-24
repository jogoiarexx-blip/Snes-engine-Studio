/**
 * SNES Engine Studio 0.9 — UI de slots de save (IndexedDB / ProjectStore)
 */
(function () {
  'use strict';

  function open() {
    const A = window.SNESStudio;
    const Store = window.ProjectStore;
    const m = document.getElementById('modal');
    const b = document.getElementById('modalBody');
    const recent = Store ? Store.listRecent() : [];

    let html = '<h2>💾 Projetos e Slots</h2>';
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">';
    html += '<button id="ssSave">Salvar projeto atual</button>';
    html += '<button id="ssExport">Exportar JSON</button>';
    html += '<button id="ssImport">Importar JSON</button>';
    html += '</div>';
    html += '<input id="ssFile" type="file" accept="application/json" hidden>';
    html += '<h3>Recentes</h3><div id="ssList">';
    if (!recent.length) html += '<p class="badge">Nenhum projeto recente</p>';
    recent.forEach((r, i) => {
      html += '<button class="ssItem" data-id="' + (r.id || '') + '" data-i="' + i + '" style="display:block;width:100%;text-align:left;margin:4px 0">';
      html += '<b>' + (r.name || r.id) + '</b> · ' + (r.gameType || '') + ' · ' + new Date(r.t).toLocaleString();
      html += '</button>';
    });
    html += '</div>';
    html += '<h3>Slots rápidos (1–3)</h3><div style="display:flex;gap:6px">';
    html += '<button data-slot="1">Slot 1</button><button data-slot="2">Slot 2</button><button data-slot="3">Slot 3</button>';
    html += '</div><p class="badge">Clique no slot: salva · Shift+clique: carrega</p>';
    b.innerHTML = html;
    m.classList.remove('hidden');

    document.getElementById('ssSave').onclick = () => {
      if (!Store) return A.toast('ProjectStore indisponível');
      A.project.id = A.project.id || A.project.name || ('proj_' + Date.now());
      Store.saveProject(A.project).then(ok => A.toast(ok ? 'Salvo' : 'Falha ao salvar'));
    };
    document.getElementById('ssExport').onclick = () => {
      const data = Store ? Store.prepareProjectForSave(A.project) : A.project;
      A.downloadFile((A.project.name || 'projeto') + '.json', JSON.stringify(data, null, 2), 'application/json');
    };
    document.getElementById('ssImport').onclick = () => document.getElementById('ssFile').click();
    document.getElementById('ssFile').onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        const finish = (data) => {
          try {
            if (A.migrateProject) data = A.migrateProject(data);
            A.project = data;
            A.renderAll();
            A.toast('Importado');
            m.classList.add('hidden');
          } catch (err) {
            A.toast('JSON inválido: ' + err.message);
          }
        };
        if (Store && Store.importJSONAsync) {
          Store.importJSONAsync(r.result).then(finish).catch(function (err) {
            A.toast('Falha: ' + err.message);
          });
        } else {
          try {
            let data = JSON.parse(r.result);
            if (Store) data = Store.restoreProject(data);
            finish(data);
          } catch (err) {
            A.toast('JSON inválido: ' + err.message);
          }
        }
      };
      r.readAsText(f);
    };
    b.querySelectorAll('.ssItem').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        if (!Store || !id) return;
        Store.loadProject(id).then(data => {
          if (!data) return A.toast('Não encontrado');
          if (A.migrateProject) data = A.migrateProject(data);
          A.project = data;
          A.renderAll();
          A.toast('Carregado: ' + (data.name || id));
          m.classList.add('hidden');
        });
      };
    });
    b.querySelectorAll('[data-slot]').forEach(btn => {
      btn.onclick = e => {
        const n = btn.dataset.slot;
        if (e.shiftKey) {
          // load
          try {
            const raw = window.SNESStorage?.legacy?.get('snes_v09_slot_' + n) || localStorage.getItem('snes_v09_slot_' + n);
            if (!raw) return A.toast('Slot vazio');
            let data = JSON.parse(raw);
            if (Store) data = Store.restoreProject(data);
            if (A.migrateProject) data = A.migrateProject(data);
            A.project = data;
            A.renderAll();
            A.toast('Slot ' + n + ' carregado');
          } catch (err) { A.toast('Erro: ' + err.message); }
        } else {
          const data = Store ? Store.prepareProjectForSave(A.project) : A.project;
          if(window.SNESSave)SNESSave.saveSlot(n,data);else if(window.SNESStorage?.legacy)SNESStorage.legacy.set('snes_v09_slot_' + n,JSON.stringify(data));else localStorage.setItem('snes_v09_slot_' + n, JSON.stringify(data));
          A.toast('Slot ' + n + ' salvo');
        }
      };
    });
  }

  function init() {
    window.SaveSlotsUI = { open: open };
    const top = document.querySelector('.top');
    if (top && !document.getElementById('slotsBtn')) {
      const btn = document.createElement('button');
      btn.id = 'slotsBtn';
      btn.textContent = '💾';
      btn.title = 'Saves / slots';
      btn.onclick = open;
      top.appendChild(btn);
    }
  }
  addEventListener('snesstudio:ready', init);
  if (window.SNESStudio) init();
})();
