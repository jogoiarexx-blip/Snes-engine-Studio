/**
 * SNES Engine Studio 0.8 — Sistema de itens do Kart (originais)
 */
(function (global) {
  'use strict';

  const ITEM_TYPES = {
    turbo: { id: 'turbo', label: 'Turbo', kind: 'boost', icon: '⚡', duration: 1.2 },
    shield: { id: 'shield', label: 'Escudo', kind: 'defense', icon: '🛡', duration: 4 },
    mine: { id: 'mine', label: 'Mina', kind: 'trap', icon: '💣', duration: 0 },
    bolt: { id: 'bolt', label: 'Projétil', kind: 'projectile', icon: '➤', duration: 0 },
    oil: { id: 'oil', label: 'Óleo', kind: 'trap', icon: '🛢', duration: 0 },
    pulse: { id: 'pulse', label: 'Pulso', kind: 'offense', icon: '✴', duration: 0.3 }
  };

  const POOL = ['turbo', 'shield', 'mine', 'bolt', 'oil', 'pulse'];

  function randomItem() {
    return POOL[Math.floor(Math.random() * POOL.length)];
  }

  function createItemManager() {
    return {
      projectiles: [],
      traps: [],
      pool: [],

      spawnTrap(type, x, y, ownerId) {
        this.traps.push({ type, x, y, r: 14, ownerId, life: 20, active: true });
      },

      spawnProjectile(type, x, y, angle, ownerId) {
        this.projectiles.push({
          type, x, y, angle, ownerId,
          speed: type === 'bolt' ? 380 : 280,
          life: 2.5, r: 8
        });
      },

      update(dt, racers, onHit) {
        // projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
          const p = this.projectiles[i];
          p.x += Math.cos(p.angle) * p.speed * dt;
          p.y += Math.sin(p.angle) * p.speed * dt;
          p.life -= dt;
          let hit = false;
          for (const r of racers) {
            if (r.id === p.ownerId || r.finished || r.invUntil > performance.now()) continue;
            const dx = r.x - p.x, dy = r.y - p.y;
            if (dx * dx + dy * dy < (r.radius + p.r) * (r.radius + p.r)) {
              onHit(r, p.type, p.ownerId);
              hit = true;
              break;
            }
          }
          if (hit || p.life <= 0) this.projectiles.splice(i, 1);
        }
        // traps
        for (let i = this.traps.length - 1; i >= 0; i--) {
          const tr = this.traps[i];
          tr.life -= dt;
          if (tr.life <= 0) { this.traps.splice(i, 1); continue; }
          for (const r of racers) {
            if (r.id === tr.ownerId || r.finished || r.invUntil > performance.now()) continue;
            const dx = r.x - tr.x, dy = r.y - tr.y;
            if (dx * dx + dy * dy < (r.radius + tr.r) * (r.radius + tr.r)) {
              onHit(r, tr.type, tr.ownerId);
              this.traps.splice(i, 1);
              break;
            }
          }
        }
      },

      use(racer, racers) {
        if (!racer.item) return;
        const type = racer.item;
        const def = ITEM_TYPES[type];
        racer.item = null;
        const now = performance.now();
        if (type === 'turbo') {
          racer.boostUntil = now + def.duration * 1000;
          racer.speed *= 1.15;
        } else if (type === 'shield') {
          racer.shieldUntil = now + def.duration * 1000;
          racer.invUntil = racer.shieldUntil;
        } else if (type === 'mine' || type === 'oil') {
          const behind = racer.angle + Math.PI;
          this.spawnTrap(type, racer.x + Math.cos(behind) * 28, racer.y + Math.sin(behind) * 28, racer.id);
        } else if (type === 'bolt') {
          this.spawnProjectile('bolt', racer.x + Math.cos(racer.angle) * 20, racer.y + Math.sin(racer.angle) * 20, racer.angle, racer.id);
        } else if (type === 'pulse') {
          for (const o of racers) {
            if (o.id === racer.id || o.finished) continue;
            const dx = o.x - racer.x, dy = o.y - racer.y;
            if (dx * dx + dy * dy < 120 * 120) {
              o.spinUntil = now + 600;
              o.speed *= 0.4;
            }
          }
        }
      }
    };
  }

  global.KartItems = { ITEM_TYPES, randomItem, createItemManager };
})(typeof window !== 'undefined' ? window : globalThis);
