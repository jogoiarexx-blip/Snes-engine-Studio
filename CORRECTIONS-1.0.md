# SNES Engine Studio 1.0 — Correções de integração

Esta build corrige problemas que podiam passar nos testes de sintaxe mas quebravam o uso real do editor.

## Corrigido

### Cutscenes por cena
As timelines criadas para uma cena existiam no projeto, mas o Game Flow não as executava. Agora, ao entrar numa cena que possui timeline, a cutscene roda primeiro e depois inicia o gameplay. Há uma trava para evitar recursão infinita.

### Reimportação de assets
Ao importar novamente um arquivo com o mesmo nome, o Studio podia criar um novo `assetId`. Isso quebrava Player, entidades, animações, parallax e tiles que ainda apontavam para o ID anterior. Agora o conteúdo é substituído preservando o ID original.

### Exclusão segura de assets
O Studio agora impede remoção de assets internos e avisa quando um asset está em uso. Confirmando a remoção, referências dependentes são limpas de forma controlada em vez de ficarem quebradas.

### Tile Cutter
A grade é limitada às dimensões reais do spritesheet. Colunas ou linhas que ultrapassariam a imagem são reduzidas automaticamente.

### Paleta customizada
A paleta de tiles personalizados é ressincronizada ao carregar/trocar projeto para evitar o editor exibir tiles do projeto anterior.

## Testes
- Sintaxe de todos os JavaScripts.
- EventBus.
- RuntimeSession.
- Dificuldade.
- Schema 10.
- Bundle de exportação.
- Game Flow sem polling.
- Production Tools.
- Timeline/UI Runtime.
- HTML custom tiles.
- Cutscene por cena.
- Preservação do ID de assets.
- Limite do Tile Cutter.
- Boot smoke test no Chromium.
