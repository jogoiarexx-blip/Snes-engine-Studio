# SNES Engine Studio 1.0 Complete

Esta build conclui a integração dos recursos que na primeira 1.0 estavam apenas como UI/configuração.

## Fluxo recomendado

1. Crie ou abra um projeto.
2. Use **1.0 Completo** na barra lateral para Hierarquia, Inspector, Triggers, IA, Boss, Luzes e Mundo.
3. Em **Mundo**, escolha o chunk a editar; o canvas continua 512×288, mas cada chunk salva suas próprias camadas.
4. Importe sprites em **Assets**. Eles são persistidos e podem ser ligados às entidades pelo Inspector.
5. Crie animações no Studio e selecione a animação no Inspector.
6. Crie Triggers e ações sem JavaScript.
7. Ative **Profiler no jogo** em Debug quando precisar medir desempenho.
8. Exporte HTML normalmente; o exportador usa as mesmas fontes atuais da engine.

## Sprites depois

Você pode montar mapas, gameplay, eventos e bosses primeiro. Quando os sprites estiverem prontos, importe-os e associe pelo Inspector. O fallback de placeholder continua disponível.
