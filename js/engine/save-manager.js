/**
 * SNES Engine Studio 1.0 — Saves versionados (editor + jogador + slots)
 */
(function (global) {
  'use strict';

  const EDITOR_KEY = 'snes_engine_studio_project_v10';
  const RECENT_KEY = 'snes_v10_recent_projects';
  const AUTOSAVE_KEY = 'snes_v10_autosave';
  const SLOT_PREFIX = 'snes_v10_slot_';
  const PLAYER_PREFIX = 'snes_v10_player_';

  function stripRuntimeState(project) {
    const p = JSON.parse(JSON.stringify(project));
    (p.scenes || []).forEach(s => {
      (s.entities || []).forEach(e => {
        delete e.vx; delete e.vy; delete e.dead; delete e.hurtUntil;
        delete e.attackUntil; delete e.animStarted; delete e.nextAttack;
        delete e.onGround; delete e.fireCD; delete e.pathT; delete e.triggered;
      });
    });
    return p;
  }

  function saveEditor(project) {
    const clean = stripRuntimeState(project); clean.version='1.0'; clean.schemaVersion=10;
    if (global.ProjectStore) global.ProjectStore.saveProject(clean).catch(function(){});
    try {
      localStorage.setItem(EDITOR_KEY, JSON.stringify(clean));
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ t: Date.now(), project: clean }));
    } catch (e) {
      // Large dataURL assets can exceed localStorage. IndexedDB remains the source of truth.
      const light = JSON.parse(JSON.stringify(clean));
      if (light.studio && light.studio.assets) light.studio.assets.forEach(function(a){ delete a.dataUrl; delete a.url; });
      try { localStorage.setItem(EDITOR_KEY, JSON.stringify(light)); localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({t:Date.now(),project:light})); } catch (_) {}
    }
    pushRecent(clean);
    return true;
  }

  function loadEditor() {
    const raw = localStorage.getItem(EDITOR_KEY)
      || localStorage.getItem('snes_engine_studio_project_v7')
      || localStorage.getItem('snes_engine_studio_project_v6')
      || localStorage.getItem('snes_engine_studio_project_v3');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }

  function loadAutosave() {
    try {
      const o = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || 'null');
      return o && o.project ? o : null;
    } catch (_) { return null; }
  }

  function saveSlot(n, project) {
    localStorage.setItem(SLOT_PREFIX + n, JSON.stringify(stripRuntimeState(project)));
  }
  function loadSlot(n) {
    try { return JSON.parse(localStorage.getItem(SLOT_PREFIX + n) || 'null'); } catch (_) { return null; }
  }

  function savePlayer(gameType, data) {
    localStorage.setItem(PLAYER_PREFIX + gameType, JSON.stringify(data));
  }
  function loadPlayer(gameType) {
    try { return JSON.parse(localStorage.getItem(PLAYER_PREFIX + gameType) || 'null'); } catch (_) { return null; }
  }

  function pushRecent(project) {
    let list = [];
    try { list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (_) {}
    list = list.filter(r => r.name !== project.name);
    list.unshift({
      name: project.name || 'Sem nome',
      gameType: project.gameType || 'platform',
      t: Date.now(),
      snapshot: stripRuntimeState(project)
    });
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)));
  }

  function listRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (_) { return []; }
  }

  global.SNESSave = {
    EDITOR_KEY, stripRuntimeState,
    saveEditor, loadEditor, loadAutosave,
    saveSlot, loadSlot, savePlayer, loadPlayer,
    pushRecent, listRecent
  };
})(typeof window !== 'undefined' ? window : globalThis);
