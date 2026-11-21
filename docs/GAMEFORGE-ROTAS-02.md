# SNES Engine Studio — Integração GameForge 02: caminhos por fase

Esta etapa reaproveita a arquitetura determinística de caminhos do **GameForge IA** no **SNES Engine Studio**, respeitando os limites dos runtimes 2D já disponíveis.

## Como criar
1. Abra **Novo → Criar por descrição (GameForge)**.
2. Escreva: `Crie um jogo de plataforma com 3 fases, 4 inimigos e 3 caminhos diferentes, incluindo passagem secreta`.
3. Clique **Analisar ideia**: a prévia registra funcionalidades aplicáveis e limitações.
4. Clique **Criar projeto da ideia**.
5. Escolha o caminho na tela apresentada antes da fase 1 e depois de cada vitória. O jogo salva a rota escolhida e sua pontuação.

## O que funciona
- Suporte nesta etapa: **Plataforma, Action RPG / Top-down e Shoot'em Up**.
- Cada fase é expandida para **3 cenas jogáveis distintas** (ou 2, se pedido), com IDs independentes, quantidade/velocidade de inimigos diferentes e recompensas graduais.
- Exemplo de 3 fases com 3 rotas: **9 cenas** no Game Flow; se a passagem secreta for pedida: **12 cenas**.
- Caminho superior: 65% dos inimigos de base, velocidade 92%, +80 pontos ao concluir.
- Caminho central: 100%, velocidade 100%, +150 pontos ao concluir.
- Caminho inferior: 155%, velocidade 115%, +260 pontos ao concluir.
- Caminho secreto: 190%, velocidade 125%, +400 pontos ao concluir. Desbloqueia após **2 conclusões de rota distintas**.
- Na **Plataforma**, alcançar a porta final conclui a rota. No **Top-down**, interaja com a porta final (se trancada, obtenha a chave). No **Shooter**, derrote o chefe.
- A tela de vitória apresenta **ESCOLHER PRÓXIMO CAMINHO** e o menu inicial permite escolher a rota da fase 1.
- Saves registram cena atual, pontuação, histórico e recompensas já concedidas. Retomar um save mantém a rota escolhida; concluir novamente a mesma rota não duplica bônus.
- O **HTML exportado** contém o módulo de rotas e as integrações dos runtimes.

## Limites que permanecem
- As alternativas **não são três bifurcações físicas desenhadas dentro de um único mapa**; são **cenas separadas** derivadas do mapa da fase, com inimigos e recompensas diferentes. Os mapas podem ser editados individualmente no editor.
- Não geramos automaticamente novo sprite/arte, mapas exclusivos elaborados ou IA de patrulha avançada.
- A rota secreta só pode ser liberada durante a campanha após duas conclusões; em campanhas com menos de 3 fases, pode não ficar acessível sem revisitar fases.
- Roteamento automático para Kart Racing, Metroidvania e Beat'em Up **não foi ativado** porque os respectivos runtimes não atendem este contrato de seleção por cena; a prévia informa a pendência.
- Exportar **ROM .sfc** é experimental e não oferece paridade com os recursos do HTML.

## Arquitetura
- `js/game/stage-routes.js`: parser de intenção, geração de rotas, multiplicadores, recompensas únicas, validação de histórico.
- `js/editor/gameforge-brief.js`: liga o contrato das rotas ao assistente de criação.
- `js/game/game-flow.js`: interface de seleção, vitória, save/restore.
- `js/runtimes/platform/platform-runtime.js` e `js/runtimes/topdown/topdown-runtime.js`: saída da fase aciona vitória em vez de transitar para outra variante por posição no array de cenas.
- `tools/build-export-sources.py` e `js/export/html-exporter.js`: exportação HTML consistente.

## Testes
```bash
node tests/gameforge-brief.test.js
node tests/stage-routes.test.js
node tests/gameflow-routes.test.js
bash tests/run-all.sh
```

O GitHub Actions verifica sintaxe, contratos, teste simulado de fluxo e consistência do export. A suíte E2E de Chromium do `run-all.sh` deve ser rodada para garantir o comportamento no navegador, principalmente no celular.

Projetos já existentes sem `game.stageRoutes` continuam com o fluxo antigo.

**Fontes**: [GameForge IA](https://github.com/jogoiarexx-blip/gameforge-ia) e [SNES Engine Studio](https://github.com/jogoiarexx-blip/Snes-engine-Studio).
