/**
 * SNES Engine Studio V7 — Command Palette (Ctrl+K)
 */
(function () {
  'use strict';

  const COMMANDS = [
    { id: 'new', label: 'Novo projeto', run: () => window.ProjectWizard && window.ProjectWizard.open() },
    { id: 'save', label: 'Salvar projeto', run: () => document.getElementById('saveBtn')?.click() },
    { id: 'load', label: 'Abrir projeto', run: () => document.getElementById('loadBtn')?.click() },
    { id: 'export', label: 'Exportar HTML', run: () => document.getElementById('exportBtn')?.click() },
    { id: 'play', label: 'Testar jogo', run: () => document.getElementById('playBtn')?.click() },
    { id: 'stop', label: 'Parar teste', run: () => document.getElementById('stopBtn')?.click() },
    { id: 'undo', label: 'Desfazer', run: () => document.getElementById('undoBtn')?.click() },
    { id: 'redo', label: 'Refazer', run: () => document.getElementById('redoBtn')?.click() },
    { id: 'map', label: 'Painel Mapas', run: () => document.querySelector('.nav[data-view="map"]')?.click() },
    { id: 'ent', label: 'Painel Entidades', run: () => document.querySelector('.nav[data-view="entities"]')?.click() },
    { id: 'tiles', label: 'Painel Tilesets', run: () => document.querySelector('.nav[data-view="tilesets"]')?.click() },
    { id: 'scenes', label: 'Painel Cenas', run: () => document.querySelector('.nav[data-view="scenes"]')?.click() },
    { id: 'proj', label: 'Painel Projeto', run: () => document.querySelector('.nav[data-view="project"]')?.click() },
    { id: 'help', label: 'Ajuda / atalhos', run: () => document.getElementById('helpBtn')?.click() },
    { id: 'validate', label: 'Validar projeto', run: () => {
      const A = window.SNESStudio;
      const issues = window.ProjectValidator.validate(A.project);
      if (!issues.length) A.toast('Projeto OK');
      else A.toast(issues.map(i => i.level + ': ' + i.msg).join(' · ').slice(0, 120));
    }}
  ];

  function open() {
    let overlay = document.getElementById('cmdPalette');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'cmdPalette';
      overlay.className = 'cmdPalette hidden';
      overlay.innerHTML = '<div class="cmdBox"><input id="cmdInput" placeholder="Digite um comando…"><div id="cmdList"></div></div>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    }
    overlay.classList.remove('hidden');
    const input = document.getElementById('cmdInput');
    const list = document.getElementById('cmdList');
    let filtered = COMMANDS.slice();
    let sel = 0;

    function render() {
      list.innerHTML = filtered.map((c, i) =>
        '<div class="cmdItem' + (i === sel ? ' active' : '') + '" data-i="' + i + '">' + c.label + '</div>'
      ).join('');
      list.querySelectorAll('.cmdItem').forEach(el => {
        el.onclick = () => { filtered[+el.dataset.i].run(); close(); };
      });
    }

    input.value = '';
    input.focus();
    filtered = COMMANDS.slice();
    sel = 0;
    render();

    input.oninput = () => {
      const q = input.value.toLowerCase();
      filtered = COMMANDS.filter(c => c.label.toLowerCase().includes(q));
      sel = 0;
      render();
    };
    input.onkeydown = e => {
      if (e.key === 'ArrowDown') { sel = Math.min(filtered.length - 1, sel + 1); render(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); render(); e.preventDefault(); }
      if (e.key === 'Enter' && filtered[sel]) { filtered[sel].run(); close(); e.preventDefault(); }
      if (e.key === 'Escape') { close(); e.preventDefault(); }
    };
  }

  function close() {
    const overlay = document.getElementById('cmdPalette');
    if (overlay) overlay.classList.add('hidden');
  }

  addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      open();
    }
  });

  window.CommandPalette = { open, close };
})();
