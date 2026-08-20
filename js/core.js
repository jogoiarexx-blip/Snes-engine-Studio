
(()=>{
'use strict';
const W=512,H=288,T=16,COLS=32,ROWS=18,KEY='snes_engine_studio_project_v6';

// ===== V3: TILESETS TEMÁTICOS (tiles + inimigo padrão + objetos decorativos) =====
// Cada tile: {name,color,solid,decos:[{x,y,w,h,color} | {x,y,w,h,outline}]} (offsets em px, tile 16x16)
const THEMES={
 floresta:{emoji:'🌿',name:'Floresta',
  tiles:[
   {name:'vazio',color:'#263b69',solid:false,decos:[]},
   {name:'grama',color:'#48a34f',solid:true,decos:[{x:0,y:0,w:16,h:3,color:'#77c95c'}]},
   {name:'terra',color:'#8a5437',solid:true,decos:[{x:3,y:7,w:3,h:2,color:'#6e3d2b'},{x:10,y:11,w:2,h:2,color:'#6e3d2b'}]},
   {name:'pedra',color:'#686b7a',solid:true,decos:[{x:2,y:2,w:12,h:12,outline:'#838796'}]},
   {name:'água',color:'#287fa7',solid:false,decos:[{x:0,y:4,w:16,h:2,color:'#57b3cb'}]},
   {name:'parede',color:'#6b4a2f',solid:true,decos:[{x:0,y:5,w:16,h:1,color:'#4d331f'},{x:0,y:11,w:16,h:1,color:'#4d331f'}]},
   {name:'arbusto',color:'#28713a',solid:true,decos:[{x:3,y:3,w:10,h:10,color:'#3b8c47'}]},
   {name:'tronco',color:'#5b3a22',solid:true,decos:[{x:0,y:6,w:16,h:1,color:'#43291a'},{x:0,y:10,w:16,h:1,color:'#43291a'}]}
  ],
  enemy:{name:'Lobo',color:'#c84c72'},
  objects:[{id:'pedra_obj',name:'Pedra',color:'#7a7a7a',shape:'box'},{id:'caixa',name:'Caixa',color:'#8a5a2f',shape:'box'},{id:'fogueira',name:'Fogueira',color:'#e8611f',shape:'circle'},{id:'placa',name:'Placa',color:'#a97c50',shape:'box'}]
 },
 deserto:{emoji:'🏜️',name:'Deserto',
  tiles:[
   {name:'vazio',color:'#e8c27a',solid:false,decos:[]},
   {name:'areia',color:'#d9b26a',solid:true,decos:[{x:2,y:3,w:2,h:2,color:'#c49a52'},{x:9,y:9,w:2,h:2,color:'#c49a52'}]},
   {name:'duna',color:'#c49a52',solid:true,decos:[{x:0,y:0,w:16,h:3,color:'#d9b26a'}]},
   {name:'rocha',color:'#8a6a4a',solid:true,decos:[{x:2,y:2,w:12,h:12,outline:'#a9895c'}]},
   {name:'oásis',color:'#2a9dab',solid:false,decos:[{x:0,y:4,w:16,h:2,color:'#57c8d4'}]},
   {name:'pedra antiga',color:'#a9895c',solid:true,decos:[{x:0,y:5,w:16,h:1,color:'#7d6440'},{x:0,y:11,w:16,h:1,color:'#7d6440'}]},
   {name:'cacto',color:'#2f6b3a',solid:true,decos:[{x:6,y:2,w:4,h:12,color:'#3c8a49'},{x:2,y:6,w:3,h:2,color:'#3c8a49'},{x:11,y:6,w:3,h:2,color:'#3c8a49'}]},
   {name:'ossos',color:'#cbb98f',solid:false,decos:[{x:5,y:6,w:6,h:2,color:'#efe5cc'}]}
  ],
  enemy:{name:'Escorpião',color:'#c8794c'},
  objects:[{id:'pedra_deserto',name:'Pedra',color:'#8a6a4a',shape:'box'},{id:'barril',name:'Barril',color:'#8a5a2f',shape:'box'},{id:'fogueira',name:'Fogueira',color:'#e8611f',shape:'circle'},{id:'placa',name:'Placa',color:'#a9895c',shape:'box'}]
 },
 neve:{emoji:'❄️',name:'Neve',
  tiles:[
   {name:'vazio',color:'#8fa9c9',solid:false,decos:[]},
   {name:'neve',color:'#f2f6fb',solid:true,decos:[{x:2,y:2,w:2,h:2,color:'#d7ecf7'},{x:10,y:9,w:2,h:2,color:'#d7ecf7'}]},
   {name:'gelo',color:'#bfe3f7',solid:true,decos:[{x:0,y:0,w:16,h:3,color:'#d7f2ff'}]},
   {name:'pedra congelada',color:'#6f7a8c',solid:true,decos:[{x:2,y:2,w:12,h:12,outline:'#93a0b3'}]},
   {name:'rio congelado',color:'#7fc4e0',solid:false,decos:[{x:0,y:4,w:16,h:2,color:'#bfe3f7'}]},
   {name:'parede de gelo',color:'#9fd3ec',solid:true,decos:[{x:0,y:5,w:16,h:1,color:'#c7e9f7'},{x:0,y:11,w:16,h:1,color:'#c7e9f7'}]},
   {name:'pinheiro',color:'#1f5c46',solid:true,decos:[{x:6,y:1,w:4,h:4,color:'#2c7a5c'},{x:4,y:5,w:8,h:4,color:'#2c7a5c'},{x:7,y:10,w:2,h:5,color:'#5b3a22'}]},
   {name:'estalactite',color:'#d7ecf7',solid:false,decos:[{x:6,y:0,w:4,h:8,color:'#c2e2f2'}]}
  ],
  enemy:{name:'Urso Polar',color:'#7a95c8'},
  objects:[{id:'boneco',name:'Boneco de Neve',color:'#ffffff',shape:'circle'},{id:'caixa',name:'Caixa',color:'#8a5a2f',shape:'box'},{id:'fogueira',name:'Fogueira',color:'#e8611f',shape:'circle'},{id:'placa',name:'Placa',color:'#9fd3ec',shape:'box'}]
 },
 vulcao:{emoji:'🌋',name:'Vulcão',
  tiles:[
   {name:'vazio',color:'#431417',solid:false,decos:[]},
   {name:'rocha vulcânica',color:'#3a2420',solid:true,decos:[{x:2,y:3,w:2,h:2,color:'#e8611f'},{x:10,y:9,w:2,h:2,color:'#e8611f'}]},
   {name:'terra queimada',color:'#5a2f1d',solid:true,decos:[{x:3,y:7,w:3,h:2,color:'#3a2420'},{x:10,y:11,w:2,h:2,color:'#3a2420'}]},
   {name:'pedra',color:'#4a4444',solid:true,decos:[{x:2,y:2,w:12,h:12,outline:'#6a6363'}]},
   {name:'lava',color:'#e8611f',solid:false,decos:[{x:0,y:4,w:16,h:2,color:'#ffb347'}]},
   {name:'obsidiana',color:'#241726',solid:true,decos:[{x:0,y:2,w:16,h:1,color:'#3a2440'},{x:0,y:12,w:16,h:1,color:'#3a2440'}]},
   {name:'planta seca',color:'#6b4a23',solid:true,decos:[{x:7,y:1,w:2,h:14,color:'#8a6432'}]},
   {name:'cristal de magma',color:'#ff8c3c',solid:false,decos:[{x:5,y:5,w:6,h:6,color:'#ffcf8c'}]}
  ],
  enemy:{name:'Salamandra de Fogo',color:'#ff6a2f'},
  objects:[{id:'pedra_vulcanica',name:'Pedra Vulcânica',color:'#3a2420',shape:'box'},{id:'barril',name:'Barril',color:'#8a5a2f',shape:'box'},{id:'fogueira',name:'Fogueira',color:'#e8611f',shape:'circle'},{id:'placa',name:'Placa',color:'#4a4444',shape:'box'}]
 },
 castelo:{emoji:'🏰',name:'Castelo',
  tiles:[
   {name:'vazio',color:'#2b2440',solid:false,decos:[]},
   {name:'piso de pedra',color:'#746a63',solid:true,decos:[{x:0,y:0,w:16,h:1,color:'#58514b'},{x:0,y:8,w:16,h:1,color:'#58514b'}]},
   {name:'tapete',color:'#7a2430',solid:true,decos:[{x:2,y:2,w:12,h:12,color:'#8f2c3a'}]},
   {name:'muralha',color:'#55504a',solid:true,decos:[{x:1,y:1,w:14,h:14,outline:'#726b62'}]},
   {name:'fosso',color:'#2c5a73',solid:false,decos:[{x:0,y:4,w:16,h:2,color:'#3d7a99'}]},
   {name:'parede de castelo',color:'#423a52',solid:true,decos:[{x:0,y:5,w:16,h:1,color:'#312a3d'},{x:0,y:11,w:16,h:1,color:'#312a3d'}]},
   {name:'tocha',color:'#caa23a',solid:true,decos:[{x:6,y:1,w:4,h:6,color:'#f0d060'}]},
   {name:'estandarte',color:'#8a2030',solid:false,decos:[{x:5,y:0,w:6,h:12,color:'#a92a3c'}]}
  ],
  enemy:{name:'Cavaleiro das Sombras',color:'#4a4458'},
  objects:[{id:'estatua',name:'Estátua',color:'#746a63',shape:'box'},{id:'barril',name:'Barril',color:'#8a5a2f',shape:'box'},{id:'tocha_obj',name:'Tocha',color:'#caa23a',shape:'circle'},{id:'placa',name:'Placa',color:'#55504a',shape:'box'}]
 },
 caverna:{emoji:'🕳️',name:'Caverna',
  tiles:[
   {name:'vazio',color:'#0d0d14',solid:false,decos:[]},
   {name:'chão de caverna',color:'#3a3630',solid:true,decos:[{x:3,y:7,w:2,h:2,color:'#4a453d'},{x:10,y:4,w:2,h:2,color:'#4a453d'}]},
   {name:'terra da caverna',color:'#4a3d2c',solid:true,decos:[{x:3,y:7,w:3,h:2,color:'#382c1f'}]},
   {name:'pedra da caverna',color:'#57534d',solid:true,decos:[{x:2,y:2,w:12,h:12,outline:'#726e66'}]},
   {name:'água subterrânea',color:'#1f5566',solid:false,decos:[{x:0,y:4,w:16,h:2,color:'#2f7a91'}]},
   {name:'parede rochosa',color:'#29241f',solid:true,decos:[{x:2,y:2,w:3,h:3,color:'#3a332b'},{x:9,y:9,w:3,h:3,color:'#3a332b'}]},
   {name:'cogumelo brilhante',color:'#5fd3c4',solid:true,decos:[{x:5,y:4,w:6,h:5,color:'#8ee8dc'},{x:7,y:9,w:2,h:5,color:'#e8e0c8'}]},
   {name:'cristal',color:'#7a5fd3',solid:false,decos:[{x:5,y:3,w:6,h:10,color:'#a48ee8'}]}
  ],
  enemy:{name:'Morcego',color:'#5a4a6a'},
  objects:[{id:'pedra_caverna',name:'Pedra',color:'#57534d',shape:'box'},{id:'caixa',name:'Caixa',color:'#8a5a2f',shape:'box'},{id:'cristal_obj',name:'Cristal',color:'#7a5fd3',shape:'circle'},{id:'placa',name:'Placa',color:'#4a3d2c',shape:'box'}]
 },
 agua:{emoji:'🌊',name:'Água',
  tiles:[
   {name:'vazio',color:'#1c4f66',solid:false,decos:[]},
   {name:'areia de praia',color:'#d9c27a',solid:true,decos:[{x:2,y:3,w:2,h:2,color:'#c4ac60'},{x:9,y:9,w:2,h:2,color:'#c4ac60'}]},
   {name:'fundo raso',color:'#2d7a8c',solid:true,decos:[{x:0,y:0,w:16,h:3,color:'#3d94a8'}]},
   {name:'recife',color:'#4a6b6f',solid:true,decos:[{x:2,y:2,w:12,h:12,outline:'#688a8e'}]},
   {name:'água profunda',color:'#123a5c',solid:false,decos:[{x:0,y:4,w:16,h:2,color:'#1f5a86'}]},
   {name:'coral',color:'#2a5c66',solid:true,decos:[{x:2,y:2,w:3,h:3,color:'#e8724c'},{x:9,y:9,w:3,h:3,color:'#e8724c'}]},
   {name:'alga',color:'#1f6b4a',solid:true,decos:[{x:6,y:0,w:2,h:14,color:'#2f8a5f'},{x:9,y:2,w:2,h:12,color:'#2f8a5f'}]},
   {name:'concha',color:'#e8d9b0',solid:false,decos:[{x:5,y:5,w:6,h:6,color:'#f2e8cc'}]}
  ],
  enemy:{name:'Peixe Elétrico',color:'#3ad0e0'},
  objects:[{id:'pedra_coral',name:'Pedra Coral',color:'#4a6b6f',shape:'box'},{id:'bau',name:'Baú',color:'#8a5a2f',shape:'box'},{id:'concha_obj',name:'Concha',color:'#e8d9b0',shape:'circle'},{id:'placa',name:'Placa',color:'#2a5c66',shape:'box'}]
 },
 espaco:{emoji:'🚀',name:'Espaço',
  tiles:[
   {name:'vazio',color:'#050512',solid:false,decos:[{x:3,y:3,w:1,h:1,color:'#ffffff'},{x:11,y:8,w:1,h:1,color:'#ffffff'},{x:8,y:12,w:1,h:1,color:'#ffffff'}]},
   {name:'piso de nave',color:'#3a3f52',solid:true,decos:[{x:0,y:0,w:16,h:1,color:'#4d5468'},{x:0,y:8,w:16,h:1,color:'#4d5468'}]},
   {name:'painel metálico',color:'#4a5068',solid:true,decos:[{x:2,y:2,w:2,h:2,color:'#606a86'},{x:11,y:9,w:2,h:2,color:'#606a86'}]},
   {name:'rocha asteroide',color:'#5a5254',solid:true,decos:[{x:2,y:2,w:12,h:12,outline:'#7a7274'}]},
   {name:'plasma',color:'#2fd0e0',solid:false,decos:[{x:0,y:4,w:16,h:2,color:'#7cf0ff'}]},
   {name:'parede da nave',color:'#23283a',solid:true,decos:[{x:0,y:5,w:16,h:1,color:'#343b52'},{x:0,y:11,w:16,h:1,color:'#343b52'}]},
   {name:'planta alienígena',color:'#6adf7a',solid:true,decos:[{x:5,y:2,w:6,h:6,color:'#9af0a5'},{x:7,y:8,w:2,h:6,color:'#3a8a49'}]},
   {name:'cristal espacial',color:'#b06aff',solid:false,decos:[{x:5,y:4,w:6,h:8,color:'#d4b0ff'}]}
  ],
  enemy:{name:'Alienígena',color:'#7aff8a'},
  objects:[{id:'rocha_asteroide',name:'Rocha Asteroide',color:'#5a5254',shape:'box'},{id:'caixote',name:'Caixote',color:'#4a5068',shape:'box'},{id:'cristal_esp',name:'Cristal',color:'#b06aff',shape:'circle'},{id:'placa',name:'Placa',color:'#23283a',shape:'box'}]
 }
};
const THEME_IDS=Object.keys(THEMES);
const ENEMY_VARIANTS={
 floresta:[{id:'lobo',name:'Lobo',color:'#9a6b55',accent:'#e8d7bb',style:'beast'},{id:'slime_folha',name:'Slime de Folha',color:'#45a858',accent:'#a8ef79',style:'slime'},{id:'javali',name:'Javali',color:'#75513f',accent:'#e3c596',style:'beast'}],
 deserto:[{id:'escorpiao',name:'Escorpião',color:'#c8794c',accent:'#ffd078',style:'crawler'},{id:'mumia',name:'Múmia',color:'#d8c99d',accent:'#7b6548',style:'humanoid'},{id:'cobra',name:'Cobra do Deserto',color:'#c7a33c',accent:'#fff09a',style:'slime'}],
 neve:[{id:'urso',name:'Urso Polar',color:'#e9f4ff',accent:'#7898b9',style:'beast'},{id:'slime_gelo',name:'Slime de Gelo',color:'#70c9e9',accent:'#d8f7ff',style:'slime'},{id:'yeti',name:'Yeti',color:'#c9e4ef',accent:'#597a99',style:'humanoid'}],
 vulcao:[{id:'salamandra',name:'Salamandra de Fogo',color:'#ef5d2f',accent:'#ffd15c',style:'beast'},{id:'slime_lava',name:'Slime de Lava',color:'#e8491d',accent:'#ffdc59',style:'slime'},{id:'golem_magma',name:'Golem de Magma',color:'#56302a',accent:'#ff7c32',style:'humanoid'}],
 castelo:[{id:'cavaleiro',name:'Cavaleiro das Sombras',color:'#48465b',accent:'#b9354d',style:'humanoid'},{id:'armadura',name:'Armadura Viva',color:'#7c8494',accent:'#e0c05a',style:'humanoid'},{id:'rato',name:'Rato Gigante',color:'#755f69',accent:'#e4a0a6',style:'beast'}],
 caverna:[{id:'morcego',name:'Morcego',color:'#655078',accent:'#d188e8',style:'flying'},{id:'aranha',name:'Aranha',color:'#493d50',accent:'#e05268',style:'crawler'},{id:'golem_cristal',name:'Golem de Cristal',color:'#6653aa',accent:'#b9a4ff',style:'humanoid'}],
 agua:[{id:'peixe',name:'Peixe Elétrico',color:'#35c6d4',accent:'#fff06c',style:'flying'},{id:'caranguejo',name:'Caranguejo',color:'#e05c48',accent:'#ffad75',style:'crawler'},{id:'tritao',name:'Tritão',color:'#397f91',accent:'#8de4db',style:'humanoid'}],
 espaco:[{id:'alien',name:'Alienígena',color:'#68dc79',accent:'#c4ff9c',style:'humanoid'},{id:'robo',name:'Robô Sentinela',color:'#77839c',accent:'#57e4ff',style:'humanoid'},{id:'slime_cosmico',name:'Slime Cósmico',color:'#9256d8',accent:'#e7a6ff',style:'slime'}]
};
function enemyList(themeId){return ENEMY_VARIANTS[themeId]||ENEMY_VARIANTS.floresta}

const clone=o=>JSON.parse(JSON.stringify(o));
function blankMap(){return Array.from({length:ROWS},()=>Array(COLS).fill(0));}
function sampleMap(){const m=blankMap();for(let x=0;x<COLS;x++){m[16][x]=2;m[17][x]=2}for(let x=2;x<8;x++)m[13][x]=1;for(let x=11;x<17;x++)m[11][x]=1;for(let x=21;x<27;x++)m[14][x]=1;for(let x=28;x<31;x++)m[10][x]=1;return m}
function defaultProject(){return {version:6,name:'Meu Jogo',settings:{type:'platform',width:512,height:288,tileSize:16},scenes:[{id:'scene1',name:'Fase 1',themeId:'floresta',map:sampleMap(),entities:[{id:'player',type:'player',name:'Player',x:32,y:240,hp:3,speed:120,jump:300},{id:'slime1',type:'enemy',name:'Lobo',x:220,y:220,hp:1,speed:35},{id:'coin1',type:'item',name:'Moeda',x:320,y:180,hp:1},{id:'obj1',type:'object',name:'Pedra',sub:'pedra_obj',x:120,y:216}]}],currentScene:'scene1'}}
let project=defaultProject(),view='map',selectedTile=1,selectedEntity=null,playing=false,history=[],future=[];
const $=id=>document.getElementById(id);const scene=()=>project.scenes.find(s=>s.id===project.currentScene)||project.scenes[0];
function curTheme(){const t=THEMES[scene().themeId];return t||THEMES.floresta}
function curTiles(){return curTheme().tiles}
const canvas=document.getElementById('editor'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
function mark(){ $('dirty').textContent='●'; $('dirty').style.color='#f7b32b' }
function pushHistory(){history.push(clone(project));if(history.length>30)history.shift();future=[];mark()}
function setStatus(s){$('status').textContent=s}
function toast(s){const d=document.createElement('div');d.className='toast';d.textContent=s;document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}

// ----- Desenho de tiles orientado a dados (funciona no editor E no jogo exportado) -----
function drawTileAt(ctx2,tile,x,y,size){const s=size/16;ctx2.fillStyle=tile.color;ctx2.fillRect(x,y,size,size);(tile.decos||[]).forEach(d=>{if(d.outline){ctx2.strokeStyle=d.outline;ctx2.lineWidth=Math.max(1,s);ctx2.strokeRect(x+d.x*s+s/2,y+d.y*s+s/2,Math.max(0,d.w*s-s),Math.max(0,d.h*s-s))}else{ctx2.fillStyle=d.color;ctx2.fillRect(x+d.x*s,y+d.y*s,d.w*s,d.h*s)}})}
function px(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)}
function drawEnemySprite(c,e,theme){const v=enemyList(scene().themeId).find(q=>q.id===e.sub)||enemyList(scene().themeId)[0],x=e.x,y=e.y,b=v.color,a=v.accent;
 if(v.style==='slime'){px(c,x+2,y+5,10,7,b);px(c,x+4,y+3,6,3,b);px(c,x+3,y+11,3,2,a);px(c,x+9,y+11,3,2,a)}
 else if(v.style==='flying'){px(c,x+4,y+4,6,7,b);px(c,x,y+2,5,3,b);px(c,x+9,y+2,5,3,b);px(c,x+2,y,3,2,a);px(c,x+10,y,3,2,a)}
 else if(v.style==='crawler'){px(c,x+3,y+5,8,6,b);px(c,x,y+4,4,2,a);px(c,x+10,y+4,4,2,a);px(c,x,y+10,4,2,b);px(c,x+10,y+10,4,2,b)}
 else if(v.style==='humanoid'){px(c,x+3,y,8,5,b);px(c,x+2,y+5,10,6,b);px(c,x,y+6,3,2,a);px(c,x+11,y+6,3,2,a);px(c,x+3,y+11,3,3,b);px(c,x+8,y+11,3,3,b)}
 else{px(c,x+2,y+4,10,7,b);px(c,x+9,y+1,4,5,b);px(c,x,y+9,4,3,a);px(c,x+3,y+11,3,3,b);px(c,x+9,y+11,3,3,b)}
 px(c,x+5,y+5,2,2,'#fff');px(c,x+9,y+5,2,2,'#18131e');
}
function drawObjectSprite(c,e,theme){const o=(theme.objects||[]).find(q=>q.id===e.sub)||theme.objects[0];if(!o)return;const x=e.x,y=e.y,id=o.id;c.fillStyle=o.color;
 if(/fogueira|tocha/.test(id)){px(c,x+6,y+8,3,6,'#704126');px(c,x+3,y+11,10,2,'#704126');px(c,x+5,y+3,6,8,'#ef5b25');px(c,x+7,y+1,3,7,'#ffd45a')}
 else if(/cristal/.test(id)){px(c,x+6,y,4,14,o.color);px(c,x+3,y+5,3,8,'#d7b9ff');px(c,x+10,y+4,3,9,'#8b62cf')}
 else if(/placa/.test(id)){px(c,x+2,y+1,12,8,o.color);px(c,x+7,y+9,2,6,'#6d4529');px(c,x+4,y+4,7,1,'#ead59a')}
 else if(/caixa|caixote|bau|barril/.test(id)){px(c,x+1,y+2,13,12,o.color);px(c,x+1,y+5,13,2,'#5d3b28');px(c,x+6,y+2,2,12,'#d0a45e')}
 else if(/boneco/.test(id)){px(c,x+4,y,7,7,'#fff');px(c,x+2,y+6,11,8,'#edf7ff');px(c,x+6,y+2,1,1,'#222');px(c,x+9,y+2,1,1,'#222')}
 else{px(c,x+3,y+2,9,11,o.color);px(c,x+1,y+7,13,6,o.color);px(c,x+4,y+4,3,2,'#ffffff55')}
}
function drawEntityAt(ctx2,e,theme){theme=theme||curTheme();if(e.type==='enemy'&&e.sprite==='skeleton'&&window.SkeletonSprite?.draw)window.SkeletonSprite.draw(ctx2,e);else if(e.type==='enemy')drawEnemySprite(ctx2,e,theme);else if(e.type==='item'){px(ctx2,e.x+4,e.y+1,5,12,'#f7b32b');px(ctx2,e.x+2,e.y+4,9,6,'#ffe17a');px(ctx2,e.x+5,e.y+4,3,6,'#c88418')}else if(e.type==='npc'){px(ctx2,e.x+3,e.y,7,5,'#ffd88a');px(ctx2,e.x+2,e.y+5,9,8,'#4aa0e0');px(ctx2,e.x+4,e.y+2,1,1,'#222');px(ctx2,e.x+8,e.y+2,1,1,'#222')}else if(e.type==='object')drawObjectSprite(ctx2,e,theme);else if(e.type==='player'){px(ctx2,e.x+3,e.y,7,5,'#ffd88a');px(ctx2,e.x+2,e.y+5,9,7,'#55d6a0');px(ctx2,e.x+2,e.y+12,3,2,'#31435c');px(ctx2,e.x+8,e.y+12,3,2,'#31435c')}}
function drawGrid(){const s=scene();const tiles=curTiles();ctx.clearRect(0,0,W,H);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)drawTileAt(ctx,tiles[s.map[y][x]]||tiles[0],x*T,y*T,T);ctx.strokeStyle='#ffffff16';for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*T,0);ctx.lineTo(x*T,H);ctx.stroke()}for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*T);ctx.lineTo(W,y*T);ctx.stroke()}if(!playing){const theme=curTheme();s.entities.forEach(e=>{drawEntityAt(ctx,e,theme);if(e.id===selectedEntity){ctx.strokeStyle='#f7b32b';ctx.lineWidth=2;ctx.setLineDash([3,2]);ctx.strokeRect(e.x-3,e.y-3,20,20);ctx.setLineDash([])}})}if(view==='map'&&!playing){const r=canvas.getBoundingClientRect();const mx=(mouse.x-r.left)*W/r.width,my=(mouse.y-r.top)*H/r.height,gx=Math.floor(mx/T),gy=Math.floor(my/T);if(gx>=0&&gx<COLS&&gy>=0&&gy<ROWS){ctx.strokeStyle='#f7b32b';ctx.lineWidth=2;ctx.strokeRect(gx*T+1,gy*T+1,T-2,T-2)}}}
let mouse={x:0,y:0,down:false};canvas.addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;if(mouse.down)paint()});canvas.addEventListener('mousedown',e=>{mouse.down=true;paint()});window.addEventListener('mouseup',()=>mouse.down=false);canvas.addEventListener('contextmenu',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();const gx=Math.floor((e.clientX-r.left)*W/r.width/T),gy=Math.floor((e.clientY-r.top)*H/r.height/T);if(gx>=0&&gy>=0&&gx<COLS&&gy<ROWS){pushHistory();scene().map[gy][gx]=0;drawGrid()}});
function paint(){if(playing||view!=='map')return;const r=canvas.getBoundingClientRect();const gx=Math.floor((mouse.x-r.left)*W/r.width/T),gy=Math.floor((mouse.y-r.top)*H/r.height/T);if(gx>=0&&gy>=0&&gx<COLS&&gy<ROWS&&scene().map[gy][gx]!==selectedTile){if(!paint.last||paint.last.x!==gx||paint.last.y!==gy){if(!paint.stroke){pushHistory();paint.stroke=true}scene().map[gy][gx]=selectedTile;paint.last={x:gx,y:gy};drawGrid()}}}
window.addEventListener('mouseup',()=>{paint.stroke=false;paint.last=null});

function renderRight(){const p=$('rightPanel');
if(view==='map'){
 const tiles=curTiles();
 p.innerHTML='<div class="card"><h3>PALETA DE TILES — '+curTheme().emoji+' '+curTheme().name+'</h3><div class="grid" id="tiles"></div></div><div class="card"><h3>MAPA</h3><div class="row"><label>Largura</label><span>'+COLS+'</span></div><div class="row"><label>Altura</label><span>'+ROWS+'</span></div><div class="row"><label>Tile</label><span>16×16</span></div></div>';
 const g=$('tiles');
 tiles.forEach((tile,i)=>{const b=document.createElement('button');b.className='tile '+(i===selectedTile?'selected':'');const c=document.createElement('canvas');c.width=c.height=32;b.appendChild(c);const tc=c.getContext('2d');tc.imageSmoothingEnabled=false;drawTileAt(tc,tile,0,0,32);tc.fillStyle='#00000088';tc.fillRect(0,22,32,10);tc.fillStyle='#fff';tc.font='8px monospace';tc.fillText(i+' '+tile.name.slice(0,7),2,29);b.title=tile.name;b.onclick=()=>{selectedTile=i;renderRight()};g.appendChild(b)});
}else if(view==='entities'){
 p.innerHTML='<div class="card"><h3>ENTIDADES</h3><button id="addPlayer">＋ Player</button> <button id="addEnemy">＋ Inimigo</button> <button id="addItem">＋ Item</button> <button id="addNpc">＋ NPC</button> <button id="addObject">＋ Objeto</button></div><div id="entitiesList"></div>';
 const list=$('entitiesList');
 const icons={player:'🧍',enemy:'👾',item:'🪙',npc:'💬',object:'📦'};
 scene().entities.forEach(e=>{const d=document.createElement('div');d.className='entity';d.innerHTML='<span class="dot">'+ (icons[e.type]||'') +'</span><div><b>'+e.name+'</b><small>'+e.type+' · X '+Math.round(e.x)+' Y '+Math.round(e.y)+'</small></div>';d.onclick=()=>{selectedEntity=e.id;editEntity(e)};list.appendChild(d)});
 $('addPlayer').onclick=()=>addEntity('player');$('addEnemy').onclick=()=>addEntity('enemy');$('addItem').onclick=()=>addEntity('item');$('addNpc').onclick=()=>addEntity('npc');$('addObject').onclick=()=>addEntity('object');
}else if(view==='tilesets'){
 const theme=curTheme();
 let h='<div class="card"><h3>TEMA DA CENA</h3><div class="themeGrid" id="themeGrid"></div></div>';
 h+='<div class="card"><h3>TILES — '+theme.emoji+' '+theme.name+'</h3><div class="grid" id="tilesPreview"></div></div>';
 h+='<div class="card"><h3>SPRITES DE INIMIGOS</h3><div class="objGrid" id="enemyPreview"></div><p class="badge">3 variantes exclusivas deste bioma.</p></div>';
 h+='<div class="card"><h3>OBJETOS DISPONÍVEIS</h3><div class="objGrid" id="objPreview"></div><p class="badge">Use "＋ Objeto" na aba Entidades para posicioná-los no mapa.</p></div>';
 p.innerHTML=h;
 const tg=$('themeGrid');
 THEME_IDS.forEach(id=>{const t=THEMES[id];const b=document.createElement('button');b.className='themeBtn '+(id===scene().themeId?'active':'');b.innerHTML=t.emoji+'<span>'+t.name+'</span>';b.onclick=()=>{if(id!==scene().themeId){pushHistory();scene().themeId=id;selectedTile=Math.min(selectedTile,THEMES[id].tiles.length-1);renderAll()}};tg.appendChild(b)});
 const tp=$('tilesPreview');
 theme.tiles.forEach(tile=>{const wrap=document.createElement('div');wrap.className='tile';const c=document.createElement('canvas');c.width=c.height=32;wrap.appendChild(c);const tc=c.getContext('2d');tc.imageSmoothingEnabled=false;drawTileAt(tc,tile,0,0,32);wrap.title=tile.name;tp.appendChild(wrap)});
 const ep=$('enemyPreview');enemyList(scene().themeId).forEach(v=>{const wrap=document.createElement('div');wrap.className='objBtn';const c=document.createElement('canvas');c.width=c.height=32;c.style.width='32px';c.style.height='32px';const ec=c.getContext('2d');ec.imageSmoothingEnabled=false;const old=scene().themeId;drawEnemySprite(ec,{x:8,y:8,sub:v.id},theme);wrap.appendChild(c);const lbl=document.createElement('div');lbl.textContent=v.name;wrap.appendChild(lbl);ep.appendChild(wrap)});
 const op=$('objPreview');
 theme.objects.forEach(o=>{const wrap=document.createElement('div');wrap.className='objBtn';const c=document.createElement('canvas');c.width=c.height=32;c.style.width='32px';c.style.height='32px';const oc=c.getContext('2d');oc.imageSmoothingEnabled=false;oc.fillStyle=o.color;if(o.shape==='circle'){oc.beginPath();oc.arc(16,16,13,0,Math.PI*2);oc.fill()}else{oc.fillRect(3,3,26,26)}wrap.appendChild(c);const lbl=document.createElement('div');lbl.textContent=o.name;wrap.appendChild(lbl);op.appendChild(wrap)});
}else if(view==='scenes'){
 p.innerHTML='<div class="card"><h3>CENAS</h3><button id="addScene">＋ Nova fase</button></div><div id="scenesPanel"></div>';
 const q=$('scenesPanel');
 project.scenes.forEach(s=>{const t=THEMES[s.themeId]||THEMES.floresta;const d=document.createElement('div');d.className='scene-item '+(s.id===project.currentScene?'active':'');d.innerHTML='<b>'+s.name+'</b><div class="badge">'+t.emoji+' '+t.name+' · '+s.map[0].length+'×'+s.map.length+' · '+s.entities.length+' entidades</div>';d.onclick=()=>{project.currentScene=s.id;selectedEntity=null;renderAll();mark()};q.appendChild(d)});
 $('addScene').onclick=()=>{pushHistory();const id='scene'+Date.now();project.scenes.push({id,name:'Fase '+(project.scenes.length+1),themeId:'floresta',map:blankMap(),entities:[]});project.currentScene=id;renderAll()};
}else{
 p.innerHTML='<div class="card"><h3>CONFIGURAÇÕES DO PROJETO</h3><div class="row"><label>Nome</label><input id="pname" value="'+project.name+'"></div><div class="row"><label>Tipo</label><select id="ptype"><option value="platform">Plataforma</option><option value="topdown">Top-down</option><option value="shooter">Shooter</option><option value="arcade">Arcade</option></select></div><div class="row"><label>Resolução</label><span>512×288</span></div><p class="badge">O projeto guarda mapas, cenas, tema visual e entidades. O runtime lê esses dados para executar o jogo.</p></div><div class="card"><h3>ARQUITETURA</h3><div class="badge">Engine Core → Tilesets (V3) → Project Data → Editor → Runtime → Export</div></div>';
 $('pname').onchange=e=>{project.name=e.target.value;$('projectName').value=project.name;mark()};$('ptype').value=project.settings.type;$('ptype').onchange=e=>{project.settings.type=e.target.value;mark()};
}}

function editEntity(e){view='entities';renderRight();const p=$('rightPanel');const c=document.createElement('div');c.className='card';
let fields='<h3>PROPRIEDADES — '+e.name+'</h3><div class="row"><label>Nome</label><input id="en" value="'+e.name+'"></div><div class="row"><label>X</label><input id="ex" type="number" value="'+e.x+'"></div><div class="row"><label>Y</label><input id="ey" type="number" value="'+e.y+'"></div>';
if(e.type==='player'||e.type==='enemy'){fields+='<div class="row"><label>Vida</label><input id="eh" type="number" value="'+(e.hp||1)+'"></div><div class="row"><label>Velocidade</label><input id="es" type="number" value="'+(e.speed||0)+'"></div>'}
if(e.type==='enemy'){fields+='<div class="row"><label>Sprite</label><select id="eenemy">'+enemyList(scene().themeId).map(v=>'<option value="'+v.id+'"'+(v.id===e.sub?' selected':'')+'>'+v.name+'</option>').join('')+'</select></div>'}
if(e.type==='npc'){fields+='<div class="row"><label>Fala</label><input id="ed" value="'+(e.dialog||'')+'"></div>'}
if(e.type==='object'){const objs=curTheme().objects;fields+='<div class="row"><label>Objeto</label><select id="esub">'+objs.map(o=>'<option value="'+o.id+'"'+(o.id===e.sub?' selected':'')+'>'+o.name+'</option>').join('')+'</select></div>'}
fields+='<button id="delEntity" class="danger">Excluir entidade</button>';
c.innerHTML=fields;p.prepend(c);
const ids=['en','ex','ey'];if($('eh'))ids.push('eh','es');if($('eenemy'))ids.push('eenemy');if($('ed'))ids.push('ed');if($('esub'))ids.push('esub');
ids.forEach(id=>$(id).onchange=()=>{pushHistory();e.name=$('en').value;e.x=+$('ex').value;e.y=+$('ey').value;if($('eh')){e.hp=+$('eh').value;e.speed=+$('es').value}if($('eenemy')){e.sub=$('eenemy').value;const v=enemyList(scene().themeId).find(v=>v.id===e.sub);if(v)e.name=v.name}if($('ed'))e.dialog=$('ed').value;if($('esub')){e.sub=$('esub').value;const o=curTheme().objects.find(o=>o.id===e.sub);if(o)e.name=o.name}renderRight();drawGrid()});
$('delEntity').onclick=()=>{pushHistory();scene().entities=scene().entities.filter(x=>x.id!==e.id);selectedEntity=null;renderAll()};
}
function addEntity(type){pushHistory();const id=type+Date.now();const theme=curTheme();let e={id,type,x:64,y:64};
if(type==='player')e={...e,name:'Player',hp:3,speed:120,jump:300};
else if(type==='enemy'){const v=enemyList(scene().themeId)[0];e={...e,name:v.name,sub:v.id,hp:2,speed:40};}
else if(type==='item')e={...e,name:'Moeda',hp:1};
else if(type==='npc')e={...e,name:'NPC',dialog:'Olá, viajante!'};
else if(type==='object'){const o=theme.objects[0];e={...e,name:o.name,sub:o.id};}
scene().entities.push(e);selectedEntity=id;renderAll();editEntity(scene().entities.find(en=>en.id===id));}
function renderSceneList(){const q=$('sceneList');q.innerHTML='';project.scenes.forEach(s=>{const b=document.createElement('button');b.className='scene-item '+(s.id===project.currentScene?'active':'');b.textContent=(THEMES[s.themeId]||THEMES.floresta).emoji+' '+s.name;b.onclick=()=>{project.currentScene=s.id;renderAll()};q.appendChild(b)})}
function renderAll(){renderSceneList();renderRight();drawGrid();$('projectName').value=project.name;$('stopBtn').classList.toggle('hidden',!playing);$('playBtn').classList.toggle('hidden',playing);$('toolInfo').textContent='Mapa '+COLS+'×'+ROWS+' · 16px · Tema: '+curTheme().emoji+' '+curTheme().name}
function undo(){if(!history.length)return;future.push(clone(project));project=history.pop();renderAll();toast('Desfeito')}
function redo(){if(!future.length)return;history.push(clone(project));project=future.pop();renderAll();toast('Refeito')}
$('undoBtn').onclick=undo;$('redoBtn').onclick=redo;$('clearBtn').onclick=()=>{if(confirm('Limpar todo o mapa da cena?')){pushHistory();scene().map=blankMap();drawGrid()}};
$('newBtn').onclick=()=>{if(confirm('Criar novo projeto?')){project=defaultProject();history=[];future=[];renderAll();toast('Novo projeto criado')}};
$('saveBtn').onclick=()=>{localStorage.setItem(KEY,JSON.stringify(project));$('dirty').textContent='✓';$('dirty').style.color='#62d38b';toast('Projeto salvo no navegador')};
$('loadBtn').onclick=()=>{const raw=localStorage.getItem(KEY)||localStorage.getItem('snes_engine_studio_project_v3')||localStorage.getItem('snes_engine_studio_project_v2');if(!raw)return toast('Nenhum projeto salvo');try{project=JSON.parse(raw);project.version=6;project.scenes.forEach(s=>{if(!s.themeId)s.themeId='floresta'});renderAll();toast('Projeto carregado e migrado para V6')}catch(e){toast('Arquivo inválido')}};
function downloadFile(name,data,type){const blob=new Blob([data],{type:type||'application/octet-stream'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
$('exportBtn').onclick=()=>{const html=buildExport();downloadFile((project.name||'meu-jogo').replace(/[^a-z0-9-_]+/gi,'_')+'.html',html,'text/html');toast('Jogo HTML exportado')};
$('exportSnesBtn').onclick=()=>exportSnesBundle();
$('projectName').onchange=e=>{project.name=e.target.value;mark()};document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderRight();drawGrid()});
$('playBtn').onclick=()=>startPlay();$('stopBtn').onclick=()=>stopPlay();
function startPlay(){playing=true;view='map';lastFrame=0;startState();$('status').textContent='TESTANDO: setas/A-D mover · Z pular · X/C atacar · ESC parar';renderAll();requestAnimationFrame(gameLoop)}function stopPlay(){playing=false;renderAll()}
let game={x:32,y:200,vx:0,vy:0,hp:3,onGround:false,score:0,speed:120,jump:300};function startState(){const p=scene().entities.find(e=>e.type==='player')||{x:32,y:200,hp:3,speed:120,jump:300};game={x:p.x,y:p.y,vx:0,vy:0,hp:p.hp||3,onGround:false,score:0,speed:p.speed||120,jump:p.jump||300}}
const keys={};window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key==='Escape'&&playing)stopPlay()});window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function isSolid(px,py){const gx=Math.floor(px/T),gy=Math.floor(py/T);if(gx<0||gx>=COLS||gy<0||gy>=ROWS)return true;const tiles=curTiles();const t=tiles[scene().map[gy][gx]]||tiles[0];return !!t.solid}
let lastFrame=0;function gameLoop(now){if(!playing)return;const dt=Math.min(.033,lastFrame?(now-lastFrame)/1000:1/60);lastFrame=now;const speed=game.speed;game.vx=((keys.arrowleft||keys.a)?-speed:0)+((keys.arrowright||keys.d)?speed:0);if((keys.z||keys[' '])&&game.onGround){game.vy=-game.jump;game.onGround=false}game.vy+=650*dt;let nx=game.x+game.vx*dt,ny=game.y+game.vy*dt;if(!isSolid(nx,game.y+10)&&!isSolid(nx+12,game.y+10))game.x=Math.max(0,Math.min(W-14,nx));if(game.vy>=0&&(isSolid(game.x+2,ny+14)||isSolid(game.x+11,ny+14))){game.y=Math.floor((ny+14)/T)*T-14;game.vy=0;game.onGround=true}else if(game.vy<0&&!isSolid(game.x+2,ny)&&!isSolid(game.x+11,ny))game.y=ny;else if(game.vy<0)game.vy=0;drawRuntime();requestAnimationFrame(gameLoop)}
function drawRuntime(){const s=scene();const theme=curTheme();const tiles=theme.tiles;ctx.clearRect(0,0,W,H);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)drawTileAt(ctx,tiles[s.map[y][x]]||tiles[0],x*T,y*T,T);for(const e of s.entities){if(e.type!=='player')drawEntityAt(ctx,e,theme)}ctx.fillStyle='#55d6a0';ctx.fillRect(game.x,game.y,12,14);ctx.fillStyle='#222';ctx.fillRect(game.x+3,game.y+3,2,2);ctx.fillRect(game.x+8,game.y+3,2,2);ctx.fillStyle='#0b0b12aa';ctx.fillRect(6,6,150,24);ctx.fillStyle='#fff';ctx.font='12px monospace';ctx.fillText('❤'.repeat(Math.max(0,game.hp))+'  SCORE '+game.score,12,23)}
function snesAsm(){
 const safe=(project.name||'MEU JOGO').toUpperCase().replace(/[^A-Z0-9 ]/g,' ').slice(0,21);
 const map=scene().map.map(r=>r.join(',')).join('\\n');
 const themeName=curTheme().name;
 return `; SNES ENGINE STUDIO - EXPORTACAO SNES
; Projeto: ${safe}
; Tema visual da cena atual: ${themeName}
; Este pacote contem os dados do projeto e uma base 65816 para compilacao.
; O editor web nao inclui um assembler 65816. Use uma toolchain SNES compativel
; (por exemplo, ca65/64tass/WLA-65816) para gerar a ROM final.

.cpu "65816"

; ----- HEADER / VETORES (template) -----
.segment "HEADER"
.byte "${safe.padEnd(21,' ')}"

; ----- DADOS DO MAPA DA CENA ATUAL -----
.segment "MAPDATA"
map_data:
.byte ${map}

; ----- PONTO DE ENTRADA -----
.segment "CODE"
reset:
  sei
  clc
  xce
  rep #$30
main:
  jmp main

; IMPORTANTE: esta base e um template de exportacao.
; A conversao final para ROM .SFC depende do assembler/linker e do runtime SNES.
`;
}
function snesReadme(){return `SNES ENGINE STUDIO - EXPORTACAO SNES\n\nProjeto: ${project.name}\nTipo: ${project.settings.type}\nTema visual: ${curTheme().name}\nResolucao alvo: 512x288 no editor / modo SNES deve ser adaptado no runtime.\n\nO que este pacote contem:\n- project.json: projeto completo da engine (inclui tilesets/temas por cena)\n- current-map.json: mapa da cena atual\n- game.asm: base 65816 e dados exportados\n- game.html: versao jogavel no navegador\n\nIMPORTANTE:\nA engine foi preparada para separar os dados do jogo do runtime. O HTML e gerado diretamente. A ROM SNES ainda exige uma toolchain 65816 e um runtime SNES especifico; por isso esta versao exporta o projeto e o codigo-fonte preparado, nao finge gerar um .SFC funcional sem compilador.\n\nProximo passo da arquitetura:\nEDITOR -> TILESETS (V3) -> PROJECT DATA -> HTML RUNTIME\n                                        -> SNES RUNTIME -> .SFC\n`}
function exportSnesBundle(){
 const base=(project.name||'meu-jogo').replace(/[^a-z0-9-_]+/gi,'_');
 const files={
  'project.json':JSON.stringify(project,null,2),
  'themes.json':JSON.stringify(THEMES,null,2),
  'current-map.json':JSON.stringify({name:scene().name,themeId:scene().themeId,map:scene().map,entities:scene().entities},null,2),
  'game.asm':snesAsm(),
  'README-SNES.txt':snesReadme(),
  [base+'.html']:buildExport()
 };
 // Browser-only ZIP writer: store-only ZIP, no external library required.
 const enc=new TextEncoder(); const parts=[]; const central=[]; let offset=0;
 const crcTable=(()=>{let t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
 const crc32=b=>{let c=0xffffffff;for(const v of b)c=crcTable[(c^v)&255]^(c>>>8);return (c^0xffffffff)>>>0};
 const u16=n=>new Uint8Array([n&255,(n>>>8)&255]); const u32=n=>new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);
 const concat=arrs=>{let n=arrs.reduce((a,b)=>a+b.length,0),o=new Uint8Array(n),i=0;for(const a of arrs){o.set(a,i);i+=a.length}return o};
 for(const [name,text] of Object.entries(files)){
  const nb=enc.encode(name), data=enc.encode(text), crc=crc32(data); const lh=concat([new Uint8Array([80,75,3,4]),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nb.length),u16(0),nb,data]); parts.push(lh);
  const ch=concat([new Uint8Array([80,75,1,2]),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nb.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nb]); central.push(ch); offset+=lh.length;
 }
 const cdOffset=offset, cd=concat(central), out=concat([...parts,[cd], [new Uint8Array([80,75,5,6]),u16(0),u16(0),u16(Object.keys(files).length),u16(Object.keys(files).length),u32(cd.length),u32(cdOffset),u16(0)]]);
 downloadFile(base+'-SNES-EXPORT.zip',out,'application/zip'); toast('Pacote SNES exportado');
}

function buildExport(){
 const data=JSON.stringify(project);
 const themesData=JSON.stringify(THEMES);
 const enemiesData=JSON.stringify(ENEMY_VARIANTS);
 return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(project.name)+'</title><style>html,body{margin:0;background:#080912;color:#fff;height:100%;display:grid;place-items:center;font-family:monospace}canvas{width:min(96vw,1024px);height:auto;image-rendering:pixelated;border:2px solid #353a5d}</style></head><body><canvas id="game" width="512" height="288"></canvas><script>'
 +'const PROJECT='+data.replace(/</g,'\\u003c')+';'
 +'const THEMES='+themesData.replace(/</g,'\\u003c')+';'
 +'const ENEMY_VARIANTS='+enemiesData.replace(/</g,'\\u003c')+';'
 +'const T=16,COLS=32,ROWS=18,W=512,H=288;'
 +'const c=document.getElementById("game"),x=c.getContext("2d");x.imageSmoothingEnabled=false;'
 +'let s=PROJECT.scenes.find(q=>q.id===PROJECT.currentScene)||PROJECT.scenes[0];'
 +'let theme=THEMES[s.themeId]||THEMES.floresta;'
 +'let p=s.entities.find(q=>q.type==="player")||{x:32,y:200,hp:3,speed:120,jump:300};'
 +'let g={x:p.x,y:p.y,vx:0,vy:0,on:false,hp:p.hp||3,score:0};let k={};onkeydown=e=>k[e.key.toLowerCase()]=1;onkeyup=e=>k[e.key.toLowerCase()]=0;'
 +'function drawTileAt(ctx2,tile,px,py,size){const sc=size/16;ctx2.fillStyle=tile.color;ctx2.fillRect(px,py,size,size);(tile.decos||[]).forEach(d=>{if(d.outline){ctx2.strokeStyle=d.outline;ctx2.lineWidth=Math.max(1,sc);ctx2.strokeRect(px+d.x*sc+sc/2,py+d.y*sc+sc/2,Math.max(0,d.w*sc-sc),Math.max(0,d.h*sc-sc))}else{ctx2.fillStyle=d.color;ctx2.fillRect(px+d.x*sc,py+d.y*sc,d.w*sc,d.h*sc)}})}'
 +'function px(c,a,b,w,h,z){c.fillStyle=z;c.fillRect(Math.round(a),Math.round(b),w,h)}'
 +'function drawEntityAt(c,e){if(e.type==="enemy"){const list=ENEMY_VARIANTS[s.themeId]||ENEMY_VARIANTS.floresta,v=list.find(q=>q.id===e.sub)||list[0],a=e.x,b=e.y,z=v.color,d=v.accent;if(v.style==="slime"){px(c,a+2,b+5,10,7,z);px(c,a+4,b+3,6,3,z)}else if(v.style==="flying"){px(c,a+4,b+4,6,7,z);px(c,a,b+2,5,3,z);px(c,a+9,b+2,5,3,z)}else if(v.style==="crawler"){px(c,a+3,b+5,8,6,z);px(c,a,b+4,4,2,d);px(c,a+10,b+4,4,2,d)}else if(v.style==="humanoid"){px(c,a+3,b,8,5,z);px(c,a+2,b+5,10,6,z);px(c,a+3,b+11,3,3,d);px(c,a+8,b+11,3,3,d)}else{px(c,a+2,b+4,10,7,z);px(c,a+9,b+1,4,5,z);px(c,a,b+9,4,3,d)}px(c,a+5,b+5,2,2,"#fff");px(c,a+9,b+5,2,2,"#18131e")}else if(e.type==="item"){px(c,e.x+2,e.y+4,9,6,"#ffe17a");px(c,e.x+5,e.y+3,3,8,"#c88418")}else if(e.type==="npc"){px(c,e.x+3,e.y,7,5,"#ffd88a");px(c,e.x+2,e.y+5,9,8,"#4aa0e0")}else if(e.type==="object"){const o=(theme.objects||[]).find(q=>q.id===e.sub)||theme.objects[0];if(o){px(c,e.x+2,e.y+2,11,12,o.color);px(c,e.x+4,e.y+4,3,2,"#ffffff55")}}}'
 +'function so(px,py){const gx=Math.floor(px/T),gy=Math.floor(py/T);if(gx<0||gx>=32||gy<0||gy>=18)return true;const t=theme.tiles[s.map[gy][gx]]||theme.tiles[0];return !!t.solid}'
 +'function loop(){g.vx=((k.arrowleft||k.a)?-p.speed:0)+((k.arrowright||k.d)?p.speed:0);if((k.z||k[" "])&&g.on){g.vy=-p.jump;g.on=false}g.vy+=650/60;let nx=g.x+g.vx/60,ny=g.y+g.vy/60;if(!so(nx,g.y+10)&&!so(nx+12,g.y+10))g.x=Math.max(0,Math.min(500,nx));if(g.vy>=0&&(so(g.x+2,ny+14)||so(g.x+11,ny+14))){g.y=Math.floor((ny+14)/T)*T-14;g.vy=0;g.on=true}else if(g.vy<0&&!so(g.x+2,ny)&&!so(g.x+11,ny))g.y=ny;else if(g.vy<0)g.vy=0;'
 +'x.clearRect(0,0,512,288);for(let y=0;y<18;y++)for(let a=0;a<32;a++)drawTileAt(x,theme.tiles[s.map[y][a]]||theme.tiles[0],a*T,y*T,T);for(const e of s.entities){if(e.type!=="player")drawEntityAt(x,e)}'
 +'x.fillStyle="#55d6a0";x.fillRect(g.x,g.y,12,14);requestAnimationFrame(loop)}loop();'
 +'<\/script></body></html>';
}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
window.SNESStudio={get project(){return project},set project(v){project=v},scene,curTheme,blankMap,pushHistory,renderAll,renderRight,drawGrid,toast,setStatus,downloadFile,buildExport,THEMES,ENEMY_VARIANTS,get selectedTile(){return selectedTile},set selectedTile(v){selectedTile=v},get selectedEntity(){return selectedEntity},set selectedEntity(v){selectedEntity=v},get view(){return view},set view(v){view=v},get playing(){return playing},get game(){return game},startPlay,stopPlay};renderAll();window.dispatchEvent(new CustomEvent("snesstudio:ready"));})();
