# Test Report — SNES Engine Studio 0.9 (atualizado)

## Syntax
Todos os JS passam em `node --check`.

## Gêneros
| Gênero | Wizard | Runtime | Export seletivo |
|--------|--------|---------|-----------------|
| Plataforma | OK | OK | só platform |
| Action RPG | OK | OK | só topdown |
| Shooter | OK | OK | só shooter |
| Kart | OK | OK | kart+sprites |
| Metroidvania | OK | OK | combat+mv |
| Beat 'em Up | OK | OK | combat+beu |

## Kart — completado
- [x] Checkpoints em ordem
- [x] Track clone no teste
- [x] RLE serialize
- [x] AI seed
- [x] Waypoint/racing line editor visual
- [x] Track editor apply/cancel + placement
- [x] Respawn

## Metroidvania / Beat'em up
- [x] Demos jogáveis
- [x] Painéis informativos no editor
- [x] Export por gênero

## Controles / Saves
- [x] Painel de remap (botão 🎮)
- [x] Persistência localStorage
- [x] Teste de teclas
- [x] Touch opacity
- [x] UI slots 💾 (IndexedDB + slots 1–3)

## Export
- [x] Tree-shake de runtimes por gameType
- [x] Skeleton base64 só em platform/metroidvania
- [x] Mobile buttons por gênero

## Ainda limitado (menor)
- Curvas bezier no track editor (linha de waypoints cobre o uso da IA)
- Editor gráfico de salas MV / ondas BEU (dados via JSON do projeto)
- Visualização de hitboxes em overlay de debug (combate funcional sem overlay)
