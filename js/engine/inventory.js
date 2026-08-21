/**
 * SNES Engine Studio 0.9 — Sistema de Inventário de Itens
 * Stackable, usáveis, equipamentos, chaveiros e loot.
 */
(function (global) {
  'use strict';

  /** Catálogo de itens */
  const ITEMS = {
    // Consumíveis
    potion_small: {
      id: 'potion_small', name: 'Poção Pequena', icon: '🧪',
      category: 'consumable', stack: 10,
      desc: 'Restaura 3 de vida.',
      use: function (holder) {
        if (!holder || holder.hp == null) return false;
        if (holder.hp >= holder.maxHp) return false;
        holder.hp = Math.min(holder.maxHp, holder.hp + 3);
        return true;
      }
    },
    potion_large: {
      id: 'potion_large', name: 'Poção Grande', icon: '💉',
      category: 'consumable', stack: 5,
      desc: 'Restaura 8 de vida.',
      use: function (holder) {
        if (!holder || holder.hp == null) return false;
        if (holder.hp >= holder.maxHp) return false;
        holder.hp = Math.min(holder.maxHp, holder.hp + 8);
        return true;
      }
    },
    ether: {
      id: 'ether', name: 'Éter', icon: '💙',
      category: 'consumable', stack: 5,
      desc: 'Restaura 40 de energia.',
      use: function (holder) {
        if (holder.energy == null) return false;
        holder.energy = Math.min(holder.maxEnergy || 100, (holder.energy || 0) + 40);
        return true;
      }
    },
    antidote: {
      id: 'antidote', name: 'Antídoto', icon: '🟢',
      category: 'consumable', stack: 5,
      desc: 'Remove veneno/status.',
      use: function (holder) {
        if (holder.status) holder.status = null;
        holder.poisoned = false;
        return true;
      }
    },

    // Chaves / quest
    key: {
      id: 'key', name: 'Chave', icon: '🔑',
      category: 'key', stack: 20,
      desc: 'Abre portas trancadas.'
    },
    boss_key: {
      id: 'boss_key', name: 'Chave do Chefe', icon: '🗝',
      category: 'key', stack: 5,
      desc: 'Abre a porta do santuário.'
    },
    map_fragment: {
      id: 'map_fragment', name: 'Fragmento de Mapa', icon: '🗺',
      category: 'key', stack: 10,
      desc: 'Revela salas no minimapa.'
    },

    // Equipamentos (passivos ao equipar)
    ring_power: {
      id: 'ring_power', name: 'Anel da Força', icon: '💍',
      category: 'equip', slot: 'ring', stack: 1,
      desc: '+1 dano enquanto equipado.',
      onEquip: function (h) { h.atkBonus = (h.atkBonus || 0) + 1; },
      onUnequip: function (h) { h.atkBonus = Math.max(0, (h.atkBonus || 0) - 1); }
    },
    ring_life: {
      id: 'ring_life', name: 'Anel Vital', icon: '💛',
      category: 'equip', slot: 'ring', stack: 1,
      desc: '+2 vida máxima enquanto equipado.',
      onEquip: function (h) {
        h.maxHp = (h.maxHp || 5) + 2;
        h.hp = Math.min(h.maxHp, (h.hp || 0) + 2);
      },
      onUnequip: function (h) {
        h.maxHp = Math.max(1, (h.maxHp || 5) - 2);
        h.hp = Math.min(h.hp, h.maxHp);
      }
    },
    boots_speed: {
      id: 'boots_speed', name: 'Botas Ligeiras', icon: '👢',
      category: 'equip', slot: 'boots', stack: 1,
      desc: '+12% velocidade.',
      onEquip: function (h) {
        h._bootMult = 1.12;
        h.speed = (h.baseSpeed || h.speed || 100) * (h._upgradeSpeed || 1) * 1.12;
      },
      onUnequip: function (h) {
        h._bootMult = 1;
        h.speed = (h.baseSpeed || h.speed || 100) * (h._upgradeSpeed || 1);
      }
    },
    amulet_shield: {
      id: 'amulet_shield', name: 'Amuleto', icon: '🔮',
      category: 'equip', slot: 'amulet', stack: 1,
      desc: 'Reduz dano recebido em 1 (mín. 1).',
      onEquip: function (h) { h.damageReduce = (h.damageReduce || 0) + 1; },
      onUnequip: function (h) { h.damageReduce = Math.max(0, (h.damageReduce || 0) - 1); }
    },

    // Armas / beat'em up
    bat: {
      id: 'bat', name: 'Taco', icon: '🏏',
      category: 'weapon', stack: 1,
      desc: 'Arma: +1 alcance e dano.',
      onEquip: function (h) { h.weapon = 'bat'; h.weaponRange = 36; h.weaponDamage = 1; },
      onUnequip: function (h) { if (h.weapon === 'bat') { h.weapon = null; h.weaponRange = 0; h.weaponDamage = 0; } }
    },
    pipe: {
      id: 'pipe', name: 'Cano', icon: '🔧',
      category: 'weapon', stack: 1,
      desc: 'Arma pesada: +2 dano.',
      onEquip: function (h) { h.weapon = 'pipe'; h.weaponRange = 32; h.weaponDamage = 2; },
      onUnequip: function (h) { if (h.weapon === 'pipe') { h.weapon = null; h.weaponRange = 0; h.weaponDamage = 0; } }
    },

    // Materiais / loot
    coin: {
      id: 'coin', name: 'Moeda', icon: '🪙',
      category: 'material', stack: 99,
      desc: 'Moeda comum.'
    },
    gem: {
      id: 'gem', name: 'Gema', icon: '💎',
      category: 'material', stack: 50,
      desc: 'Vale 10 pontos de upgrade.'
    },
    heart_piece: {
      id: 'heart_piece', name: 'Pedaço de Coração', icon: '❤',
      category: 'material', stack: 4,
      desc: '4 pedaços = +1 vida máxima.'
    }
  };

  function createInventory(opts) {
    opts = opts || {};
    return {
      slots: opts.slots || [],       // { id, qty }
      capacity: opts.capacity || 20,
      equipped: Object.assign({ ring: null, boots: null, amulet: null, weapon: null }, opts.equipped || {})
    };
  }

  function findSlot(inv, id) {
    for (let i = 0; i < inv.slots.length; i++) {
      if (inv.slots[i].id === id) return i;
    }
    return -1;
  }

  function count(inv, id) {
    let n = 0;
    inv.slots.forEach(function (s) { if (s.id === id) n += s.qty; });
    return n;
  }

  function has(inv, id, qty) {
    return count(inv, id) >= (qty || 1);
  }

  function add(inv, id, qty) {
    qty = qty || 1;
    const def = ITEMS[id];
    if (!def) return false;
    const maxStack = def.stack || 1;
    // stack existing
    for (let i = 0; i < inv.slots.length && qty > 0; i++) {
      const s = inv.slots[i];
      if (s.id === id && s.qty < maxStack) {
        const addN = Math.min(maxStack - s.qty, qty);
        s.qty += addN;
        qty -= addN;
      }
    }
    while (qty > 0) {
      if (inv.slots.length >= inv.capacity) return qty === 0;
      const put = Math.min(maxStack, qty);
      inv.slots.push({ id: id, qty: put });
      qty -= put;
    }
    return true;
  }

  function remove(inv, id, qty) {
    qty = qty || 1;
    if (!has(inv, id, qty)) return false;
    for (let i = inv.slots.length - 1; i >= 0 && qty > 0; i--) {
      const s = inv.slots[i];
      if (s.id !== id) continue;
      const take = Math.min(s.qty, qty);
      s.qty -= take;
      qty -= take;
      if (s.qty <= 0) inv.slots.splice(i, 1);
    }
    return true;
  }

  function use(inv, id, holder) {
    const def = ITEMS[id];
    if (!def || !def.use) return false;
    if (!has(inv, id, 1)) return false;
    if (!def.use(holder)) return false;
    remove(inv, id, 1);
    return true;
  }

  function equip(inv, id, holder) {
    const def = ITEMS[id];
    if (!def || (def.category !== 'equip' && def.category !== 'weapon')) return false;
    if (!has(inv, id, 1)) return false;
    const slot = def.slot || (def.category === 'weapon' ? 'weapon' : null);
    if (!slot) return false;
    // unequip previous
    const prev = inv.equipped[slot];
    if (prev) {
      const prevDef = ITEMS[prev];
      if (prevDef && prevDef.onUnequip) prevDef.onUnequip(holder);
      add(inv, prev, 1);
    }
    remove(inv, id, 1);
    inv.equipped[slot] = id;
    if (def.onEquip) def.onEquip(holder);
    return true;
  }

  function unequip(inv, slot, holder) {
    const id = inv.equipped[slot];
    if (!id) return false;
    const def = ITEMS[id];
    if (def && def.onUnequip) def.onUnequip(holder);
    inv.equipped[slot] = null;
    add(inv, id, 1);
    return true;
  }

  function reapplyEquipment(inv, holder) {
    ['ring', 'boots', 'amulet', 'weapon'].forEach(function (slot) {
      const id = inv.equipped[slot];
      if (!id) return;
      const def = ITEMS[id];
      if (def && def.onEquip) def.onEquip(holder);
    });
  }

  /** Converte pedaços de coração automaticamente */
  function tryCraftHearts(inv, holder) {
    while (count(inv, 'heart_piece') >= 4) {
      remove(inv, 'heart_piece', 4);
      if (holder) {
        holder.maxHp = (holder.maxHp || 5) + 1;
        holder.hp = holder.maxHp;
      }
    }
  }

  /** Converte gemas em pontos de upgrade */
  function convertGems(inv, upgradeState) {
    const n = count(inv, 'gem');
    if (n <= 0 || !upgradeState || !global.SNESUpgrades) return 0;
    remove(inv, 'gem', n);
    global.SNESUpgrades.addPoints(upgradeState, n * 10);
    return n;
  }

  function toJSON(inv) {
    return {
      slots: (inv.slots || []).map(function (s) { return { id: s.id, qty: s.qty }; }),
      capacity: inv.capacity,
      equipped: Object.assign({}, inv.equipped || {})
    };
  }

  function fromJSON(data) {
    return createInventory(data || {});
  }

  function getDef(id) { return ITEMS[id] || null; }

  function listCategory(cat) {
    return Object.keys(ITEMS).map(function (k) { return ITEMS[k]; })
      .filter(function (d) { return d.category === cat; });
  }

  // Drop tables simples
  const DROPS = {
    enemy_basic: [
      { id: 'coin', chance: 0.4, qty: [1, 3] },
      { id: 'potion_small', chance: 0.12, qty: [1, 1] },
      { id: 'heart_piece', chance: 0.05, qty: [1, 1] }
    ],
    enemy_heavy: [
      { id: 'coin', chance: 0.6, qty: [2, 5] },
      { id: 'potion_small', chance: 0.2, qty: [1, 1] },
      { id: 'gem', chance: 0.1, qty: [1, 1] }
    ],
    boss: [
      { id: 'potion_large', chance: 1, qty: [1, 1] },
      { id: 'gem', chance: 1, qty: [2, 3] },
      { id: 'boss_key', chance: 0.5, qty: [1, 1] }
    ],
    crate: [
      { id: 'coin', chance: 0.5, qty: [1, 4] },
      { id: 'potion_small', chance: 0.25, qty: [1, 1] },
      { id: 'bat', chance: 0.08, qty: [1, 1] },
      { id: 'ether', chance: 0.1, qty: [1, 1] }
    ]
  };

  function rollDrop(tableName, rng) {
    rng = rng || Math.random;
    const table = DROPS[tableName] || DROPS.enemy_basic;
    const out = [];
    table.forEach(function (entry) {
      if (rng() < entry.chance) {
        const q = entry.qty[0] + Math.floor(rng() * (entry.qty[1] - entry.qty[0] + 1));
        out.push({ id: entry.id, qty: q });
      }
    });
    return out;
  }

  global.SNESInventory = {
    ITEMS: ITEMS,
    DROPS: DROPS,
    create: createInventory,
    add: add,
    remove: remove,
    has: has,
    count: count,
    use: use,
    equip: equip,
    unequip: unequip,
    reapplyEquipment: reapplyEquipment,
    tryCraftHearts: tryCraftHearts,
    convertGems: convertGems,
    toJSON: toJSON,
    fromJSON: fromJSON,
    getDef: getDef,
    listCategory: listCategory,
    rollDrop: rollDrop
  };
})(typeof window !== 'undefined' ? window : globalThis);
