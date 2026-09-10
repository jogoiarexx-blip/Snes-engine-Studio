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
          if(global.SNESLogger)global.SNESLogger.warn('asset','Falha ao carregar '+id,{paths:paths});
          if(global.SNESEvents)global.SNESEvents.emit('asset:error',{id:id,paths:paths,error:err});
          if (opts.optional) resolve(null);
          else reject(err);
          return;
        }
        const url = paths[attempt++];
        img.onload = function () {
          cache[id] = { status: 'ok', value: img };
          (waiters[id] || []).forEach(function (w) { w.resolve(img); });
          waiters[id] = null;
          if(global.SNESEvents)global.SNESEvents.emit('asset:loaded',{id:id,image:img});
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



  /** Preload real do projeto para editor e jogo exportado.
   * Imagens entram no cache SNESAssets e áudio é decodificado pelo SNESAudio.
   * Retorna {total,done,ok,error,errors} e nunca derruba o jogo por asset opcional.
   */
  function projectManifest(project) {
    const out = studioManifest(project && project.gameType).slice();
    const seen = Object.create(null);
    out.forEach(function (x) { seen[x.id] = true; });
    ((project && project.studio && project.studio.assets) || []).forEach(function (a) {
      if (!a || !a.id) return;
      const src = a.dataUrl || a.url || a.src;
      if (!src) return;
      const kind = String(a.kind || a.type || '').toLowerCase();
      const isAudio = kind === 'audio' || /^audio\//.test(a.mime || '') || /\.(ogg|mp3|wav|m4a)$/i.test(a.name || src);
      const type = isAudio ? 'audio' : 'image';
      const id = 'project:' + a.id;
      if (seen[id]) return;
      seen[id] = true;
      out.push({ id: id, assetId: a.id, src: src, dataUrl: a.dataUrl || null, type: type, optional: true, name: a.name || a.id });
    });
    return out;
  }

  function preloadProject(project, onProgress) {
    const list = projectManifest(project), total = list.length;
    const result = { total: total, done: 0, ok: 0, error: 0, errors: [] };
    if (!total) { if (onProgress) onProgress(0, 0, 1, result); return Promise.resolve(result); }
    function mark(item, ok, error) {
      result.done++; if (ok) result.ok++; else { result.error++; result.errors.push({ id:item.id, assetId:item.assetId, name:item.name, error:String(error && error.message || error || 'Falha') }); }
      if (onProgress) onProgress(result.done, total, result.done / total, result);
    }
    const jobs = list.map(function (item) {
      if (item.type === 'audio') {
        const audio = global.SNESAudio;
        if (!audio || !audio.loadBuffer) { mark(item, false, 'SNESAudio indisponível'); return Promise.resolve(null); }
        return audio.loadBuffer(item.assetId || item.id, item.src).then(function(v){ mark(item, true); return v; }).catch(function(err){ mark(item, false, err); return null; });
      }
      return loadImage(item.id, item.src, item).then(function(v){ mark(item, !!v, v ? null : 'Imagem vazia'); return v; }).catch(function(err){ mark(item, false, err); return null; });
    });
    return Promise.all(jobs).then(function(){
      if (global.SNESEvents) global.SNESEvents.emit('assets:project-ready', { project: project, stats: result });
      return result;
    });
  }



  function projectAssetMap(project) {
    const map = Object.create(null);
    ((project && project.studio && project.studio.assets) || []).forEach(function (a) { if (a && a.id) map[a.id] = a; });
    return map;
  }

  function referencedAssetIds(value, assetMap, out, seen) {
    out = out || Object.create(null); seen = seen || new Set();
    if (value == null) return out;
    if (typeof value === 'string') { if (assetMap[value]) out[value] = true; return out; }
    if (typeof value !== 'object' || seen.has(value)) return out;
    seen.add(value);
    if (Array.isArray(value)) value.forEach(function (v) { referencedAssetIds(v, assetMap, out, seen); });
    else Object.keys(value).forEach(function (k) { referencedAssetIds(value[k], assetMap, out, seen); });
    return out;
  }

  function assetItem(a) {
    if (!a || !a.id) return null;
    const src = a.dataUrl || a.url || a.src; if (!src) return null;
    const kind = String(a.kind || a.type || '').toLowerCase();
    const isAudio = kind === 'audio' || /^audio\//.test(a.mime || '') || /\.(ogg|mp3|wav|m4a)$/i.test(a.name || src);
    return { id:'project:'+a.id, assetId:a.id, src:src, dataUrl:a.dataUrl||null, type:isAudio?'audio':'image', optional:true, name:a.name||a.id };
  }

  function manifestForAssetIds(project, ids, includeStudio) {
    const map = projectAssetMap(project), out = includeStudio ? studioManifest(project && project.gameType).slice() : [], seen = Object.create(null);
    out.forEach(function (x) { seen[x.id] = true; });
    Object.keys(ids || {}).forEach(function (id) { const item = assetItem(map[id]); if (item && !seen[item.id]) { seen[item.id]=true; out.push(item); } });
    return out;
  }

  function coreManifest(project) {
    const map = projectAssetMap(project), ids = Object.create(null), g = project && project.game || {};
    referencedAssetIds(g.mainMenu || {}, map, ids);
    referencedAssetIds(g.splash || {}, map, ids);
    referencedAssetIds(g.loading || {}, map, ids);
    const startId = g.startScene || project.currentScene || (project.scenes && project.scenes[0] && project.scenes[0].id);
    const scene = (project.scenes || []).find(function (s) { return s.id === startId; });
    if (scene) referencedAssetIds(scene, map, ids);
    return manifestForAssetIds(project, ids, true);
  }

  function sceneManifest(project, sceneId) {
    const map = projectAssetMap(project), ids = Object.create(null), scene = (project.scenes || []).find(function (s) { return s.id === sceneId; });
    if (scene) referencedAssetIds(scene, map, ids);
    const track = project && project.game && project.game.cutscenes && project.game.cutscenes.scenes && project.game.cutscenes.scenes[sceneId];
    if (track) referencedAssetIds(track, map, ids);
    return manifestForAssetIds(project, ids, false);
  }

  function preloadManifest(list, onProgress, eventName, project, sceneId) {
    list = list || []; const total = list.length, result = { total:total, done:0, ok:0, error:0, errors:[] };
    if (!total) { if(onProgress) onProgress(0,0,1,result); return Promise.resolve(result); }
    function mark(item, ok, error) { result.done++; if(ok) result.ok++; else { result.error++; result.errors.push({id:item.id,assetId:item.assetId,name:item.name,error:String(error&&error.message||error||'Falha')}); } if(onProgress) onProgress(result.done,total,result.done/total,result); }
    const jobs = list.map(function(item){
      if (item.type === 'audio') {
        const audio=global.SNESAudio; if(!audio||!audio.loadBuffer){mark(item,false,'SNESAudio indisponível');return Promise.resolve(null);}
        return audio.loadBuffer(item.assetId||item.id,item.src).then(function(v){mark(item,true);return v;}).catch(function(err){mark(item,false,err);return null;});
      }
      return loadImage(item.id,item.src,item).then(function(v){mark(item,!!v,v?null:'Imagem vazia');return v;}).catch(function(err){mark(item,false,err);return null;});
    });
    return Promise.all(jobs).then(function(){ if(global.SNESEvents) global.SNESEvents.emit(eventName||'assets:ready',{project:project,sceneId:sceneId,stats:result}); return result; });
  }

  function preloadCore(project,onProgress){ return preloadManifest(coreManifest(project),onProgress,'assets:core-ready',project,null); }
  function preloadScene(project,sceneId,onProgress){ return preloadManifest(sceneManifest(project,sceneId),onProgress,'assets:scene-ready',project,sceneId); }

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

  function releaseEntry(id){const e=cache[id];if(!e)return;const v=e.value;try{if(v&&v.tagName==='IMG'){if(String(v.src||'').startsWith('blob:'))URL.revokeObjectURL(v.src);v.onload=v.onerror=null;v.src=''}else if(v&&v.tagName==='AUDIO'){v.pause?.();if(String(v.src||'').startsWith('blob:'))URL.revokeObjectURL(v.src);v.src=''}}catch(_){}delete cache[id]}
  function clear(id) { if (id) releaseEntry(id); else Object.keys(cache).forEach(releaseEntry); }
  function unload(id){releaseEntry(id);global.SNESEvents?.emit('asset:unloaded',{id})}
  function reload(id,src,opts){unload(id);return loadImage(id,src,opts||{}).then(v=>{global.SNESEvents?.emit('asset:reloaded',{id,value:v});return v})}
  function usage(project,assetId){const refs=[];const seen=new Set();function walk(v,path){if(v==null)return;if(typeof v==='string'){if(v===assetId)refs.push(path);return}if(typeof v!=='object'||seen.has(v))return;seen.add(v);if(Array.isArray(v))v.forEach((x,i)=>walk(x,path+'['+i+']'));else Object.keys(v).forEach(k=>walk(v[k],path?path+'.'+k:k))}walk(project,'project');return refs}
  function dependencyGraph(project){const assets=(project?.studio?.assets||[]),nodes=assets.map(a=>({id:a.id,name:a.name||a.id,kind:a.kind||a.type||'asset',uses:usage(project,a.id)}));return{nodes,edges:nodes.flatMap(n=>n.uses.map(path=>({from:path,to:n.id})))}}
  function dispose(){clear();basePath=''}

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
    projectManifest: projectManifest,
    preloadProject: preloadProject,
    coreManifest: coreManifest,
    sceneManifest: sceneManifest,
    preloadCore: preloadCore,
    preloadScene: preloadScene,
    clear: clear,
    unload: unload,
    reload: reload,
    usage: usage,
    dependencyGraph: dependencyGraph,
    dispose: dispose,
    stats: stats,
    loadAtlas: loadAtlas
  };
})(typeof window !== 'undefined' ? window : globalThis);
