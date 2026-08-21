# SNES Engine Studio 1.0 — Relatório de validação

## Resultado

- Sintaxe: todos os arquivos JavaScript passaram em `node --check`.
- Runtime compartilhado: teste de Trigger/Event, flag, camera shake, chunks ativos e spawn por prefab passou.
- Export pipeline: `export-sources.js` foi regenerado a partir das fontes atuais e contém 25 módulos; `studioRuntime` está presente e o Engine exportado chama a camada Studio 1.0.
- Assets: importação agora gera Data URL persistente e também grava no IndexedDB (`SNESAssetDB`).
- Schema: ProjectStore e projeto-base usam `schemaVersion: 10` / `version: 1.0`.

## Recursos conectados ao runtime

- Eventos e triggers
- Ações de diálogo, flags, portas, teleporte, cura/dano, checkpoint, shake, partículas, ambient light, spawn e vitória
- Streaming lógico de entidades por chunks
- Colisão com chunks de tilemap
- Câmera com configuração do Studio
- Partículas
- Luz ambiente e point lights
- Bosses com fases e ataques reutilizáveis
- Sprites importados e animações por spritesheet
- Profiler em runtime
- Prefabs vinculados e sincronizáveis

## Editor

- Inspector por componentes
- Scene Hierarchy
- Trigger Editor
- AI presets
- Boss Designer
- Point Light editor
- World Navigator
- Edição de tile chunks 512×288 dentro de mundos maiores
- Minimap lógico do mundo

## Observação do teste gráfico

O Chromium headless disponível neste ambiente não concluiu a captura de tela por limitações do processo/DBus do container. Por isso, a validação final automática é estrutural e de runtime, não uma aprovação pixel-a-pixel da interface. O carregamento deve ser conferido também abrindo `index.html` em Chrome/Edge no computador.
