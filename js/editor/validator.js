/**
 * SNES Engine Studio V7 — Validador de projeto
 */
(function (global) {
  'use strict';

  function validate(project) {
    const issues = [];
    if (!project) {
      issues.push({ level: 'error', msg: 'Projeto inválido' });
      return issues;
    }
    const type = project.gameType || (project.settings && project.settings.type) || 'platform';
    if (!['platform', 'topdown', 'shooter'].includes(type)) {
      issues.push({ level: 'error', msg: 'Tipo de jogo desconhecido: ' + type });
    }
    if (!project.scenes || !project.scenes.length) {
      issues.push({ level: 'error', msg: 'Nenhuma cena no projeto' });
      return issues;
    }
    const ids = new Set();
    let hasPlayer = false;
    project.scenes.forEach(s => {
      if (!s.id) issues.push({ level: 'error', msg: 'Cena sem id' });
      if (ids.has(s.id)) issues.push({ level: 'error', msg: 'ID de cena duplicado: ' + s.id });
      ids.add(s.id);
      if (!s.layers && !s.map) issues.push({ level: 'warning', msg: 'Cena ' + s.name + ' sem mapa' });
      (s.entities || []).forEach(e => {
        if (e.type === 'player') hasPlayer = true;
        if (e.type === 'door' && e.targetScene && !project.scenes.find(x => x.id === e.targetScene)) {
          issues.push({ level: 'warning', msg: 'Porta aponta para cena inexistente: ' + e.targetScene });
        }
      });
    });
    if (!hasPlayer) issues.push({ level: 'error', msg: 'Nenhum player no projeto' });
    if (!project.currentScene || !project.scenes.find(s => s.id === project.currentScene)) {
      issues.push({ level: 'warning', msg: 'Cena atual inválida — usando a primeira' });
    }
    if (type === 'shooter') {
      const sc = project.scenes.find(s => s.id === project.currentScene) || project.scenes[0];
      const hasWave = (sc.entities || []).some(e => e.type === 'spawner' || e.boss);
      if (!hasWave) issues.push({ level: 'info', msg: 'Shooter sem spawner/onda — uma onda automática será usada' });
    }
    return issues;
  }

  global.ProjectValidator = { validate };
})(typeof window !== 'undefined' ? window : globalThis);
