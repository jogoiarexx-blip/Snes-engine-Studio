
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

// ===== Studio 1.0: packs de tiles pixel-art embutidos =====
THEMES.naturepack={emoji:'🌱',name:'Natureza Pixel',tiles:[
 {name:'vazio',color:'#182327',solid:false,decos:[]},
 {name:'grama',color:'#67b52d',solid:true,decos:[],sheet:'terrain_pack',src:[20,25,85,70]},
 {name:'terra',color:'#81502c',solid:true,decos:[],sheet:'terrain_pack',src:[20,180,85,100]},
 {name:'pedra antiga',color:'#545263',solid:true,decos:[],sheet:'terrain_pack',src:[20,305,85,105]},
 {name:'areia',color:'#d29b38',solid:true,decos:[],sheet:'terrain_pack',src:[20,420,85,110]},
 {name:'tijolos',color:'#4a4b54',solid:true,decos:[],sheet:'terrain_pack',src:[20,550,85,100]},
 {name:'gelo',color:'#3d77a9',solid:true,decos:[],sheet:'terrain_pack',src:[20,680,85,105]},
 {name:'água',color:'#2870a8',solid:false,decos:[],sheet:'terrain_pack',src:[20,800,85,105]},
 {name:'caixa',color:'#8a5a2f',solid:true,decos:[],sheet:'terrain_pack',src:[1035,500,88,92]}
],enemy:{name:'Slime',color:'#75bd45'},objects:[{id:'arvore',name:'Árvore',color:'#4c9b32',shape:'circle'},{id:'caixa',name:'Caixa',color:'#8a5a2f',shape:'box'},{id:'barril',name:'Barril',color:'#7a4b27',shape:'circle'},{id:'placa',name:'Placa',color:'#9b6e35',shape:'box'}]};
THEMES.platformpack={emoji:'🧱',name:'Plataformas Pixel',tiles:[
 {name:'vazio',color:'#152029',solid:false,decos:[]},
 {name:'grama bloco',color:'#5fad2f',solid:true,decos:[],sheet:'platform_pack',src:[10,20,100,95]},
 {name:'grama rocha',color:'#6e9c2d',solid:true,decos:[],sheet:'platform_pack',src:[120,20,100,95]},
 {name:'rampa grama',color:'#5d9b31',solid:true,decos:[],sheet:'platform_pack',src:[225,220,105,92]},
 {name:'ilha flutuante',color:'#70492a',solid:true,decos:[],sheet:'platform_pack',src:[700,20,125,115]},
 {name:'pedra musgo',color:'#515461',solid:true,decos:[],sheet:'platform_pack',src:[485,435,135,105]},
 {name:'areia bloco',color:'#c68d35',solid:true,decos:[],sheet:'platform_pack',src:[10,535,100,105]},
 {name:'gelo bloco',color:'#3577aa',solid:true,decos:[],sheet:'platform_pack',src:[10,785,100,105]},
 {name:'madeira',color:'#8a592b',solid:true,decos:[],sheet:'platform_pack',src:[940,300,130,100]}
],enemy:{name:'Guardião',color:'#9b6a45'},objects:[{id:'ponte',name:'Ponte',color:'#8a592b',shape:'box'},{id:'caixa',name:'Caixa',color:'#8a5a2f',shape:'box'},{id:'barril',name:'Barril',color:'#7a4b27',shape:'circle'},{id:'placa',name:'Placa',color:'#9b6e35',shape:'box'}]};

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
window.THEMES=THEMES;window.ENEMY_VARIANTS=ENEMY_VARIANTS;window.THEME_IDS=THEME_IDS;
function enemyList(themeId){return ENEMY_VARIANTS[themeId]||ENEMY_VARIANTS.floresta}

const clone=o=>JSON.parse(JSON.stringify(o));
function blankMap(){return Array.from({length:ROWS},()=>Array(COLS).fill(0));}
function sampleMap(){const m=blankMap();for(let x=0;x<COLS;x++){m[16][x]=2;m[17][x]=2}for(let x=2;x<8;x++)m[13][x]=1;for(let x=11;x<17;x++)m[11][x]=1;for(let x=21;x<27;x++)m[14][x]=1;for(let x=28;x<31;x++)m[10][x]=1;return m}
function defaultProject(){const m=sampleMap();return {version:'1.0.1',schemaVersion:10,gameType:'platform',name:'Meu Jogo',settings:{type:'platform',width:512,height:288,tileSize:16},scenes:[{id:'scene1',name:'Fase 1',themeId:'floresta',map:m,layers:{background:blankMap(),ground:m.map(r=>r.slice()),foreground:blankMap()},entities:[{id:'player',type:'player',name:'Player',x:32,y:240,hp:3,speed:120,jump:300},{id:'slime1',type:'enemy',name:'Lobo',x:220,y:220,hp:1,speed:35},{id:'coin1',type:'item',name:'Moeda',x:320,y:180,hp:1},{id:'obj1',type:'object',name:'Pedra',sub:'pedra_obj',x:120,y:216}]}],currentScene:'scene1',world:{nodes:{},start:'scene1'}}}

function migrateProject(p){
  if(!p||typeof p!=='object')return defaultProject();
  p.version=p.version||'0.9';p.schemaVersion=p.schemaVersion||7;if(!p.gameType)p.gameType=(p.settings&&p.settings.type)||'platform';
  if(!p.settings)p.settings={type:'platform',width:512,height:288,tileSize:16};
  if(p.settings.type&&p.settings.type!=='platform'){
    // manter tipo mas avisar no status depois
  }
  if(!Array.isArray(p.scenes)||!p.scenes.length)p.scenes=defaultProject().scenes;
  p.scenes.forEach(s=>{
    if(!s.themeId)s.themeId='floresta';
    if(!Array.isArray(s.entities))s.entities=[];
    if(!s.layers){
      const map=Array.isArray(s.map)?s.map:blankMap();
      s.layers={background:blankMap(),ground:map.map?map.map(r=>r.slice()):blankMap(),foreground:blankMap()};
    }
    if(!s.layers.background)s.layers.background=blankMap();
    if(!s.layers.ground)s.layers.ground=(Array.isArray(s.map)?s.map.map(r=>r.slice()):blankMap());
    if(!s.layers.foreground)s.layers.foreground=blankMap();
    s.map=s.layers.ground;
  });
  if(!p.currentScene)p.currentScene=p.scenes[0].id;
  if(!p.world)p.world={nodes:{},start:p.currentScene};
  if(p.gameType==='kart-racing'&&!p.kartTrack&&window.KartTrack)p.kartTrack=window.KartTrack.generateDemoTrack();
  p.version='1.0.1';p.schemaVersion=10;p.studio=p.studio||{};p.studio.version='1.0.1';
  if(window.SNESTileMap)p.scenes.forEach(s=>window.SNESTileMap.normalizeScene(s));
  if(window.SNESEntityComponents)p.scenes.forEach(s=>(s.entities||[]).forEach(e=>window.SNESEntityComponents.ensure(e)));
  if(window.SNESProjectModel){const r=window.SNESProjectModel.migrate(p);p=r.project;}
  return p;
}

let project=migrateProject(defaultProject()),view='map',selectedTile=1,selectedEntity=null,playing=false,history=[],future=[],commandManager=null,pendingHistory=false,committedSnapshot=null;
committedSnapshot=clone(project);
function getCommandManager(){if(!commandManager&&window.SNESCommands)commandManager=window.SNESCommands.create();return commandManager}
const $=id=>document.getElementById(id);const scene=()=>project.scenes.find(s=>s.id===project.currentScene)||project.scenes[0];
function curTheme(){const t=THEMES[scene().themeId];return t||THEMES.floresta}
function curTiles(){return curTheme().tiles}
const canvas=document.getElementById('editor'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
function mark(){ $('dirty').textContent='●'; $('dirty').style.color='#f7b32b' }
function syncHistoryBaseline(){committedSnapshot=clone(project)}
function pushHistory(){
 const mgr=getCommandManager();
 if(mgr){
   // 1.0.1: transaction bridge works whether a tool calls pushHistory BEFORE or
   // AFTER mutating the project. The baseline is the last committed project state.
   if(!pendingHistory){
     pendingHistory=true;const before=clone(committedSnapshot||project);
     queueMicrotask(()=>{pendingHistory=false;const after=clone(project);if(JSON.stringify(before)===JSON.stringify(after)){committedSnapshot=clone(after);return}const cmd={name:'Editar projeto',execute(){project=clone(after);committedSnapshot=clone(after);renderAll()},undo(){project=clone(before);committedSnapshot=clone(before);renderAll()}};mgr.recordApplied?mgr.recordApplied(cmd):(mgr.undoStack.push(cmd),mgr.redoStack.length=0);committedSnapshot=clone(after);});
   }
 }else{const before=clone(committedSnapshot||project);history.push(before);if(history.length>30)history.shift();future=[];queueMicrotask(()=>syncHistoryBaseline())}
 mark();
}
function setStatus(s){$('status').textContent=s}
function toast(s){const d=document.createElement('div');d.className='toast';d.textContent=s;document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}

// ----- Desenho de tiles orientado a dados (funciona no editor E no jogo exportado) -----
function drawTileAt(ctx2,tile,x,y,size){if(window.SNESBuiltinTiles?.draw(ctx2,tile,x,y,size))return;const s=size/16;ctx2.fillStyle=tile.color;ctx2.fillRect(x,y,size,size);(tile.decos||[]).forEach(d=>{if(d.outline){ctx2.strokeStyle=d.outline;ctx2.lineWidth=Math.max(1,s);ctx2.strokeRect(x+d.x*s+s/2,y+d.y*s+s/2,Math.max(0,d.w*s-s),Math.max(0,d.h*s-s))}else{ctx2.fillStyle=d.color;ctx2.fillRect(x+d.x*s,y+d.y*s,d.w*s,d.h*s)}})}
function px(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)}
function drawEnemySprite(c,e,theme){const v=enemyList(scene().themeId).find(q=>q.id===e.sub)||enemyList(scene().themeId)[0],x=e.x,y=e.y,b=v.color,a=v.accent;
 if(v.style==='slime'){px(c,x+2,y+5,10,7,b);px(c,x+4,y+3,6,3,b);px(c,x+3,y+11,3,2,a);px(c,x+9,y+11,3,2,a)}
 else if(v.style==='flying'){px(c,x+4,y+4,6,7,b);px(c,x,y+2,5,3,b);px(c,x+9,y+2,5,3,b);px(c,x+2,y,3,2,a);px(c,x+10,y,3,2,a)}
 else if(v.style==='crawler'){px(c,x+3,y+5,8,6,b);px(c,x,y+4,4,2,a);px(c,x+10,y+4,4,2,a);px(c,x,y+10,4,2,b);px(c,x+10,y+10,4,2,b)}
 else if(v.style==='humanoid'){px(c,x+3,y,8,5,b);px(c,x+2,y+5,10,6,b);px(c,x,y+6,3,2,a);px(c,x+11,y+6,3,2,a);px(c,x+3,y+11,3,3,b);px(c,x+8,y+11,3,3,b)}
 else{px(c,x+2,y+4,10,7,b);px(c,x+9,y+1,4,5,b);px(c,x,y+9,4,3,a);px(c,x+3,y+11,3,3,b);px(c,x+9,y+11,3,3,b)}
 px(c,x+5,y+5,2,2,'#fff');px(c,x+9,y+5,2,2,'#18131e');
}
const __editorAssetImages=Object.create(null);
function editorAssetImage(id){
 const a=(project.studio&&project.studio.assets||[]).find(x=>x.id===id);
 let src=a&&(a.dataUrl||a.url);
 if(id==='builtin_hero_blue_red')src=(a&&(a.dataUrl||a.url))||window.__HERO_BLUE_RED_SHEET_DATAURL||'assets/hero-blue-red-sheet.png';
 if(!src)return null;
 let im=__editorAssetImages[id];
 if(!im){im=new Image();im.onload=()=>{try{drawGrid()}catch(_){}};im.src=src;__editorAssetImages[id]=im;}
 return im;
}
function drawCustomEntitySprite(c,e){
 if(!e||!e.spriteAsset)return false;
 const im=editorAssetImage(e.spriteAsset);if(!im||!im.complete||!im.naturalWidth)return false;
 let sx=0,sy=0,sw=im.naturalWidth,sh=im.naturalHeight;
 const anims=project.studio&&project.studio.animations||[];const a=anims.find(x=>x.id===e.animationId);
 if(a&&a.frames&&a.frames.length&&Array.isArray(a.frames[0])&&a.frames[0].length>=4)[sx,sy,sw,sh]=a.frames[0];
 if(e.spriteAsset==='builtin_hero_blue_red'&&(!a||!a.frames||!a.frames.length)){sx=13;sy=1;sw=119;sh=178;}
 const dw=+e.spriteW||32,dh=+e.spriteH||32;const cw=+e.w||14,ch=+e.h||14;
 const dx=(+e.x||0)-(dw-cw)/2,dy=(+e.y||0)+ch-dh;
 c.save();c.imageSmoothingEnabled=false;c.drawImage(im,sx,sy,sw,sh,dx,dy,dw,dh);c.restore();return true;
}
function drawObjectSprite(c,e,theme){const o=(theme.objects||[]).find(q=>q.id===e.sub)||theme.objects[0];if(!o)return;const x=e.x,y=e.y,id=o.id;c.fillStyle=o.color;
 if(/fogueira|tocha/.test(id)){px(c,x+6,y+8,3,6,'#704126');px(c,x+3,y+11,10,2,'#704126');px(c,x+5,y+3,6,8,'#ef5b25');px(c,x+7,y+1,3,7,'#ffd45a')}
 else if(/cristal/.test(id)){px(c,x+6,y,4,14,o.color);px(c,x+3,y+5,3,8,'#d7b9ff');px(c,x+10,y+4,3,9,'#8b62cf')}
 else if(/placa/.test(id)){px(c,x+2,y+1,12,8,o.color);px(c,x+7,y+9,2,6,'#6d4529');px(c,x+4,y+4,7,1,'#ead59a')}
 else if(/caixa|caixote|bau|barril/.test(id)){px(c,x+1,y+2,13,12,o.color);px(c,x+1,y+5,13,2,'#5d3b28');px(c,x+6,y+2,2,12,'#d0a45e')}
 else if(/boneco/.test(id)){px(c,x+4,y,7,7,'#fff');px(c,x+2,y+6,11,8,'#edf7ff');px(c,x+6,y+2,1,1,'#222');px(c,x+9,y+2,1,1,'#222')}
 else{px(c,x+3,y+2,9,11,o.color);px(c,x+1,y+7,13,6,o.color);px(c,x+4,y+4,3,2,'#ffffff55')}
}
function drawEntityAt(ctx2,e,theme){theme=theme||curTheme();if(e.spriteAsset&&drawCustomEntitySprite(ctx2,e))return;if(e.type==='enemy'&&e.sprite==='skeleton'&&window.SkeletonSprite?.draw)window.SkeletonSprite.draw(ctx2,e);else if(e.type==='enemy')drawEnemySprite(ctx2,e,theme);else if(e.type==='item'){const it=e.item||e.sub||'coin';if(it==='heart'||it==='heart_piece'){px(ctx2,e.x+3,e.y+2,10,8,'#e74c3c');px(ctx2,e.x+5,e.y+4,6,6,'#c0392b')}else if(it==='key'||it==='boss_key'){px(ctx2,e.x+4,e.y+2,8,4,'#f1c40f');px(ctx2,e.x+10,e.y+6,3,8,'#f39c12')}else if(it==='gem'){px(ctx2,e.x+4,e.y+2,8,12,'#9b59b6')}else if(it==='potion_small'||it==='potion'||it==='potion_large'){px(ctx2,e.x+5,e.y+2,6,12,'#3498db');px(ctx2,e.x+6,e.y,4,3,'#ecf0f1')}else{px(ctx2,e.x+4,e.y+1,5,12,'#f7b32b');px(ctx2,e.x+2,e.y+4,9,6,'#ffe17a');px(ctx2,e.x+5,e.y+4,3,6,'#c88418')}}else if(e.type==='npc'){px(ctx2,e.x+3,e.y,7,5,'#ffd88a');px(ctx2,e.x+2,e.y+5,9,8,'#4aa0e0');px(ctx2,e.x+4,e.y+2,1,1,'#222');px(ctx2,e.x+8,e.y+2,1,1,'#222')}else if(e.type==='object')drawObjectSprite(ctx2,e,theme);else if(e.type==='player'){px(ctx2,e.x+3,e.y,7,5,'#ffd88a');px(ctx2,e.x+2,e.y+5,9,7,'#55d6a0');px(ctx2,e.x+2,e.y+12,3,2,'#31435c');px(ctx2,e.x+8,e.y+12,3,2,'#31435c')}else if(e.type==='checkpoint'){px(ctx2,e.x+6,e.y-8,3,20,'#27ae60');px(ctx2,e.x+9,e.y-8,10,8,'#2ecc71')}else if(e.type==='door'){px(ctx2,e.x,e.y,12,24,e.requires?'#f39c12':'#3498db');px(ctx2,e.x+3,e.y+10,3,3,'#fff')}else if(e.type==='ability'){px(ctx2,e.x+2,e.y+2,12,12,'#f1c40f');px(ctx2,e.x+5,e.y+5,6,6,'#fff')}else if(e.type==='save_crystal'){px(ctx2,e.x+2,e.y,12,16,'#74b9ff')}else{px(ctx2,e.x,e.y,14,14,'#888')}}
function drawGrid(){const s=scene();const tiles=curTiles();ctx.clearRect(0,0,W,H);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)drawTileAt(ctx,tiles[s.map[y][x]]||tiles[0],x*T,y*T,T);ctx.strokeStyle='#ffffff16';for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*T,0);ctx.lineTo(x*T,H);ctx.stroke()}for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*T);ctx.lineTo(W,y*T);ctx.stroke()}if(!playing){const theme=curTheme();s.entities.forEach(e=>{drawEntityAt(ctx,e,theme);if(e.id===selectedEntity){ctx.strokeStyle='#f7b32b';ctx.lineWidth=2;ctx.setLineDash([3,2]);ctx.strokeRect(e.x-3,e.y-3,20,20);ctx.setLineDash([])}})}if(view==='map'&&!playing){const r=canvas.getBoundingClientRect();const mx=(mouse.x-r.left)*W/r.width,my=(mouse.y-r.top)*H/r.height,gx=Math.floor(mx/T),gy=Math.floor(my/T);if(gx>=0&&gx<COLS&&gy>=0&&gy<ROWS){ctx.strokeStyle='#f7b32b';ctx.lineWidth=2;ctx.strokeRect(gx*T+1,gy*T+1,T-2,T-2)}}}
let mouse={x:0,y:0,down:false};canvas.addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;if(mouse.down)paint()});canvas.addEventListener('mousedown',e=>{mouse.down=true;paint()});window.addEventListener('mouseup',()=>mouse.down=false);canvas.addEventListener('contextmenu',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();const gx=Math.floor((e.clientX-r.left)*W/r.width/T),gy=Math.floor((e.clientY-r.top)*H/r.height/T);if(gx>=0&&gy>=0&&gx<COLS&&gy<ROWS){pushHistory();scene().map[gy][gx]=0;drawGrid()}});
function paint(){if(playing||view!=='map'||window.SNESStudio&&window.SNESStudio.placeMode)return;const r=canvas.getBoundingClientRect();const gx=Math.floor((mouse.x-r.left)*W/r.width/T),gy=Math.floor((mouse.y-r.top)*H/r.height/T);if(gx>=0&&gy>=0&&gx<COLS&&gy<ROWS&&scene().map[gy][gx]!==selectedTile){if(!paint.last||paint.last.x!==gx||paint.last.y!==gy){if(!paint.stroke){pushHistory();paint.stroke=true}scene().map[gy][gx]=selectedTile;paint.last={x:gx,y:gy};drawGrid()}}}
window.addEventListener('mouseup',()=>{paint.stroke=false;paint.last=null});


function sceneUid(){return 'scene_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)}
function entityUid(prefix='e'){return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)}
function makeSceneTemplate(kind='auto'){
 const id=sceneUid(), nm=blankMap(), bg=blankMap(), fg=blankMap();
 const type=(project.gameType||project.settings?.type||'platform');
 if(kind==='auto')kind=(type==='topdown'||type==='top-down'||type==='action-rpg')?'topdown':(type==='shooter'?'shooter':'platform');
 const sc={id,name:'Fase '+(project.scenes.length+1),themeId:'floresta',map:nm,layers:{background:bg,ground:nm.map(r=>r.slice()),foreground:fg},entities:[],sceneType:'gameplay'};
 const addPlayer=(x,y)=>sc.entities.push({id:entityUid('player'),type:'player',name:'Player',x,y,w:14,h:22,hp:3,maxHp:3,speed:120});
 if(kind==='platform'||kind==='boss'){
   for(let x=0;x<COLS;x++)sc.layers.ground[ROWS-2][x]=1;
   addPlayer(48,(ROWS-2)*T-12);
   if(kind==='boss'){sc.name='Boss '+(project.scenes.length+1);sc.sceneType='boss';sc.entities.push({id:entityUid('boss'),type:'enemy',name:'Boss',x:390,y:(ROWS-2)*T-18,w:28,h:36,hp:20,maxHp:20,damage:2,speed:35,boss:true});}
 }else if(kind==='topdown'){
   for(let x=0;x<COLS;x++){sc.layers.ground[0][x]=1;sc.layers.ground[ROWS-1][x]=1}
   for(let y=0;y<ROWS;y++){sc.layers.ground[y][0]=1;sc.layers.ground[y][COLS-1]=1}
   addPlayer(W/2,H/2);
 }else if(kind==='shooter')addPlayer(W/2,H-48);
 else if(kind==='cutscene'){sc.sceneType='cutscene';sc.name='Cutscene '+(project.scenes.length+1);sc.entities=[];}
 else if(kind==='menu'){sc.sceneType='menu';sc.name='Menu '+(project.scenes.length+1);sc.entities=[];}
 else if(kind==='empty'){sc.sceneType='gameplay'}
 sc.map=sc.layers.ground;
 if(window.SNESTileMap)window.SNESTileMap.normalizeScene(sc);
 return sc;
}
function addSceneTemplate(kind){pushHistory();const sc=makeSceneTemplate(kind);project.scenes.push(sc);project.currentScene=sc.id;project.game=project.game||{};project.game.campaign=project.game.campaign||[];if(!project.game.campaign.includes(sc.id))project.game.campaign.push(sc.id);selectedEntity=null;renderAll();toast('Cena criada: '+sc.name)}
function duplicateSceneById(id){const src=project.scenes.find(x=>x.id===id);if(!src)return;pushHistory();const cp=clone(src),oldId=cp.id,newId=sceneUid(),emap=new Map();cp.id=newId;cp.name=(src.name||'Cena')+' — Cópia';(cp.entities||[]).forEach(e=>{const old=e.id;e.id=entityUid(e.type||'e');emap.set(old,e.id)});for(const e of cp.entities||[]){for(const k of ['targetId','entityId','parentId','ownerId'])if(e[k]&&emap.has(e[k]))e[k]=emap.get(e[k])}
 const idx=project.scenes.findIndex(x=>x.id===id);project.scenes.splice(idx+1,0,cp);const st=project.studio||{};const evMap=new Map();const oldEvents=(st.events||[]).filter(e=>e.sceneId===oldId);for(const ev of oldEvents){const ne=clone(ev),oe=ne.id;ne.id=entityUid('ev');ne.sceneId=newId;evMap.set(oe,ne.id);(st.events||(st.events=[])).push(ne)}for(const tr of (st.triggers||[]).filter(t=>t.sceneId===oldId)){const nt=clone(tr);nt.id=entityUid('tr');nt.sceneId=newId;if(nt.eventId&&evMap.has(nt.eventId))nt.eventId=evMap.get(nt.eventId);(st.triggers||(st.triggers=[])).push(nt)}
 const cuts=project.game?.cutscenes?.scenes;if(cuts&&cuts[oldId])cuts[newId]=clone(cuts[oldId]);const camp=project.game?.campaign;if(Array.isArray(camp)){const ci=camp.indexOf(oldId);if(ci>=0)camp.splice(ci+1,0,newId)}project.currentScene=newId;selectedEntity=null;renderAll();toast('Cena duplicada')}
function renameSceneById(id){const sc=project.scenes.find(x=>x.id===id);if(!sc)return;const name=prompt('Novo nome da cena:',sc.name||'Cena');if(!name||!name.trim())return;pushHistory();sc.name=name.trim();renderAll();toast('Cena renomeada')}
function moveSceneById(id,delta){const i=project.scenes.findIndex(x=>x.id===id),j=i+delta;if(i<0||j<0||j>=project.scenes.length)return;pushHistory();const [sc]=project.scenes.splice(i,1);project.scenes.splice(j,0,sc);renderAll()}
function deleteSceneById(id){if(project.scenes.length<=1)return toast('O projeto precisa ter pelo menos uma cena.');const sc=project.scenes.find(x=>x.id===id);if(!sc)return;if(!confirm('Excluir "'+(sc.name||id)+'"? Eventos, triggers e referências dessa cena serão limpos.'))return;pushHistory();project.scenes=project.scenes.filter(x=>x.id!==id);const fallback=project.scenes[0].id;project.currentScene=project.currentScene===id?fallback:project.currentScene;const st=project.studio||{};st.events=(st.events||[]).filter(e=>e.sceneId!==id);st.triggers=(st.triggers||[]).filter(t=>t.sceneId!==id);for(const s of project.scenes)for(const e of s.entities||[])if(e.targetScene===id)e.targetScene='';project.game=project.game||{};if(project.game.startScene===id)project.game.startScene=fallback;if(Array.isArray(project.game.campaign))project.game.campaign=project.game.campaign.filter(x=>x!==id);if(project.game.cutscenes?.scenes)delete project.game.cutscenes.scenes[id];selectedEntity=null;renderAll();toast('Cena excluída e referências limpas')}
function renderRight(){const p=$('rightPanel');
if(view==='map'){
 const tiles=curTiles();
 const themeOptions=THEME_IDS.map(id=>'<option value="'+id+'" '+(scene().themeId===id?'selected':'')+'>'+THEMES[id].emoji+' '+THEMES[id].name+'</option>').join('');
 p.innerHTML='<div class="card"><h3>PALETA DE TILES</h3><div class="row"><label>Tileset</label><select id="mapThemeSelect">'+themeOptions+'</select></div><p class="badge">Escolha o tileset e clique no tile abaixo. Depois pinte diretamente no mapa.</p><div class="grid" id="tiles"></div></div><div class="card"><h3>MAPA</h3><div class="row"><label>Largura</label><span>'+COLS+'</span></div><div class="row"><label>Altura</label><span>'+ROWS+'</span></div><div class="row"><label>Tile</label><span>16×16</span></div></div>';
 $('mapThemeSelect').onchange=e=>{if(e.target.value!==scene().themeId){pushHistory();scene().themeId=e.target.value;selectedTile=1;renderAll();toast('Tileset: '+curTheme().name)}};
 const g=$('tiles');
 tiles.forEach((tile,i)=>{const b=document.createElement('button');b.className='tile '+(i===selectedTile?'selected':'');const c=document.createElement('canvas');c.width=c.height=32;b.appendChild(c);const tc=c.getContext('2d');tc.imageSmoothingEnabled=false;drawTileAt(tc,tile,0,0,32);tc.fillStyle='#00000088';tc.fillRect(0,22,32,10);tc.fillStyle='#fff';tc.font='8px monospace';tc.fillText(i+' '+tile.name.slice(0,7),2,29);b.title=tile.name;b.onclick=()=>{selectedTile=i;renderRight()};g.appendChild(b)});
}else if(view==='entities'){
 const playerEnt=scene().entities.find(e=>e.type==='player');const studioAssets=(project.studio&&project.studio.assets||[]).filter(a=>a.kind==='image');
 const playerOptions=['<option value="default">Player padrão</option>','<option value="builtin_hero_blue_red" '+(playerEnt&&playerEnt.spriteAsset==='builtin_hero_blue_red'?'selected':'')+'>Herói Azul/Vermelho</option>'].concat(studioAssets.filter(a=>a.id!=='builtin_hero_blue_red').map(a=>'<option value="'+a.id+'" '+(playerEnt&&playerEnt.spriteAsset===a.id?'selected':'')+'>'+esc(a.name)+'</option>')).join('');
 p.innerHTML='<div class="card"><h3>ENTIDADES</h3><button id="addPlayer">＋ Player</button> <button id="addEnemy">＋ Inimigo</button> <button id="addItem">＋ Item</button> <button id="addNpc">＋ NPC</button> <button id="addObject">＋ Objeto</button></div>'+(playerEnt?'<div class="card"><h3>PLAYER VISUAL</h3><div class="row"><label>Sprite</label><select id="quickPlayerVisual">'+playerOptions+'</select></div><button id="applyQuickPlayer">✓ Usar este Player</button><p class="badge">Você pode trocar o Player aqui sem abrir o Inspector avançado.</p></div>':'')+'<div id="entitiesList"></div>';
 if(playerEnt){$('applyQuickPlayer').onclick=()=>{pushHistory();const v=$('quickPlayerVisual').value;if(v==='default'){playerEnt.spriteAsset=null;playerEnt.animationId=null;playerEnt.playerVisual='default';playerEnt.spriteW=16;playerEnt.spriteH=16;}else if(v==='builtin_hero_blue_red'){playerEnt.spriteAsset=v;playerEnt.animationId='hero_blue_red_idle';playerEnt.playerVisual='hero_blue_red';playerEnt.spriteW=32;playerEnt.spriteH=48;playerEnt.w=playerEnt.w||14;playerEnt.h=playerEnt.h||22;}else{playerEnt.spriteAsset=v;playerEnt.animationId=null;playerEnt.playerVisual='custom';playerEnt.spriteW=playerEnt.spriteW||32;playerEnt.spriteH=playerEnt.spriteH||32;}playerEnt.components=playerEnt.components||{};playerEnt.components.spriteRenderer={assetId:playerEnt.spriteAsset,animationId:playerEnt.animationId,w:playerEnt.spriteW,h:playerEnt.spriteH,visible:true};delete playerEnt.components.sprite;toast('Player visual aplicado');drawGrid();renderRight();mark();};}
 const list=$('entitiesList');
 const icons={player:'🧍',enemy:'👾',item:'🪙',npc:'💬',object:'📦'};
 scene().entities.forEach(e=>{const d=document.createElement('div');d.className='entity';d.innerHTML='<span class="dot">'+ (icons[e.type]||'') +'</span><div><b>'+e.name+'</b><small>'+e.type+' · X '+Math.round(e.x)+' Y '+Math.round(e.y)+'</small></div>';d.onclick=()=>{selectedEntity=e.id;editEntity(e)};list.appendChild(d)});
 $('addPlayer').onclick=()=>addEntity('player');$('addEnemy').onclick=()=>addEntity('enemy');$('addItem').onclick=()=>addEntity('item');$('addNpc').onclick=()=>addEntity('npc');$('addObject').onclick=()=>addEntity('object');
}else if(view==='tilesets'){
 const theme=curTheme();
 let h='<div class="card"><h3>TEMA DA CENA</h3><div class="themeGrid" id="themeGrid"></div></div>';
 h+='<div class="card"><h3>TILES — '+theme.emoji+' '+theme.name+'</h3><p class="badge">Clique em qualquer tile abaixo para selecioná-lo e voltar ao mapa pronto para pintar.</p><div class="grid" id="tilesPreview"></div></div>';
 h+='<div class="card"><h3>SPRITES DE INIMIGOS</h3><div class="objGrid" id="enemyPreview"></div><p class="badge">3 variantes exclusivas deste bioma.</p></div>';
 h+='<div class="card"><h3>OBJETOS DISPONÍVEIS</h3><div class="objGrid" id="objPreview"></div><p class="badge">Use "＋ Objeto" na aba Entidades para posicioná-los no mapa.</p></div>';
 p.innerHTML=h;
 const tg=$('themeGrid');
 THEME_IDS.forEach(id=>{const t=THEMES[id];const b=document.createElement('button');b.className='themeBtn '+(id===scene().themeId?'active':'');b.innerHTML=t.emoji+'<span>'+t.name+'</span>';b.onclick=()=>{if(id!==scene().themeId){pushHistory();scene().themeId=id;selectedTile=Math.min(selectedTile,THEMES[id].tiles.length-1);renderAll()}};tg.appendChild(b)});
 const tp=$('tilesPreview');
 theme.tiles.forEach((tile,i)=>{const wrap=document.createElement('button');wrap.className='tile '+(i===selectedTile?'selected':'');const c=document.createElement('canvas');c.width=c.height=32;wrap.appendChild(c);const tc=c.getContext('2d');tc.imageSmoothingEnabled=false;drawTileAt(tc,tile,0,0,32);wrap.title='Usar '+tile.name+' no mapa';wrap.onclick=()=>{selectedTile=i;const mapBtn=document.querySelector('.nav[data-view="map"]');if(mapBtn)mapBtn.click();else{view='map';renderAll()}toast('Tile selecionado: '+tile.name)};tp.appendChild(wrap)});
 const ep=$('enemyPreview');enemyList(scene().themeId).forEach(v=>{const wrap=document.createElement('div');wrap.className='objBtn';const c=document.createElement('canvas');c.width=c.height=32;c.style.width='32px';c.style.height='32px';const ec=c.getContext('2d');ec.imageSmoothingEnabled=false;const old=scene().themeId;drawEnemySprite(ec,{x:8,y:8,sub:v.id},theme);wrap.appendChild(c);const lbl=document.createElement('div');lbl.textContent=v.name;wrap.appendChild(lbl);ep.appendChild(wrap)});
 const op=$('objPreview');
 theme.objects.forEach(o=>{const wrap=document.createElement('div');wrap.className='objBtn';const c=document.createElement('canvas');c.width=c.height=32;c.style.width='32px';c.style.height='32px';const oc=c.getContext('2d');oc.imageSmoothingEnabled=false;oc.fillStyle=o.color;if(o.shape==='circle'){oc.beginPath();oc.arc(16,16,13,0,Math.PI*2);oc.fill()}else{oc.fillRect(3,3,26,26)}wrap.appendChild(c);const lbl=document.createElement('div');lbl.textContent=o.name;wrap.appendChild(lbl);op.appendChild(wrap)});
 }else if(view==='scenes'){
 const suggested=(project.gameType==='topdown'||project.gameType==='top-down'||project.gameType==='action-rpg')?'topdown':project.gameType==='shooter'?'shooter':'platform';
 p.innerHTML='<div class="card"><h3>SCENE MANAGER 1.0.1</h3><div class="row"><select id="sceneTemplate"><option value="'+suggested+'">Template recomendado</option><option value="platform">Plataforma</option><option value="topdown">Top-down</option><option value="shooter">Shooter</option><option value="boss">Arena de Boss</option><option value="cutscene">Cutscene</option><option value="menu">Menu</option><option value="empty">Vazia</option></select><button id="addScene">＋ Criar</button></div><input id="sceneSearch" placeholder="Pesquisar cenas..." style="width:100%;margin-top:8px"><p class="badge">Duplique, renomeie, ordene e exclua cenas sem quebrar campanha/eventos.</p></div><div id="scenesPanel"></div>';
 const q=$('scenesPanel');
 const renderScenes=()=>{const term=($('sceneSearch')?.value||'').toLowerCase();q.innerHTML='';project.scenes.forEach((s,idx)=>{if(term&&!String(s.name||'').toLowerCase().includes(term)&&!String(s.id).toLowerCase().includes(term))return;const t=THEMES[s.themeId]||THEMES.floresta,m=s.map||s.layers?.ground||blankMap(),d=document.createElement('div');d.className='scene-item '+(s.id===project.currentScene?'active':'');d.dataset.sceneId=s.id;d.innerHTML='<div style="display:flex;align-items:center;gap:6px"><b style="flex:1">'+esc(s.name)+'</b><span class="badge">'+esc(s.sceneType||'gameplay')+'</span></div><div class="badge">'+t.emoji+' '+t.name+' · '+((m[0]&&m[0].length)||COLS)+'×'+(m.length||ROWS)+' · '+(s.entities||[]).length+' entidades</div><div class="row scene-tools"><button data-act="up" title="Mover para cima">↑</button><button data-act="down" title="Mover para baixo">↓</button><button data-act="dup">Duplicar</button><button data-act="rename">Renomear</button><button data-act="delete">Excluir</button></div>';d.onclick=e=>{if(e.target.closest('button'))return;project.currentScene=s.id;selectedEntity=null;renderAll();mark()};d.querySelectorAll('[data-act]').forEach(b=>b.onclick=e=>{e.stopPropagation();const a=b.dataset.act;if(a==='up')moveSceneById(s.id,-1);else if(a==='down')moveSceneById(s.id,1);else if(a==='dup')duplicateSceneById(s.id);else if(a==='rename')renameSceneById(s.id);else if(a==='delete')deleteSceneById(s.id)});q.appendChild(d)})};
 $('sceneSearch').oninput=renderScenes;$('addScene').onclick=()=>addSceneTemplate($('sceneTemplate').value);renderScenes();
}else{
 p.innerHTML='<div class="card"><h3>CONFIGURAÇÕES DO PROJETO</h3><div class="row"><label>Nome</label><input id="pname" value="'+project.name+'"></div><div class="row"><label>Tipo</label><select id="ptype"><option value="platform">Plataforma 2D</option><option value="topdown">Top-down / RPG</option><option value="shooter">Shooter / Navinha</option></select></div><div class="row"><label>Resolução</label><span>512×288</span></div><p class="badge">O projeto guarda mapas, cenas, tema visual e entidades. O runtime lê esses dados para executar o jogo.</p></div><div class="card"><h3>ARQUITETURA</h3><div class="badge">Engine Core → Tilesets (V3) → Project Data → Editor → Runtime → Export</div></div>';
 $('pname').onchange=e=>{project.name=e.target.value;$('projectName').value=project.name;mark()};$('ptype').value=project.gameType||project.settings.type||'platform';$('ptype').onchange=e=>{const v=e.target.value;project.gameType=v;project.settings.type=v;mark();if(window.SNESStudioUI)window.SNESStudioUI.refreshGameTypeUI();toast('Estilo: '+v)};
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
function undo(){const mgr=getCommandManager();if(mgr&&mgr.undoStack.length){mgr.undo();syncHistoryBaseline();toast('Desfeito');return}if(!history.length)return;future.push(clone(project));project=history.pop();syncHistoryBaseline();renderAll();toast('Desfeito')}
function redo(){const mgr=getCommandManager();if(mgr&&mgr.redoStack.length){mgr.redo();syncHistoryBaseline();toast('Refeito');return}if(!future.length)return;history.push(clone(project));project=future.pop();syncHistoryBaseline();renderAll();toast('Refeito')}
$('undoBtn').onclick=undo;$('redoBtn').onclick=redo;document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName))return;const mod=e.ctrlKey||e.metaKey;if(mod&&!e.shiftKey&&e.key.toLowerCase()==='z'){e.preventDefault();undo()}else if(mod&&(e.key.toLowerCase()==='y'||(e.shiftKey&&e.key.toLowerCase()==='z'))){e.preventDefault();redo()}});$('clearBtn').onclick=()=>{if(confirm('Limpar a camada de terreno da cena?')){pushHistory();const s=scene();const m=blankMap();if(s.layers){s.layers.ground=m;s.map=m}else s.map=m;drawGrid()}};
$('newBtn').onclick=()=>{if(confirm('Criar novo projeto?')){project=migrateProject(defaultProject());history=[];future=[];getCommandManager()?.clear();syncHistoryBaseline();renderAll();toast('Novo projeto criado')}};
$('saveBtn').onclick=()=>{try{if(window.SNESSave)SNESSave.saveEditor(project);else if(window.SNESStorage?.legacy)SNESStorage.legacy.set(KEY,JSON.stringify(project));else throw new Error('StorageHub indisponível');$('dirty').textContent='✓';$('dirty').style.color='#62d38b';toast('Projeto salvo no navegador')}catch(e){toast('Falha ao salvar')}};
$('loadBtn').onclick=()=>{try{let data=window.SNESSave?SNESSave.loadEditor():null;if(!data){const st=window.SNESStorage?.legacy;const raw=st?(st.get(KEY)||st.get('snes_engine_studio_project_v3')||st.get('snes_engine_studio_project_v2')):null;data=raw?JSON.parse(raw):null}if(!data)return toast('Nenhum projeto salvo');project=migrateProject(data);renderAll();toast('Projeto carregado e migrado para 1.0')}catch(e){toast('Arquivo inválido')}};
function downloadFile(name,data,type){const blob=new Blob([data],{type:type||'application/octet-stream'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function exportPreflight(){const issues=window.ProjectValidator?window.ProjectValidator.validate(project):[],errors=issues.filter(i=>i.level==='error');if(errors.length){toast('Exportação bloqueada: '+errors[0].msg);console.error('[Export Preflight]',errors);return false}const warnings=issues.filter(i=>i.level==='warning');if(warnings.length)console.warn('[Export Preflight] '+warnings.length+' aviso(s)',warnings);return true}
$('exportBtn').onclick=()=>{if(!exportPreflight())return;const html=buildExport();downloadFile((project.name||'meu-jogo').replace(/[^a-z0-9-_]+/gi,'_')+'.html',html,'text/html');toast('Jogo HTML exportado')};
$('exportSnesBtn').onclick=()=>exportSnesBundle();
$('projectName').onchange=e=>{project.name=e.target.value;mark()};document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderRight();drawGrid()});
$('playBtn').onclick=()=>startPlay();$('stopBtn').onclick=()=>stopPlay();

let game={x:32,y:200,vx:0,vy:0,hp:3,onGround:false,score:0,speed:120,jump:300};
function startPlay(){
  if(playing)return;
  project.scenes.forEach(s=>{
    if(window.PlatformRuntime)window.PlatformRuntime.ensureLayers(s);
    else if(window.SNESRuntime)window.SNESRuntime.ensureLayers(s);
  });
  const issues=window.ProjectValidator?window.ProjectValidator.validate(project):[];
  const errors=issues.filter(i=>i.level==='error');
  if(errors.length){toast('Corriga erros antes de testar: '+errors[0].msg);return}
  if(!window.SNESEngine){toast('Engine V7 não carregada');return}
  playing=true;view='map';
  const skDraw=window.SkeletonSprite?window.SkeletonSprite.draw:null;
  const handle=window.SNESEngine.play(project,canvas,THEMES,ENEMY_VARIANTS,skDraw,{
    onStop:function(){playing=false;renderAll()}
  });
  if(handle&&handle.rt)game=handle.rt.player;
  $('status').textContent='TESTANDO ('+(project.gameType||'platform')+'): setas movem · Z/X/E ações · ESC parar';
  renderAll();
}
function stopPlay(){
  if(window.SNESEngine)window.SNESEngine.stop();
  playing=false;
  renderAll();
}
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&playing){if(window.SNESGameFlow&&window.SNESGameFlow.getActive&&window.SNESGameFlow.getActive())return;e.preventDefault();stopPlay()}});


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
 // Migrar camadas antes de exportar
 project.scenes.forEach(s=>{if(window.SNESRuntime)window.SNESRuntime.ensureLayers(s)});
 const data=JSON.stringify(project);
 const themesData=JSON.stringify(THEMES);
 const enemiesData=JSON.stringify(ENEMY_VARIANTS);
 let runtimeSrc='';
 try{const xhr=null}catch(_){}
 // Runtime é injetado de window.__SNES_RUNTIME_SRC se disponível, senão versão mínima embutida
 const rtSrc=(window.__SNES_RUNTIME_SRC)||'';
 const skClips=window.SkeletonSprite?JSON.stringify(window.SkeletonSprite.clips):'{}';
 const skData=window.SKELETON_SHEET_DATA||'';
 return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"><title>'+esc(project.name)+'</title><style>'
 +'html,body{margin:0;background:#080912;color:#fff;height:100%;display:grid;place-items:center;font-family:monospace;overflow:hidden;touch-action:none}'
 +'canvas{width:min(96vw,1024px);height:auto;image-rendering:pixelated;border:2px solid #353a5d;max-height:80vh}'
 +'#pad{position:fixed;left:0;right:0;bottom:0;height:140px;pointer-events:none;display:none}'
 +'#pad .btn{pointer-events:auto;position:absolute;width:56px;height:56px;border-radius:50%;background:#ffffff33;border:2px solid #fff6;color:#fff;font-size:18px;display:grid;place-items:center;user-select:none;-webkit-user-select:none}'
 +'#pad .left{left:24px;bottom:40px}#pad .right{left:90px;bottom:40px}#pad .jump{right:90px;bottom:40px}#pad .attack{right:24px;bottom:40px}#pad .action{right:56px;bottom:100px}'
 +'@media (pointer:coarse){#pad{display:block}}'
 +'</style></head><body><canvas id="game" width="512" height="288"></canvas><div id="pad">'
 +'<div class="btn left" data-k="left">◀</div><div class="btn right" data-k="right">▶</div>'
 +'<div class="btn jump" data-k="jump">A</div><div class="btn attack" data-k="attack">B</div><div class="btn action" data-k="action">X</div></div><script>'
 +'(function(){\n'
 +'const PROJECT='+data.replace(/</g,'\\u003c')+';\n'
 +'const THEMES='+themesData.replace(/</g,'\\u003c')+';\n'
 +'const ENEMY_VARIANTS='+enemiesData.replace(/</g,'\\u003c')+';\n'
 +'const SK_CLIPS='+skClips+';\n'
 +'const SK_DATA='+JSON.stringify(skData)+';\n'
 +rtSrc.replace(/<\/script/gi,'<\\\\/script')+'\n'
 // Skeleton draw
 +'const skImg=new Image();if(SK_DATA)skImg.src=SK_DATA;\n'
 +'const rates={idle:5,walk:9,run:12,attack:13,hurt:9,death:8};\n'
 +'function skState(e){if(e.dead)return"death";if(e.hurtUntil>Date.now())return"hurt";if(e.attackUntil>Date.now())return"attack";if(Math.abs(e.vx||0)>55)return"run";if(Math.abs(e.vx||0)>2)return"walk";return"idle"}\n'
 +'function skDraw(c,e){if(!skImg.complete||!skImg.naturalWidth){c.fillStyle="#b8a477";c.fillRect(e.x,e.y-30,22,46);return}const st=skState(e),arr=SK_CLIPS[st]||SK_CLIPS.idle;if(!arr)return;const elapsed=e.animStarted?performance.now()-e.animStarted:performance.now();const i=st==="death"?Math.min(arr.length-1,Math.floor(elapsed/120)):Math.floor(elapsed/(1000/(rates[st]||8)))%arr.length;const f=arr[i];c.save();c.imageSmoothingEnabled=false;const flip=e.facing==="left",dw=52,dh=64,dx=e.x-17,dy=e.y-48;if(flip){c.translate(dx+dw,0);c.scale(-1,1);c.drawImage(skImg,f[0],f[1],f[2],f[3],0,dy,dw,dh)}else c.drawImage(skImg,f[0],f[1],f[2],f[3],dx,dy,dw,dh);c.restore()}\n'
 +'const c=document.getElementById("game"),x=c.getContext("2d");x.imageSmoothingEnabled=false;\n'
 +'const rt=SNESRuntime.createRuntimeState(PROJECT,PROJECT.currentScene);\n'
 +'SNESRuntime.bindInput(rt,window);\n'
 // Touch
 +'const pad=document.getElementById("pad");\n'
 +'function setTouch(k,v){if(k==="left")rt.touch.left=v;if(k==="right")rt.touch.right=v;if(k==="jump")rt.touch.jump=v;if(k==="attack")rt.touch.attack=v;if(k==="action")rt.touch.action=v}\n'
 +'pad.querySelectorAll(".btn").forEach(b=>{const k=b.dataset.k;const on=e=>{e.preventDefault();setTouch(k,true)};const off=e=>{e.preventDefault();setTouch(k,false)};b.addEventListener("touchstart",on,{passive:false});b.addEventListener("touchend",off,{passive:false});b.addEventListener("touchcancel",off,{passive:false});b.addEventListener("mousedown",on);b.addEventListener("mouseup",off);b.addEventListener("mouseleave",off)});\n'
 // Save
 +'const SAVE_KEY="snes_player_save_v06";\n'
 +'try{const raw=localStorage.getItem(SAVE_KEY);if(raw){const sv=JSON.parse(raw);if(sv&&sv.sceneId){rt.player.score=sv.score||0;rt.player.keys=sv.keys||0;if(sv.checkpoint)rt.player.checkpoint=sv.checkpoint}}}\n'
 +'catch(_){}\n'
 +'function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({sceneId:rt.sceneId,score:rt.player.score,keys:rt.player.keys||0,checkpoint:rt.player.checkpoint,hp:rt.player.hp}))}catch(_){}}\n'
 +'setInterval(persist,5000);\n'
 +'let last=0;function loop(now){const dt=Math.min(0.033,last?(now-last)/1000:1/60);last=now;SNESRuntime.tick(rt,THEMES,ENEMY_VARIANTS,dt,now);SNESRuntime.drawFrame(x,rt,THEMES,ENEMY_VARIANTS,skDraw);requestAnimationFrame(loop)}requestAnimationFrame(loop);\n'
 +'})();<\/script></body></html>';
}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
window.SNESStudio={get commandManager(){return getCommandManager()},get project(){return project},set project(v){project=migrateProject(v);syncHistoryBaseline()},scene,curTheme,blankMap,pushHistory,renderAll,renderRight,drawGrid,drawEntityAt,toast,setStatus,downloadFile,buildExport,migrateProject,makeSceneTemplate,addSceneTemplate,duplicateSceneById,renameSceneById,moveSceneById,deleteSceneById,THEMES,ENEMY_VARIANTS,THEME_IDS,get selectedTile(){return selectedTile},set selectedTile(v){selectedTile=v},get selectedEntity(){return selectedEntity},set selectedEntity(v){selectedEntity=v},get view(){return view},set view(v){view=v},get playing(){return playing},get game(){return game},startPlay,stopPlay,_drawEntityAt:drawEntityAt,get gameType(){return project.gameType||'platform'}};renderAll();window.dispatchEvent(new CustomEvent("snesstudio:ready"));})();
