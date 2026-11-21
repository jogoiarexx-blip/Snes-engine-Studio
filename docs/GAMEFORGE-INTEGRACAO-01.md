# Integração GameForge → SNES Engine Studio (fase 1)

## Objetivo
Usar a capacidade do GameForge de interpretar pedidos de pessoas iniciantes sem trocar o motor do SNES Engine Studio nem criar promessas falsas de recursos.

A implementação é um pequeno compilador **local e determinístico**, inspirado na arquitetura do `gameforge-ia/js/intent-compiler.js` e na distinção entre `applied` e `pending`. Não depende de nuvem, token de IA, execução de scripts, nem copia os runtimes 3D do GameForge.

## Como usar
1. Clique em **Novo**.
2. No campo **Criar por descrição (GameForge)**, escreva, por exemplo: `Quero um jogo de plataforma na floresta com 3 fases e 4 inimigos`.
3. Selecione **Analisar ideia**. A prévia mostra gênero, fases, configurações disponíveis e pedidos pendentes.
4. Se o gênero for suportado, clique em **Criar projeto da ideia**.
5. Edite mapas, inimigos, bosses e objetivos nos editores normais; teste antes de exportar.

O botão de criação é desabilitado quando a descrição não indica um único gênero suportado ou pede 3D/Minecraft/FPS.

## O que é aplicado agora
- Identificação conservadora de **Plataforma, Action RPG/Top-down, Shoot'em Up, Kart Racing, Metroidvania e Beat'em Up**.
- Até **12 fases reais**, clonadas de um modelo funcional, com IDs distintos e campanha sequencial.
- Tema visual existente (floresta, castelo, caverna, deserto, neve, água, vulcão, espaço).
- Quantidade de inimigos comuns por fase para os gêneros compatíveis; em shooter, a quantidade é **por spawner/onda existente**.
- Dificuldade configurada nas preferências do jogo (o compilador **não implementa nova IA nem novo balanceamento**).
- Título informado entre aspas; salva os requisitos originais e o relatório em `project.studio.gameforgeBrief`.

## Não implementar silenciosamente
O compilador informa como pendentes: multiplayer, Minecraft/3D/FPS, mundo aberto, crafting, shader avançado, árvore de habilidades automática e cutscenes automáticas. Um texto pedindo um chefe em gêneros diferentes de shooter não gera um boss falso: pede que o criador use os controles existentes no editor.

`applied` na prévia significa **dados que serão configurados depois de clicar em Criar**, nunca garantia de que todas as mecânicas descritas no texto existem.

## Limites técnicos
A duplicação de fases cria cópias do mapa inicial, **não desenha fases únicas nem roteiros completos automaticamente**. No Kart Racing, a pista inicial é reutilizada como base: é preciso editar trajetos. Nos gêneros com entidades, posições de inimigos são iniciais e podem exigir ajustes de colisão/solo pelo editor. Alterar o tema não cria novos arquivos de arte. O texto original não é enviado a servidores, mas fica registrado no projeto até o usuário apagá-lo.

## Testes
Execute `node tests/gameforge-brief.test.js` ou `bash tests/run-all.sh`. A suíte cobre contagens de fases e inimigos, restrições de gênero, limites de pedidos, títulos e gravação do briefing. Antes de publicar, execute também o E2E de Chromium presente no `run-all.sh`.

## Próximas integrações sugeridas
1. Planejador de três caminhos por fase, usando o Game Flow existente e checks de save/checkpoint.
2. Gerador de encontros condicionado às capacidades reais dos runtimes de cada gênero.
3. Geração de diagnóstico e testes de jogabilidade por fase com evidências, sem confundir plano com implementação.

## Fonte
- GameForge IA: https://github.com/jogoiarexx-blip/gameforge-ia
- Destino: https://github.com/jogoiarexx-blip/Snes-engine-Studio
