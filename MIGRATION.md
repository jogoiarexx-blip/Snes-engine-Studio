# Migration 0.8 → 0.9

## Automatic
Opening a 0.8 project in 0.9 runs `migrateProject`:
- `version` → `0.9`
- `schemaVersion` → 9
- Kart tracks: if `road` is plain object/array, restored via `ProjectStore.deserializeTrack` or rebuilt from demo

## Kart track format
**0.8:** `road` as Uint8Array (breaks in JSON as `{0:1,1:1,...}`)  
**0.9:** `{ t:'rle', len, data: base64 }` via `ProjectStore.serializeTrack`

On load, `restoreProject` rebuilds `Uint8Array`.

## Storage
- Small config + recent list: `localStorage`
- Full projects: `IndexedDB` (`snes_studio_0_9`) with localStorage fallback key `snes_proj_<id>`

## New fields
- `project.metroidvania` (optional rooms override)
- `project.beatEmUp` (optional waves)
- `project.kartTrack.checkpoints[].radius`

## Breaking
None intentional. Old platforms/topdown/shooter projects open as before.
