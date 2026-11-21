/* Integração inspirada no GameForge: pedido leigo PT-BR -> configurações verificáveis.
 * Sem IA remota, eval, execução do texto, assets inventados ou mudanças no runtime.
 * Sempre distingue configurações aplicadas de funcionalidades pendentes.
 */
(function (root) {
  'use strict';
  const SUPPORTED = ['platform', 'topdown', 'shooter', 'kart-racing', 'metroidvania', 'beat-em-up'];
  const GENRES = [
    ['metroidvania', /\b(metroidvania|castlevania|exploracao lateral)\b/],
    ['beat-em-up', /\b(beat.?em.?up|briga de rua|luta de rua|final fight)\b/],
    ['kart-racing', /\b(kart|corrida de kart|corrida de carros|pista de corrida)\b/],
    ['shooter', /\b(shoot.?em.?up|shmup|jogo de nave|nave espacial|navinha|navina)\b/],
    ['topdown', /\b(action rpg|rpg de acao|top.?down|visao de cima|visao superior|rpg)\b/],
    ['platform', /\b(plataforma|platafoma|platformer|pular entre plataformas|super mario)\b/]
  ];
  const THEMES = [
    ['espaco', /\b(espaco|espacial|galaxia)\b/], ['floresta', /\b(floresta|selva)\b/],
    ['deserto', /\b(deserto|areia)\b/], ['neve', /\b(neve|gelo)\b/],
    ['vulcao', /\b(vulcao|lava)\b/], ['castelo', /\b(castelo|medieval)\b/],
    ['caverna', /\b(caverna|subterraneo)\b/], ['agua', /\b(oceano|mar|submarino|aquatico)\b/]
  ];
  const NUMBERS = {um:1, uma:1, dois:2, duas:2, tres:3, quatro:4, cinco:5, seis:6,
    sete:7, oito:8, nove:9, dez:10, onze:11, doze:12, quinze:15, vinte:20};
  const NUMBER = '(\\d{1,3}|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|quinze|vinte)';
  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/\b(?:qro|keru)\b/g, 'quero')
      .replace(/\bplatafomra\b/g, 'plataforma')
      .replace(/\b(?:inimigu|inimigus)\b/g, 'inimigos')
      .replace(/\b(?:shefe|xefe)\b/g, 'chefe');
  }
  function number(value) {
    if (!value) return null;
    const v = normalize(value);
    const n = /^\d+$/.test(v) ? Number(v) : NUMBERS[v];
    return Number.isSafeInteger(n) && n >= 0 ? n : null;
  }
  function extractCount(text, noun) {
    const pre = new RegExp('\\b' + NUMBER + '\\s+(?:' + noun + ')\\b');
    const post = new RegExp('\\b(?:' + noun + ')\\s*(?::|=|de|com)\\s*' + NUMBER + '\\b');
    const first = text.match(pre);
    const second = text.match(post);
    return number(first ? first[1] : second ? second[1] : null);
  }
  function titleFrom(input) {
    const hit = input.match(/\b(?:chamad[oa]|nomead[oa]|t[ií]tulo)\s*(?::|=)?\s*["“']([^"”']{2,75})["”']/i);
    return hit ? hit[1].replace(/[<>&]/g, '').trim().slice(0,75) : null;
  }
  function compile(input) {
    const source = String(input || '').trim();
    if (!source) throw new Error('Descreva o jogo antes de analisar.');
    if (source.length > 4000) throw new Error('Descrição longa demais: máximo de 4.000 caracteres.');
    const t = normalize(source);
    const applied = [], pending = [], warnings = [];
    const matches = GENRES.filter(([, pattern]) => pattern.test(t)).map(([id]) => id);
    const genre = matches.length === 1 ? matches[0] : null;
    if (!matches.length) pending.push('Indique um gênero compatível: plataforma, action RPG, nave, kart, metroidvania ou beat em up.');
    if (matches.length > 1) pending.push('Há mais de um gênero na descrição; escolha um estilo principal.');
    const unsupported3D = /\b(3\s*d|tres dimensoes|primeira pessoa|fps de acao|minecraft)\b/.test(t);
    if (unsupported3D) pending.push('Jogos 3D/FPS/Minecraft não são gerados por este assistente SNES 2D.');
    if (genre) applied.push('Modelo jogável: ' + genre);
    const title = titleFrom(source);
    if (title) applied.push('Título: ' + title);
    const phaseRaw = extractCount(t, 'fases?|niveis?|levels?');
    const phases = phaseRaw === null ? 1 : Math.max(1, Math.min(12, phaseRaw));
    if (phaseRaw !== null) {
      applied.push('Campanha com ' + phases + ' fase(s)');
      if (phaseRaw !== phases) warnings.push('Limite de 1 a 12 fases; quantidade ajustada.');
    }
    const theme = (THEMES.find(([, pattern]) => pattern.test(t)) || [null])[0];
    if (theme) applied.push('Tema visual: ' + theme);
    const enemyRaw = extractCount(t, 'inimigos?|monstros?');
    const noEnemies = /\b(sem|nenhum|zero|0)\s+(?:inimigos?|monstros?)\b/.test(t);
    const enemies = noEnemies ? 0 : enemyRaw === null ? null : Math.max(0, Math.min(12, enemyRaw));
    if (enemyRaw !== null && enemyRaw !== enemies && !noEnemies) warnings.push('Limite de 12 inimigos por fase/onda.');
    if (enemies !== null) {
      if (genre === 'kart-racing') pending.push('Contagem de inimigos não se aplica ao Kart Racing.');
      else if (genre === 'shooter') applied.push(enemies + ' inimigos por onda existente de naves');
      else if (genre) applied.push(enemies + ' inimigos comuns por fase');
    }
    let difficulty = null;
    if (/\b(mais dificil|dificuldade dificil|dificuldade alta|hardcore)\b/.test(t)) difficulty = 'hard';
    else if (/\b(mais facil|dificuldade facil|dificuldade baixa)\b/.test(t)) difficulty = 'easy';
    if (difficulty) applied.push('Preferência de dificuldade do projeto: ' + difficulty);
    const routes = root.SNESStageRoutes?.parse?.(source) || null;
    const physical = root.SNESPhysicalForks?.parse?.(source,routes) || null;
    if (physical) {
      if (['platform','topdown'].includes(genre) && !unsupported3D) {
        applied.push(physical.choices.length+' rotas físicas no mesmo mapa, com obstáculos, checkpoints e saídas');
        if (physical.secret) applied.push('Corredor secreto desbloqueável no mapa');
      } else {
        pending.push('Bifurcações físicas no mesmo mapa disponíveis apenas em Plataforma e Action RPG/Top-down.');
      }
    } else if (routes) {
      if (root.SNESStageRoutes?.SUPPORTED?.includes(genre) && !unsupported3D) {
        applied.push(routes.choices.length + ' caminhos por fase com inimigos e recompensas diferentes');
        if (routes.secret) applied.push('Passagem secreta desbloqueável');
      } else {
        pending.push('Caminhos alternativos ainda não funcionam nesse gênero; requer implementação específica.');
      }
    }
    const unsupported = [
      [/\b(multiplayer|online|coop)\b/, 'Multiplayer/online'],
      [/\b(crafting|fabricacao de itens)\b/, 'Crafting'],
      [/\b(mundo aberto|mundo infinito)\b/, 'Mundo aberto/infinito'],
      [/\b(arvore de habilidades|skill tree)\b/, 'Árvore de habilidades automática'],
      [/\b(shaders?|ray tracing)\b/, 'Shaders avançados'],
      [/\b(cutscene cinematica|cinematica automatica)\b/, 'Cutscene automática']
    ];
    for (const [pattern, label] of unsupported) if (pattern.test(t)) pending.push(label + ' exige edição/implementação adicional.');
    if (/\b(boss|chefao|chefe)\b/.test(t) && genre && genre !== 'shooter') {
      pending.push('Chefe específico não é criado automaticamente; configure-o no editor.');
    }
    return {version:1, source, genre, supported:!!genre && SUPPORTED.includes(genre) && !unsupported3D,
      title, phases, theme, enemies, difficulty, routes, physical, applied, pending, warnings};
  }
  function apply(project, plan) {
    if (!project || !Array.isArray(project.scenes) || !project.scenes.length ||
        !plan || !plan.supported || !SUPPORTED.includes(plan.genre) ||
        project.gameType !== plan.genre) throw new Error('Projeto ou gênero incompatível.');
    if (plan.title) project.name = plan.title;
    const first = project.scenes[0];
    const template = JSON.stringify(first);
    project.scenes = Array.from({length: Math.max(1, Math.min(12, plan.phases || 1))}, (_, i) => {
      const scene = JSON.parse(template);
      scene.id = 'scene' + (i + 1);
      scene.name = 'Fase ' + (i + 1);
      if (plan.theme) scene.themeId = plan.theme;
      if (plan.enemies !== null && plan.enemies !== undefined && plan.genre !== 'kart-racing') {
        if (plan.genre === 'shooter') {
          for (const entity of scene.entities || []) if (entity.type === 'spawner') entity.count = plan.enemies;
        } else {
          scene.entities = (scene.entities || []).filter(entity => entity.type !== 'enemy' || entity.boss);
          for (let n = 0; n < plan.enemies; n++) {
            const isTopdown = plan.genre === 'topdown';
            scene.entities.push({id:'brief_enemy_' + (i + 1) + '_' + (n + 1),
              type:'enemy',name:'Inimigo ' + (n + 1),
              x: isTopdown ? 112 + (n % 5) * 72 : 144 + (n % 5) * 68,
              y: isTopdown ? 90 + Math.floor(n / 5) * 48 : 210 + (n % 2) * 8,
              hp:2, speed:35});
          }
        }
      }
      return scene;
    });
    project.currentScene = 'scene1';
    project.world = {nodes:{}, start:'scene1'};
    project.game = project.game || {};
    project.game.campaign = project.scenes.map(scene => scene.id);
    if (plan.physical && ['platform','topdown'].includes(plan.genre) && root.SNESPhysicalForks) {
      root.SNESPhysicalForks.build(project,plan.physical);
    } else if (!plan.physical && plan.routes && root.SNESStageRoutes?.SUPPORTED?.includes(plan.genre)) {
      root.SNESStageRoutes.build(project, plan.routes);
    }
    if (plan.difficulty) {
      project.game.settings = project.game.settings || {};
      project.game.settings.difficulty = plan.difficulty;
    }
    project.studio = project.studio || {};
    project.studio.gameforgeBrief = {
      version:1, source:plan.source, applied:plan.applied.slice(),
      pending:plan.pending.slice(), warnings:plan.warnings.slice()
    };
    return project;
  }
  const api = {compile, apply, normalize};
  root.SNESGameForgeBrief = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
