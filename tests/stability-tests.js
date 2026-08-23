const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
let passed=0,failed=0;
function test(name,fn){try{fn();console.log('PASS',name);passed++;}catch(e){console.error('FAIL',name,'-',e.message);failed++;}}
function assert(v,msg){if(!v)throw new Error(msg||'assertion failed')}
function load(rel,ctx){vm.runInContext(fs.readFileSync(path.join(ROOT,rel),'utf8'),ctx,{filename:rel})}
const ctx=vm.createContext({console,globalThis:null,window:null,structuredClone:global.structuredClone,setTimeout,clearTimeout,Date,Math,JSON});ctx.globalThis=ctx;ctx.window=ctx;
load('js/engine/event-bus.js',ctx);load('js/engine/runtime-session.js',ctx);
test('EventBus emite e remove listeners',()=>{let n=0;const off=ctx.SNESEvents.on('x',()=>n++);ctx.SNESEvents.emit('x');off();ctx.SNESEvents.emit('x');assert(n===1,'listener count '+n)});
test('RuntimeSession não altera projeto original',()=>{const p={game:{settings:{difficulty:'hard'}},scenes:[{entities:[{type:'enemy',hp:10,maxHp:10,damage:2},{type:'player',hp:4}]}]};const s=ctx.SNESRuntimeSession.create(p);s.project.scenes[0].entities[0].hp=1;assert(p.scenes[0].entities[0].hp===10,'original mutated')});
test('Dificuldade hard escala inimigos',()=>{const p={game:{settings:{difficulty:'hard'}},scenes:[{entities:[{type:'enemy',hp:10,maxHp:10,damage:4}]}]};const s=ctx.SNESRuntimeSession.create(p);const e=s.project.scenes[0].entities[0];assert(e.hp===14,'hp '+e.hp);assert(e.damage===5,'damage '+e.damage)});
test('Project Wizard cria schema 10',()=>{const t=fs.readFileSync(path.join(ROOT,'js/editor/project-wizard.js'),'utf8');assert(/schemaVersion:\s*10/.test(t),'schema 10 absent');assert(!/schemaVersion:\s*7/.test(t),'legacy schema remains')});
test('Export bundle inclui EventBus/RuntimeSession/Components',()=>{const t=fs.readFileSync(path.join(ROOT,'js/export/export-sources.js'),'utf8');for(const k of ['eventBus','runtimeSession','entityComponents'])assert(t.includes('"'+k+'"'),k+' missing')});
test('GameFlow não usa polling setInterval para vitória',()=>{const t=fs.readFileSync(path.join(ROOT,'js/game/game-flow.js'),'utf8');assert(!t.includes('state.monitor=setInterval'),'monitor polling remains');assert(t.includes('onGameOver'),'onGameOver hook absent');assert(t.includes('PRESSIONE UMA TECLA'),'remap UI absent')});

test('Production tools incluem Cutscene/UI/Tile Cutter/Prefab overrides',()=>{const t=fs.readFileSync(path.join(ROOT,'js/editor/production-tools.js'),'utf8');for(const k of ['Timeline','Tile Cutter','prefabOverrides','Seleção múltipla'])assert(t.includes(k),k+' missing')});
test('GameFlow executa timeline e tema visual',()=>{const t=fs.readFileSync(path.join(ROOT,'js/game/game-flow.js'),'utf8');assert(t.includes('function runTimeline'),'cutscene runtime missing');assert(t.includes('g.ui=Object.assign'),'ui theme defaults missing');assert(t.includes('previewCutscene'),'cutscene preview missing')});
test('HTML export preserva custom tiles',()=>{const t=fs.readFileSync(path.join(ROOT,'js/export/html-exporter.js'),'utf8');assert(t.includes('PROJECT.studio.customTiles'),'custom tiles not embedded');assert(t.includes('assetImage'),'custom tile asset renderer missing')});


test('Cutscene de cena é executada antes do gameplay',()=>{const t=fs.readFileSync(path.join(ROOT,'js/game/game-flow.js'),'utf8');assert(t.includes('project.game.cutscenes.scenes&&project.game.cutscenes.scenes[target]'),'scene cutscene lookup missing');assert(t.includes('skipSceneCutscene'),'scene cutscene recursion guard missing')});
test('Reimportar asset preserva ID existente',()=>{const t=fs.readFileSync(path.join(ROOT,'js/editor/studio-v10.js'),'utf8');assert(t.includes('SNESAssetDB.put(f,keepId||undefined)'),'asset id preservation missing');assert(t.includes('referências limpas'),'safe asset delete missing')});
test('Tile Cutter limita recorte ao tamanho da imagem',()=>{const t=fs.readFileSync(path.join(ROOT,'js/editor/production-tools.js'),'utf8');assert(t.includes('Math.floor(im.naturalWidth/tw)'),'tile cutter width clamp missing');assert(t.includes('Math.floor(im.naturalHeight/th)'),'tile cutter height clamp missing')});

console.log(`\n${passed} passed, ${failed} failed`);process.exit(failed?1:0);
