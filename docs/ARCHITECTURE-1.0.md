# SNES Engine Studio 1.0 — Arquitetura consolidada

A build mantém os adaptadores V4/V5/V6 apenas por compatibilidade de projetos antigos, mas novos sistemas usam as APIs canônicas abaixo.

- `SNESProjectModel`: schema 10, UUIDs e migração.
- `SNESRuntimeSession`: cópia isolada do projeto para gameplay.
- `SNESEntityWorld`: API central de entidades.
- `SNESEntityComponents`: componentes canônicos; campos legados são adaptadores.
- `SNESGameStateMachine`: estados de fluxo de jogo.
- `SNESStorage`: projetos, saves, preferências e assets separados.
- `SNESCommands`: undo/redo por comandos.
- `SNESDependencyGraph`: referências de assets.
- `SNESAnimatorController`: states/transitions/eventos por frame.
- `SNESAutotile`: bitmask 4/8 direções.
- `SNESCollisionLayers`: layers/masks.
- `SNESLogger` / `SNESProfiler`: diagnóstico estruturado.
- `SNESRecovery`: autosave/crash recovery.
- `SNESSnesAssetCompiler`: primitivas para assets 4bpp de SNES.

A remoção física dos adaptadores antigos fica condicionada à migração integral dos seis runtimes; removê-los sem essa etapa quebraria projetos antigos.
