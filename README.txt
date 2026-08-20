SNES ENGINE STUDIO 0.6 — ENGINE UNIFICADA
==========================================

COMO ABRIR
1. Extraia o ZIP inteiro mantendo a estrutura de pastas.
2. Dê dois cliques em index.html (funciona em file://, sem servidor).
3. Não remova as pastas css/, js/ e assets/.

ESTRUTURA
- index.html
- css/studio.css
- js/core.js                 — projeto, temas, editor base, exportação
- js/editor-v4.js            — camadas reais, auto-tile, balde, seleção
- js/gameplay-v5.js          — botões Caveira/Boss/Porta/Checkpoint/Baú
- js/creation-v6.js          — World Map, slots de save, import/export JSON
- js/ui-enhancements.js      — UX, atalhos, modal, autosave
- js/skeleton-sprite.js      — animações da Caveira Espadachim
- js/skeleton-data.js        — spritesheet embutida (offline)
- js/runtime/runtime.js      — runtime UNIFICADO (física, IA, combate, HUD)
- js/runtime/runtime-src.js  — blob do runtime para embutir no HTML exportado
- assets/skeleton.png

CONTROLES DO EDITOR
- Clique: pintar tile na camada ativa
- Botão direito: apagar tile
- Balde: preenche a partir do clique
- Auto-tile: aplica regras de superfície/miolo (só tiles 1–2; especiais ≥3 preservados)
- AT: auto-tile automático ao pintar
- B/G/F: mostrar/ocultar camadas Fundo/Terreno/Frente
- 🔒: bloquear camada ativa
- Ctrl+S salvar · Ctrl+Z desfazer · Ctrl+Y refazer
- 1–5 painéis · Tab menu · ? ajuda · Esc fecha modal / para teste

CONTROLES DO JOGO (Testar e HTML exportado)
- Setas / A D : mover
- Z / Espaço  : pular (coyote time + jump buffer)
- X / C       : atacar
- E / Enter   : ação (NPC, baú)
- Esc         : parar teste (só no editor)
- Touch (mobile no HTML): ◀ ▶ A B X

CAMADAS
Cada cena possui layers.background, layers.ground, layers.foreground.
Colisão usa apenas a camada ground.
Todas as camadas são desenhadas juntas (camada inativa com transparência).
Projetos antigos (V2/V3/V6/V6.2) são migrados automaticamente.

RUNTIME UNIFICADO
O botão Testar e o HTML exportado usam o mesmo código (js/runtime/runtime.js):
física, colisão, player, inimigos (patrulha/perseguição/ataque), projéteis,
itens, portas, baús, checkpoints, HUD, troca de fase.
O teste NÃO altera permanentemente as entidades do editor (usa snapshot).

CAVEIRA ESPADACHIM
Estados: idle, walk, run, attack, hurt, death.
Respeita plataformas e paredes. Patrulha, persegue e ataca.
Todas as animações funcionam no Testar e no HTML exportado.

EXPORTAÇÃO HTML
- Arquivo único, offline, sem CDN.
- Inclui runtime, temas, cenas, sprites da Caveira, controles touch e save do jogador.
EXPORTAÇÃO SNES
- Pacote com project.json, mapas, themes, game.asm (template 65816) e HTML.
- NÃO gera ROM .sfc pronta; requer toolchain externa (ca65/WLA etc.).

MODOS DE JOGO
- Plataforma: suportado.
- Top-down / Shooter / Arcade: marcados como "em desenvolvimento".

BUGS CORRIGIDOS NA 0.6
- Botão Fechar do modal não fazia nada
- Camadas falsas (só uma visível por vez via troca de ponteiro)
- Auto-tile destrutivo (convertia tudo em 1/2)
- Balde sempre preenchia a partir de (0,0)
- Dois requestAnimationFrame concorrentes no teste
- Entidades mutadas permanentemente durante o teste (dead, vx…)
- HTML exportado com gameplay simplificado e Caveira só em idle
- Sem colisão de inimigos com o cenário
- Tipos de jogo não-plataforma sem aviso
- URL.createObjectURL revogado corretamente (já ok)

LIMITAÇÕES CONHECIDAS / FUTURO
- Editor visual completo de eventos estilo RPG Maker (estrutura básica via entidades)
- World Map com arrastar nós e conexões gráficas (lista funcional existe)
- Importador avançado de spritesheets irregulares
- Gamepad mapping completo
- Top-down / shooter / arcade runtimes
- Compilação real para ROM SNES

MIGRAÇÃO
Ao carregar projetos antigos: themeId padrão, layers criadas a partir de map,
versão atualizada para 0.6. Backup manual recomendado antes de migrar saves grandes.
