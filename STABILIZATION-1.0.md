# SNES Engine Studio 1.0 — Stabilized Build

Esta build concentra a estabilização da arquitetura 1.0.

## Corrigido nesta build

- Project Wizard cria projetos diretamente em schemaVersion 10 / version 1.0.
- RuntimeSession: Jogar Jogo usa uma cópia de execução; Novo Jogo, saves, flags e alterações do gameplay não modificam o projeto aberto no editor.
- Event Bus central (`SNESEvents`) e callbacks de ciclo do Engine.
- Game Flow deixou de consultar vitória/derrota por polling de 120 ms; agora recebe eventos/callbacks do Engine.
- Controles realmente remapeáveis durante o jogo, incluindo movimento (left/right/up/down), ações e pause.
- Preferências de controles, música, SFX, dificuldade e pixel-perfect persistem separadamente dos saves de campanha.
- Dificuldade agora tem efeito de runtime: Easy/Hard aplicam modificadores de HP/dano em uma sessão clonada.
- HUD/Game Over/Vitória nativos de Platform, Topdown e Shooter são ocultados quando o Game Flow fornece a UI externa, evitando duplicação visual.
- Ponte de componentes central (`SNESEntityComponents`) e normalização consistente para Transform, Health, Combat, AI e SpriteRenderer.
- StudioRuntime sincroniza valores alterados em runtime de volta aos componentes da sessão.
- Flags disparadas por eventos são sincronizadas com o estado salvo da sessão.
- Exportador HTML recebe EventBus, RuntimeSession e EntityComponents e é regenerado a partir das fontes atuais.
- Validador ganhou verificações de schema, Game Flow, campanha, conflitos de controles e divergências legado/componentes.
- Suíte de testes adicionada em `tests/run-all.sh`.

## Arquitetura resultante

ProjectDefinition (editor)
→ RuntimeSession (clone)
→ Engine
→ Runtime do gênero
→ StudioRuntime / Components
→ EventBus
→ GameFlow / HUD / Save

O projeto de edição não é mais usado diretamente como estado mutável da partida completa.

## Ainda não é considerado concluído

- Remoção completa de `editor-v4.js`, `gameplay-v5.js` e `creation-v6.js`: eles ainda possuem dependências funcionais do editor atual. A build estabiliza a convivência, mas a remoção exige migração modular dedicada.
- Editor visual de Cutscene com timeline completa.
- Editor visual livre de Menu/Pause/HUD (o runtime é configurável, mas ainda usa layouts padronizados).
- Prefab override/herança no nível de engines como Unity/Godot.
- Conversor SNES de PNG/tiles/sprites/animações/áudio com paridade total com o runtime HTML.
- Runtime `.sfc` ainda é experimental em comparação com o jogo HTML completo.

## Testes

Execute:

```bash
./tests/run-all.sh
```

A suíte valida sintaxe JavaScript, schema, EventBus, isolamento de sessão, dificuldade, sincronização do export bundle e boot básico em Chromium headless.
