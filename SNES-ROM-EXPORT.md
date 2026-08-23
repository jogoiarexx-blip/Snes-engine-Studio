# Exportação ROM SNES — Studio 1.0

O botão **🎮 ROM SNES (.sfc)** agora gera uma ROM LoROM de 32 KiB diretamente no navegador. Não é mais um ZIP contendo apenas `game.asm`.

## O que a ROM 1.0 executa hoje

- header interno de cartucho LoROM;
- vetor de RESET real para código 65C816;
- inicialização básica da PPU;
- paleta convertida para BGR15 do SNES;
- tilemap 32×32 gerado da cena atual;
- gráficos 4bpp compatíveis com VRAM;
- player OBJ real na OAM;
- leitura automática do controle 1;
- movimento do player com o direcional;
- arquivo final `.sfc` que pode ser aberto por um emulador de SNES.

## Limite de compatibilidade desta primeira ROM nativa

O runtime JavaScript do Studio não pode ser executado pelo processador 65C816. Por isso a saída SNES usa um runtime nativo separado. Nesta build, a ROM reproduz a cena atual, paleta e um player controlável. IA, múltiplas cenas, eventos visuais, áudio moderno e conversão completa de PNG ainda aparecem como avisos antes de compilar.

Esses avisos são intencionais: a engine não apresenta mais um ZIP como se fosse uma ROM completa.
