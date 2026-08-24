# SNES Engine Studio 1.0 — Final Integration

Esta rodada fecha os principais pontos que ainda estavam parcialmente implantados no runtime HTML/editor.

## Corrigido e integrado

- AnimatorController agora publica `runtimeAnimationId`, que tem prioridade sobre a animação fixa do SpriteRenderer.
- Components virou a fonte de verdade para Transform, Health, Combat, Movement, AI e SpriteRenderer. Campos legados (`x`, `hp`, `damage`, `speed`, `spriteAsset`, `animationId`) são accessors vivos para Components, não cópias independentes.
- EntityWorld agrega as coleções específicas dos runtimes (`enemies`, `items`, `projectiles`, `bullets`, `pickups`, `npcs`) e oferece query única.
- CommandManager ganhou `recordApplied` e o `pushHistory()` principal agrupa mutações síncronas em uma transação de undo/redo.
- Saves do editor, slots, controles e recovery passam pelo gateway `SNESStorage` quando disponível.
- DependencyGraph foi ampliado para rastrear referências de assets recursivamente em projeto, prefabs, cutscenes, UI e outros dados.
- Profiler ganhou spans por sistema (camera, chunks, animation, events, bossAI, particles, shake).
- Export sources foram regenerados com as fontes atuais.

## Validação

- 26 testes de estabilidade: PASS
- 11 testes de integração: PASS
- Sintaxe de todos os JavaScripts: PASS
- Rebuild do exportador: PASS
- Chromium boot smoke: PASS

## Compatibilidade legada

`editor-v4.js`, `gameplay-v5.js` e `creation-v6.js` continuam carregados apenas como adaptadores de interface para ferramentas antigas que ainda existem na tela. O estado canônico é mantido nas APIs 1.0 (Components, EntityWorld, TileMap, Storage, Game Flow). Remover fisicamente esses arquivos nesta build quebraria partes da UI antiga; por isso eles permanecem como compatibilidade e não como nova fonte de verdade.

## SNES

A exportação `.sfc` continua marcada como Experimental. A ROM é real/inicializável, mas a paridade total do runtime HTML (IA completa, Game Flow, cutscenes, áudio SPC/BRR, SRAM e todos os assets) exige implementação nativa adicional em 65C816/SPC700.
