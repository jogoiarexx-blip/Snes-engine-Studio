# GameForge → SNES Engine Studio · Evolução 03: bifurcações físicas

## O que mudou
O SNES Engine Studio agora aceita pedidos explícitos de **caminhos dentro do mesmo mapa**, diferenciando-os das rotas da Evolução 02, que são cenas inteiras separadas.

**Exemplo de pedido**: `Crie um jogo de plataforma com 3 fases, 4 inimigos, 3 caminhos físicos no mesmo mapa, checkpoints e uma passagem secreta.`

Em **Novo → Criar por descrição (GameForge)**, selecione **Analisar ideia**, confira a prévia e depois **Criar projeto da ideia**.

### Modos disponíveis

| Tipo | Funcionamento real |
|---|---|
| **Action RPG / Top-down** | Três corredores paralelos saem de um hall comum, com paredes, obstáculos, checkpoints e saídas próprias. O jogador anda fisicamente até o caminho escolhido. |
| **Plataforma 2D** | Quatro portais opcionais no hall de entrada levam a corredores de diferentes alturas **no mesmo mapa**, separados por paredes. Há pisos com colisão, degraus, inimigos, checkpoints e portas de saída. |
| **Corredor secreto** | Acessível após concluir **duas rotas diferentes** em fases anteriores. Em Top-down, há uma porta que atravessa uma barreira; em Plataforma, o portal secreto fica no hall. |

No celular, use o botão de ação/interação para abrir portais e portas finais. No Top-down os checkpoints são ativados pela aproximação; na Plataforma o portal cria um checkpoint inicial e há outro checkpoint ao longo de cada corredor.

### Mecânicas
- **1 cena por fase**: com 3 fases, o projeto tem 3 cenas completas (não 9 variantes).
- Obstáculos construídos com tiles que participam da colisão real do runtime.
- Inimigos distribuídos separadamente em cada rota; o número varia conforme a dificuldade e é derivado do pedido de inimigos.
- Rota superior: +80 pontos ao concluir; central: +150; inferior: +260; secreta: +400.
- O caminho escolhido é registrado no player e a saída só conclui a fase se corresponder à rota ativada.
- Checkpoints fazem o motor gerar o evento padrão de autosave; `routeChoice`, coordenadas e recompensas são preservados no save/restore.
- O sistema impede duplicação da recompensa de uma mesma fase/rota.
- Pontuação e vida são transferidas ao avançar pelo botão **PRÓXIMA FASE**.
- Menu de jogo existente, efeitos leves e exportação HTML continuam funcionando.
- Jogos antigos sem `game.physicalForks` continuam usando o fluxo anterior.

### Limitações
- Por enquanto, este gerador físico atende **Plataforma** e **Action RPG / Top-down**. Shoot 'em Up, Kart, Metroidvania e Beat 'em Up continuam com seus sistemas anteriores, sem promessa de mapas físicos automáticos.
- O mapa é um protótipo editável de **512 × 288 px**; o gerador não cria mundos gigantes, mapas aleatórios infinitos ou arte inédita. Os trechos de Plataforma são acessados por **portais dentro da fase**, não por rampas contínuas.
- Checkpoints do Top-down preservam a posição no save; a recuperação se dá pelo fluxo de carregar/reiniciar a partir do save, sem introduzir respawn automático novo.
- A rota secreta após 2 conclusões só fica disponível na progressão se houver fases posteriores. Para campanhas curtas, é preciso repetir fases ou editar o desbloqueio.
- Exportação **.sfc** continua experimental e não inclui paridade garantida com HTML.

## Arquivos técnicos
- `js/game/physical-forks.js`: mapas, caminhos, obstáculos, checkpoints, portais, bloqueios e recompensas.
- `js/editor/gameforge-brief.js`: identifica o pedido por mapa único e preserva o modo antigo de rotas em cenas separadas.
- `js/runtimes/platform/platform-runtime.js` / `topdown-runtime.js`: ativação de portal/checkpoint/saída por interação.
- `js/game/game-flow.js`: recompensa, transferência de pontuação, persistência do caminho e desbloqueio do segredo.
- `tools/build-export-sources.py` / `js/export/html-exporter.js`: bundle do jogo exportado.
- `tests/physical-forks.test.js`, `tests/physical-flow.test.js`: testes determinísticos de colisão, caminhos, bloqueios e saves.

## Como verificar
```sh
node tests/physical-forks.test.js
node tests/physical-flow.test.js
node tests/gameforge-brief.test.js
node tests/stage-routes.test.js
node tests/gameflow-routes.test.js
node tests/integration-tests.js
```

A Action do GitHub verifica sintaxe de todos os módulos, os testes e a reconstrução do bundle. Ainda se recomenda teste manual da jogabilidade no celular e no navegador real, inclusive velocidade do movimento e interação nos portais.

**Referência de arquitetura**: [GameForge IA](https://github.com/jogoiarexx-blip/gameforge-ia).
