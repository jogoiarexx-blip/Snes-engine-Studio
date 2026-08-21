
(function () {
  function init() {
    if (!window.SNESAudio) return;
    document.addEventListener('click', function (e) {
      const t = e.target;
      if (t && (t.tagName === 'BUTTON' || t.classList.contains('nav') || t.classList.contains('cmdItem'))) {
        SNESAudio.play('ui_click');
      }
    }, true);
    // mute toggle with M when not typing
    addEventListener('keydown', function (e) {
      if (e.key === 'm' || e.key === 'M') {
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        const muted = SNESAudio.toggleMute();
        if (window.SNESStudio && SNESStudio.toast) SNESStudio.toast(muted ? 'Áudio mutado' : 'Áudio ativo');
      }
    });
  }
  addEventListener('snesstudio:ready', init);
  if (window.SNESStudio) init();
})();
