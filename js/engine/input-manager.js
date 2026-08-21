/**
 * SNES Engine Studio V7 — Input (teclado + touch + gamepad básico)
 */
(function (global) {
  'use strict';

  function createInput() {
    const keys = Object.create(null);
    const touch = {
      left: false, right: false, up: false, down: false,
      jump: false, attack: false, attack2: false, action: false,
      bomb: false, inventory: false, pause: false,
      stickX: 0, stickY: 0
    };
    let unbind = null;

    function bind(target) {
      const down = e => {
        const k = e.key.toLowerCase();
        keys[k] = true;
        if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'z', 'x', 'c', 'e'].includes(k)) {
          e.preventDefault();
        }
      };
      const up = e => { keys[e.key.toLowerCase()] = false; };
      target.addEventListener('keydown', down);
      target.addEventListener('keyup', up);
      unbind = () => {
        target.removeEventListener('keydown', down);
        target.removeEventListener('keyup', up);
      };
      return unbind;
    }

    function axisX() {
      let v = 0;
      if (keys.arrowleft || keys.a || touch.left) v -= 1;
      if (keys.arrowright || keys.d || touch.right) v += 1;
      if (Math.abs(touch.stickX) > 0.2) v = touch.stickX;
      // gamepad
      try {
        const gp = navigator.getGamepads && navigator.getGamepads()[0];
        if (gp) {
          if (gp.axes[0] < -0.3) v = -1;
          if (gp.axes[0] > 0.3) v = 1;
          if (gp.buttons[14] && gp.buttons[14].pressed) v = -1;
          if (gp.buttons[15] && gp.buttons[15].pressed) v = 1;
        }
      } catch (_) {}
      return Math.max(-1, Math.min(1, v));
    }

    function axisY() {
      let v = 0;
      if (keys.arrowup || keys.w || touch.up) v -= 1;
      if (keys.arrowdown || keys.s || touch.down) v += 1;
      if (Math.abs(touch.stickY) > 0.2) v = touch.stickY;
      try {
        const gp = navigator.getGamepads && navigator.getGamepads()[0];
        if (gp) {
          if (gp.axes[1] < -0.3) v = -1;
          if (gp.axes[1] > 0.3) v = 1;
          if (gp.buttons[12] && gp.buttons[12].pressed) v = -1;
          if (gp.buttons[13] && gp.buttons[13].pressed) v = 1;
        }
      } catch (_) {}
      return Math.max(-1, Math.min(1, v));
    }

    function gp() {
      try {
        const pads = navigator.getGamepads && navigator.getGamepads();
        return pads && pads[0];
      } catch (_) { return null; }
    }
    function gpBtn(i) {
      const g = gp();
      return !!(g && g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.5));
    }
    function pressed(name) {
      const km = global.__SNES_KEYMAP;
      if (km && km[name]) {
        for (const k of km[name]) {
          if (k === ' ') { if (keys[' '] || keys.space) return true; }
          else if (keys[k] || keys[k.toLowerCase()] || keys[k.toUpperCase()]) return true;
        }
      }
      // Standard mapping: A=0 B=1 X=2 Y=3 LB=4 RB=5 LT=6 RT=7 Start=9
      if (name === 'jump') return !!(keys.z || keys[' '] || touch.jump || gpBtn(0));
      if (name === 'attack') return !!(keys.x || keys.c || touch.attack || gpBtn(2) || gpBtn(1));
      if (name === 'attack2') return !!(keys.v || touch.attack2 || gpBtn(3));
      if (name === 'action') return !!(keys.e || keys.enter || touch.action || gpBtn(0));
      if (name === 'bomb') return !!(keys.b || touch.bomb || gpBtn(4) || gpBtn(5));
      if (name === 'inventory') return !!(keys.i || touch.inventory || gpBtn(8));
      if (name === 'pause') return !!(keys.p || keys.escape || touch.pause || gpBtn(9));
      return !!keys[name];
    }

    function resetTouch() {
      Object.keys(touch).forEach(k => {
        if (typeof touch[k] === 'boolean') touch[k] = false;
      });
      touch.stickX = 0;
      touch.stickY = 0;
    }

    return {
      keys, touch, bind, axisX, axisY, pressed, resetTouch,
      dispose() { if (unbind) unbind(); }
    };
  }

  function setKeyMap(map) {
    global.__SNES_KEYMAP = map;
  }

  global.SNESInput = {
    setKeyMap: setKeyMap, create: createInput };
})(typeof window !== 'undefined' ? window : globalThis);
