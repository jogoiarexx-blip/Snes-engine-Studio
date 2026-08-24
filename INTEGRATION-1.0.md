# SNES Engine Studio 1.0 — Integração real

Esta build liga os módulos de consolidação ao fluxo principal da engine.

## Integrações concluídas
- `SNESTileMap` passa a ser o modelo canônico de tilemap/chunks, mantendo aliases `scene.map`, `scene.layers` e `scene.chunks` somente para compatibilidade.
- `SNESEntityWorld` usa a coleção real de entidades do runtime.
- `SNESEntityComponents` sincroniza os runtimes legados nas bordas de frame; os componentes são a representação canônica para Transform, SpriteRenderer, Health, Combat, Movement, AI e Collider.
- `SNESAnimatorController` é atualizado pelo StudioRuntime; o Herói Azul/Vermelho usa controller real para Idle/Run/Attack.
- `SNESGameStateMachine` é usado pelo Game Flow em Splash/Menu/Slots/Gameplay/Pause/Options/Controls/GameOver/Victory/Cutscene/Ending/Credits.
- Game saves e preferências do Game Flow passam pelo `SNESStorage`.
- `SNESAutotile` é chamado pelo editor de camadas e aceita rule maps por bitmask, com fallback para temas antigos.
- Undo/Redo principal é roteado pelo `CommandManager`, preservando compatibilidade com as ações antigas baseadas em `pushHistory()`.
- Câmera real aplicada ao render de Plataforma/Topdown/Shooter em mundos maiores, com HUD em screen-space.
- Parallax é efetivamente desenhado no pipeline de render.
- Collision Layers passam a ser respeitadas quando ambos os corpos possuem Collider.
- Spawn de Prefab em eventos passa pelo EntityWorld.
- Exportação HTML inclui TileMap e todos os módulos integrados reconstruídos a partir das fontes atuais.

## Bugs corrigidos
- Pintura por arraste do editor V4 usava uma variável `s` inexistente ao chamar `markDirty()`.
- Parallax existia em configuração/runtime mas não era chamado pelo pipeline final.
- Câmera era atualizada em runtimes, porém o draw de vários gêneros ignorava seu deslocamento.
- Game Flow ainda acessava `localStorage` diretamente em vez do StorageHub.

## Compatibilidade
Os arquivos `editor-v4.js`, `gameplay-v5.js` e `creation-v6.js` continuam carregados como adaptadores de compatibilidade. A engine nova agora é a fonte canônica para dados e runtime, mas a remoção física desses adaptadores deve ser feita somente depois de portar toda a UI histórica, para não quebrar projetos existentes.

## SNES
A ROM `.sfc` continua marcada como Experimental. O pipeline gera ROM real e compila tiles 4bpp, mas paridade completa com HTML (Game Flow completo, áudio SPC/BRR, SRAM, todas as cutscenes/IA) continua sendo trabalho nativo 65C816 separado.
