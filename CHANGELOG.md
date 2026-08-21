# Changelog — SNES Engine Studio

## 0.9 — Multi-Genre Update

### Kart (crítico)
- Checkpoints com ordem real (removido `|| true`)
- Aviso de checkpoint perdido
- Raio configurável por checkpoint
- Cópia da pista ao testar (não muta o projeto)
- Serialização RLE+base64 da estrada (Uint8Array)
- IndexedDB + fallback localStorage
- Track editor em cópia temporária (Aplicar / Cancelar)
- Objetos só no pointerdown (sem duplicar no drag)
- IA com RNG seedado (reproduzível)
- IA freia em curvas fechadas; throttle aplicado à física
- Respawn se preso fora da pista
- Posições de largada nunca undefined

### Novos gêneros
- **Metroidvania**: 5 salas, double jump, dash, chave, boss 3 fases, mapa, checkpoints
- **Beat 'em Up**: ondas, combo 3 hits, agarrão, especial, crates, boss, sort Y

### Sistema compartilhado
- `js/engine/combat/combat-core.js` — damage, hitbox, pool, combo, attack tokens
- `js/storage/project-store.js` — RLE track, IndexedDB

### Pré-existente mantido
- Plataforma, Action RPG, Shooter, Kart 2.5D, animações, áudio, atlas

## 0.8
- Kart Racing 2.5D, sprites ninja, atlas, audio manager, asset manager

## 0.7
- Sprite animation system

## 0.6 / V7
- Multi-runtime foundation
