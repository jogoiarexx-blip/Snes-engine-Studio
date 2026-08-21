(function(){
  function init(){
    const A=window.SNESStudio; if(!A||!window.SNESSave)return;
    const saveBtn=document.getElementById('saveBtn');
    if(saveBtn){
      saveBtn.addEventListener('click',function(){
        try{ SNESSave.saveEditor(A.project); }catch(_){}
      }, true);
    }
    // FPS meter
    let frames=0, last=performance.now();
    function fpsLoop(now){
      frames++;
      if(now-last>=1000){
        const el=document.getElementById('fpsMeter');
        if(el){
          const n=(A.scene()&&A.scene().entities||[]).length;
          el.textContent=(window.SNESEngine&&SNESEngine.isPlaying()?frames+' FPS':'—')+' · '+n+' ent';
        }
        frames=0; last=now;
      }
      requestAnimationFrame(fpsLoop);
    }
    requestAnimationFrame(fpsLoop);

    // Breadcrumb
    const bar=document.querySelector('.bottom');
    if(bar && !document.getElementById('breadcrumb')){
      const bc=document.createElement('span');
      bc.id='breadcrumb'; bc.className='badge';
      bar.insertBefore(bc, bar.firstChild);
    }
    setInterval(function(){
      const bc=document.getElementById('breadcrumb');
      if(!bc||!A.project)return;
      const s=A.scene?A.scene():null;
      const layer=(A._editorLayers&&A._editorLayers.active)||'ground';
      bc.textContent=(A.project.name||'Projeto')+' › '+(s&&s.name||'cena')+' › '+layer+' › '+(A.project.gameType||'platform');
    }, 500);
  }
  addEventListener('snesstudio:ready', init);
  if(window.SNESStudio) init();
})();
