# Physics — PALLADIUM NULL (Open, Receive-Only)

All functions are **textbook identities** or **educational toys** cited to public sources. No classified, ITAR, or restricted material.

## Constants (SI exact)

| Symbol | Value | Source |
|--------|-------|--------|
| `C` | 299 792 458 m/s | CODATA 2018 (exact by definition) |
| `K_BOLTZMANN` | 1.380 649 × 10⁻²³ J/K | CODATA 2018 (exact by definition) |
| `MU_EARTH` | 398 600.4418 km³/s² | NASA GSFC |
| `R_EARTH_KM` | 6371 km | IUGG / WGS84 |

## Functions

### `wavelengthM(fHz)` / `frequencyHz(lambdaM)`
```
λ = c / f    |    f = c / λ
```
**Reference:** Skolnik, *Radar Handbook* 3rd ed., Ch. 2; ITU-R P.525.

### `dopplerShiftHz(fHz, vRadialMps)`
```
Δf = −(v_radial / c) · f
```
Sign convention: `v > 0` = receding → negative shift.
**Reference:** Barton, *Modern Radar System Analysis*, Ch. 2.

### `ellipseSumM(f1, f2, p)` — Multistatic range-sum ellipse (teaching)
For two passive receivers at `f1`, `f2` and a target at `p`, the sum of ranges is constant on an ellipse:
```
‖p − f1‖ + ‖p − f2‖ = 2a
```
`ellipsePoint2D(a, c, t)` returns a point on the ellipse with foci at `(±c, 0)` and semi-major `a`.
**Reference:** Skolnik Ch. 12 (multistatic); Willis & Griffiths, *Advances in Bistatic Radar*.

### `tdoaRangeDiffM(dtSeconds)` / `tdoaSeconds(rangeDiffM)`
```
Δr = c · Δt    |    Δt = Δr / c
```
TDOA hyperbola sketch: constant range-difference → hyperboloid of revolution.
**Reference:** ICAO Annex 10 Vol IV (multilateration); ITU-R M.1459.

### `radioHorizonKm(h1m, h2m)`
```
D ≈ 4.12 (√h1 + √h2)  km   (h in meters)
```
Standard 4/3 Earth-radius model.
**Reference:** ITU-R P.525; Barton Ch. 1.

### `freeSpacePathLossDb(fHz, rangeKm)`
```
FSPL(dB) = 20 log10(4πR / λ)
```
**Reference:** ITU-R P.525 (free-space); Skolnik Ch. 2.

### `illuminatorSnrDb({ptW, gtDb, fHz, rangeKm, bandwidthHz, noiseFigureDb, tK})`
Order-of-magnitude SNR of a *received* illuminator of opportunity (FM, DVB-T, Starlink downlink — concept labels only).
```
Pr(dBW) = 10 log10(Pt) + Gt − FSPL
N(dBW)  = 10 log10(k·T·B) + NF
SNR(dB) = Pr − N
```
**Label:** `SANDBOX SNR LITERACY` — no transmitter design, no demod recipe.
**Reference:** Skolnik Ch. 2 (radar equation recv); ITU-R P.372 (noise).

### `gnssIntegrity(rng, health)` — Synthetic RAIM toy
Generates 8 SVs with C/N₀ and residuals. `health ∈ [0,1]` controls residual spread.
```
residual_i ~ N(0, σ)  with  σ = 0.6 / max(health, 0.02)
RAIM alert ⇔ max|residual| > 4.0
```
**Reference:** ICD-GPS-200 (RAIM concept); RTCA DO-229 (public excerpts); *GNSS Integrity* tutorial (ESA/NASA open).

### `seismicIntensity(mag, distKm)` — Toy decay
```
I = max(0, M − 1.4·log10(d + 5))
```
**Reference:** USGS *Earthquake Intensity Models* (public); Wald et al. 1999 (ShakeMap).

### `tsunamiEtaMin(distKm, depthM)` — Travel-time toy
```
t = dist / √(g·depth)   (shallow-water approx)
```
**Reference:** NOAA *Tsunami Travel Time* models (public); Synolakis & Bernard 2006.

### `orbitalPeriodMin(n)` / `orbitalVelocityKms(alt)` / `debrisRangeRateKms(alt, aspect)`
```
T = 1440 / n                    (n = rev/day)
v = √(μ / (Rₑ + alt))
ṙ = v · sin(aspect)
```
**Reference:** NASA *Orbital Debris Quarterly News* (public); Vallado *Fundamentals of Astrodynamics*.

## Forbidden Physics (Not Implemented)

| Forbidden | Reason |
|-----------|--------|
| Lead angle / intercept geometry | Fire-control |
| Time-to-impact / time-to-go | Engagement |
| Interceptor Δv / propulsion | Weapon design |
| Blast radius / fuse / warhead | Effects |
| Seeker SNR / guidance law | Terminal guidance |
| Jammer ERP / EIRP / barrage noise | Electronic attack |
| Antenna pattern synthesis for TX | Transmitter design |

## Citation Index

1. Skolnik, M. *Radar Handbook* (3rd ed.) — Ch. 2, 3, 12 (public excerpts via IEEE Xplore abstracts / Google Books preview)
2. Barton, D. *Modern Radar System Analysis* — Ch. 1–4 (Artech House, public excerpts)
3. ICAO Annex 10 Vol I–IV — *Aeronautical Telecommunications* (open standards)
4. ITU-R P.525, P.526, P.838, P.372, M.1459 — Recommendations (public via ITU)
5. NASA *Orbital Debris Quarterly News* — public PDFs
6. USGS *Earthquake Hazards Program* — intensity models, ShakeMap
7. NOAA *Tsunami Travel Time* — public models
8. ESA *GNSS Science Advisory Committee* reports — integrity/RAIM (public)
9. Vallado, D. *Fundamentals of Astrodynamics* — orbital mechanics (public excerpts)

All formulas implemented in `src/physics/index.ts` with unit tests in `tests/physics.identities.test.ts`.