/**
 * Preload de assets ao iniciar o Studio + barra leve
 */
// optional worker warm-up
(function warm() {
  if (window.SNESLoadWorker) {
    window.SNESLoadWorker.ping().then(function () {
      console.info('[SNES] Load worker OK');
    }).catch(function () {});
  }
})();
(function () {
  function showBar() {
    let el = document.getElementById('assetLoadBar');
    if (!el) {
      el = document.createElement('div');
      el.id = 'assetLoadBar';
      el.style.cssText = 'position:fixed;left:0;right:0;top:0;height:3px;background:#1a2030;z-index:100;';
      el.innerHTML = '<div id="assetLoadFill" style="height:100%;width:0;background:#f7b32b;transition:width .15s"></div>';
      document.body.appendChild(el);
    }
    return el;
  }
  function hideBar() {
    const el = document.getElementById('assetLoadBar');
    if (el) setTimeout// optional worker warm-up
(function warm() {
  if (window.SNESLoadWorker) {
    window.SNESLoadWorker.ping().then(function () {
      console.info('[SNES] Load worker OK');
    }).catch(function () {});
  }
})();
(function () { el.remove(); }, 300);
  }
  function run() {
    if (!window.SNESAssets) return;
    const A = window.SNESStudio;
    const project = A && A.project;
    showBar();
    const fill = document.getElementById('assetLoadFill');
    SNESAssets.preloadStudio(project, function (done, total, ratio) {
      if (fill) fill.style.width = Math.round(ratio * 100) + '%';
    }).then// optional worker warm-up
(function warm() {
  if (window.SNESLoadWorker) {
    window.SNESLoadWorker.ping().then(function () {
      console.info('[SNES] Load worker OK');
    }).catch(function () {});
  }
})();
(function () {
      hideBar();
      if (window.NinjaKartSprites) window.NinjaKartSprites.load('');
      const st = SNESAssets.stats();
      console.info('[SNESAssets]', st.ok + '/' + st.total + ' ok');
    });
  }
  addEventListener('snesstudio:ready', run);
  // also when game type changes to kart
  addEventListener('snesstudio:gametype', run);
})();
