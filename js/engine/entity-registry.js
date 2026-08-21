/**
 * SNES Engine Studio V7 — Registro central de entidades por estilo de jogo
 */
(function (global) {
  'use strict';
  const registry = Object.create(null);

  function register(type, def) {
    registry[type] = Object.assign({
      type: type,
      label: type,
      supportedGameTypes: ['platform', 'topdown', 'shooter'],
      category: 'geral',
      defaults: {},
      icon: '•'
    }, def || {});
  }

  function get(type) { return registry[type] || null; }

  function listForGameType(gameType) {
    return Object.keys(registry)
      .map(k => registry[k])
      .filter(d => !gameType || (d.supportedGameTypes || []).includes(gameType));
  }

  function create(type, overrides) {
    const d = registry[type];
    if (!d) return null;
    const id = (overrides && overrides.id) || (type + Date.now() + Math.floor(Math.random() * 999));
    return Object.assign({ id, type, name: d.label }, JSON.parse(JSON.stringify(d.defaults || {})), overrides || {});
  }

  // --- Registros padrão ---
  register('player', {
    label: 'Player', icon: '🧍', category: 'personagem',
    supportedGameTypes: ['platform', 'topdown', 'shooter'],
    defaults: { x: 64, y: 200, hp: 3, speed: 120, jump: 300, w: 12, h: 14 }
  });
  register('enemy', {
    label: 'Inimigo', icon: '👾', category: 'inimigo',
    supportedGameTypes: ['platform', 'topdown', 'shooter'],
    defaults: { x: 200, y: 200, hp: 2, speed: 35, damage: 1, w: 14, h: 14 }
  });
  register('skeleton', {
    label: 'Caveira Espadachim', icon: '💀', category: 'inimigo',
    supportedGameTypes: ['platform'],
    defaults: {
      type: 'enemy', sprite: 'skeleton', name: 'Caveira Espadachim',
      x: 360, y: 200, hp: 6, maxHp: 6, speed: 38, damage: 1,
      facing: 'left', vision: 170, attackRange: 30, patrolMin: 300, patrolMax: 420,
      w: 22, h: 46
    }
  });
  register('boss', {
    label: 'Boss', icon: '👹', category: 'inimigo',
    supportedGameTypes: ['platform', 'topdown', 'shooter'],
    defaults: { type: 'enemy', boss: true, x: 400, y: 180, hp: 20, maxHp: 20, speed: 30, damage: 2, w: 24, h: 24 }
  });
  register('npc', {
    label: 'NPC', icon: '💬', category: 'personagem',
    supportedGameTypes: ['platform', 'topdown'],
    defaults: { x: 160, y: 160, dialog: 'Olá, viajante!', w: 14, h: 16 }
  });
  register('item', {
    label: 'Item', icon: '🪙', category: 'objeto',
    supportedGameTypes: ['platform', 'topdown'],
    defaults: { x: 200, y: 160, itemKind: 'coin', w: 12, h: 12 }
  });
  register('chest', {
    label: 'Baú', icon: '📦', category: 'objeto',
    supportedGameTypes: ['platform', 'topdown'],
    defaults: { x: 180, y: 180, opened: false, loot: 'score', w: 16, h: 14 }
  });
  register('door', {
    label: 'Porta', icon: '🚪', category: 'objeto',
    supportedGameTypes: ['platform', 'topdown'],
    defaults: { x: 400, y: 200, event: 'nextScene', locked: false, w: 16, h: 20 }
  });
  register('checkpoint', {
    label: 'Checkpoint', icon: '🚩', category: 'objeto',
    supportedGameTypes: ['platform'],
    defaults: { x: 120, y: 200, activated: false, w: 12, h: 18 }
  });
  register('powerup', {
    label: 'Power-up', icon: '⭐', category: 'objeto',
    supportedGameTypes: ['shooter'],
    defaults: { x: 256, y: 80, power: 'double', w: 12, h: 12 }
  });
  register('spawner', {
    label: 'Spawner / Onda', icon: '🌊', category: 'sistema',
    supportedGameTypes: ['shooter'],
    defaults: { x: 500, y: 100, waveId: 'wave1', count: 5, interval: 0.8, enemyType: 'enemy', path: 'sine' }
  });
  register('object', {
    label: 'Objeto', icon: '🪨', category: 'objeto',
    supportedGameTypes: ['platform', 'topdown'],
    defaults: { x: 100, y: 200, sub: 'pedra_obj', w: 14, h: 14 }
  });
  register('event_area', {
    label: 'Área de evento', icon: '⬚', category: 'sistema',
    supportedGameTypes: ['topdown', 'platform'],
    defaults: { x: 200, y: 150, w: 32, h: 32, event: 'dialog', dialog: 'Você encontrou algo!' }
  });


  register('moving_platform', {
    label: 'Plataforma móvel', icon: '↔', category: 'objeto',
    supportedGameTypes: ['platform'],
    defaults: { x: 160, y: 180, w: 48, h: 8, axis: 'x', min: 120, max: 280, speed: 40, name: 'Plataforma móvel' }
  });
  register('ladder', {
    label: 'Escada', icon: '≡', category: 'objeto',
    supportedGameTypes: ['platform'],
    defaults: { x: 200, y: 120, w: 16, h: 64, name: 'Escada' }
  });
  global.EntityRegistry = { register, get, listForGameType, create, _all: registry };
})(typeof window !== 'undefined' ? window : globalThis);
