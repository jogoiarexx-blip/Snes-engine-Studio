/* Testes de rotas GameForge para o SNES Engine: contrato, campanha, save e export. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const routes=require('../js/game/stage-routes.js');
const brief=require('../js/editor/gameforge-brief.js');
let total=0;
function test(label,fn){fn();console.log('PASS',label);total++;}
function sample(genre='platform',n=4) {
 const entities=[{type:'player',id:'player',x:32,y:200,hp:3}];
 for(let i=0;i<n;i++)entities.push({type:genre==='shooter'?'spawner':'enemy',
   id:'enemy'+i,x:160+i*48,y:210,hp:2,speed:35,count:6,interval:.8});
 return {gameType:genre,name:'Jogo',scenes:[{id:'scene1',name:'Fase 1',themeId:'floresta',
    map:[[0]],layers:{ground:[[0]]},entities}],game:{},world:{}};
}
test('Detecta 3 caminhos e segredo com ortografia informal',()=>{
 const c=routes.parse('Quero tres caminhos diferentes e passagem secreta');
 assert.ok(c);assert.deepEqual(c.choices,['high','middle','low']);assert.equal(c.secret,true);
 assert.equal(routes.parse('quero só um jogo divertido'),null);
});
test('Três rotas x três fases geram nove cenas jogáveis únicas',()=>{
 const project=sample();
 const p=brief.compile('jogo de plataforma com 3 fases e 4 inimigos e 3 caminhos diferentes');
 assert.equal(p.supported,true);assert.ok(p.routes);
 brief.apply(project,p);
 assert.equal(project.scenes.length,9);
 assert.equal(new Set(project.scenes.map(x=>x.id)).size,9);
 assert.equal(project.game.stageRoutes.groups.length,3);
 assert.equal(project.game.campaign.length,9);
 assert.equal(project.game.flowGraph.edges.length,18);
 const counts=project.game.stageRoutes.groups[0].options.map(o=>
   project.scenes.find(s=>s.id===o.sceneId).entities.filter(e=>e.type==='enemy').length);
 assert.ok(counts[0]<counts[1]&&counts[1]<counts[2],JSON.stringify(counts));
 assert.equal(project.game.startScene,project.scenes[0].id);
});
test('Varia número de inimigos por onda no shooter sem alterar bosses',()=>{
 const p=sample('shooter',2);
 p.scenes[0].entities.push({type:'enemy',id:'boss',boss:true,hp:50});
 routes.build(p,routes.parse('3 rotas'));
 const options=p.game.stageRoutes.groups[0].options;
 const counts=options.map(o=>p.scenes.find(s=>s.id===o.sceneId).entities.find(e=>e.type==='spawner').count);
 assert.ok(counts[0]<counts[1]&&counts[1]<counts[2]);
 assert.ok(p.scenes.every(s=>s.entities.find(e=>e.id==='boss').hp===50));
});
test('Secret só aparece após duas rotas concluídas; unlock salvo',()=>{
 const p=sample();
 p.scenes.push({...p.scenes[0],id:'scene2'});
 p.scenes.push({...p.scenes[0],id:'scene3'});
 routes.build(p,routes.parse('3 caminhos e um secreto'));
 const config=p.game.stageRoutes;
 let state=routes.emptyState();
 assert.equal(routes.choicesFor(config,0,state).find(o=>o.id==='secret').locked,true);
 const first=config.groups[0].options[0].sceneId;
 const result=routes.complete(config,state,first,0);
 state=result.state;
 assert.equal(result.awarded,80);
 assert.equal(routes.choicesFor(config,1,state).find(o=>o.id==='secret').locked,true);
 state=routes.complete(config,state,config.groups[1].options[1].sceneId,result.score).state;
 state=routes.restore(config,JSON.parse(JSON.stringify(state)));
 assert.equal(routes.choicesFor(config,2,state).find(o=>o.id==='secret').locked,false);
 assert.ok(routes.select(config,state,2,'secret'));
});
test('Concluir a mesma rota duas vezes não multiplica recompensa',()=>{
 const p=sample();routes.build(p,routes.parse('3 caminhos'));
 const c=p.game.stageRoutes,stage=c.groups[0].options[0].sceneId;
 const one=routes.complete(c,routes.emptyState(),stage,900);
 const two=routes.complete(c,one.state,stage,one.score);
 assert.equal(two.awarded,0);assert.equal(two.score,980);
 assert.equal(two.state.claimed.length,1);
});
test('Snapshot de terceiros não habilita rotas inexistentes',()=>{
 const p=sample();routes.build(p,routes.parse('3 caminhos e secreto'));
 const cfg=p.game.stageRoutes;
 const save=routes.restore(cfg,{version:1,claimed:['fake','scene1__high','scene1__high'],history:[{stage:99,id:'secret'}]});
 assert.deepEqual(save.claimed,['scene1__high']);assert.deepEqual(save.history,[]);
 assert.equal(routes.select(cfg,0,0,'secret'),null);
});
test('Pedidos explícitos de zero inimigos preservam zero em todas as rotas',()=>{
 const project=sample();
 const plan=brief.compile('jogo de plataforma com 3 caminhos e sem inimigos');
 brief.apply(project,plan);
 assert.ok(project.scenes.every(s=>s.entities.filter(e=>e.type==='enemy').length===0));
});
test('Gênero kart não recebe promessa falsa de caminhos',()=>{
 const plan=brief.compile('kart corrida com 3 caminhos');
 assert.ok(plan.pending.some(x=>x.includes('Caminhos')));
});
test('Scripts do editor e exportador incluem rotas em ordem correta',()=>{
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const exporter=fs.readFileSync(path.join(root,'js/export/html-exporter.js'),'utf8');
 const bundle=fs.readFileSync(path.join(root,'js/export/export-sources.js'),'utf8');
 const gameflow=fs.readFileSync(path.join(root,'js/game/game-flow.js'),'utf8');
 assert.ok(index.includes('js/game/stage-routes.js'));
 assert.ok(index.indexOf('stage-routes.js')<index.indexOf('js/game/game-flow.js'));
 assert.ok(exporter.includes("src.stageRoutes || ''"));
 assert.ok(bundle.includes('"stageRoutes"'));
 assert.ok(gameflow.includes('routeMenu(nextStage)'));
 assert.ok(gameflow.includes('routes.complete(config,state.routeState'));
});
console.log('\n'+total+' testes de caminhos GameForge aprovados.');
