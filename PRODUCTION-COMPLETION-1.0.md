# SNES Engine Studio 1.0 — Production Completion

Esta build conclui ferramentas que ainda estavam apenas parciais na estabilização anterior.

## Implementado
- Cutscene Timeline: ações temporizadas para diálogo, objetivo, espera, fade, shake, flags, mover player e trocar cena.
- Runtime de cutscene no Game Flow para Intro e Ending, com preview no editor e botão Pular.
- Visual UI Designer: cores, background por asset, posição/alinhamento do menu, escala do HUD e opacidade do Pause.
- Tile Cutter: transforma assets de imagem em paletas de tiles personalizadas com grid configurável e metadata de material/colisão.
- Render de tiles personalizados no editor e runtimes HTML por `assetId + src rect`.
- Prefab overrides: sincronização preserva propriedades sobrescritas pela instância; captura/reset e atualização do prefab.
- Hierarquia de produção: seleção múltipla, agrupar, duplicar, excluir, copiar/colar e atalhos Ctrl+C/V/D + Delete.
- UI do Game Flow agora usa tema visual configurado.

## Arquitetura
Os dados continuam no schema 10. Novos campos ficam em `project.game.ui`, `project.game.cutscenes`, `project.studio.customTiles` e `entity.prefabOverrides`.

## SNES
A geração `.sfc` continua sendo um runtime nativo separado. Esta build mantém a ROM bootável e o verificador de compatibilidade. Recursos avançados do runtime HTML que não possuem implementação 65C816 correspondente continuam reportados como limitações em vez de serem silenciosamente ignorados.
