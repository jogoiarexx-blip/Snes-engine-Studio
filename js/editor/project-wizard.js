/**
 * SNES Engine Studio V7 — Assistente de Novo Projeto
 */
(function () {
  'use strict';

  const TEMPLATES = [
    {
      id: 'platform',
      title: 'Plataforma',
      emoji: '🏃',
      desc: 'Ação lateral com pulos, inimigos e bosses.',
      features: ['Gravidade', 'Pulo', 'Caveira', 'Checkpoints'],
      themeId: 'floresta',
      ready: true
    },
    {
      id: 'topdown',
      title: 'Action RPG',
      emoji: '⚔️',
      desc: 'Exploração vista de cima, NPCs e missões.',
      features: ['8 direções', 'Diálogos', 'Inventário', 'Portas'],
      themeId: 'castelo',
      ready: true
    },
    {
      id: 'shooter',
      title: "Shoot 'em Up",
      emoji: '🚀',
      desc: 'Nave, ondas, power-ups e bosses.',
      features: ['Scroll', 'Tiros', 'Ondas', 'Boss'],
      themeId: 'espaco',
      ready: true
    },
    {
      id: 'kart-racing',
      title: 'Kart Racing 2.5D',
      emoji: '🏎️',
      desc: 'Corrida com perspectiva, drift, itens e IA.',
      features: ['Mode7', 'Drift', 'Itens', 'Minimap', 'Editor de pista'],
      themeId: 'deserto',
      ready: true
    },
    {
      id: 'metroidvania',
      title: 'Metroidvania',
      emoji: '🗡️',
      desc: 'Exploração, habilidades e mapa interconectado.',
      features: ['Salas', 'Pulo duplo', 'Dash', 'Boss', 'Mapa'],
      themeId: 'caverna',
      ready: true
    },
    {
      id: 'run-and-gun',
      title: 'Run and Gun',
      emoji: '🔫',
      desc: 'Plataforma com armas e projéteis.',
      features: ['Armas', 'Projéteis', 'Bosses'],
      themeId: 'vulcao',
      ready: false
    },
    {
      id: 'beat-em-up',
      title: "Beat 'em Up",
      emoji: '🥊',
      desc: 'Luta em grupo com profundidade, combos e boss.',
      features: ['Combos 3 hits', 'Agarrão', 'Ondas', 'Boss', 'Crates'],
      themeId: 'castelo',
      ready: true
    },
    {
      id: 'fighting',
      title: 'Luta 1x1',
      emoji: '👊',
      desc: 'Dois lutadores, rounds e barra de vida.',
      features: ['Rounds', 'Combos', 'VS'],
      themeId: 'castelo',
      ready: false
    },
    {
      id: 'survival',
      title: 'Survival',
      emoji: '🧟',
      desc: 'Recursos, inventário e ameaças.',
      features: ['Craft', 'Mapa', 'Noite'],
      themeId: 'floresta',
      ready: false
    },
    {
      id: 'tower-defense',
      title: 'Tower Defense',
      emoji: '🏰',
      desc: 'Torres, caminhos e ondas.',
      features: ['Torres', 'Upgrades', 'Waves'],
      themeId: 'neve',
      ready: false
    },
    {
      id: 'card-battle',
      title: 'Card Battle',
      emoji: '🃏',
      desc: 'Deck, turnos e efeitos.',
      features: ['Deck', 'IA', 'Turnos'],
      themeId: 'castelo',
      ready: false
    },
    {
      id: 'turn-rpg',
      title: 'RPG por Turnos',
      emoji: '🧙',
      desc: 'Party, atributos e batalha.',
      features: ['Party', 'Skills', 'Turnos'],
      themeId: 'caverna',
      ready: false
    },
    {
      id: 'puzzle',
      title: 'Puzzle',
      emoji: '🧩',
      desc: 'Desafios lógicos e fases.',
      features: ['Grid', 'Fases', 'Regras'],
      themeId: 'espaco',
      ready: false
    },
    {
      id: 'topdown-race',
      title: 'Corrida Top-Down',
      emoji: '🏁',
      desc: 'Corrida vista de cima.',
      features: ['Circuitos', 'IA', 'Voltas'],
      themeId: 'deserto',
      ready: false
    }
  ];

  function blankMap() {
    return Array.from({ length: 18 }, () => Array(32).fill(0));
  }

  function samplePlatformMap() {
    const m = blankMap();
    for (let x = 0; x < 32; x++) { m[16][x] = 2; m[17][x] = 2; }
    for (let x = 2; x < 8; x++) m[13][x] = 1;
    for (let x = 11; x < 17; x++) m[11][x] = 1;
    for (let x = 21; x < 27; x++) m[14][x] = 1;
    return m;
  }

  function buildProject(type) {
    const tpl = TEMPLATES.find(t => t.id === type) || TEMPLATES[0];
    const map = type === 'platform' ? samplePlatformMap() : blankMap();
    if (type === 'topdown') {
      for (let x = 0; x < 32; x++) for (let y = 0; y < 18; y++) {
        if (x === 0 || y === 0 || x === 31 || y === 17) map[y][x] = 3;
        else map[y][x] = 1;
      }
    }
    if (type === 'shooter') {
      for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) map[y][x] = 0;
    }

    let entities = [];
    let kartTrack = null;
    let settingsExtra = {};
    if (type === 'metroidvania') {
      settingsExtra = { metroidvania: true };
      entities = [{ id: 'player', type: 'player', name: 'Heroi', x: 48, y: 200, hp: 5 }];
    } else if (type === 'beat-em-up') {
      settingsExtra = { beatEmUp: { waves: null } };
      entities = [{ id: 'player', type: 'player', name: 'Lutador', x: 80, y: 200 }];
    } else if (type === 'kart-racing') {
      kartTrack = (window.KartTrack && window.KartTrack.generateDemoTrack()) || null;
      settingsExtra = { kart: { difficulty: 'normal' } };
      entities = [{ id: 'player', type: 'player', name: 'Piloto', x: 0, y: 0 }];
    } else if (type === 'platform') {
      entities = [
        { id: 'player', type: 'player', name: 'Player', x: 32, y: 200, hp: 3, speed: 120, jump: 300 },
        { id: 'enemy1', type: 'enemy', name: 'Inimigo', x: 220, y: 220, hp: 2, speed: 35 }
      ];
    } else if (type === 'topdown') {
      entities = [
        { id: 'player', type: 'player', name: 'Heroi', x: 64, y: 64, hp: 5, speed: 90 },
        { id: 'npc1', type: 'npc', name: 'Aldeão', x: 200, y: 100, dialog: 'Bem-vindo à vila!|Procure a chave no baú.|A porta ao norte está trancada.' },
        { id: 'chest1', type: 'chest', name: 'Baú', x: 280, y: 140, loot: 'key' },
        { id: 'door1', type: 'door', name: 'Porta', x: 400, y: 80, locked: true, event: 'nextScene' }
      ];
    } else {
      entities = [
        { id: 'player', type: 'player', name: 'Nave', x: 40, y: 130, hp: 5, speed: 160 },
        { id: 'wave1', type: 'spawner', name: 'Onda 1', x: 500, y: 80, count: 6, interval: 0.7, path: 'sine' },
        { id: 'wave2', type: 'spawner', name: 'Onda 2', x: 500, y: 200, count: 5, interval: 0.9, path: 'zigzag' },
        { id: 'boss1', type: 'enemy', name: 'Boss', x: 420, y: 120, hp: 40, maxHp: 40, boss: true, damage: 2, w: 32, h: 32 }
      ];
    }

    return {
      schemaVersion: 7,
      version: '7.0',
      gameType: type,
      name: 'Meu Jogo ' + tpl.title,
      settings: Object.assign({
        type: type,
        width: 512,
        height: 288,
        tileSize: 16,
        eightWay: true,
        shooter: type === 'shooter' ? { scrollDir: 'left', scrollSpeed: 30, shipSpeed: 160, fireRate: 0.18, bulletSpeed: 320 } : undefined
      }, settingsExtra || {}),
      scenes: [{
        id: 'scene1',
        name: 'Fase 1',
        themeId: tpl.themeId,
        map: map,
        layers: {
          background: blankMap(),
          ground: map.map(r => r.slice()),
          decoration: blankMap(),
          foreground: blankMap(),
          collision: null
        },
        entities
      }],
      currentScene: 'scene1',
      world: { nodes: {}, start: 'scene1' },
      variables: {},
      kartTrack: kartTrack
    };
  }

  function openWizard(A) {
    const m = document.getElementById('modal');
    const b = document.getElementById('modalBody');
    if (!m || !b) return;

    b.innerHTML =
      '<div class="wizard">' +
      '<h2>◆ Novo Projeto — Escolha o estilo</h2>' +
      '<p class="badge">Cada estilo tem física, controles, entidades e exportação próprios.</p>' +
      '<div class="wizardGrid" id="wizardGrid"></div>' +
      '</div>';

    const grid = document.getElementById('wizardGrid');
    TEMPLATES.forEach(tpl => {
      const card = document.createElement('button');
      card.className = 'wizardCard';
      card.innerHTML =
        '<div class="wizardEmoji">' + tpl.emoji + '</div>' +
        '<strong>' + tpl.title + '</strong>' +
        '<p>' + tpl.desc + '</p>' +
        '<ul>' + tpl.features.map(f => '<li>' + f + '</li>').join('') + '</ul>';
      if (tpl.ready === false) {
        card.style.opacity = '0.55';
        card.innerHTML += '<p class="badge">Em breve (0.9+)</p>';
      }
      card.onclick = () => {
        if (tpl.ready === false) {
          A.toast(tpl.title + ' em desenvolvimento — disponível em versão futura');
          return;
        }
        const p = buildProject(tpl.id);
        A.project = p;
        if (A.migrateProject) A.project = A.migrateProject(p);
        m.classList.add('hidden');
        A.renderAll();
        A.toast('Projeto ' + tpl.title + ' criado');
        if (window.SNESStudioUI && window.SNESStudioUI.refreshGameTypeUI) {
          window.SNESStudioUI.refreshGameTypeUI();
        }
      };
      grid.appendChild(card);
    });

    m.classList.remove('hidden');
  }

  function init() {
    const A = window.SNESStudio;
    if (!A) return;
    const btn = document.getElementById('newBtn');
    if (btn) {
      btn.onclick = () => openWizard(A);
    }
    window.ProjectWizard = { open: () => openWizard(A), buildProject, TEMPLATES };
  }

  addEventListener('snesstudio:ready', init);
  if (window.SNESStudio) init();
})();
