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

console.log(`\n${p} integration passed, ${f} failed`);process.exit(f?1:0)
