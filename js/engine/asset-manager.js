/**
 * SNES Engine Studio 0.8 — AssetManager
 * Cache, preload paralelo, progresso, fallbacks. file:// friendly.
 */
(function (global) {
  'use strict';

  const cache = Object.create(null);      // id -> { img|audio|data, status }
  const waiters = Object.create(null);    // id -> [resolve]
  let basePath = '';

  function setBase(path) {
    basePath = path || '';
    if (basePath && !basePath.endsWith('/')) basePath += '/';
  }

  function get(id) {
    const e = cache[id];
    return e && e.status === 'ok' ? e.value : null;
  }

  function status(id) {
    return (cache[id] && cache[id].status) || 'none';
  }

  function loadImage(id, src, opts) {
    opts = opts || {};
    if (cache[id] && cache[id].status === 'ok') {
      return Promise.resolve(cache[id].value);
    }
    if (cache[id] && cache[id].status === 'loading') {
      return new Promise(function (resolve, reject) {
        (waiters[id] = waiters[id] || []).push({ resolve: resolve, reject: reject });
      });
    }
    cache[id] = { status: 'loading', value: null };
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.decoding = opts.decoding || 'async';
      // Não usar crossOrigin em file://
      const paths = [];
      if (src.indexOf('data:') === 0) paths.push(src);
      else {
        paths.push(basePath + src);
        paths.push(src);
        if (src.indexOf('assets/') !== 0) paths.push(basePath + 'assets/' + src);
      }
      if (opts.fallback) paths.push(opts.fallback);
      if (opts.dataUrl) paths.push(opts.dataUrl);

      let attempt = 0;
      function tryNext() {
        if (attempt >= paths.length) {
          cache[id] = { status: 'error', value: null };
          const err = new Error('Asset failed: ' + id);
          (waiters[id] || []).forEach(function (w) { w.reject(err); });
          waiters[id] = null;
          if (opts.optional) resolve(null);
          else reject(err);
          return;
        }
        const url = paths[attempt++];
        img.onload = function () {
          cache[id] = { status: 'ok', value: img };
          (waiters[id] || []).forEach(function (w) { w.resolve(img); });
          waiters[id] = null;
          resolve(img);
        };
        img.onerror = function () { tryNext(); };
        img.src = url;
      }
      tryNext();
    });
  }

  /** Preload lista: [{ id, src, type:'image', optional, dataUrl }] */
  function preload(list, onProgress) {
    list = list || [];
    let done = 0;
    const total = list.length || 1;
    function progress() {
      done++;
      if (onProgress) onProgress(done, list.length, done / total);
    }
    const jobs = list.map(function (item) {
      if (item.type === 'json') {
        return fetch(basePath + item.src).then(function (r) { return r.json(); })
          .then(function (data) {
            cache[item.id] = { status: 'ok', value: data };
            progress();
            return data;
          })
          .catch(function () {
            cache[item.id] = { status: 'error', value: null };
            progress();
            return null;
          });
      }
      return loadImage(item.id, item.src, item).then(function (v) {
        progress();
        return v;
      }).catch(function () {
        progress();
        return null;
      });
    });
    return Promise.all(jobs);
  }

  /** Manifest padrão do Studio */
  function studioManifest(gameType) {
    const list = [
      { id: 'skeleton', src: 'assets/skeleton.png', optional: true }
    ];
    if (!gameType || gameType === 'kart-racing') {
      list.push({
        id: 'ninjaKart',
        src: 'assets/ninja-kart-sheet.png',
        optional: true,
        dataUrl: global.__NINJA_KART_SHEET_DATAURL || null
      });
    }
    return list;
  }

  /** Pré-carrega assets do projeto atual + mostra barra opcional */
  function preloadStudio(project, onProgress) {
    const gt = project && project.gameType;
    return preload(studioManifest(gt), onProgress);
  }

  function clear(id) {
    if (id) delete cache[id];
    else {
      Object.keys(cache).forEach(function (k) { delete cache[k]; });
    }
  }

  // Memory hint
  function stats() {
    const ids = Object.keys(cache);
    let ok = 0, err = 0, loading = 0;
    ids.forEach(function (id) {
      const s = cache[id].status;
      if (s === 'ok') ok++;
      else if (s === 'error') err++;
      else if (s === 'loading') loading++;
    });
    return { total: ids.length, ok: ok, error: err, loading: loading };
  }

  function loadAtlas(name, jsonUrl, imageUrl) {
    if (global.SNESAtlas) return global.SNESAtlas.load(name, jsonUrl, imageUrl);
    return Promise.resolve(null);
  }

  // Worker-backed load when available
  function preloadWithWorker(list, onProgress) {
    if (global.SNESLoadWorker && global.SNESLoadWorker.loadAssets) {
      return global.SNESLoadWorker.loadAssets(list.map(function (item) {
        return { id: item.id || item.src, src: item.src || item, type: item.type || 'image' };
      }), { onProgress: onProgress, concurrency: 4 }).then(function (results) {
        results.forEach(function (r) {
          if (r.ok && r.data) {
            if (typeof cache !== 'undefined') cache[r.id] = r.data;
            else if (global.SNESAssets && global.SNESAssets._cache) global.SNESAssets._cache[r.id] = r.data;
          }
        });
        return results;
      });
    }
    return null;
  }

  global.SNESAssets = {
    loadAsync: function(list, onProgress) {
      const w = preloadWithWorker(list, onProgress);
      if (w) return w;
      return Promise.resolve([]);
    },
    setBase: setBase,
    get: get,
    status: status,
    loadImage: loadImage,
    preload: preload,
    preloadStudio: preloadStudio,
    studioManifest: studioManifest,
    clear: clear,
    stats: stats,
    loadAtlas: loadAtlas
  };
})(typeof window !== 'undefined' ? window : globalThis);
