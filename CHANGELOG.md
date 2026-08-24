# SNES Engine Studio 1.0 Complete

- Concluída a integração runtime dos recursos Studio 1.0.
- Assets persistentes em IndexedDB + Data URL portátil.
- Eventos/Triggers executáveis.
- World chunks, colisão por chunk e streaming lógico.
- Inspector por componentes, Hierarquia, IA, Boss e Luzes.
- Sprites/Animações importados consumidos pelo runtime.
- Project schema 10 / version 1.0.
- Export pipeline regenerado a partir das fontes atuais.
- Profiler e validação ampliados.

# CHANGELOG

## 1.0 — Studio Workspace Update
- Nova interface Studio 1.0 com modo Simples e Avançado.
- Asset Browser com importação drag-and-drop e manifest `assets.json`.
- Biblioteca de Prefabs reutilizáveis e criação a partir da entidade selecionada.
- Editor visual de Eventos por gatilho/ação.
- Editor de animações com FPS, frames e loop.
- Configuração de mundo grande com dimensões lógicas e streaming por chunks.
- Painel avançado de câmera, dead-zone, look-ahead, pixel-perfect e shake.
- Camadas de Parallax configuráveis.
- Pré-visualização de iluminação e presets de partículas.
- Boss Designer com estrutura padrão de 3 fases.
- Overlay de debug para hitboxes e limites de chunks (atalho F3).
- Validador de projeto e limpeza de referências quebradas.
- Correção crítica: `ENEMY_VARIANTS` agora é exportado após sua declaração.
- Mantida compatibilidade com projetos 0.9 e runtimes existentes.

# Changelog — SNES Engine Studio

## 0.9 — Multi-Genre Update

### Kart (crítico)
- Checkpoints com ordem real (removido `|| true`)
- Aviso de checkpoint perdido
- Raio configurável por checkpoint
- Cópia da pista ao testar (não muta o projeto)
- Serialização RLE+base64 da estrada (Uint8Array)
- IndexedDB + fallback localStorage
- Track editor em cópia temporária (Aplicar / Cancelar)
- Objetos só no pointerdown (sem duplicar no drag)
- IA com RNG seedado (reproduzível)
- IA freia em curvas fechadas; throttle aplicado à física
- Respawn se preso fora da pista
- Posições de largada nunca undefined

### Novos gêneros
- **Metroidvania**: 5 salas, double jump, dash, chave, boss 3 fases, mapa, checkpoints
- **Beat 'em Up**: ondas, combo 3 hits, agarrão, especial, crates, boss, sort Y

### Sistema compartilhado
- `js/engine/combat/combat-core.js` — damage, hitbox, pool, combo, attack tokens
- `js/storage/project-store.js` — RLE track, IndexedDB

### Pré-existente mantido
- Plataforma, Action RPG, Shooter, Kart 2.5D, animações, áudio, atlas

## 0.8
- Kart Racing 2.5D, sprites ninja, atlas, audio manager, asset manager

## 0.7
- Sprite animation system

## 0.6 / V7
- Multi-runtime foundation

## 1.0 Complete — Player opcional integrado
- Adicionado spritesheet `assets/hero-blue-red-sheet.png` como Player opcional.
- Asset embutido no Studio para persistir também em exportação HTML.
- Preset **Herói Azul/Vermelho** no Inspector de entidades Player.
- Animações incluídas: Idle, Corrida e Ataque.
- Troca automática de animação no runtime conforme movimento/ataque.
- Tamanho visual padrão 32×48, mantendo collider independente.

## 1.0 — Exportador ROM SNES real
- Substituído o botão de pacote SNES por `ROM SNES (.sfc)`.
- Novo compilador binário LoROM no navegador, sem assembler externo.
- Header/vetores 65C816, PPU, VRAM, CGRAM, OAM e auto-joypad implementados.
- Cena atual convertida para tilemap/paleta SNES e player controlável por D-pad.
- Validação/avisos explícitos para recursos ainda não portados ao runtime nativo.
- HTML export permanece separado e inalterado.

## 1.0 - Built-in Pixel Tile Packs
- Added user-provided Terrain/Nature pixel tilesheet as built-in `Natureza Pixel` theme.
- Added user-provided platform/environment tilesheet as built-in `Plataformas Pixel` theme.
- Added embedded sheet cache/renderer (`js/builtin-tiles-data.js`).
- Tile rendering now supports source rectangles from image atlases in editor and game runtimes.
- HTML export embeds the built-in sheets so exported games keep the selected visual tiles.
- Cleaned the checkerboard background from the terrain sheet for in-engine use.

## 1.0 Game Complete
- Novo `js/game/game-flow.js`.
- Splash, menu principal, Novo Jogo, Continuar e slots de save.
- Intro, campanha, objetivos por cena, HUD global e progresso.
- Pause real com salvar/reiniciar/opções/menu.
- Game Over, Victory, Ending e Credits.
- Opções, fullscreen, pixel-perfect e tela de controles.
- Novo painel `🎮 Jogo Completo` no Studio.
- Novo botão `🎮 JOGAR JOGO`, separado do teste de cena.
- Exportação HTML passa a iniciar pelo Game Flow completo.

## 1.0 usability fix — Player e Tiles
- Player Visual agora pode ser escolhido diretamente em Entidades.
- Herói Azul/Vermelho e imagens importadas podem ser aplicados sem abrir o Inspector avançado.
- Sprite escolhido aparece também no canvas do editor.
- Runtimes deixam de desenhar o placeholder por baixo de um Player com sprite personalizado.
- Mapa ganhou seletor direto de Tileset acima da paleta.
- Tiles da tela Tilesets agora são clicáveis e retornam ao mapa prontos para pintar.
- Export sources regeneradas após os ajustes de runtime.

## 1.0 Stabilized — 2026-08-23
- Project Wizard corrigido para schema 10 / versão 1.0.
- Adicionado Event Bus central.
- Adicionada RuntimeSession isolando projeto e estado de jogo.
- Game Flow sem polling de vitória/derrota.
- Remapeamento real de teclado e movimento.
- Preferências persistentes separadas dos saves.
- Dificuldade passa a modificar o runtime.
- HUD/Game Over/Vitória duplicados ocultados quando Game Flow está ativo (Platform/Topdown/Shooter).
- Componentes normalizados/sincronizados durante runtime.
- Flags de eventos sincronizadas ao estado da sessão.
- Export sources atualizados automaticamente com os novos módulos.
- Validador ampliado.
- Testes automatizados e smoke test de browser adicionados.

## 1.0 Production Completion — 23/08/2026
- Adicionada aba Produção com Cutscene Timeline, Visual UI Designer, Tile Cutter, Prefab Overrides e Hierarquia de produção.
- Intro e Ending podem usar timelines temporizadas executadas pelo Game Flow.
- Menu principal recebe tema visual, background por asset e posicionamento configurável.
- Tiles personalizados por asset/source rectangle funcionam no editor e no HTML exportado.
- Prefabs passam a preservar overrides durante sincronização.
- Seleção múltipla, grupo, copiar/colar, duplicar e excluir entidades.
- Testes de regressão ampliados para 9 verificações unitárias + smoke test Chromium.

## 1.0 Production Complete — Correções de integração (23/08/2026)
- Cutscenes associadas a cenas passam a executar antes do gameplay da cena.
- Proteção contra recursão ao terminar uma cutscene de cena.
- Reimportação de asset com mesmo nome preserva o ID existente e não quebra referências.
- Exclusão de asset agora detecta uso e limpa referências em entidades, animações, parallax, menu e tiles personalizados.
- Assets internos/builtin não podem ser apagados acidentalmente.
- Tile Cutter limita colunas/linhas ao tamanho real da imagem para impedir source rectangles inválidos.
- Paleta customizada é ressincronizada ao trocar/carregar projeto.
- Suíte de estabilidade ampliada para 12 verificações unitárias + smoke test de boot.

## 1.0 Consolidation (2026-08-24)
- Arquitetura canônica, preload corrigido, EntityWorld, state machine, storage, commands, dependency graph, animator, autotile, collision layers, logger/profiler, recovery e avanço SNES 4bpp.

## 1.0 Integrated
- TileMap chunked canônico integrado.
- GameFlow ligado ao GameStateMachine e StorageHub.
- EntityWorld ligado às entidades reais do runtime.
- Components sincronizados nas bordas de frame.
- AnimatorController ativo para entidades com controller e para o herói embutido.
- AutoTile bitmask ligado ao editor.
- CommandManager ligado ao Undo/Redo principal.
- Câmera e parallax corrigidos no pipeline de gameplay.
- Collision Layers integradas ao AABB quando aplicável.
- Prefab spawn usa EntityWorld.
- Corrigido `markDirty(s.layers...)` com `s` inexistente no editor V4.
- 20 testes de estabilidade + 8 testes de integração passando.

## 1.0 Final Integration
- Components agora usam accessors vivos e são a fonte de verdade.
- Corrigida prioridade AnimatorController > animação fixa do SpriteRenderer.
- EntityWorld passou a agregar coleções específicas dos gêneros.
- Storage de editor/slots/controles/recovery centralizado no SNESStorage.
- CommandManager ganhou registro de mutações já aplicadas e agrupamento no fluxo legado.
- DependencyGraph recursivo e Profiler por sistemas.
- 26 testes de estabilidade + 11 de integração passando.
