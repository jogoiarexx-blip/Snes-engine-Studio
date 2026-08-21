
(function () {
  function init() {
    addEventListener('keydown', function (e) {
      if (e.key === 'F4') {
        if (!window.SNESLoadWorker) return;
        const el = document.getElementById('snesWorkerMem');
        const on = !el;
        window.SNESLoadWorker.showOverlay(on);
        if (window.SNESStudio && SNESStudio.toast) {
          SNESStudio.toast(on ? 'Worker mem: ON (F4)' : 'Worker mem: OFF');
        }
      }
    });
  }
  addEventListener('snesstudio:ready', init);
  if (window.SNESStudio) init();
})();
