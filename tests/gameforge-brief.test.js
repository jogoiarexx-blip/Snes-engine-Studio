/* Testes da integração GameForge Brief, sem navegador ou dependências externas. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/editor/gameforge-brief.js'), 'utf8');
const context = vm.createContext({console, module:{exports:{}}});
vm.runInContext(source, context, {filename:'gameforge-brief.js'});
const {compile, apply} = context.module.exports;
let passed = 0;
function test(label, action) {
  action();
  passed++;
  console.log('PASS', label);
}
function sample(type) {
  return {name:'Jogo exemplo',gameType:type,settings:{},
    scenes:[{id:'scene1',name:'Fase 1',themeId:'floresta',
      map:[[0]],layers:{background:[[0]],ground:[[0]]},
      entities:[{id:'player',type:'player',name:'Jogador',x:20,y:20},
        {id:'enemy1',type:'enemy',name:'Inimigo',x:200,y:200}]}]};
}
test('PT-BR informal gera gênero, fases, tema e inimigos', () => {
  const p=compile('Qro um jogo de platafoma na floresta com tres fases e 4 inimigus');
  assert.equal(p.genre, 'platform'); assert.equal(p.supported,true);
  assert.equal(p.phases,3); assert.equal(p.enemies,4); assert.equal(p.theme,'floresta');
});
test('Descrição de navinha altera ondas, não inventa física de FPS', () => {
  const p=compile('Uma navinha na galáxia com 2 fases e cinco inimigos');
  assert.equal(p.genre,'shooter');assert.equal(p.phases,2);assert.equal(p.enemies,5);
  const project=sample('shooter');
  project.scenes[0].entities=[{type:'player',id:'p'},{type:'spawner',id:'waveA',count:2},{type:'spawner',id:'waveB',count:4}];
  apply(project,p);
  assert.equal(project.scenes[1].entities[1].count,5);
  assert.equal(project.scenes[1].entities[2].count,5);
});
test('Campanha possui referências distintas e conserva jogador', () => {
  const p=compile('plataforma na neve com 3 fases e 4 inimigos');
  const project=sample('platform');
  apply(project,p);
  assert.equal(project.scenes.length,3);
  assert.deepEqual(Array.from(project.game.campaign),['scene1','scene2','scene3']);
  assert.notEqual(project.scenes[0],project.scenes[1]);
  assert.equal(project.scenes[0].entities.filter(e=>e.type==='enemy').length,4);
  assert.equal(project.scenes[2].entities.filter(e=>e.type==='player').length,1);
  assert.ok(project.scenes.every(s=>s.themeId==='neve'));
});
test('Negação explícita impede criar inimigos', () => {
  const p=compile('briga de rua com 2 fases sem inimigos');
  assert.equal(p.enemies,0);
  const project=sample('beat-em-up');
  apply(project,p);
  assert.equal(project.scenes[0].entities.filter(e=>e.type==='enemy').length,0);
});
test('Contagem de fases tem limite e gera aviso', () => {
  const p=compile('kart de corrida no deserto com 80 fases');
  assert.equal(p.phases,12);assert.ok(p.warnings.length>0);
  assert.equal(p.genre,'kart-racing');
});
test('Não converte pedidos 3D/Minecraft em jogo 2D silenciosamente', () => {
  const p=compile('Crie Minecraft 3D com shaders');
  assert.equal(p.supported,false);assert.ok(p.pending.length>0);
  assert.throws(()=>apply(sample('platform'),p));
});
test('Gênero ausente ou ambíguo bloqueia geração automática', () => {
  assert.equal(compile('jogo com cores bonitas').supported,false);
  assert.equal(compile('plataforma de kart e corrida').supported,false);
});
test('Títulos são armazenados como texto simples', () => {
  const p=compile('jogo de plataforma chamado "<script>alert(1)</script>"');
  assert.equal(p.supported,true);assert.ok(!p.title.includes('<'));
  const project=sample('platform');apply(project,p);
  assert.ok(!project.name.includes('<'));
  assert.ok(project.studio.gameforgeBrief.source.length>0);
});
test('Jogos de kart não recebem contagens de inimigos falsas', () => {
  const p=compile('kart com 3 inimigos');
  assert.equal(p.supported,true);assert.ok(p.pending.some(s=>s.includes('Kart')));
});
test('Build/HTML conectam o assistente sem incluir código arbitrário no runtime', () => {
  const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const wizard=fs.readFileSync(path.join(root,'js/editor/project-wizard.js'),'utf8');
  assert.ok(index.indexOf('gameforge-brief.js')<index.indexOf('project-wizard.js'));
  assert.ok(wizard.includes('SNESGameForgeBrief.compile'));
  assert.ok(wizard.includes('SNESGameForgeBrief.apply'));
  assert.ok(!source.includes('eval('));
});
console.log('\n' + passed + ' testes GameForge Brief aprovados.');
