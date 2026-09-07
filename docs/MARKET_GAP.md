# Market Gap — PALLADIUM NULL

## Fragmented Landscape (2026)

| Domain | Open Tools | Gap |
|--------|------------|-----|
| Air (ADS-B) | OpenSky, tar1090, readsb | Tracks only; no fusion, no shelter |
| Sea (AIS) | AISHub, MarineTraffic (limited free) | Tracks only; no air/ground fusion |
| Weather (METAR) | NOAA ADDS, aviationweather.gov | No integration with tracks |
| Seismic | USGS Earthquake Hazards, IRIS | Event list only; no city twin |
| GNSS Integrity | None open (WAAS/EGNOS status proprietary) | No RAIM toy for civil defense |
| Wildfire IR | FIRMS (NASA), EFFIS (EU) | Detections only; no shelter routing |
| Space Debris | CelesTrak TLEs, SatNOGS | Orbits only; no conjunction risk to shelters |
| Digital Twin | CesiumJS demos, proprietary (Palantir, Anduril, Helsing) | Closed, offensive-capable, no doctrine enforcement |

## What PALLADIUM NULL Adds (Unified)

1. **Single receive-only operating picture** — all domains in one SPA
2. **Formal defensive boundary** — type system + tests enforce `NO FIRE`
3. **Agent NULL** — load-shedding + attention naming, not targeting
4. **City-shelter twin** — 12 nodes, hospitals, bridges, flood/tsunami routing
5. **CAD lab** — PN-LISTEN-1 array with `weapons: null`
6. **Physics literacy** — SNR, TDOA, Doppler, horizon, RAIM, orbital — all open textbook
7. **Proof artifacts** — `/api/proof`, `typeof intercept === "undefined"`, test suite

## Comparison Matrix

| Capability | OpenSky | MarineTraffic | USGS | FIRMS | CelesTrak | **PALLADIUM NULL** |
|------------|---------|---------------|------|-------|-----------|-------------------|
| Air tracks | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Sea tracks | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Seismic | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Wildfire IR | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| GNSS integrity | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (toy) |
| Debris conjunction | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ (to shelter) |
| Shelter routing | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Doctrine proof | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| WebGPU + CAD + PPI | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Open source (MIT) | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |

## Why Now (2026)

- WebGPU stable in Chrome/FF/Edge/Safari → sensor volumes + point clouds in browser
- WASM/WASI for physics kernels → deterministic replay
- Open-data APIs matured (OpenSky REST, NOAA API, USGS FDSN, CelesTrak GP)
- Civil-defense urgency (urban density, climate, near-peer pacing threats) → demand for *defensive* tooling
- TypeScript `strict` + `esbuild` + `vitest` → formal boundary enforceable in CI

**PALLADIUM NULL fills the gap: a beautiful, open, receive-only, multi-domain civil-defense operating picture that proves it cannot fire.**