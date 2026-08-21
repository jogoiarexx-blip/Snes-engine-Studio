/**
 * SNES Engine Studio V7 — Câmera por estilo (mundo ≠ tela)
 */
(function (global) {
  'use strict';

  function create(opts) {
    opts = opts || {};
    return {
      x: 0, y: 0,
      deadZoneX: opts.deadZoneX != null ? opts.deadZoneX : 40,
      deadZoneY: opts.deadZoneY != null ? opts.deadZoneY : 30,
      lookAhead: opts.lookAhead != null ? opts.lookAhead : 24,
      mode: opts.mode || 'follow', // follow | fixed | autoscroll
      scrollSpeed: opts.scrollSpeed || 40,
      scrollDir: opts.scrollDir || 'none', // none | left | up
      worldW: opts.worldW || 512,
      worldH: opts.worldH || 288,
      viewW: opts.viewW || 512,
      viewH: opts.viewH || 288
    };
  }

  function update(cam, target, dt) {
    if (!cam || !target) return;
    if (cam.mode === 'fixed') return;

    if (cam.mode === 'autoscroll') {
      if (cam.scrollDir === 'left') cam.x += cam.scrollSpeed * dt;
      if (cam.scrollDir === 'up') cam.y -= cam.scrollSpeed * dt;
      clamp(cam);
      return;
    }

    // follow with dead zone + look-ahead
    const tx = target.x + (target.facing === 'right' ? cam.lookAhead : target.facing === 'left' ? -cam.lookAhead : 0);
    const ty = target.y;
    const cx = cam.x + cam.viewW / 2;
    const cy = cam.y + cam.viewH / 2;
    if (tx > cx + cam.deadZoneX) cam.x += (tx - (cx + cam.deadZoneX)) * Math.min(1, 6 * dt);
    if (tx < cx - cam.deadZoneX) cam.x += (tx - (cx - cam.deadZoneX)) * Math.min(1, 6 * dt);
    if (ty > cy + cam.deadZoneY) cam.y += (ty - (cy + cam.deadZoneY)) * Math.min(1, 6 * dt);
    if (ty < cy - cam.deadZoneY) cam.y += (ty - (cy - cam.deadZoneY)) * Math.min(1, 6 * dt);
    clamp(cam);
  }

  function clamp(cam) {
    const maxX = Math.max(0, cam.worldW - cam.viewW);
    const maxY = Math.max(0, cam.worldH - cam.viewH);
    cam.x = Math.max(0, Math.min(maxX, cam.x));
    cam.y = Math.max(0, Math.min(maxY, cam.y));
  }

  /** Converte mundo → tela */
  function worldToScreen(cam, x, y) {
    return { x: x - cam.x, y: y - cam.y };
  }

  global.SNESCamera = { create, update, clamp, worldToScreen };
})(typeof window !== 'undefined' ? window : globalThis);
