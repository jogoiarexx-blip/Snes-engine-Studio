/**
 * SNES Engine Studio 0.9 — Persistência de projetos
 * localStorage: configs + lista recente
 * IndexedDB: projetos grandes (com fallback localStorage comprimido)
 * RLE + base64 para Uint8Array de pistas
 */
(function (global) {
  'use strict';

  const DB_NAME = 'snes_studio_0_9';
  const DB_VER = 1;
  const STORE = 'projects';
  const RECENT_KEY = 'snes_v09_recent';
  const CFG_KEY = 'snes_v09_cfg';

  // —— RLE for Uint8Array ——
  function rleEncode(u8) {
    if (!(u8 instanceof Uint8Array)) {
      if (Array.isArray(u8)) u8 = new Uint8Array(u8);
      else if (u8 && typeof u8 === 'object') {
        const keys = Object.keys(u8);
        const max = keys.reduce((m, k) => Math.max(m, parseInt(k, 10) || 0), 0);
        const arr = new Uint8Array(max + 1);
        keys.forEach(k => { arr[parseInt(k, 10)] = u8[k] & 0xff; });
        u8 = arr;
      } else return { t: 'empty' };
    }
    const runs = [];
    let i = 0;
    while (i < u8.length) {
      const v = u8[i];
      let n = 1;
      while (i + n < u8.length && u8[i + n] === v && n < 255) n++;
      runs.push(n, v);
      i += n;
    }
    const bytes = new Uint8Array(runs);
    let bin = '';
    for (let j = 0; j < bytes.length; j++) bin += String.fromCharCode(bytes[j]);
    return { t: 'rle', len: u8.length, data: btoa(bin) };
  }

  function rleDecode(obj) {
    if (!obj || obj.t === 'empty') return new Uint8Array(0);
    if (obj.t === 'rle') {
      const bin = atob(obj.data);
      const runs = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) runs[i] = bin.charCodeAt(i);
      const out = new Uint8Array(obj.len);
      let pos = 0;
      for (let i = 0; i < runs.length; i += 2) {
        const n = runs[i], v = runs[i + 1];
        for (let j = 0; j < n && pos < out.length; j++) out[pos++] = v;
      }
      return out;
    }
    if (obj.t === 'raw' && Array.isArray(obj.data)) return new Uint8Array(obj.data);
    return new Uint8Array(0);
  }

  function serializeTrack(track) {
    if (!track) return null;
    return {
      size: track.size,
      name: track.name,
      laps: track.laps || 3,
      road: rleEncode(track.road),
      waypoints: track.waypoints || [],
      checkpoints: track.checkpoints || [],
      itemBoxes: (track.itemBoxes || []).map(b => ({ x: b.x, y: b.y })),
      obstacles: track.obstacles || [],
      startPositions: track.startPositions || [],
      altLines: track.altLines || []
    };
  }

  function deserializeTrack(data) {
    if (!data) return null;
    try {
      const road = data.road && data.road.t ? rleDecode(data.road)
        : data.road instanceof Uint8Array ? data.road
        : Array.isArray(data.road) ? new Uint8Array(data.road)
        : null;
      if (!road || !road.length) return null;
      return {
        size: data.size || Math.sqrt(road.length) | 0,
        name: data.name || 'Pista',
        laps: data.laps || 3,
        road: road,
        waypoints: data.waypoints || [],
        checkpoints: data.checkpoints || [],
        itemBoxes: (data.itemBoxes || []).map(b => ({ x: b.x, y: b.y, respawn: 0 })),
        obstacles: data.obstacles || [],
        startPositions: data.startPositions || [],
        altLines: data.altLines || []
      };
    } catch (e) {
      console.warn('[ProjectStore] track deserialize failed', e);
      return null;
    }
  }

  function prepareProjectForSave(project) {
    const p = JSON.parse(JSON.stringify(project, function (k, v) {
      if (v instanceof Uint8Array) return rleEncode(v);
      return v;
    }));
    // Explicit kart track
    if (project.kartTrack) {
      p.kartTrack = serializeTrack(project.kartTrack);
    }
    p.schemaVersion = 9;
    p.version = p.version || '0.9';
    return p;
  }

  function restoreProject(data) {
    if (!data || typeof data !== 'object') return null;
    if (data.kartTrack) {
      const t = deserializeTrack(data.kartTrack);
      if (t) data.kartTrack = t;
      else if (global.KartTrack) data.kartTrack = global.KartTrack.generateDemoTrack();
      else data.kartTrack = null;
    }
    // Walk scenes for any rle fields
    return data;
  }

  // —— IndexedDB ——
  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!global.indexedDB) { resolve(null); return; }
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = function () {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { resolve(null); };
    });
  }

  function idbPut(id, project) {
    return openDb().then(function (db) {
      if (!db) return false;
      return new Promise(function (resolve) {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put({ id: id, project: project, t: Date.now() });
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { resolve(false); };
      });
    });
  }

  function idbGet(id) {
    return openDb().then(function (db) {
      if (!db) return null;
      return new Promise(function (resolve) {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(id);
        req.onsuccess = function () {
          resolve(req.result ? req.result.project : null);
        };
        req.onerror = function () { resolve(null); };
      });
    });
  }

  function saveProject(project) {
    const prepared = prepareProjectForSave(project);
    const id = project.id || project.name || 'default';
    // Recent list (small)
    try {
      let recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      recent = recent.filter(r => r.id !== id);
      recent.unshift({ id: id, name: project.name || id, gameType: project.gameType, t: Date.now() });
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 12)));
    } catch (e) {}
    // Prefer IndexedDB
    return idbPut(id, prepared).then(function (ok) {
      if (!ok) {
        try {
          localStorage.setItem('snes_proj_' + id, JSON.stringify(prepared));
        } catch (e) {
          console.warn('localStorage full', e);
          return false;
        }
      }
      return true;
    });
  }

  function loadProject(id) {
    return idbGet(id).then(function (data) {
      if (!data) {
        try {
          data = JSON.parse(localStorage.getItem('snes_proj_' + id) || 'null');
        } catch (e) { data = null; }
      }
      // Legacy keys
      if (!data) {
        try {
          data = JSON.parse(localStorage.getItem('snes_engine_studio_project_v7') ||
            localStorage.getItem('snes_engine_studio_project_v6') || 'null');
        } catch (e) {}
      }
      return data ? restoreProject(data) : null;
    });
  }

  function listRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function loadProjectAsync(id) {
    return loadProject(id).then(function (data) {
      if (!data) return null;
      // heavy RLE decode on worker when possible
      if (data.kartTrack && data.kartTrack.road && data.kartTrack.road.t === 'rle' && global.SNESLoadWorker) {
        return global.SNESLoadWorker.rleDecode(data.kartTrack.road).then(function (u8) {
          if (u8 && u8.length) data.kartTrack.road = u8;
          return data;
        }).catch(function () { return restoreProject(data); });
      }
      return data;
    });
  }

  function importJSONAsync(text) {
    if (global.SNESLoadWorker) {
      return global.SNESLoadWorker.prepareProject(text).then(function (data) {
        return restoreProject(data);
      });
    }
    return Promise.resolve(restoreProject(JSON.parse(text)));
  }

  global.ProjectStore = {
    loadProjectAsync: loadProjectAsync,
    importJSONAsync: importJSONAsync,
    rleEncode: rleEncode,
    rleDecode: rleDecode,
    serializeTrack: serializeTrack,
    deserializeTrack: deserializeTrack,
    prepareProjectForSave: prepareProjectForSave,
    restoreProject: restoreProject,
    saveProject: saveProject,
    loadProject: loadProject,
    listRecent: listRecent
  };
})(typeof window !== 'undefined' ? window : globalThis);
