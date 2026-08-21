/**
 * SNES Engine Studio 0.9 — Host de Web Workers para carregamento
 * Worker criado via Blob (funciona offline / file:// na maioria dos browsers).
 * Fallback síncrono se Worker indisponível.
 */
(function (global) {
  'use strict';

  // —— Código do worker (string → Blob URL) ——
  const WORKER_SRC = `
self.onmessage = function (ev) {
  var msg = ev.data || {};
  var id = msg.id;
  var type = msg.type;
  try {
    if (type === 'ping') {
      self.postMessage({ id: id, ok: true, type: 'pong', mem: selfMem() });
      return;
    }
    if (type === 'memStats') {
      self.postMessage({ id: id, ok: true, type: 'memStats', mem: selfMem() });
      return;
    }
    if (type === 'parseJSON') {
      var obj = JSON.parse(msg.text || 'null');
      self.postMessage({ id: id, ok: true, type: 'parseJSON', data: obj });
      return;
    }
    if (type === 'rleDecode') {
      var payload = msg.payload || {};
      var out = rleDecode(payload);
      // Transferable ArrayBuffer
      self.postMessage({ id: id, ok: true, type: 'rleDecode', buffer: out.buffer, length: out.length }, [out.buffer]);
      return;
    }
    if (type === 'rleEncode') {
      var u8 = msg.bytes ? new Uint8Array(msg.bytes) : new Uint8Array(0);
      var encoded = rleEncode(u8);
      self.postMessage({ id: id, ok: true, type: 'rleEncode', data: encoded });
      return;
    }
    if (type === 'hash') {
      var str = msg.text || '';
      var h = 2166136261;
      for (var i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      self.postMessage({ id: id, ok: true, type: 'hash', hash: (h >>> 0).toString(16) });
      return;
    }
    if (type === 'prepareProject') {
      var raw = msg.text || '{}';
      var data = JSON.parse(raw);
      // Normalize kart track road if RLE
      if (data && data.kartTrack && data.kartTrack.road && data.kartTrack.road.t === 'rle') {
        var road = rleDecode(data.kartTrack.road);
        data.kartTrack._roadLength = road.length;
        // keep RLE form; main thread rebuilds Uint8Array
      }
      self.postMessage({ id: id, ok: true, type: 'prepareProject', data: data });
      return;
    }
    self.postMessage({ id: id, ok: false, error: 'unknown type ' + type });
  } catch (err) {
    self.postMessage({ id: id, ok: false, error: String(err && err.message || err) });
  }
};

function selfMem() {
  var out = { ts: Date.now() };
  try {
    if (self.performance && self.performance.memory) {
      out.jsHeap = self.performance.memory.usedJSHeapSize;
      out.jsHeapTotal = self.performance.memory.totalJSHeapSize;
      out.jsHeapLimit = self.performance.memory.jsHeapSizeLimit;
    }
  } catch (e) {}
  out.nav = (self.navigator && self.navigator.deviceMemory) || null;
  return out;
}

function rleEncode(u8) {
  if (!u8 || !u8.length) return { t: 'empty' };
  var runs = [];
  var i = 0;
  while (i < u8.length) {
    var v = u8[i];
    var n = 1;
    while (i + n < u8.length && u8[i + n] === v && n < 255) n++;
    runs.push(n, v);
    i += n;
  }
  var bytes = new Uint8Array(runs);
  var bin = '';
  for (var j = 0; j < bytes.length; j++) bin += String.fromCharCode(bytes[j]);
  // btoa may not exist in worker in very old engines — manual
  var b64 = '';
  try { b64 = btoa(bin); } catch (e) { b64 = ''; }
  return { t: 'rle', len: u8.length, data: b64 };
}

function rleDecode(obj) {
  if (!obj || obj.t === 'empty') return new Uint8Array(0);
  if (obj.t !== 'rle') {
    if (Array.isArray(obj.data)) return new Uint8Array(obj.data);
    return new Uint8Array(0);
  }
  var bin = '';
  try { bin = atob(obj.data || ''); } catch (e) { return new Uint8Array(obj.len || 0); }
  var runs = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) runs[i] = bin.charCodeAt(i);
  var out = new Uint8Array(obj.len || 0);
  var pos = 0;
  for (var i = 0; i < runs.length; i += 2) {
    var n = runs[i], v = runs[i + 1];
    for (var j = 0; j < n && pos < out.length; j++) out[pos++] = v;
  }
  return out;
}
`;

  let worker = null;
  let seq = 1;
  const pending = Object.create(null);
  let available = null;

  const stats = {
    jobsTotal: 0,
    jobsOk: 0,
    jobsFail: 0,
    jobsTimeout: 0,
    bytesIn: 0,
    bytesOut: 0,
    lastDurationMs: 0,
    peakPending: 0,
    workerHeap: null,
    workerHeapTotal: null,
    mainHeap: null,
    lastSampleAt: 0,
    history: [] // last N samples
  };
  const HISTORY_MAX = 30;

  function estimateSize(val) {
    if (val == null) return 0;
    if (typeof val === 'string') return val.length * 2;
    if (val instanceof ArrayBuffer) return val.byteLength;
    if (val.buffer && val.byteLength != null) return val.byteLength;
    if (Array.isArray(val)) {
      let n = 0;
      for (let i = 0; i < Math.min(val.length, 1000); i++) n += estimateSize(val[i]);
      return n;
    }
    if (typeof val === 'object') {
      try { return JSON.stringify(val).length * 2; } catch (e) { return 64; }
    }
    return 8;
  }

  function readMainHeap() {
    try {
      if (global.performance && performance.memory) {
        return {
          jsHeap: performance.memory.usedJSHeapSize,
          jsHeapTotal: performance.memory.totalJSHeapSize,
          jsHeapLimit: performance.memory.jsHeapSizeLimit
        };
      }
    } catch (e) {}
    return null;
  }

  function formatBytes(n) {
    if (n == null || isNaN(n)) return 'n/a';
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(2) + ' MB';
  }

  function pushHistory(sample) {
    stats.history.push(sample);
    if (stats.history.length > HISTORY_MAX) stats.history.shift();
  }

  function createWorker() {
    if (typeof Worker === 'undefined') return null;
    try {
      const blob = new Blob([WORKER_SRC], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const w = new Worker(url);
      // Keep blob URL for worker lifetime
      w._blobUrl = url;
      w.onmessage = function (ev) {
        const msg = ev.data || {};
        const p = pending[msg.id];
        if (!p) return;
        delete pending[msg.id];
        const dt = p.t0 ? (Date.now() - p.t0) : 0;
        stats.lastDurationMs = dt;
        if (msg.mem) {
          stats.workerHeap = msg.mem.jsHeap;
          stats.workerHeapTotal = msg.mem.jsHeapTotal;
        }
        if (msg.type === 'rleDecode' && msg.buffer) {
          stats.bytesOut += msg.buffer.byteLength || 0;
        } else {
          stats.bytesOut += estimateSize(msg);
        }
        if (msg.ok) {
          stats.jobsOk++;
          if (msg.type === 'rleDecode' && msg.buffer) {
            p.resolve(new Uint8Array(msg.buffer));
          } else {
            p.resolve(msg);
          }
        } else {
          stats.jobsFail++;
          p.reject(new Error(msg.error || 'worker error'));
        }
      };
      w.onerror = function (err) {
        console.warn('[LoadWorker]', err);
      };
      return w;
    } catch (e) {
      console.warn('[LoadWorker] create failed', e);
      return null;
    }
  }

  function ensureWorker() {
    if (available === false) return null;
    if (!worker) {
      worker = createWorker();
      available = !!worker;
    }
    return worker;
  }

  function post(type, payload, transfer) {
    return new Promise(function (resolve, reject) {
      const w = ensureWorker();
      if (!w) {
        // fallback main thread
        try {
          resolve(fallback(type, payload));
        } catch (e) {
          reject(e);
        }
        return;
      }
      const id = seq++;
      stats.jobsTotal++;
      pending[id] = { resolve: resolve, reject: reject, t0: Date.now(), type: type };
      const pendCount = Object.keys(pending).length;
      if (pendCount > stats.peakPending) stats.peakPending = pendCount;
      const msg = Object.assign({ id: id, type: type }, payload);
      stats.bytesIn += estimateSize(payload);
      try {
        if (transfer && transfer.length) w.postMessage(msg, transfer);
        else w.postMessage(msg);
      } catch (e) {
        delete pending[id];
        stats.jobsFail++;
        try { resolve(fallback(type, payload)); }
        catch (e2) { reject(e2); }
      }
      // timeout
      setTimeout(function () {
        if (pending[id]) {
          delete pending[id];
          stats.jobsTimeout++;
          try { resolve(fallback(type, payload)); }
          catch (e) { reject(e); }
        }
      }, 8000);
    });
  }

  function fallback(type, payload) {
    payload = payload || {};
    if (type === 'ping') return { ok: true, type: 'pong' };
    if (type === 'parseJSON') return { ok: true, type: 'parseJSON', data: JSON.parse(payload.text || 'null') };
    if (type === 'rleDecode') {
      if (global.ProjectStore && global.ProjectStore.rleDecode) {
        return global.ProjectStore.rleDecode(payload.payload);
      }
      return new Uint8Array(0);
    }
    if (type === 'rleEncode') {
      if (global.ProjectStore && global.ProjectStore.rleEncode) {
        return { ok: true, data: global.ProjectStore.rleEncode(new Uint8Array(payload.bytes || [])) };
      }
      return { ok: true, data: { t: 'empty' } };
    }
    if (type === 'prepareProject') {
      return { ok: true, data: JSON.parse(payload.text || '{}') };
    }
    if (type === 'hash') {
      let h = 2166136261;
      const str = payload.text || '';
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return { ok: true, hash: (h >>> 0).toString(16) };
    }
    throw new Error('fallback unknown ' + type);
  }

  /** Carrega imagem sem bloquear (decode async) */
  function loadImage(src, onProgress) {
    return new Promise(function (resolve, reject) {
      if (!src) { resolve(null); return; }
      const img = new Image();
      img.decoding = 'async';
      img.onload = function () {
        // decode() when available
        if (img.decode) {
          img.decode().then(function () { resolve(img); }).catch(function () { resolve(img); });
        } else resolve(img);
      };
      img.onerror = function () { reject(new Error('image load failed')); };
      img.src = src;
    });
  }

  /** Pré-carrega lista de assets em paralelo com limite de concorrência */
  function loadAssets(list, opts) {
    opts = opts || {};
    const concurrency = opts.concurrency || 4;
    const onProgress = opts.onProgress;
    list = list || [];
    let done = 0;
    let idx = 0;
    const results = new Array(list.length);
    return new Promise(function (resolve) {
      if (!list.length) { resolve([]); return; }
      let active = 0;
      function next() {
        while (active < concurrency && idx < list.length) {
          const i = idx++;
          const item = list[i];
          active++;
          const job = (item.type === 'json')
            ? fetchText(item.src).then(function (text) {
                return post('parseJSON', { text: text }).then(function (m) { return m.data; });
              })
            : loadImage(item.src);
          job.then(function (res) {
            results[i] = { id: item.id, ok: true, data: res };
          }).catch(function (err) {
            results[i] = { id: item.id, ok: false, error: String(err) };
          }).then(function () {
            active--;
            done++;
            if (onProgress) onProgress(done, list.length, done / list.length);
            if (done === list.length) resolve(results);
            else next();
          });
        }
      }
      next();
    });
  }

  function fetchText(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('fetch ' + url);
      return r.text();
    });
  }

  function isAvailable() {
    ensureWorker();
    return !!available;
  }

  function dispose() {
    if (worker) {
      worker.terminate();
      if (worker._blobUrl) URL.revokeObjectURL(worker._blobUrl);
      worker = null;
    }
    Object.keys(pending).forEach(function (k) {
      pending[k].reject(new Error('disposed'));
      delete pending[k];
    });
  }

  function getStats() {
    const main = readMainHeap();
    if (main) stats.mainHeap = main.jsHeap;
    return {
      available: !!available,
      pending: Object.keys(pending).length,
      peakPending: stats.peakPending,
      jobsTotal: stats.jobsTotal,
      jobsOk: stats.jobsOk,
      jobsFail: stats.jobsFail,
      jobsTimeout: stats.jobsTimeout,
      bytesIn: stats.bytesIn,
      bytesOut: stats.bytesOut,
      bytesInLabel: formatBytes(stats.bytesIn),
      bytesOutLabel: formatBytes(stats.bytesOut),
      lastDurationMs: stats.lastDurationMs,
      workerHeap: stats.workerHeap,
      workerHeapLabel: formatBytes(stats.workerHeap),
      workerHeapTotal: stats.workerHeapTotal,
      mainHeap: stats.mainHeap,
      mainHeapLabel: formatBytes(stats.mainHeap),
      lastSampleAt: stats.lastSampleAt,
      history: stats.history.slice()
    };
  }

  function sampleMemory() {
    return post('memStats', {}).then(function (msg) {
      const main = readMainHeap();
      const sample = {
        t: Date.now(),
        workerHeap: msg.mem && msg.mem.jsHeap,
        workerHeapTotal: msg.mem && msg.mem.jsHeapTotal,
        mainHeap: main && main.jsHeap,
        pending: Object.keys(pending).length
      };
      if (msg.mem) {
        stats.workerHeap = msg.mem.jsHeap;
        stats.workerHeapTotal = msg.mem.jsHeapTotal;
      }
      if (main) stats.mainHeap = main.jsHeap;
      stats.lastSampleAt = sample.t;
      pushHistory(sample);
      return getStats();
    }).catch(function () {
      const main = readMainHeap();
      if (main) stats.mainHeap = main.jsHeap;
      stats.lastSampleAt = Date.now();
      pushHistory({ t: stats.lastSampleAt, workerHeap: null, mainHeap: stats.mainHeap, pending: Object.keys(pending).length });
      return getStats();
    });
  }

  /** Overlay de debug opcional */
  let overlayTimer = null;
  function showOverlay(enable) {
    let el = document.getElementById('snesWorkerMem');
    if (!enable) {
      if (overlayTimer) { clearInterval(overlayTimer); overlayTimer = null; }
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement('div');
      el.id = 'snesWorkerMem';
      el.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:9999;background:#0b0b12ee;color:#9fe;border:1px solid #3b4665;padding:8px 10px;font:11px monospace;border-radius:8px;min-width:200px;pointer-events:none';
      document.body.appendChild(el);
    }
    function tick() {
      sampleMemory().then(function (s) {
        el.innerHTML =
          '<b>Worker Mem</b> ' + (s.available ? 'ON' : 'OFF') + '<br>' +
          'W heap: ' + s.workerHeapLabel + '<br>' +
          'Main: ' + s.mainHeapLabel + '<br>' +
          'Jobs: ' + s.jobsOk + '/' + s.jobsTotal + ' fail=' + s.jobsFail + '<br>' +
          'Pending: ' + s.pending + ' (peak ' + s.peakPending + ')<br>' +
          'In/Out: ' + s.bytesInLabel + ' / ' + s.bytesOutLabel + '<br>' +
          'Last: ' + s.lastDurationMs + 'ms';
      });
    }
    tick();
    if (overlayTimer) clearInterval(overlayTimer);
    overlayTimer = setInterval(tick, 1500);
  }

  global.SNESLoadWorker = {
    post: post,
    parseJSON: function (text) {
      return post('parseJSON', { text: text }).then(function (m) { return m.data; });
    },
    rleDecode: function (payload) {
      return post('rleDecode', { payload: payload });
    },
    rleEncode: function (u8) {
      const copy = u8 instanceof Uint8Array ? u8 : new Uint8Array(u8 || []);
      return post('rleEncode', { bytes: Array.from(copy) }).then(function (m) { return m.data; });
    },
    prepareProject: function (text) {
      return post('prepareProject', { text: text }).then(function (m) { return m.data; });
    },
    loadImage: loadImage,
    loadAssets: loadAssets,
    isAvailable: isAvailable,
    dispose: dispose,
    ping: function () { return post('ping', {}); },
    getStats: getStats,
    sampleMemory: sampleMemory,
    showOverlay: showOverlay,
    formatBytes: formatBytes
  };
})(typeof window !== 'undefined' ? window : globalThis);
