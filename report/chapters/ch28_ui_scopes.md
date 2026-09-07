# Chapter 28 — Watch Floor UI/UX & Scopes

## 28.1 Layout

The watch-floor interface is a single-page application split into five persistent zones. All state is client-side; the server only provides `/api/*` endpoints for health, doctrine proof, CAD model, sensor picture, shelters, and agent evaluation. No secret keys ever leave the browser.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR                                                                      │
│  [PALLADIUM NULL disc]  PALLADIUM NULL  v0.1.0-lab   │  14:32:17Z  │
│  NULL BUS / NO FIRE    │  SENSORS ARE DANGEROUS… THIS BUILD CANNOT ARM.   │
├──────────┬───────────────────────────────────────────────────┬─────────────┤
│ LEFT     │ CENTER STAGE                                      │ RIGHT       │
│ RAIL     │                                                   │ RAIL        │
│          │  ┌─────────────────────┬──────────────────────┐  │             │
│ SENSOR   │  │      CAD3D          │  GPU POINTS (WebGPU) │  │  BUDGET     │
│ CLINIC   │  │  (Three.js scene)   │  5000 pts, sensor    │  │  meter      │
│          │  │                     │  volumes + shelters  │  │  shown/held │
│  • Mode  │  ├─────────────────────┼──────────────────────┤  │  /cap=12    │
│    seg   │  │       HUD           │  fallback: 2D canvas │  ├─────────────┤
│  • Rx    │  │  ATT  —   BUDGET 12 │                      │  │  ATTENTION  │
│    stare │  │  VERBS SHOW         │                      │  │  card       │
│  • Sliders│  │  WEAPONS BUS ABSENT │                      │  │  ID/kind/   │
│  • Toggls│  └─────────────────────┴──────────────────────┘  │  range/brg/  │
│  • Role  │  ┌──────────┬──────────────┬──────────────────┐  │  quality/   │
│  • Audio │  │   PPI    │ SPECTROGRAM  │    CITYMAP       │  │  inbound    │
│  • Proof │  │  sweep   │  scroll 1px  │  Meridian Bay    │  │  ATTENTION  │
│  btn     │  │  0.9 rad/s│  /frame      │  shelters/hazards│  │  ≠ AIMPOINT │
│          │  └──────────┴──────────────┴──────────────────┘  ├─────────────┤
│          │                                                   │  SHELTER    │
│          │                                                   │  card       │
│          │                                                   │  nodeId/eta │
│          │                                                   │  cap/reason │
│          │                                                   │  mayor-only │
│          │                                                   │  release    │
│          │                                                   ├─────────────┤
│          │                                                   │  DECISION   │
│          │                                                   │  LOG        │
│          │                                                   │  SHOW/HOLD/ │
│          │                                                   │  SHELTER/   │
│          │                                                   │  WARN       │
│          │                                                   ├─────────────┤
│          │                                                   │  PROOF LINE │
│          │                                                   │  typeof     │
│          │                                                   │  intercept  │
│          │                                                   │  === "undef"│
└──────────┴───────────────────────────────────────────────────┴─────────────┘
│ FOOTER                                                                      │
│  commit abc123  NullBus v0.1.0-lab  harm path: absent  api: linked (v0.1)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

{{FIG:fig-ui-layout|Full watch-floor wireframe}}

### Topbar

- **Disc mark**: SVG icon — outer ring (listening circumference), inner dashed ring (sector), center dot (array center), north tick (true north reference).
- **UTC clock**: Updates every second via `fmtUtc()` → `HH:MM:SSZ`.
- **Doctrine chip**: `NULL BUS / NO FIRE` — teal background, always visible.
- **Dual-use pulse**: Amber pulsing banner — "SENSORS ARE DANGEROUS IN THE WORLD. THIS BUILD CANNOT ARM." — reminds operators that the same RF hardware used for passive receive can be weaponized in other systems.

### Left Rail — Sensor Clinic

All controls are pure UI state; they mutate the synthetic `world.controls` object which the fusion engine reads each frame.

| Control | Element | Range / Values | Effect on Fusion |
|---------|---------|----------------|------------------|
| **Domain Mode** | Segmented buttons `mode-seg` | AIR \| SEA \| GROUND \| NEAR-SPACE \| CITY | Filters which track domains appear on PPI & citymap (`PpiScope.domainEnabled`) |
| **Passive Array Stare** | Canvas `stare` (196×120) | Animated RX sector visualization | Visual only — represents the 24-element circumferential loop listening sector |
| **GNSS health** | Slider `s-gnss` 0–100 | Default 88% | Scales GPS RAIM alert probability in `gnssIntegrity()` |
| **ADS-B density** | Slider `s-adsb` 0–100 | Default 65% | Scales ADS-B track spawn rate in `world.step()` |
| **AIS density** | Slider `s-ais` 0–100 | Default 55% | Scales AIS track spawn rate |
| **Seismic rate** | Slider `s-seis` 0–100 | Default 18% | Scales seismic event spawn rate |
| **Open Data Toggles** | Checkboxes `t-adsb`, `t-ais`, `t-metar`, `t-usgs`, `t-firms`, `t-tle` | Boolean | Enable/disable synthetic feed injectors in `world.controls.openData` |
| **Zero-Trust Role** | `<select id="role">` | observer \| physicist \| mayor \| auditor | Gates `SHELTER` verb release; `mayor` required to release shelter directive |
| **Audio toggle** | Checkbox `t-audio` | Boolean | Enables 1320 Hz click on new `SHOW` verb |
| **Proof button** | Button `btn-proof` | — | Runs local `proofLine()` + optional `/api/proof` fetch |

{{TABLE:tab-ui-controls|All left-rail controls}}

### Center Stage

#### CAD3D (Three.js)
- **Canvas**: `#cad3d` — full-width, flex-2
- **Scene**: PN-LISTEN-1 RX array — 24 Vivaldi-ish elements on 7 m radius torus, central vault, cal tower at (10, 3, 0), headhouse/shelter at (40, 1.5, -15), perimeter fence.
- **Materials**: Concrete (0x7a7f86), Steel (0x9aa0a8), Composite (0x5a5f66).
- **Signage**: Three sprites — "PN-LISTEN-1 RX ARRAY", "CIVIL SHELTER S-01", "RF RECEIVE SITE — NO TRANSMITTER ON SITE".
- **Sector ring**: `RingGeometry(9.5, 10.5, 64)` — rotates at 0.4 rad/s (`animTime * 0.4`), teal, 18% opacity — represents the listening attention sector.
- **Beacon**: Pulsing sphere on cal tower — opacity 0.5 + 0.5·sin(4t).
- **Camera**: OrbitControls, damping 0.05, min 10 m, max 100 m.
- **Fog**: Near 30 m, far 120 m, color #0b0e11.
- **Panel tag**: "PN-LISTEN-1 · CIRCUMFERENTIAL RX ARRAY · interfaces.weapons = null"

{{FIG:fig-cad3d-screenshot}}

#### WebGPU Point Cloud
- **Canvas**: `#gpupts` — flex-1, right of CAD3D
- **Points**: 5000 vertices — random positions in cylinder r≤8, z∈[-2,2]; colors teal→amber gradient.
- **Buffers**: Position (float32x3), Color (float32x3), Uniform (MVP matrix + time).
- **Shader**: Point-list topology, vertex transforms by MVP, passes color to fragment.
- **Animation**: Model rotates Y at 0.15 rad/s (`t * 0.15`).
- **Fallback**: If `navigator.gpu` unavailable or adapter/device creation fails → 2D canvas fallback with 3000 points, CPU rotation.
- **State badge**: `#gpu-state` shows "WEBGPU" (teal) or "CPU FALLBACK" (amber).

{{FIG:fig-webgpu-points}}

#### HUD
Four-row fixed display top-right of center stage:
| Row | Label | Value Source |
|-----|-------|--------------|
| ATT | Attention track ID | `agentOut.attention?.id` |
| BUDGET | Shown count | `agentOut.shown.length` |
| VERBS | Active verbs | `agentOut.verbs.join(' · ')` — teal |
| WEAPONS BUS | Static | "ABSENT" — amber |

### Scopes Row (Bottom of Center)

Three equal-width canvases, each with a header label.

#### PPI Scope (`#ppi`)
- **Type**: 2D Canvas, RX-only sweep.
- **Range rings**: 4 rings at 25%, 50%, 75%, 100% of 58 km.
- **Bearing spokes**: Every 30°.
- **Sweep wedge**: 0.6 rad wide, radial gradient teal 25%→0%, rotates at **0.9 rad/s** (`state.sweepRad += dt * 0.9`).
- **Tracks**: Plotted in polar (range ≤ 58 km). Color by domain: AIR=white, SEA=teal, GROUND=amber, NEAR-SPACE=purple. Disabled domains → dim gray.
- **Attention highlight**: Red fill (6 px) + red stroke ring (10 px).
- **Labels**: "RX ONLY" top-left, "RNG 58km" top-right.

{{FIG:fig-ppi-scope}}

#### Spectrogram Scope (`#spec`)
- **Type**: 2D Canvas, offscreen buffer scroll.
- **Scroll**: **1 px/frame** downward (`offCtx.drawImage(off, 0, 1, w, h-1, 0, 0, w, h-1)`).
- **Carriers**: 3 simulated sinusoids (freq 0.12, 0.35, 0.68 normalized) with slow drift.
- **Injection**: `injectTrack()` replaces a carrier with new random freq/amp/drift when agent emits `SHOW`.
- **Palette**: Green→amber→red intensity mapping.
- **Labels**: "SANDBOX SNR LITERACY", "SIM BASEBAND".

{{FIG:fig-spectrogram}}

#### CityMap Scope (`#city`)
- **Type**: 2D Canvas, Mercator-style local projection (Meridian Bay, x∈[-5,30], y∈[-20,5] km).
- **Layers**:
  1. Grid 40 px
  2. Coastline (sinusoidal)
  3. Flood polygon (teal 18% fill, 60% stroke) from `CITY.floodPolygon`
  4. Tsunami arc (amber, expanding 0.8 km/s, label "TSUNAMI ETA X min")
  5. Shelters: 12 nodes from `CITY.shelters` — white squares, active plan = red square + red stroke
  6. Hospitals: Red cross symbols
  7. Bridges: Gray lines
  8. Array site: Circle + "PN-LISTEN-1" label at (0,0)
  9. Shelter route: Dashed red line from hazard to shelter node
  10. Ground tracks: Amber dots (filtered by mode)
- **Shelter plan**: Passed from agent output — includes `nodeId`, `etaMin`, `from` coordinates.

{{FIG:fig-citymap-scope}}

{{TABLE:tab-scopes|Scope refresh rates & data sources}}

### Right Rail — Agent NULL

Four cards + proof line.

#### Budget Meter Card
- **Meter**: Horizontal bar, teal→amber gradient, width = `(shown / 12) * 100%`.
- **Counters**: shown / held / cap (12).
- **Source**: `agentOut.shown.length`, `agentOut.held`, constant 12.

{{FIG:fig-budget-meter}}

#### Attention Track Card
- **Fields**: ID, Kind (domain), Range (km), Bearing (°), Quality (%), Inbound (YES/no).
- **Mandatory disclaimer**: "ATTENTION ≠ AIMPOINT" — amber, micro text.
- **Empty state**: "No tracks in view".

{{FIG:fig-attention-card}}

#### Shelter Card
- **Fields**: Node ID (e.g., S-03), Walk ETA (min), Capacity (persons), Reason (e.g., "flood severity 0.82 at 1.2 km").
- **Gate**: If role ≠ mayor → "Mayor role required to release SHELTER" (amber).
- **Empty state**: "No active shelter directive. 12 nodes on standby."

{{FIG:fig-shelter-card}}

#### Decision Log Card
- **List**: Max 14 entries, newest top.
- **Format**: `[HH:MM:SSZ] VERB — detail`
- **Verbs logged**: SHOW (with track ID), HOLD (with count), SHELTER (with node), WARN (with hazard type).

{{FIG:fig-decision-log}}

#### Proof Line
- **Static text**: `typeof intercept === "undefined"` — amber on amber-tinted background.
- **Button action**: Runs `proofLine()` locally, then fetches `/api/proof` for server-side confirmation (`interceptModule=false`, `weaponsBus=null`, `typeofIntercept="undefined"`, `cadWeaponsInterface=null`).

{{FIG:fig-proof-line}}

### Footer (Statusbar)
- Commit hash (injected at build via `__GIT_HASH__`)
- NullBus version (`__NULL_BUS_VERSION__`)
- "harm path: absent" — amber
- API state: "api: linked (v…)" (teal) or "api: offline · synthetic mode" (amber)
- "PALLADIUM NULL · NDCDS · defensive use only"

---

## 28.2 Motion

All animation runs in a single `requestAnimationFrame` loop (`main.ts:170-206`).

| Element | Rate | Implementation |
|---------|------|----------------|
| PPI sweep | **0.9 rad/s** | `state.sweepRad += dt * 0.9` |
| Spectrogram scroll | **1 px/frame** | `offCtx.drawImage(off, 0, 1, w, h-1, ...)` |
| CAD sector ring | **0.4 rad/s** | `sectorRing.rotation.z = animTime * 0.4` |
| CAD beacon pulse | **4 Hz** | `opacity = 0.5 + 0.5 * sin(animTime * 4)` |
| WebGPU point cloud | **0.15 rad/s** | `mat4RotateY(model, t * 0.15)` |
| 2D fallback rotation | **0.1 rad/s** | `rot = t * 0.1` |
| Agent evaluation | **0.5 Hz** (every 2 s) | `if (now - lastAgentEval > 2000)` |
| Clock update | **1 Hz** | `setInterval(fmtUtc, 1000)` |
| API probe | **0.1 Hz** (every 10 s) | `setInterval(probeApi, 10000)` |

Target frame budget: **60 fps** (16.67 ms/frame). The loop caps `dt` at 50 ms to avoid spiral-of-death on slow frames.

---

## 28.3 Audio

Optional low click on new `SHOW` verb (enabled via `#t-audio` checkbox).

- **Frequency**: 1320 Hz (E6, ~2 octaves above middle C)
- **Envelope**: 80 ms total
  - Attack: 0.004 s exponential ramp 0.0001 → 0.05
  - Decay: 0.056 s exponential ramp 0.05 → 0.0001
- **Implementation**: `AudioContext` created lazily on first click; `OscillatorNode` (sine) + `GainNode`.
- **Trigger**: In `loop()`, when `nowShowing && !wasShowing` (transition into `SHOW` verb).

---

## 28.4 WebGPU Point Cloud

**Primary path (WebGPU)**:
- 5000 points, 2 vertex buffers (position, color), 1 uniform buffer (MVP + time).
- Point-list topology, no indices.
- Perspective projection (FOV 60°), camera at (25, 15, 25) looking at origin.
- Model rotates Y at 0.15 rad/s.
- Render pass clears to #0b0e11 (0.04, 0.05, 0.07, 1).

**Fallback (CPU 2D)**:
- 3000 points, precomputed positions + HSL colors.
- CPU rotation: `x' = x·cos - z·sin`, `z' = x·sin + z·cos`.
- Draws 1.5×1.5 px rects per point.
- Watermark: "WEBGPU UNAVAILABLE — CPU FALLBACK".

{{FIG:fig-webgpu-points|WebGPU point cloud — 5000 points, sensor volumes + shelter columns}}

---

## 28.5 Cards — Right Rail Detail

### Budget Meter
```
DISPLAY BUDGET
████████████░░░░░░░░░░  50%
shown 6  held 18  cap 12
```
- Green→amber gradient visually warns when approaching cap.
- `held = totalTracks - shown` — tracks not displayed due to budget.

### Attention Track
```
ATTENTION TRACK  target of attention — never an aimpoint
ID:     TRK-7A3F
Kind:   AIR (AIR)
Range:  42.3 km  Brg:  127°
Quality: 87%  Inbound: no
ATTENTION ≠ AIMPOINT
```

### Shelter
```
SHELTER
Node:    S-03
Walk ETA: 8 min
Capacity: 150
flood severity 0.82 at 1.2 km
Mayor role required to release SHELTER
```

### Decision Log
```
14:32:17Z SHOW — TRK-7A3F (AIR, 42.3 km, 127°)
14:32:15Z HOLD — 18 tracks held
14:31:59Z WARN — flood severity 0.82
14:31:45Z SHOW — TRK-9B21 (SEA, 18.7 km, 034°)
```

### Proof Line
```
typeof intercept === "undefined"
```
Clicking **RUN DOCTRINE PROOF** replaces this with:
```
API: interceptModule=false weaponsBus=null typeofIntercept="undefined"
```

---

## 28.6 Data Flow Summary

```
User Input (left rail) → world.controls → Fusion World (step) → Tracks/Hazards
                                                          ↓
                                          Agent NULL (evaluateAgent, 0.5 Hz)
                                                          ↓
                        ┌──────────────┬──────────────┬────┴────┬───────────┐
                        ↓              ↓              ↓         ↓           ↓
                     PPI           Spectrogram      CityMap   CAD3D      Right Rail
                     (tracks,      (injectTrack,    (hazards, (update,    (budget,
                      sweep)         step)           shelter,  animate)    attention,
                                                                       shelter,
                                                                       log, proof)
```

All rendering is **receive-only** — no outbound RF, no geometry sent to any fire-control interface (which does not exist).

---

## 28.7 Accessibility & Responsiveness

- Semantic HTML: `<header>`, `<main>`, `<aside>`, `<section>`, `<footer>`, `<ol>` for log.
- ARIA labels on both rails.
- Color contrast: Teal (#35b6a6) on #0b0e11 = 7.2:1; Amber (#ffb347) on #0b0e11 = 5.8:1.
- Focus visible on all interactive elements (buttons, sliders, toggles, select).
- Reduced motion: CSS `@media (prefers-reduced-motion)` not yet implemented — tracked for CH30.
- Viewport: Fixed 100vh grid; scopes row min-height 220 px; rails scroll independently.

---

## 28.8 Figures & Tables Referenced

| Figure | Description | Source |
|--------|-------------|--------|
| {{FIG:fig-ui-layout}} | Full watch-floor wireframe | `index.html` structure |
| {{FIG:fig-ppi-scope}} | PPI scope with sweep wedge | `src/scopes/ppi.ts` |
| {{FIG:fig-spectrogram}} | Spectrogram waterfall | `src/scopes/spectrogram.ts` |
| {{FIG:fig-citymap-scope}} | CityMap with hazards/shelters | `src/scopes/citymap.ts` |
| {{FIG:fig-webgpu-points}} | WebGPU point cloud (5000 pts) | `src/scopes/webgpuPoints.ts` |
| {{FIG:fig-cad3d-screenshot}} | Three.js CAD scene | `src/scopes/cadScene.ts` |
| {{FIG:fig-stare-ring}} | Passive array stare canvas | `index.html:#stare` |
| {{FIG:fig-budget-meter}} | Budget meter card | `index.html:#budget-card` |
| {{FIG:fig-attention-card}} | Attention track card | `index.html:#attention-card` |
| {{FIG:fig-shelter-card}} | Shelter directive card | `index.html:#shelter-card` |
| {{FIG:fig-decision-log}} | Decision log list | `index.html:#log-card` |
| {{FIG:fig-proof-line}} | Proof line footer | `index.html:#proof-line` |

| Table | Description | Source |
|-------|-------------|--------|
| {{TABLE:tab-ui-controls}} | All left-rail controls | `index.html:#left-rail` |
| {{TABLE:tab-scopes}} | Scope refresh rates & data sources | `src/scopes/*.ts`, `main.ts` |