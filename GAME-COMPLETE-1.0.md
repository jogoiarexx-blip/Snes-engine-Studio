# SNES Engine Studio 1.0 — Game Complete

Esta build adiciona a camada de fluxo de jogo completa sobre os runtimes de fase.

## Fluxo de jogo
- Splash opcional
- Menu principal
- Novo Jogo
- Continuar
- 1–9 slots de save
- Introdução
- Campanha ordenável por cenas
- HUD global
- Pause com salvar, reiniciar, opções e menu principal
- Game Over
- Vitória / próxima fase
- Ending
- Créditos
- Opções (música, SFX, dificuldade, pixel-perfect, fullscreen)
- Tela de controles
- Objetivo por cena

## Editor
Use **🎮 Jogo Completo** no menu lateral para configurar o fluxo. Use **🎮 JOGAR JOGO** na barra superior para testar o jogo desde o menu principal. O botão **▶ TESTAR** continua testando apenas a fase.

## Exportação HTML
O exportador HTML inclui o mesmo `game-flow.js`, portanto o jogo exportado inicia pelo Splash/Menu, mantém slots de save no navegador e executa a campanha completa.

## Observação SNES
A ROM `.sfc` continua sendo um runtime SNES nativo separado. O Game Flow completo está integrado ao runtime HTML nesta build; cada tela do fluxo precisa de equivalente 65C816 para ter paridade total na ROM física.
