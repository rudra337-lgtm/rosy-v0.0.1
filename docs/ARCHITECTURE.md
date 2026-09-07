# Architecture — PALLADIUM NULL

## System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                        WATCH FLOOR (SPA)                        │
│  ┌──────────────┐  ┌──────────────────────┐  ┌──────────────┐  │
│  │ SENSOR CLINIC│  │  CAD  │ PPI │ SPEC   │  │  AGENT NULL  │  │
│  │  (Left Rail) │  │ (3D)  │(2D) │(2D)   │  │ (Right Rail) │  │
│  └──────┬───────┘  └──────────┬───────────┘  └──────┬───────┘  │
└─────────┼─────────────────────┼─────────────────────┼──────────┘
          │                     │                     │
          ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API SERVER                               │
│  /api/health  /api/doctrine  /api/cad  /api/picture             │
│  /api/shelters  /api/agent/evaluate  /api/proof                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      WORLD SIMULATOR                             │
│  Seeded RNG → Tracks (AIR/SEA/GROUND/NEAR-SPACE)                │
│  Hazards: Flood, Wildfire, Seismic, Tsunami, GNSS               │
│  Fusion: NN-gate + IMM-lite (educational)                       │
└─────────────────────────────────────────────────────────────────┘
```

## Module Dependencies (acyclic)

```
doctrine (leaf) ──────────────────────────┐
physics (leaf) ───────────────────────────┤
twin (leaf) ──────────────────────────────┤
cad/model (leaf) ─────────────────────────┤
fusion ───────────────────────────────────┼──► agent ◄──┐
ui/dom (leaf) ────────────────────────────┤             │
scopes/* ─────────────────────────────────┤             │
main.ts ◄─────────────────────────────────┘             │
server/index.ts ◄───────────────────────────────────────┘
```

## Data Flow

1. **Boot** → `createWorld(seed)` → seeded deterministic simulator
2. **RAF loop** (client) / `setInterval 2s` (server)
   - `world.step(dt)` → advances tracks, spawns/despawns, updates hazards
3. **Agent tick** (every 2s)
   - `evaluateAgent({tracks, hazards, role, budget})`
   - Returns `{ shown, held, attention, shelter, verbs, log, proof }`
4. **Render**
   - CAD scene (Three.js): PN-LISTEN-1 ring, vault, elements, tower, shelter
   - PPI (Canvas 2D): range rings, sweep wedge, track blips, attention highlight
   - Spectrogram (Canvas 2D): scrolling waterfall, injected carriers on new attention
   - City map (Canvas 2D): shelters, hospitals, bridges, flood polygon, tsunami arc, route
   - WebGPU points: sensor volumes + city points (fallback to Canvas 2D)
5. **API** (server)
   - Static `dist/` + SPA fallback
   - `/api/picture` → current world snapshot
   - `/api/agent/evaluate` → doctrine-checked agent output
   - `/api/proof` → `{ interceptModule:false, weaponsBus:null, ... }`

## Threat Model (what we refuse)

| Threat | Mitigation |
|--------|------------|
| Fire-control type introduced | `tests/doctrine.test.ts` scans file names; `assertVerb` rejects `FIRE`; `FORBIDDEN_KEYS` schema guard |
| Weapons bus added | `CAD.interfaces.weapons === null` enforced in test; `NullBus.acceptsGeometry === false` |
| Aimpoint in API payload | `assertNoForbiddenKeys` throws 422 on `aimpoint`/`launch`/`battery`/`intercept` |
| Transmitter class | No `Transmitter` export; `compliance.transmitter === "none"` in CAD |
| Covert SIGINT playbook | Only open-data adapters; physics functions are textbook identities |

## Build & Deploy

- `npm run build` → `vite build` (client) + `esbuild` (server bundle → `dist-server/index.mjs`)
- `npm start` → `node dist-server/index.mjs` serves `dist/` + API on single port
- `npm run dev` → `tsx watch server/index.ts` + `vite` (proxied)
- Reproducible: fixed seeds, no timestamps in build output

## Observability

- OpenTelemetry-style traces: agent decision log emitted every 2s (`decision log` panel)
- `GET /api/proof` — machine-readable doctrine proof
- `console.log` only for server startup; client uses decision log panel

## Scaling Notes

- World simulator is single-threaded, deterministic, seeded — suitable for replay/record
- Client renders at 60fps; server ticks at 0.5Hz (2s)
- For multi-site correlation: run multiple `World` instances with shared clock (PTP) and fuse at agent layer