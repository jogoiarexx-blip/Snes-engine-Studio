# SNES Engine Studio 1.0 — Consolidation Build

Esta build consolida a arquitetura sem remover adaptadores legados que ainda são necessários aos seis runtimes antigos.

## Corrigido

- `ProjectModel` canônico: schema 10, versão 1.0.0 e ID de projeto independente do nome.
- `ProjectStore` passa pelo migrador canônico ao carregar e garante UUID ao salvar.
- `RuntimeSession` continua isolando gameplay do projeto aberto.
- `EntityWorld` central para spawn/query/destroy de entidades.
- `spriteRenderer` passa a ser o componente canônico; `components.sprite` é migrado.
- Layers/masks de colisão e seletor de Collision Layer no Inspector.
- Game State Machine disponível para estados determinísticos.
- Storage Hub separa projetos, savegames, preferências e assets.
- Command Manager para Undo/Redo por comandos.
- Dependency Graph para rastrear quem usa cada asset.
- Animator Controller com estados, transições e eventos por frame.
- Autotile bitmask 4/8 direções.
- Logger e Profiler estruturados.
- Autosave/Crash Recovery a cada 60 s, blur e beforeunload.
- Painel “Arquitetura” com validação, dependências, profiler e recuperação.
- `asset-preload.js` foi refeito: o arquivo anterior estava estruturalmente corrompido apesar de passar no parser.
- Preload agora inclui assets do projeto e publica `assets:ready` / `asset:error`.
- Export HTML deixa de usar polling para detectar o runtime; usa `runtime:started`.
- Build do exportador inclui as novas APIs canônicas.
- Export SNES renomeado para Experimental para não prometer paridade inexistente.
- SNES agora tenta compilar os pixels dos tiles do tema atual para paleta + tiles 4bpp reais; faz fallback para os blocos simplificados se a imagem não puder ser lida.
- `SNESSnesAssetCompiler` inclui conversão 4bpp, BGR15 e deduplicação de tiles.
- Script único `tools/build-all.sh` reconstrói fontes e executa a suíte.

## Compatibilidade

Os arquivos `editor-v4.js`, `gameplay-v5.js` e `creation-v6.js` permanecem carregados como adaptadores de compatibilidade. Removê-los agora quebraria rotinas ainda chamadas pelos runtimes/editor antigo. A arquitetura nova foi colocada como fonte canônica; a remoção física deve ocorrer apenas depois de portar integralmente os seis gêneros.

## Limite real da ROM SNES

A ROM é inicializável e agora aproveita melhor os tiles reais, porém a paridade de múltiplas cenas, IA completa, Game Flow, cutscenes, áudio SPC/BRR e save SRAM ainda exige implementação nativa 65C816/SPC700. A UI deixa isso explícito como `SNES Experimental`.
