SNES ENGINE STUDIO V6.2 UX EDITION

COMO ABRIR
1. Extraia o ZIP inteiro.
2. Dê dois cliques em index.html.
3. Mantenha as pastas css e js ao lado do index.

ARQUIVOS
- index.html: interface principal
- css/studio.css: visual e responsividade
- js/core.js: engine, cenas, tilesets e exportadores
- js/editor-v4.js: camadas, zoom, seleção, copiar/colar e balde
- js/gameplay-v5.js: ataque, itens, eventos, portas e bosses
- js/skeleton-sprite.js: animações recortadas da Caveira Espadachim
- js/skeleton-data.js: spritesheet incorporada para funcionamento offline
- assets/skeleton.png: spritesheet original com transparência
- js/creation-v6.js: World Map, saves e importação/exportação
- js/ui-enhancements.js: interface moderna, autosave, ajuda, atalhos e arrastar entidades

CONTROLES: setas/A-D movem, Z/Espaço pula, X/C ataca, Esc encerra.
A Caveira Espadachim possui idle, caminhada, corrida, ataque, dano e morte.

ATALHOS DE EDIÇÃO
- Ctrl+S salva; Ctrl+Z desfaz; Ctrl+Y refaz
- 1 a 5 alternam os painéis principais
- Tab recolhe o menu; ? abre a ajuda
- Na aba Entidades, arraste o personagem diretamente no mapa

SNES: a exportação gera projeto, mapas, temas, HTML e base 65816. A ROM .SFC
final ainda requer compilação e adaptação do runtime em uma toolchain SNES.
O PNG da caveira possui mais cores e resolução que o hardware original; no HTML
ele funciona diretamente. Para ROM real, deve ser convertido para tiles e paleta SNES.
