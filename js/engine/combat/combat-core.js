/**
 * SNES Engine Studio 0.9 — Sistema genérico de combate
 * Reutilizado por metroidvania, beat'em up, top-down
 */
(function (global) {
  'use strict';

  function Health(max) {
    return { hp: max, maxHp: max, dead: false };
  }

  function takeDamage(ent, amount, opts) {
    opts = opts || {};
    const now = opts.now || performance.now();
    if (ent.invUntil && now < ent.invUntil) return false;
    if (ent.dead) return false;
    const reduced = Math.max(1, amount - (ent.damageReduce || 0));
    ent.hp = Math.max(0, (ent.hp != null ? ent.hp : ent.maxHp || 1) - (amount <= 0 ? 0 : reduced));
    ent.invUntil = now + (opts.iFrames || 400);
    if (opts.knockback && opts.from) {
      const dx = ent.x - opts.from.x;
      const dy = ent.y - opts.from.y;
      const d = Math.hypot(dx, dy) || 1;
      ent.vx = (ent.vx || 0) + (dx / d) * (opts.knockback || 120);
      ent.vy = (ent.vy || 0) + (dy / d) * (opts.knockback || 80);
    }
    if (ent.hp <= 0) {
      ent.dead = true;
      ent.deathAt = now;
    }
    return true;
  }

  function Hitbox(x, y, w, h) {
    return { x: x, y: y, w: w, h: h };
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function entityHurtbox(e) {
    return { x: e.x, y: e.y, w: e.w || 16, h: e.h || 16 };
  }

  function attackHitbox(e, atk) {
    const dir = e.facing === 'left' ? -1 : e.facing === 'up' ? 0 : e.facing === 'down' ? 0 : 1;
    const range = atk.range || 20;
    const w = atk.w || range;
    const h = atk.h || 14;
    let x = e.x, y = e.y + (e.h || 16) * 0.3;
    if (e.facing === 'left') x = e.x - w;
    else if (e.facing === 'right') x = e.x + (e.w || 16);
    else if (e.facing === 'up') { x = e.x; y = e.y - h; }
    else if (e.facing === 'down') { y = e.y + (e.h || 16); }
    return { x: x, y: y, w: w, h: h };
  }

  /** Pool simples de projéteis */
  function createProjectilePool(max) {
    max = max || 32;
    const pool = [];
    for (let i = 0; i < max; i++) {
      pool.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, damage: 1, w: 6, h: 6, owner: null, faction: 0 });
    }
    return {
      pool: pool,
      spawn: function (opts) {
        for (let i = 0; i < pool.length; i++) {
          if (!pool[i].active) {
            const p = pool[i];
            p.active = true;
            p.x = opts.x; p.y = opts.y;
            p.vx = opts.vx || 0; p.vy = opts.vy || 0;
            p.life = opts.life || 1.5;
            p.damage = opts.damage || 1;
            p.w = opts.w || 6; p.h = opts.h || 6;
            p.owner = opts.owner || null;
            p.faction = opts.faction || 0;
            return p;
          }
        }
        return null;
      },
      update: function (dt, onHit) {
        for (let i = 0; i < pool.length; i++) {
          const p = pool[i];
          if (!p.active) continue;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          if (p.life <= 0) { p.active = false; continue; }
          if (onHit) onHit(p);
        }
      },
      each: function (fn) {
        for (let i = 0; i < pool.length; i++) if (pool[i].active) fn(pool[i]);
      }
    };
  }

  function ComboController(moves) {
    return {
      moves: moves || [],
      index: 0,
      timer: 0,
      window: 0.4,
      reset: function () { this.index = 0; this.timer = 0; },
      tryAttack: function (dt) {
        this.timer -= dt;
        if (this.timer <= 0) this.index = 0;
        const move = this.moves[this.index] || this.moves[0];
        this.index = (this.index + 1) % Math.max(1, this.moves.length);
        this.timer = this.window;
        return move;
      }
    };
  }

  /** Fila de ataque para beat'em up — só N inimigos atacam ao mesmo tempo */
  function AttackTokenQueue(maxActive) {
    return {
      max: maxActive || 2,
      active: [],
      request: function (id) {
        if (this.active.indexOf(id) >= 0) return true;
        if (this.active.length < this.max) {
          this.active.push(id);
          return true;
        }
        return false;
      },
      release: function (id) {
        this.active = this.active.filter(function (x) { return x !== id; });
      }
    };
  }

  global.SNESCombat = {
    Health: Health,
    takeDamage: takeDamage,
    Hitbox: Hitbox,
    overlaps: overlaps,
    entityHurtbox: entityHurtbox,
    attackHitbox: attackHitbox,
    createProjectilePool: createProjectilePool,
    ComboController: ComboController,
    AttackTokenQueue: AttackTokenQueue
  };
})(typeof window !== 'undefined' ? window : globalThis);
