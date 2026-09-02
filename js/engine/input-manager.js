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

    function mappedKey(name) {
      const km = global.__SNES_KEYMAP;
      if (!km || !km[name]) return false;
      return km[name].some(function(k){ return !!keys[String(k).toLowerCase()]; });
    }

    function axisX() {
      let v = 0;
      if (mappedKey('left') || (!global.__SNES_KEYMAP && (keys.arrowleft || keys.a)) || touch.left) v -= 1;
      if (mappedKey('right') || (!global.__SNES_KEYMAP && (keys.arrowright || keys.d)) || touch.right) v += 1;
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
      if (mappedKey('up') || (!global.__SNES_KEYMAP && (keys.arrowup || keys.w)) || touch.up) v -= 1;
      if (mappedKey('down') || (!global.__SNES_KEYMAP && (keys.arrowdown || keys.s)) || touch.down) v += 1;
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
    const frameNow = Object.create(null), framePrev = Object.create(null);
    const ACTIONS=['left','right','up','down','jump','attack','attack2','action','bomb','inventory','pause'];
    function pressed(name) {
      const km = global.__SNES_KEYMAP;
      const hasMap = !!(km && Array.isArray(km[name]));
      let keyHit = false;
      if (hasMap) {
        keyHit = km[name].some(function(k){
          k=String(k).toLowerCase();
          return k===' ' ? !!(keys[' ']||keys.space) : !!keys[k];
        });
      } else {
        if (name === 'jump') keyHit = !!(keys.z || keys[' ']);
        else if (name === 'attack') keyHit = !!(keys.x || keys.c);
        else if (name === 'attack2') keyHit = !!keys.v;
        else if (name === 'action') keyHit = !!(keys.e || keys.enter);
        else if (name === 'bomb') keyHit = !!keys.b;
        else if (name === 'inventory') keyHit = !!keys.i;
        else if (name === 'pause') keyHit = !!(keys.p || keys.escape);
        else keyHit = !!keys[name];
      }
      if (name === 'jump') return !!(keyHit || touch.jump || gpBtn(0));
      if (name === 'attack') return !!(keyHit || touch.attack || gpBtn(2) || gpBtn(1));
      if (name === 'attack2') return !!(keyHit || touch.attack2 || gpBtn(3));
      if (name === 'action') return !!(keyHit || touch.action || gpBtn(0));
      if (name === 'bomb') return !!(keyHit || touch.bomb || gpBtn(4) || gpBtn(5));
      if (name === 'inventory') return !!(keyHit || touch.inventory || gpBtn(8));
      if (name === 'pause') return !!(keyHit || touch.pause || gpBtn(9));
      return keyHit;
    }


    function beginFrame() {
      ACTIONS.forEach(function(name){ frameNow[name]=rawPressed(name); });
    }
    function endFrame() {
      ACTIONS.forEach(function(name){ framePrev[name]=!!frameNow[name]; });
    }
    function justPressed(name) { return !!frameNow[name] && !framePrev[name]; }
    function justReleased(name) { return !frameNow[name] && !!framePrev[name]; }
    function rawPressed(name) { return pressed(name); }

    function resetTouch() {
      Object.keys(touch).forEach(k => {
        if (typeof touch[k] === 'boolean') touch[k] = false;
      });
      touch.stickX = 0;
      touch.stickY = 0;
    }

    return {
      keys, touch, bind, axisX, axisY, pressed, justPressed, justReleased, beginFrame, endFrame, resetTouch,
      dispose() { if (unbind) unbind(); }
    };
  }

  function setKeyMap(map) {
    global.__SNES_KEYMAP = map;
  }

  global.SNESInput = {
    setKeyMap: setKeyMap, create: createInput };
})(typeof window !== 'undefined' ? window : globalThis);
