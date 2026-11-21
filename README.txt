SNES ENGINE STUDIO 1.0.1
========================

ABRIR
1. Extraia o ZIP mantendo as pastas juntas.
2. Abra index.html em um navegador Chromium/Edge/Chrome atual.
3. Para desenvolvimento/testes, Node.js e Python 3 são recomendados.

WORKFLOW
Projeto -> Cena -> Player/Entidades -> Tiles/Chunks -> Animator/UI/Cutscene -> Jogar Jogo -> Save/Load -> Exportar HTML.

RECURSOS CENTRAIS
- EntityWorld + Components como modelo principal de entidades, com ponte segura para projetos legados.
- TileMap canônico em scene.tilemap, chunks, layers, edição global e migração de map/layers/chunks antigos.
- Animator Controller com parâmetros bool/number/trigger, transições, eventos e hitboxes por frame.
- Editor de mapa: brush, fill, line, rectangle, eyedropper, stamp, copiar/colar, layers e AutoTile bitmask.
- Tile Cutter 8/16/32/custom, tiles compostos e metadata de colisão/material/dano/água/escada/slope/one-way/animação/som/tags.
- Scene Manager 1.0.1 com busca, ordenação, duplicação/exclusão segura e templates Plataforma, Top-down, Shooter, Boss, Cutscene, Menu e Vazia.
- Game Flow em grafo com condições por flags, quests, itens, bosses e decisões.
- UI Designer compartilhado por Menu, Pause, Game Over, Victory, Slots, Loading e Credits.
- Cutscene timeline multipista com Camera, Dialogue, Player/NPC, Animation, Audio, Events e Scene Transition.
- Áudio centralizado em BGM, Ambient, SFX, UI e Voice, com fade/crossfade e áudio por cena.
- Save slots, autosave rotativo, checkpoint e recuperação; persistência via StorageHub.
- Asset Manager com arquivos reais + assets/manifest.json, preload/cache/hot reload/uso/dependências e descarte.
- Camera com dead zone, look ahead, clamp, zoom, shake, regions e pan cinematográfico.
- Profiler e Debug: F2 métricas; F3 colliders/hurtboxes/attack hitboxes/triggers/limites de câmera.
- Qualidade Auto/Baixa/Balanceada/Alta afeta somente render/FX, nunca gameplay.
- Seis gêneros: Plataforma, Top-down, Shooter, Kart, Metroidvania e Beat'em Up.

ATALHOS
F2 Debug | F3 Geometria | Ctrl+Z/Y Undo/Redo | Ctrl+C/V Copiar/Colar | Ctrl+D Duplicar | Delete Excluir.

TESTES
Execute: bash tests/run-all.sh
A suíte valida sintaxe, testes unitários/integração, rebuild do bundle, E2E em Chromium e boot HTML.
O E2E cobre projeto, TileMap, Components/EntityWorld, Animator, save/load, gameplay, pause, cena, checkpoint, Game Flow, os 6 gêneros e abertura do HTML exportado.

EXPORTAÇÃO HTML
Use Exportar HTML. O bundle é reconstruído por tools/build-export-sources.py a partir dos módulos atuais; não edite export-sources.js manualmente.

EXPORTAÇÃO SNES
A saída .sfc continua EXPERIMENTAL. O compilador converte assets para estruturas SNES onde suportado, mas não existe paridade total com o runtime HTML. A interface identifica explicitamente essa limitação.

ESTRUTURA
index.html | css/ | js/ | assets/ | tests/ | tools/

VERSÃO
SNES Engine Studio 1.0.1 | Project Schema 10

INTEGRAÇÃO GAMEFORGE (PRIMEIRA ETAPA)
- Na opção Novo, use "Criar por descrição (GameForge)" para transformar ideias em projetos editáveis.
- Exemplo: "Quero um jogo de plataforma na floresta com 3 fases e 4 inimigos".
- Clique Analisar ideia antes de Criar projeto: a prévia separa o que será configurado do que é pendente.
- Interpretação offline, somente os seis gêneros disponíveis, limite de 12 fases e sem geração automática de 3D.
- O pedido original e os limites detectados ficam em studio.gameforgeBrief.
- Guia detalhado: docs/GAMEFORGE-INTEGRACAO-01.md.


INTEGRAÇÃO GAMEFORGE (SEGUNDA ETAPA — ROTAS)
- Pedidos como "plataforma com 3 fases, 3 caminhos diferentes e passagem secreta" criam variantes jogáveis por fase.
- Selecione a rota no começo da campanha e depois de cada vitória; os inimigos e bônus de pontos variam.
- A passagem secreta requer duas rotas concluídas; save/load conserva pontos e recompensas concedidas.
- Atualmente: Plataforma, Top-down e Shooter. Outros gêneros mostram pendência na prévia.
- Cada caminho é uma cena separada e editável, não uma bifurcação desenhada dentro do mesmo mapa.
- Guia: docs/GAMEFORGE-ROTAS-02.md.
