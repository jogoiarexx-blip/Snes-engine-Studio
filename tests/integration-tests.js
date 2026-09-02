const fs=require('fs'),vm=require('vm'),path=require('path');const R=path.resolve(__dirname,'..');let p=0,f=0;function t(n,fn){try{fn();console.log('PASS',n);p++}catch(e){console.error('FAIL',n,'-',e.message);f++}}function a(v,m){if(!v)throw new Error(m||'assert')}function txt(x){return fs.readFileSync(path.join(R,x),'utf8')}function load(x,c){vm.runInContext(txt(x),c,{filename:x})}
const c=vm.createContext({console,globalThis:null,window:null,structuredClone:global.structuredClone,Math,Date,JSON});c.globalThis=c;c.window=c;load('js/engine/tilemap.js',c);
t('TileMap migra map/layers para chunks canônicos',()=>{const s={map:Array.from({length:18},()=>Array(32).fill(0)),entities:[]};s.map[2][3]=7;c.SNESTileMap.normalizeScene(s);a(s.tilemap.chunks['0,0'].layers.ground[2][3]===7);a(s.chunks===s.tilemap.chunks);a(s.map===s.layers.ground)});
t('GameFlow usa StateMachine e StorageHub',()=>{const x=txt('js/game/game-flow.js');a(x.includes('SNESGameStateMachine'));a(x.includes('SNESStorage?.saves'));a(x.includes('SNESStorage?.preferences'))});
t('Engine usa EntityWorld e sincronização Components',()=>{const x=txt('js/engine/engine.js');a(x.includes("SNESEntityWorld.create({entities:rt.entities"));a(x.includes('syncToLegacy'));a(x.includes('syncFromLegacy'))});
t('Camera pipeline aplica transform no gameplay',()=>{const x=txt('js/engine/engine.js');a(x.includes('rt.__cameraPipeline'));a(x.includes('rt.camera.x'));a(txt('js/runtimes/platform/platform-runtime.js').includes('!rt.__skipClear'))});
t('Parallax é renderizado no pipeline final',()=>{const x=txt('js/engine/studio-runtime.js');a(x.includes("globalCompositeOperation='destination-over'"));a(x.includes('drawParallax(ctx,rt)'))});
t('Editor V4 usa SNESAutotile e não contém variável s inválida na pintura',()=>{const x=txt('js/editor-v4.js');a(x.includes('window.SNESAutotile.mask'));a(!x.includes('markDirty(s.layers || s, active)'))});
t('Undo/Redo principal usa CommandManager',()=>{const x=txt('js/core.js');a(x.includes('getCommandManager'));a(x.includes('mgr.undo()'));a(x.includes('mgr.redo()'))});
t('HTML export inclui TileMap canônico',()=>{const x=txt('js/export/html-exporter.js'),b=txt('js/export/export-sources.js');a(x.includes("src.tilemap || ''"));a(b.includes('"tilemap"'))});

t('Runtime liga coleções específicas dos gêneros ao EntityWorld',()=>{const x=txt('js/engine/engine.js');a(x.includes("['enemies','items','projectiles','bullets','pickups','npcs']"));a(x.includes('attachCollection'))});
t('Components usam bridge em vez de sincronização duplicada',()=>{const x=txt('js/engine/entity-components.js');a(x.includes("defineBridge(e,'hp'"));a(x.includes("defineBridge(e,'spriteAsset'"))});
t('Storage de editor/slots passa pelo gateway unificado',()=>{a(txt('js/engine/save-manager.js').includes('SNESStorage?.legacy'));a(txt('js/editor/recovery.js').includes('SNESStorage?.legacy'));a(txt('js/editor/controls-panel.js').includes('SNESStorage?.preferences'))});


t('Game Flow faz preload real e transição antes da cena',()=>{const x=txt('js/game/game-flow.js');a(x.includes('async function preloadGame()'));a(x.includes('preloadProject(project'));a(x.includes('withTransition'));a(x.includes("setScreen('loading')"))});
t('Checkpoint central dispara autosave do Game Flow',()=>{const e=txt('js/engine/engine.js'),g=txt('js/game/game-flow.js');a(e.includes("emit('checkpoint:activated'"));a(g.includes("on('checkpoint:activated'"));a(g.includes('settings.autosave!==false'))});
t('Pad móvel e gamepad controlam Pause global',()=>{const e=txt('js/engine/engine.js'),g=txt('js/game/game-flow.js');a(e.includes("padButtons.includes('pause')"));a(g.includes('gp.buttons[9]'));a(g.includes('state._shellPauseHeld'))});
t('Runtime usa imagens pré-carregadas e fallback para asset ausente',()=>{const x=txt('js/engine/studio-runtime.js');a(x.includes("SNESAssets?.get?.('project:'"));a(x.includes("fillStyle='#ff00cc'"))});


t('Save preserva snapshot após encerrar runtime e restaura checkpoint',()=>{const g=txt('js/game/game-flow.js');a(g.includes('state.lastSnapshot=snapshot()'));a(g.includes("checkpoint:clone(s.checkpoint)"));a(g.includes('state.pendingPlayer=Object.assign'));a(g.includes('const d=saves(),sv=d.slots&&d.slots[state.slot]'))});


t('Troca interna de cena atualiza Project, EntityWorld e Game Flow',()=>{const e=txt('js/engine/engine.js'),g=txt('js/game/game-flow.js');a(e.includes("emit('scene:changed'"));a(e.includes('project.currentScene=liveScene'));a(e.includes('rt.__studio=null'));a(g.includes("on('scene:changed'"));a(g.includes('project.game.cutscenes?.scenes?.[ev.current]'))});
t('Cutscene usa runtime vivo para prefab/entidade/câmera e BGM real',()=>{const g=txt('js/game/game-flow.js');a(g.includes('rt.world.spawn(pf.entity)'));a(g.includes('rt.world.destroy(ent.id)'));a(g.includes('global.SNESAudio.playBgm'));a(g.includes("cam.mode='fixed'"))});

t('Qualidade adaptativa está ligada ao runtime e FX',()=>{const q=txt('js/engine/quality-manager.js'),s=txt('js/engine/studio-runtime.js'),h=txt('js/export/html-exporter.js');a(q.includes('quality:changed'));a(s.includes('SNESQuality?.update'));a(s.includes('maxParticles'));a(h.includes('src.qualityManager'))});
t('Input possui justPressed/justReleased com ciclo por frame',()=>{const i=txt('js/engine/input-manager.js'),e=txt('js/engine/engine.js');a(i.includes('function justPressed'));a(i.includes('function justReleased'));a(e.includes('rt.input?.beginFrame'));a(e.includes('rt.input?.endFrame'))});
t('Pause suspende áudio e perda de foco pausa o jogo',()=>{const g=txt('js/game/game-flow.js'),au=txt('js/engine/audio-manager.js');a(g.includes('SNESAudio?.suspend'));a(g.includes("visibilitychange"));a(g.includes("autoPause:true"));a(au.includes('function suspend()'));a(au.includes('function resume()'))});
t('Lifecycle de cena emite leaving/entered',()=>{const e=txt('js/engine/engine.js');a(e.includes("emit('scene:leaving'"));a(e.includes("emit('scene:entered'"))});
t('Validador cobre qualidade, cutscene, prefab e custom tiles',()=>{const v=txt('js/editor/validator.js');for(const x of ['Qualidade inválida','Cutscene aponta para cena inexistente','Prefab ','Tile customizado '])a(v.includes(x),x)});

t('Missões estão no editor, save e HTML exportado',()=>{const g=txt('js/game/game-flow.js'),ed=txt('js/editor/game-flow-editor.js'),ex=txt('js/export/html-exporter.js');a(g.includes('SNESQuestSystem'));a(g.includes('quests:state.questSystem'));a(ed.includes('MISSÕES'));a(ex.includes('src.questSystem'))});
t('Debug overlay acompanha runtime e é exportado',()=>{const d=txt('js/engine/debug-overlay.js'),ex=txt('js/export/html-exporter.js');a(d.includes("runtime:started"));a(d.includes("engine:frame"));a(ex.includes('src.debugOverlay'))});

console.log(`\n${p} integration passed, ${f} failed`);process.exit(f?1:0)
