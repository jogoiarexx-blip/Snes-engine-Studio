/**
 * SNES Engine Studio 0.9 — Sistema de Upgrades e Habilidades
 * Compartilhado entre gêneros; persistível no projeto / save do jogador.
 */
(function (global) {
  'use strict';

  /**
   * Catálogo de habilidades/upgrades.
   * stackable: pode comprar várias vezes
   * maxRank: limite de nível
   * cost: função (rank) => custo em pontos
   * apply: (entity, rank, ctx) => void
   * requires: ids de outras habilidades
   */
  const CATALOG = {
    // —— Movimento (metroidvania / platform) ——
    double_jump: {
      id: 'double_jump', label: 'Pulo Duplo', icon: '⬆⬆',
      category: 'movement', genres: ['metroidvania', 'platform'],
      desc: 'Pule novamente no ar.',
      maxRank: 1, cost: function () { return 0; }, // obtido no mundo
      unlockOnly: true,
      apply: function (p) { p.abilities = p.abilities || {}; p.abilities.double_jump = true; }
    },
    dash: {
      id: 'dash', label: 'Dash', icon: '⚡',
      category: 'movement', genres: ['metroidvania', 'platform'],
      desc: 'Impulso horizontal rápido com i-frames.',
      maxRank: 1, cost: function () { return 0; },
      unlockOnly: true,
      apply: function (p) { p.abilities = p.abilities || {}; p.abilities.dash = true; }
    },
    wall_jump: {
      id: 'wall_jump', label: 'Wall Jump', icon: '🧗',
      category: 'movement', genres: ['metroidvania'],
      desc: 'Salte paredes para alcançar novas áreas.',
      maxRank: 1, cost: function () { return 0; },
      unlockOnly: true,
      apply: function (p) { p.abilities = p.abilities || {}; p.abilities.wall_jump = true; }
    },
    speed_up: {
      id: 'speed_up', label: 'Passo Ágil', icon: '💨',
      category: 'movement', genres: ['metroidvania', 'platform', 'beat-em-up', 'topdown'],
      desc: '+8% velocidade por nível.',
      maxRank: 5, cost: function (r) { return 30 + r * 25; },
      apply: function (p, rank) {
        p._upgradeSpeed = 1 + 0.08 * rank;
        p.speed = (p.baseSpeed || p.speed || 100) * p._upgradeSpeed;
      }
    },
    jump_boost: {
      id: 'jump_boost', label: 'Pulo Reforçado', icon: '🦘',
      category: 'movement', genres: ['metroidvania', 'platform'],
      desc: '+6% altura de pulo por nível.',
      maxRank: 3, cost: function (r) { return 40 + r * 30; },
      apply: function (p, rank) {
        p.jump = (p.baseJump || p.jump || 290) * (1 + 0.06 * rank);
      }
    },

    // —— Combate ——
    atk_power: {
      id: 'atk_power', label: 'Força', icon: '⚔',
      category: 'combat', genres: ['metroidvania', 'platform', 'beat-em-up', 'topdown'],
      desc: '+1 dano de ataque por nível.',
      maxRank: 5, cost: function (r) { return 35 + r * 30; },
      apply: function (p, rank) { p.atkBonus = rank; }
    },
    max_hp: {
      id: 'max_hp', label: 'Vitalidade', icon: '❤',
      category: 'combat', genres: ['metroidvania', 'platform', 'beat-em-up', 'topdown', 'shooter'],
      desc: '+1 vida máxima por nível.',
      maxRank: 5, cost: function (r) { return 40 + r * 35; },
      apply: function (p, rank) {
        const base = p.baseMaxHp || p.maxHp || 5;
        p.maxHp = base + rank;
        if (p.hp > p.maxHp) p.hp = p.maxHp;
      }
    },
    crit_chance: {
      id: 'crit_chance', label: 'Crítico', icon: '💥',
      category: 'combat', genres: ['metroidvania', 'beat-em-up', 'topdown'],
      desc: '+8% chance de crítico por nível.',
      maxRank: 3, cost: function (r) { return 50 + r * 40; },
      apply: function (p, rank) { p.critChance = 0.08 * rank; }
    },
    life_steal: {
      id: 'life_steal', label: 'Roubo de Vida', icon: '🩸',
      category: 'combat', genres: ['metroidvania', 'beat-em-up'],
      desc: '15% de chance de curar 1 HP ao abater.',
      maxRank: 1, cost: function () { return 120; },
      apply: function (p, rank) { p.lifeSteal = rank > 0; }
    },

    // —— Beat'em up específicos ——
    energy_gain: {
      id: 'energy_gain', label: 'Fúria', icon: '🔥',
      category: 'combat', genres: ['beat-em-up'],
      desc: '+20% ganho de energia de especial.',
      maxRank: 3, cost: function (r) { return 45 + r * 35; },
      apply: function (p, rank) { p.energyMult = 1 + 0.2 * rank; }
    },
    combo_window: {
      id: 'combo_window', label: 'Ritmo', icon: '🥁',
      category: 'combat', genres: ['beat-em-up'],
      desc: 'Janela de combo mais longa.',
      maxRank: 2, cost: function (r) { return 40 + r * 30; },
      apply: function (p, rank) { p.comboWindowBonus = 0.25 * rank; }
    },

    // —— Utilitário ——
    magnet: {
      id: 'magnet', label: 'Ímã', icon: '🧲',
      category: 'utility', genres: ['metroidvania', 'platform'],
      desc: 'Coleta itens de mais longe.',
      maxRank: 1, cost: function () { return 60; },
      apply: function (p, rank) { p.magnet = rank > 0; }
    },
    shield_start: {
      id: 'shield_start', label: 'Escudo Inicial', icon: '🛡',
      category: 'utility', genres: ['metroidvania', 'beat-em-up', 'shooter'],
      desc: 'Começa com 1s de invencibilidade.',
      maxRank: 1, cost: function () { return 80; },
      apply: function (p, rank) { p.startShield = rank > 0; }
    }
  };

  function createState(opts) {
    opts = opts || {};
    return {
      points: opts.points || 0,
      unlocked: Object.assign({}, opts.unlocked || {}), // id -> rank
      genres: opts.genres || null
    };
  }

  function getRank(state, id) {
    return (state && state.unlocked && state.unlocked[id]) || 0;
  }

  function isUnlocked(state, id) {
    return getRank(state, id) > 0 || (CATALOG[id] && CATALOG[id].unlockOnly && getRank(state, id) >= 1);
  }

  function canBuy(state, id) {
    const def = CATALOG[id];
    if (!def || def.unlockOnly) return false;
    const rank = getRank(state, id);
    if (rank >= def.maxRank) return false;
    if (def.requires) {
      for (let i = 0; i < def.requires.length; i++) {
        if (getRank(state, def.requires[i]) < 1) return false;
      }
    }
    const cost = def.cost(rank);
    return state.points >= cost;
  }

  function buy(state, id) {
    const def = CATALOG[id];
    if (!canBuy(state, id)) return false;
    const rank = getRank(state, id);
    const cost = def.cost(rank);
    state.points -= cost;
    state.unlocked[id] = rank + 1;
    return true;
  }

  /** Desbloqueia habilidade do mundo (sem custo) */
  function unlock(state, id) {
    const def = CATALOG[id];
    if (!def) {
      state.unlocked[id] = 1;
      return true;
    }
    const rank = getRank(state, id);
    if (rank >= def.maxRank) return false;
    state.unlocked[id] = Math.max(1, rank);
    if (!def.unlockOnly) state.unlocked[id] = Math.min(def.maxRank, rank + 1);
    else state.unlocked[id] = 1;
    return true;
  }

  function addPoints(state, n) {
    state.points = (state.points || 0) + (n || 0);
  }

  /** Aplica todos os ranks ao jogador/entity */
  function applyAll(state, entity) {
    if (!state || !entity) return;
    entity.baseSpeed = entity.baseSpeed || entity.speed;
    entity.baseJump = entity.baseJump || entity.jump;
    entity.baseMaxHp = entity.baseMaxHp || entity.maxHp;
    entity.abilities = entity.abilities || {};
    entity.atkBonus = 0;
    entity.critChance = 0;
    entity.lifeSteal = false;
    entity.energyMult = 1;
    entity.comboWindowBonus = 0;
    entity.magnet = false;
    entity.startShield = false;

    Object.keys(state.unlocked || {}).forEach(function (id) {
      const def = CATALOG[id];
      const rank = state.unlocked[id];
      if (!def || rank < 1) {
        // world ability not in catalog
        entity.abilities[id] = true;
        return;
      }
      def.apply(entity, rank);
      if (def.unlockOnly) entity.abilities[id] = true;
    });

    if (entity.startShield) {
      entity.invUntil = (typeof performance !== 'undefined' ? performance.now() : 0) + 1000;
    }
  }

  function listForGenre(gameType) {
    return Object.keys(CATALOG)
      .map(function (id) { return CATALOG[id]; })
      .filter(function (d) {
        return !d.genres || d.genres.indexOf(gameType) >= 0;
      });
  }

  function rollDamage(entity, base) {
    let dmg = (base || 1) + (entity.atkBonus || 0);
    if (entity.critChance && Math.random() < entity.critChance) dmg *= 2;
    return dmg;
  }

  function onKill(entity, upgradeState) {
    if (entity.lifeSteal && Math.random() < 0.15) {
      entity.hp = Math.min(entity.maxHp, (entity.hp || 0) + 1);
    }
    if (upgradeState) addPoints(upgradeState, 5);
  }

  // Persist helpers
  function toJSON(state) {
    return { points: state.points || 0, unlocked: Object.assign({}, state.unlocked || {}) };
  }

  function fromJSON(data) {
    return createState(data || {});
  }

  global.SNESUpgrades = {
    CATALOG: CATALOG,
    createState: createState,
    getRank: getRank,
    isUnlocked: isUnlocked,
    canBuy: canBuy,
    buy: buy,
    unlock: unlock,
    addPoints: addPoints,
    applyAll: applyAll,
    listForGenre: listForGenre,
    rollDamage: rollDamage,
    onKill: onKill,
    toJSON: toJSON,
    fromJSON: fromJSON
  };
})(typeof window !== 'undefined' ? window : globalThis);
