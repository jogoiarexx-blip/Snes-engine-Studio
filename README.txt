SNES ENGINE STUDIO 0.9 — MULTI-GENRE
====================================

ABRIR
1. Extraia o ZIP.
2. Dois cliques em index.html (file://).
3. Mantenha css/, js/, assets/ juntos.

GÊNEROS JOGÁVEIS
1. Plataforma
2. Action RPG (top-down)
3. Shoot 'em Up
4. Kart Racing 2.5D
5. Metroidvania (NOVO)
6. Beat 'em Up (NOVO)

NOVO PROJETO → escolha o gênero → TESTAR

KART 0.9
- Checkpoints em ordem (sem atalho)
- Pista serializada RLE (sem corromper Uint8Array)
- Teste não altera o projeto
- Track Editor: cópia + Aplicar
- IA com seed + freio em curva
- Respawn se preso

METROIDVANIA
- 5 salas + segredo
- Pulo duplo, dash
- Boss 3 fases, chave, checkpoints
- Controles: setas · Z pula · X ataca · C dash · E porta

BEAT 'EM UP
- Profundidade Y, combo, agarrão, especial
- 3 ondas + boss, crates, itens
- Controles: setas · X combo · C especial · E agarrão

ARQUITETURA
js/engine/     core, combat, audio, atlas, assets
js/runtimes/   platform, topdown, shooter, metroidvania, beat-em-up
js/genres/kart-racing/
js/storage/project-store.js
js/editor/

DOCS
CHANGELOG.md · TEST-REPORT.md · MIGRATION.md

LIMITAÇÕES
Ver TEST-REPORT.md seção Incomplete.
Não gera ROM SNES real.


UPGRADES & HABILIDADES
- Botão ⬆ no editor ou tecla I no jogo (MV / Beat'em Up)
- Habilidades de mundo: pulo duplo, dash, wall jump (mapa)
- Upgrades compráveis com pontos (força, vida, crítico, velocidade…)
- Pontos ao abater inimigos e limpar ondas
- Persistidos em project.upgrades (save/export)


INVENTÁRIO
- Botão 🎒 no editor · tecla I no jogo
- Consumíveis: poções (Q usa poção rápida), éter, antídoto
- Chaves no inventário (portas)
- Equipamentos: anéis, botas, amuleto, armas
- Loot de inimigos/crates (moedas, gemas, itens)
- Gemas → pontos de upgrade no painel
- 4 pedaços de coração = +1 vida máx
- Persistido em project.inventory


EDITOR — ESTILOS E COLOCAÇÃO (0.9)
- Seletor de tema na barra de ferramentas e no painel Mapa
- Aba Tilesets: clique no tema para aplicar
- Para colocar item/inimigo/objeto: escolha no painel e CLIQUE NO MAPA
- Esc cancela o modo de colocação
- Itens rápidos: moeda, coração, chave, checkpoint, porta
- Objetos e inimigos na aba Tilesets são clicáveis


RENDER CANVAS 2D (0.9)
- js/engine/render-cache.js
- Cache offscreen por camada de tiles
- Atlas de tiles pré-rasterizado
- Dirty flags: só re-bake quando a camada muda
- imageSmoothing desligado · contexto desynchronized
- F3 no play: mostra FPS


WEB WORKERS (carregamento)
- js/engine/load-worker-host.js
- Worker via Blob (offline / file://)
- parseJSON, RLE encode/decode, prepareProject em background
- loadAssets com concorrência limitada
- Fallback automático na main thread se Worker falhar
- Import de JSON de projeto usa worker quando disponível


MONITOR WORKER (memória)
- F4: overlay de memória do worker
- SNESLoadWorker.getStats() / sampleMemory()
- Exibe: heap worker, heap main, jobs, pending, bytes in/out
- performance.memory só em Chromium; outros mostram n/a
