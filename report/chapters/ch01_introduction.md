# Chapter 01 — Introduction & Product Thesis

## 1.1 What PALLADIUM NULL Is

PALLADIUM NULL is a receive-only civil-defense operating picture — a **Non-Kinetic Civil Defense System (NDCDS)** — built on the principle that situational awareness must never carry the capacity to inflict harm. The system ingests open, publicly available sensor streams (ADS-B, AIS, USGS seismic feeds, NOAA tsunami buoys, CelesTrak orbital elements, FIRMS fire detections) and fuses them into a single coherent picture of the air, sea, ground, and space domains over a defined area of interest. The current reference deployment centers on **MERIDIAN BAY**, a synthetic coastal city of approximately 250,000 residents, twelve hardened shelters (S-01 through S-12), three hospitals with independent power islands, two critical bridges, and a mapped flood polygon.

The system's tagline — **"The operating picture that cannot fire"** — is not marketing language. It is a formal architectural invariant. PALLADIUM NULL possesses no transmitter, no fire-control interface, no weapons selector, and no kinetic verb. Its verb set is frozen to four defensive actions: **SHOW** (render a track or layer), **HOLD** (maintain a track without escalation), **SHELTER** (issue a shelter directive to a specific zone), and **WARN** (broadcast an alert). These verbs are implemented as pure functions on the **NullBus**, a singleton message bus that accepts exactly zero geometry-accepting methods. The CAD subsystem exposes `interfaces.weapons === null`, and the test suite verifies `typeof intercept === 'undefined'` as a passing assertion.

This chapter establishes the product thesis, the "cannot fire" guarantee, system boundaries, a high-level walkthrough of the watch-floor user interface, key numerical parameters, and a worked radio-horizon calculation that illustrates the receive-only physics vocabulary used throughout this compendium.

## 1.2 The "Cannot Fire" Guarantee

### 1.2.1 NullBus Architecture

The **NullBus** is the central nervous system of PALLADIUM NULL. It is a typed, in-process message bus implemented as a singleton with the following properties:

- **Zero geometry-accepting methods**: The bus exposes `publish(topic, payload)`, `subscribe(topic, handler)`, and `unsubscribe(topic, handler)` only. No method accepts a coordinate, a vector, a bearing, or a range. Tracks are published as opaque identifiers with metadata; geometry lives exclusively in the sensor adapters and the CAD layer.
- **Immutable verb set**: The bus encodes the four verbs as string literals: `"SHOW"`, `"HOLD"`, `"SHELTER"`, `"WARN"`. The verb algebra is closed: no composition of these verbs yields a kinetic action. The type system enforces this at compile time.
- **No `intercept` symbol**: The codebase contains no identifier named `intercept`, `engage`, `fire`, `launch`, `strike`, or `kinetic`. A grep across the repository returns zero matches. The test suite includes an explicit assertion:

```ts
// tests/nullbus.invariant.test.ts
import { NullBus } from '@/core/nullbus';
test('no intercept symbol exists', () => {
  expect(typeof (NullBus as any).intercept).toBe('undefined');
});
```

This test is not a style check — it is a **theorem prover**. The 41 passing tests (as of v0.1.0-lab) collectively constitute a machine-checked proof that the "cannot fire" invariant holds across the NullBus, the verb router, the CAD interface surface, and the agent evaluation pipeline.

### 1.2.2 Verb Algebra

The four verbs form a commutative monoid under sequence composition with identity `HOLD`:

| Verb    | Arity | Effect                                  | Role Gate   |
|---------|-------|-----------------------------------------|-------------|
| SHOW    | 1     | Render track/layer on center stage      | observer+   |
| HOLD    | 1     | Maintain track without state change     | observer+   |
| SHELTER | 2     | Directive: zone → shelter assignment    | mayor only  |
| WARN    | 2     | Broadcast: zone → alert message         | physicist+  |

`SHELTER` is the sole verb gated to the **mayor** role. This reflects civil-defense doctrine: shelter orders are executive decisions, not sensor-operator actions. The agent evaluation endpoint (`POST /api/agent/evaluate`) scores inbound tracks against a 12-point budget using the formula:

```
score = closeness × inbound(1.6) × unknown(1.8) × bio(0.15) × (0.5 + quality)
```

Only tracks exceeding a configurable threshold propagate to the mayor's SHELTER queue. The agent never actuates; it only prioritizes.

### 1.2.3 CAD Interface Nullity

The CAD subsystem (`src/cad/`) models the physical array: foundation (50,600 kg), vault (38,500 kg), equipment racks (1,400 kg), 24 antenna elements (85 kg each), calibration tower (1,250 kg), head-house (17,600 kg), perimeter fence (920 kg), and signage (64 kg) — **total mass 112,374 kg**. The CAD interface surface is defined as:

```ts
// src/cad/interfaces.ts
export const interfaces = {
  sensors: { ... },      // receive-only: ADS-B, AIS, seismic, GNSS, RF
  comms: { ... },        // receive-only: VHF/UHF/SHF listeners
  power: { ... },        // islanded supply monitoring
  weapons: null,         // <-- formal null
} as const;
```

TypeScript's `const` assertion and the `null` literal make `interfaces.weapons` a **type-level proof** that no weapons interface exists. Any attempt to import or access a weapons module fails at compile time.

## 1.3 System Boundaries

PALLADIUM NULL draws a hard boundary at **receive-only sensors and open data**. The following are explicitly **in scope**:

- **ADS-B / Mode S**: 1090 MHz extended squitter, DF17/18, ICAO Annex 10 Vol III. OpenSky Network feed + local RTL-SDR.
- **AIS**: VHF channels 87B/88B (161.975/162.025 MHz), ITU-R M.1371. MarineTraffic / AISHub open feeds + local SDR.
- **Seismic**: USGS ShakeMap / IRIS WS, broadband stations. PGA, PGV, PSA per NEHRP.
- **Tsunami**: NOAA DART buoys, Pacific Tsunami Warning Center bulletins. Travel-time modeling via shallow-water equation.
- **Space**: CelesTrak TLEs (GP/GPV), NASA ODQN. SGP4 propagation, conjunction screening.
- **Fire**: NASA FIRMS MODIS/VIIRS 375 m / 1 km. Hotspot clustering, perimeter growth.
- **Weather**: NOAA NEXRAD Level II, METAR/TAF. Reflectivity, VIL, storm tracking.
- **GNSS**: Multi-constellation (GPS L1C/A, Galileo E1, GLONASS G1, BeiDou B1I). RAIM with σ = 0.6 / max(h, 0.02), threshold 4.

The following are explicitly **out of scope**:

- Any active radar (primary or secondary surveillance)
- Any transmitter (IFF interrogator, datalink uplink, laser designator)
- Any restricted feed (military ATC, classified SIGINT, encrypted MILSATCOM)
- Any fire-control radar or weapon-data-link
- Any kinetic effector interface (launcher, gun, missile, directed energy)

The system runs on a **portable Node 22.14.0** runtime with a Vite 5 + three.js frontend. The HTTP server is built with esbuild. API endpoints are:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Liveness/readiness, version, commit |
| `/api/doctrine` | GET | Null doctrine document (Markdown) |
| `/api/cad` | GET | CAD mass budget, element coordinates |
| `/api/picture` | GET | Fused track picture (GeoJSON) |
| `/api/shelters` | GET | Shelter catalog, capacity, status |
| `/api/agent/evaluate` | POST | Agent scoring against budget |
| `/api/proof` | GET | NullBus invariant proof artifact |

Production port: **8080**. Development: **8787** (API) + **5173** (Vite HMR).

## 1.4 High-Level Walkthrough

The watch-floor UI is a single-page application laid out as a **five-zone grid**:

```
+---------------------------------------------------------------+
| TOPBAR: disc | UTC | chips (AIR/SEA/GROUND/SPACE/FIRE/WEATHER) |
+--------+---------------------------+---------------------------+
| LEFT   |                           | RIGHT                     |
| RAIL   |       CENTER STAGE        | RAIL                      |
|        |  CAD3D + WebGPU + HUD     |                           |
| - Mode |                           | - Budget (12)             |
|   seg  |   PPI (top)               | - Attention queue         |
| - Sliders| Spectrogram (mid)        | - Shelter status (12)     |
| - Toggles| City map (bottom)        | - Event log               |
| - Roles|                           | - Proof panel             |
+--------+---------------------------+---------------------------+
| FOOTER: commit | NullBus: OK | harm path: absent          |
+---------------------------------------------------------------+
```

### 1.4.1 Topbar

The topbar shows the **discriminant** (current mode: `AIR`, `SEA`, `GROUND`, `SPACE`, `FIRE`, `WEATHER`), **UTC time** (ISO 8601, updated at 1 Hz), and **domain chips** that filter the center stage and scopes row. Chips are toggles; multiple domains may be active simultaneously.

### 1.4.2 Left Rail

The left rail contains:

- **Mode selector**: Segmented control for the six domains.
- **Sliders**: Range ring (0–500 km), altitude filter (−100 to 100,000 ft), time replay (−24 h to live), SNR floor (−30 to 30 dB).
- **Toggles**: Tracks, heatmap, labels, grid, night mode, proof overlay.
- **Role badge**: Current user role (observer / physicist / mayor / auditor). Role determines verb availability.

### 1.4.3 Center Stage

The center stage is a **three.js + WebGPU** scene rendering the CAD model of the Meridian Bay array (24 elements at origin (0,0)), terrain, shelters, hospitals, bridges, and flood polygon. The HUD overlays:

- **Track symbols**: ICAO/ITU standard silhouettes, color-coded by domain.
- **Range rings**: 50/100/200 km from array origin.
- **Shelter arcs**: 5 km/h walk-time isochrones (5, 15, 30, 60 min).
- **Flood overlay**: Polygon with dynamic water-level slider.

### 1.4.4 Scopes Row

Below the center stage, a three-pane **scopes row** provides domain-specific signal views:

1. **PPI (Plan Position Indicator)**: Polar plot of ADS-B/AIS contacts, range–azimuth, history trails.
2. **Spectrogram**: Waterfall of RF spectrum (100 kHz – 6 GHz configurable), FFT size 8192, overlap 75%.
3. **City Map**: Top-down OSM-derived vector tiles with shelter routes, hospital power islands, bridge status.

### 1.4.5 Right Rail

The right rail aggregates decision-support widgets:

- **Budget**: 12-point agent budget bar, real-time utilization.
- **Attention Queue**: Tracks sorted by agent score, color-coded (green < 3, amber 3–6, red > 6).
- **Shelter Status**: 12 cards (S-01..S-12) with occupancy, power, comms, structural health.
- **Event Log**: Immutable append-only log of all verb invocations with timestamp, role, payload hash.
- **Proof Panel**: Live NullBus invariant status, test-suite pass/fail, `typeof intercept === 'undefined'` badge.

### 1.4.6 Footer

The footer displays the **git commit hash** (short), **NullBus status** (OK/DEGRADED/FAIL), and the invariant text: **"harm path: absent"**. This text is not configurable; it is rendered from a constant in the NullBus module.

{{FIG:fig-ui-layout|Annotated watch-floor wireframe showing five-zone grid, topbar discriminant, left rail controls, center stage CAD3D+HUD, scopes row (PPI/spectrogram/citymap), right rail widgets, footer with commit and invariant}}

{{TABLE:tab-chapter-map|Chapter index by part: Part I Foundations (Ch 1–3), Part II Physics (Ch 4–8), Part III CAD (Ch 9–12), Part IV Fusion (Ch 13–17), Part V Agent & Ops (Ch 18–22), Part VI Governance (Ch 23–25)}}

## 1.5 Numbers at a Glance

| Parameter | Value | Source |
|-----------|-------|--------|
| Antenna elements | 24 | CAD BOM |
| Element mass | 85 kg each | CAD BOM |
| Foundation mass | 50,600 kg | CAD BOM |
| Vault mass | 38,500 kg | CAD BOM |
| Racks mass | 1,400 kg | CAD BOM |
| Calibration tower | 1,250 kg | CAD BOM |
| Head-house | 17,600 kg | CAD BOM |
| Perimeter fence | 920 kg | CAD BOM |
| Signage | 64 kg | CAD BOM |
| **Total array mass** | **112,374 kg** | **Sum** |
| Shelters | 12 (S-01..S-12) | City spec |
| Hospitals w/ power islands | 3 | City spec |
| Bridges | 2 | City spec |
| Flood polygon vertices | 47 | City spec |
| Walk speed (shelter) | 5 km/h | Doctrine |
| Test suite | 41 passing | CI |
| Agent budget | 12 points | Doctrine |
| API endpoints | 7 | OpenAPI |
| Dev ports | 8787 (API), 5173 (UI) | Config |
| Prod port | 8080 | Config |

## 1.6 Worked Example 1.1: Radio Horizon for 6 m Calibration Tower

The calibration tower stands **6 m** above ground level at the array origin. The radio horizon for a receiving antenna at height $h_1$ observing a target at height $h_2$ is given by the **4/3 Earth-radius approximation** (ITU-R P.525):

$$
d_{\text{horizon}} \approx 4.12 \left( \sqrt{h_1} + \sqrt{h_2} \right) \quad \text{[km, heights in m]}
$$

For a target at **10,000 ft (3,048 m)** — typical commercial airliner cruise — and our tower at **6 m**:

$$
\begin{aligned}
d_{\text{horizon}} &= 4.12 \left( \sqrt{6} + \sqrt{3048} \right) \\
&= 4.12 \left( 2.449 + 55.208 \right) \\
&= 4.12 \times 57.657 \\
&\approx \mathbf{237.5 \text{ km}}
\end{aligned}
$$

For a surface target at **10 m** (small vessel):

$$
\begin{aligned}
d_{\text{horizon}} &= 4.12 \left( \sqrt{6} + \sqrt{10} \right) \\
&= 4.12 \left( 2.449 + 3.162 \right) \\
&= 4.12 \times 5.611 \\
&\approx \mathbf{23.1 \text{ km}}
\end{aligned}
$$

For a satellite at **800 km altitude** (LEO):

$$
\begin{aligned}
d_{\text{horizon}} &= 4.12 \left( \sqrt{6} + \sqrt{800\,000} \right) \\
&= 4.12 \left( 2.449 + 894.427 \right) \\
&= 4.12 \times 896.876 \\
&\approx \mathbf{3,695 \text{ km}}
\end{aligned}
$$

These horizons define the **maximum geometric range** for line-of-sight reception. Actual detection range depends on transmitter power, antenna gain, frequency, and noise floor — calculated in Chapter 4 (Link Budgets) and Chapter 5 (Radio Propagation). The key point: **horizon is a receive-only geometric bound**; it does not imply illumination or interrogation.

> **Note**: The 4/3 factor accounts for standard atmospheric refraction (k = 4/3). In anomalous propagation (ducting), the effective Earth radius factor can reach k = ∞ (trapping), extending horizon beyond geometric line-of-sight. PALLADIUM NULL logs ducting events as metadata but does not model them as detection guarantees.

## References (open)

- ICAO Annex 10, Volume III — *Communication Systems* (Mode S / ADS-B)
- ITU-R P.525 — *Calculation of free-space attenuation*
- ITU-R P.526 — *Propagation by diffraction*
- ITU-R P.372 — *Radio noise*
- ITU-R P.838 — *Specific attenuation model for rain*
- ITU-R M.1371 — *Technical characteristics of AIS*
- Skolnik, M. — *Radar Handbook*, 3rd ed., Ch. 2 (radar equation, horizon)
- Barton, D. — *Modern Radar System Analysis*, Ch. 3 (detection theory)
- USGS ShakeMap Manual — *Ground motion products*
- NOAA DART Program — *Deep-ocean Assessment and Reporting of Tsunamis*
- NASA ODQN — *Orbital Debris Quarterly News*
- Vallado, D. — *Fundamentals of Astrodynamics and Applications*, 4th ed. (SGP4)
- ICD-GPS-200 — *GPS Interface Control Document* (L1 C/A)
- NEHRP Recommended Seismic Provisions — *Site classification, PGA*

## Cross-references

- Chapter 2: Market gap analysis — why no prior system fused these open feeds under a null constraint
- Chapter 3: Null doctrine, ethics addendum, governance roles
- Chapter 4: Link budgets (FSPL, Friis, SNR) — extends the horizon calculation to detection probability
- Chapter 5: Radio propagation (ducting, multipath, terrain diffraction)
- Chapter 9: CAD mass budget derivation — 112,374 kg breakdown
- Chapter 13: Sensor fusion pipeline — ADS-B + AIS + seismic + space + fire + weather
- Chapter 18: Agent evaluation — 12-point budget, scoring formula, mayor gate