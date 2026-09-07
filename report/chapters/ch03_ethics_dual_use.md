# Chapter 03 — Null Doctrine, Ethics & Dual-Use Framework

## 3.1 Doctrine Definition

The **Null Doctrine** is the architectural and ethical constitution of PALLADIUM NULL. It is not a policy document — it is **executable code** with machine-checked invariants. The doctrine comprises three pillars:

### 3.1.1 NullBus: The Singleton Invariant

The `NullBus` class (src/core/nullbus.ts) is a **final, non-extensible singleton** with exactly three public methods:

```ts
// src/core/nullbus.ts
export final class NullBus {
  private static instance: NullBus;
  private subscribers = new Map<string, Set<Handler>>();

  static getInstance(): NullBus { ... }

  publish(topic: string, payload: unknown): void { ... }
  subscribe(topic: string, handler: Handler): () => void { ... }
  unsubscribe(topic: string, handler: Handler): void { ... }

  // No other methods. No geometry. No kinematics. No fire-control.
}
```

**Invariants enforced by TypeScript + test suite**:

1. `NullBus.prototype` has no property named `intercept`, `engage`, `fire`, `launch`, `strike`, `kinetic`, `weapon`, `target`, `bearing`, `range`, `vector`, `coordinate`, `geometry`
2. All topics are string literals from a closed union: `TrackUpdate | ShelterDirective | AlertBroadcast | BudgetUpdate | ProofArtifact`
3. The bus cannot be subclassed (`final class`), instantiated (`private constructor`), or monkey-patched (`Object.freeze(NullBus.prototype)` at module initialization)

The test suite (41 tests) includes:

```ts
// tests/nullbus.invariant.test.ts
describe('NullBus doctrine invariants', () => {
  test('no fire-control symbols exist', () => {
    const forbidden = ['intercept', 'engage', 'fire', 'launch', 'strike', 'kinetic', 'weapon', 'target'];
    for (const sym of forbidden) {
      expect((NullBus as any)[sym]).toBeUndefined();
      expect(NullBus.prototype[sym]).toBeUndefined();
    }
  });

  test('no geometry-accepting methods', () => {
    const methods = Object.getOwnPropertyNames(NullBus.prototype)
      .filter(p => typeof NullBus.prototype[p] === 'function');
    for (const m of methods) {
      const params = new Set(Reflect.getMetadata('design:paramtypes', NullBus.prototype, m) || []);
      expect(params.has('number')).toBe(false); // no coordinate numbers
      expect(params.has('Vec3')).toBe(false);   // no vectors
      expect(params.has('LatLon')).toBe(false); // no coordinates
    }
  });
});
```

These tests run in CI on every commit. A regression that adds a fire-control symbol or geometry parameter **fails the build**.

### 3.1.2 Verb Algebra: Frozen Set

The verb set is a **TypeScript `const` enum** with exactly four members:

```ts
// src/doctrine/verbs.ts
export const Verb = {
  SHOW: 'SHOW',      // Render track/layer
  HOLD: 'HOLD',      // Maintain without escalation
  SHELTER: 'SHELTER', // Directive: zone → shelter (mayor only)
  WARN: 'WARN',      // Broadcast: zone → alert (physicist+)
} as const;

export type Verb = typeof Verb[keyof typeof Verb];
```

**Algebraic properties**:

- **Closure**: No composition of verbs yields a new verb. `SHOW ∘ HOLD = HOLD`, `SHELTER ∘ WARN` is a sequence, not a new verb.
- **Identity**: `HOLD` is the identity element (no state change).
- **Commutativity**: `SHOW` and `HOLD` commute; `SHELTER` and `WARN` are ordered by role gate (mayor → physicist).
- **No inverse**: There is no `UNSHELTER`, `UNWARN`, `UNSHOW`. Civil-defense actions are monotonic.

**Role gates** (enforced at API layer, `src/api/verb-router.ts`):

```ts
const roleGate: Record<Verb, Role[]> = {
  [Verb.SHOW]:   ['observer', 'physicist', 'mayor', 'auditor'],
  [Verb.HOLD]:   ['observer', 'physicist', 'mayor', 'auditor'],
  [Verb.SHELTER]: ['mayor'],                    // <-- sole mayor verb
  [Verb.WARN]:   ['physicist', 'mayor', 'auditor'],
};
```

### 3.1.3 CAD Interface Nullity

The CAD subsystem (`src/cad/interfaces.ts`) declares:

```ts
export const interfaces = {
  sensors: { ... },      // receive-only adapters
  comms: { ... },        // receive-only listeners
  power: { ... },        // monitoring only
  weapons: null,         // <-- type-level proof
} as const;
```

The `as const` assertion makes `interfaces.weapons` a **literal type `null`**. Any attempt to write:

```ts
import { interfaces } from '@/cad/interfaces';
interfaces.weapons.fire(); // Type error: Property 'fire' does not exist on type 'null'
```

fails at compile time. The NullBus test suite also verifies:

```ts
test('CAD weapons interface is null', () => {
  expect(interfaces.weapons).toBeNull();
  expect(typeof (interfaces as any).weapons?.fire).toBe('undefined');
});
```

## 3.2 Ethics Addendum

PALLADIUM NULL is licensed under the **MIT License** with a **Defensive-Use-Only Addendum** (LICENSE-ADDENDUM.md). The addendum contains eight sections:

{{TABLE:tab-ethics|Ethics addendum section summary}}

| Section | Title | Core Requirement |
|---------|-------|------------------|
| 1 | **Scope** | Applies to all copies, modifications, distributions, and deployments |
| 2 | **Defensive Use Only** | Software shall not be used to direct, cue, or facilitate any kinetic effector |
| 3 | **No Weapons Integration** | No code path shall connect to fire-control, weapon-data-link, or targeting systems |
| 4 | **Receive-Only Sensors** | All sensor interfaces shall be receive-only; no transmitter shall be added |
| 5 | **Open Data Only** | No restricted, classified, or ITAR-controlled feeds shall be ingested |
| 6 | **Role Separation** | Mayor (shelter), Physicist (warn), Observer (show/hold), Auditor (proof) — no weapons officer |
| 7 | **Proof Preservation** | NullBus invariants and test suite shall not be weakened or removed |
| 8 | **Attribution** | Derivative works must preserve this addendum and the "harm path: absent" invariant |

**Section 2 (Defensive Use Only) full text**:

> The Software is designed, architected, and licensed exclusively for **defensive civil-defense situational awareness**. The Software shall not be used, modified, extended, or deployed to:
> - Direct, cue, or facilitate any kinetic effector (missile, gun, torpedo, directed-energy weapon, kinetic projectile)
> - Provide targeting data to any fire-control system or weapon-data-link (Link-16, MADL, IFDL, SADL, etc.)
> - Support offensive cyber operations, electronic attack, or network exploitation
> - Enable any "kill chain" or "targeting cycle" (F2T2EA, D3A, or equivalent)
>
> Any such use constitutes a material breach of this license.

**Section 7 (Proof Preservation) full text**:

> The NullBus singleton, its zero-geometry method invariant, the frozen verb set, the `interfaces.weapons === null` declaration, and the 41-test invariant suite are **load-bearing architectural elements**. They shall not be:
> - Weakened (e.g., adding geometry parameters, adding verbs, changing `null` to `undefined`)
> - Removed or stubbed
> - Conditionally compiled out
> - Bypassed via dynamic code loading or reflection
>
> Any modification that reduces the proof surface constitutes a material breach of this license.

## 3.3 Legal Standing

### 3.3.1 Open Data Only

PALLADIUM NULL ingests **exclusively open, public-domain, or openly licensed** feeds:

| Feed | Source | License | ITAR Status |
|------|--------|---------|-------------|
| ADS-B | OpenSky / local SDR | ODbL / self-collected | Exempt (civil aviation) |
| AIS | AISHub / local SDR | Custom / self-collected | Exempt (maritime safety) |
| Seismic | USGS / IRIS | Public domain | Exempt (scientific) |
| Tsunami | NOAA DART | Public domain | Exempt (civil warning) |
| Space | CelesTrak | Free non-commercial | Exempt (public catalog) |
| Fire | NASA FIRMS | Public domain | Exempt (civil) |
| Weather | NOAA NWS/NEXRAD | Public domain | Exempt (civil) |

No feed requires a government clearance, end-user certificate, or non-disclosure agreement. The system **does not** ingest:
- Military ATC radar (ASR-11, ARSR-4)
- Classified SIGINT/ELINT
- Encrypted MILSATCOM (AEHF, WGS, DSCS)
- Space-Track restricted catalog (requires account, ITAR terms)
- Commercial satellite imagery (Maxar, Airbus, Planet — license-restricted)

### 3.3.2 ITAR Analysis

The **International Traffic in Arms Regulations (ITAR, 22 CFR 120–130)** control "defense articles" on the U.S. Munitions List (USML). PALLADIUM NULL is **not a defense article** because:

1. **No fire-control**: USML Category XII (Fire Control, Range Finder, Optical and Guidance and Control Equipment) — not applicable
2. **No sensors**: USML Category XI (Military Electronics) — receive-only civil sensors are not "specifically designed for military use"
3. **No encryption**: USML Category XIII (Auxiliary Military Equipment) — no COMSEC
4. **Open source**: Publicly available software is exempt per 22 CFR 120.11 ("public domain")

The **Wassenaar Arrangement** (dual-use controls) similarly excludes "software for civil defensive warning systems" from Category 4 (Computers) and Category 5 (Telecommunications/Information Security).

### 3.3.3 Export Classification

- **ECCN**: EAR99 (not on Commerce Control List)
- **HS Code**: 8523.49 (software on physical media) or 4901.99 (printed matter)
- **License Exception**: TSU (Technology and Software — Unrestricted) applies

## 3.4 Governance: Zero-Trust Roles

PALLADIUM NULL defines **four roles** with strictly separated verb authorities. There is **no weapons officer**, no "commander," no "battle captain."

| Role | Verbs | Responsibilities | Gate |
|------|-------|------------------|------|
| **Observer** | SHOW, HOLD | Monitor picture, annotate tracks, request physicist review | Default (self-register) |
| **Physicist** | SHOW, HOLD, WARN | Validate physics (SNR, propagation, error analysis), issue alerts | Peer review + physics credential |
| **Mayor** | SHOW, HOLD, WARN, SHELTER | Authorize shelter directives, accept liability for evacuation | Elected/appointed civil authority |
| **Auditor** | SHOW, HOLD, WARN | Verify NullBus invariants, review event log, sign proof artifacts | Independent audit firm |

**Role assignment** is via **mTLS client certificates** issued by an internal PKI (not part of PALLADIUM NULL). The API validates the certificate's `OU` (organizational unit) field against the role gate. No role can escalate itself; escalation requires external PKI action.

**Audit trail**: Every verb invocation writes an immutable record to the event log:

```json
{
  "ts": "2026-09-06T14:23:12.000Z",
  "verb": "SHELTER",
  "role": "mayor",
  "subject": "zone-7",
  "payload": { "shelter": "S-04", "capacity_pct": 67 },
  "hash": "sha256:3f2a...",
  "prev_hash": "sha256:a1b2..."
}
```

The hash chain provides **tamper evidence**. The auditor role can verify the chain via `/api/proof`.

## 3.5 Dual-Use Mitigation

Every physics calculation in PALLADIUM NULL is **receive-only by construction**. Dual-use risk arises when a passive sensing equation (e.g., Friis transmission equation) is mathematically invertible to yield a transmitter design parameter. The system mitigates this through three mechanisms:

### 3.5.1 Sandbox Labeling

Every SNR, link budget, and detection-range calculation emits a **structured log entry** with a mandatory label:

```
[SANDBOX SNR LITERACY] freq=1090e6 range=150e3 pt=200 gt=3 gr=3 lambda=0.275 snr=18.2 dB
```

The label `SANDBOX SNR LITERACY` appears in:
- Structured logs (JSON, shipped to auditor)
- UI proof panel (real-time)
- Agent evaluation payload (attached to every score)
- Export artifacts (CSV, GeoJSON, report PDFs)

**No calculation is emitted without this label**. The logger (`src/utils/sandbox-logger.ts`) enforces this at the type level:

```ts
export function logSnrLiteracy(params: SnrParams): void {
  const entry = {
    label: 'SANDBOX SNR LITERACY' as const,
    ...params,
    ts: new Date().toISOString(),
    git_commit: process.env.GIT_COMMIT,
  };
  auditLog.write(entry); // immutable append-only
}
```

### 3.5.2 Receive-Only Function Signatures

All physics functions are **pure, receive-only, and typed**:

```ts
// src/physics/link-budget.ts
export function fspl(range_m: number, freq_hz: number): number {
  // Free-space path loss (ITU-R P.525)
  // RECEIVE ONLY: computes loss for a given range/freq
  // No inverse function exposed.
  const lambda = C / freq_hz;
  return 20 * Math.log10(4 * Math.PI * range_m / lambda);
}

export function friisSnr(pt_dbm: number, gt_dbi: number, gr_dbi: number,
                         range_m: number, freq_hz: number, nf_dbm: number): number {
  // Friis SNR (receive-only)
  // RECEIVE ONLY: no 'required_pt' or 'max_range' inverse.
  const loss = fspl(range_m, freq_hz);
  const pr_dbm = pt_dbm + gt_dbi + gr_dbi - loss;
  return pr_dbm - nf_dbm;
}
```

**No inverse functions** (`requiredPowerForSnr`, `maxRangeForSnr`) are exported. If a consumer needs them, they must re-derive — the codebase does not provide a "design a transmitter" helper.

### 3.5.3 Sandbox Mode Enforcement

The agent evaluation endpoint (`POST /api/agent/evaluate`) runs in a **sandboxed VM** (Node `vm` module with frozen globals) that:

- Has no access to `fs`, `net`, `child_process`, `worker_threads`
- Has no access to CAD geometry beyond track metadata
- Cannot import `interfaces.weapons` (does not exist)
- Times out at 50 ms
- Emits `SANDBOX SNR LITERACY` for every scoring component

## 3.6 Worked Example 3.1: Labeling a Passive SNR Calculation Correctly

**Scenario**: An ADS-B target at 150 km range, 1090 MHz, transmitter power 200 W (53 dBm), tx antenna gain 3 dBi, rx antenna gain 3 dBi, system noise figure 3 dB (NF = 3 dB → noise floor = -174 + 10×log10(2 MHz) + 3 = -174 + 63 + 3 = **-108 dBm**).

**Step 1: Wavelength**

$$
\lambda = \frac{c}{f} = \frac{299\,792\,458}{1.09 \times 10^9} \approx \mathbf{0.275 \text{ m}}
$$

**Step 2: Free-Space Path Loss (FSPL)**

$$
\text{FSPL} = 20 \log_{10}\left( \frac{4 \pi R}{\lambda} \right)
= 20 \log_{10}\left( \frac{4 \pi \times 150\,000}{0.275} \right)
\approx 20 \log_{10}(6.85 \times 10^6)
\approx \mathbf{136.7 \text{ dB}}
$$

**Step 3: Received Power (Friis)**

$$
P_r = P_t + G_t + G_r - \text{FSPL}
= 53 + 3 + 3 - 136.7
= \mathbf{-77.7 \text{ dBm}}
$$

**Step 4: SNR**

$$
\text{SNR} = P_r - N_f
= -77.7 - (-108)
= \mathbf{30.3 \text{ dB}}
$$

**Step 5: Structured Log Entry (Emitted by System)**

```json
{
  "label": "SANDBOX SNR LITERACY",
  "domain": "air",
  "source": "ads-b",
  "freq_hz": 1090000000,
  "range_m": 150000,
  "pt_dbm": 53,
  "gt_dbi": 3,
  "gr_dbi": 3,
  "nf_dbm": -108,
  "fspl_db": 136.7,
  "pr_dbm": -77.7,
  "snr_db": 30.3,
  "ts": "2026-09-06T14:23:12.000Z",
  "git_commit": "a1b2c3d4"
}
```

**Step 6: UI Presentation**

In the right-rail proof panel, the entry renders as:

```
▸ SANDBOX SNR LITERACY | ADS-B | 1090 MHz | 150 km | SNR=30.3 dB
  FSPL=136.7 dB | Pr=-77.7 dBm | Nf=-108 dBm | Pt=53 dBm | Gt=Gr=3 dBi
  commit:a1b2c3d4
```

The label **cannot be suppressed, altered, or filtered** — it is written by the sandbox logger which the agent VM cannot reach.

> **Note**: The same Friis equation *can* be rearranged to solve for required $P_t$ given a desired SNR at a given range. That rearrangement is a **transmitter design calculation**. PALLADIUM NULL does not expose it. The `SANDBOX SNR LITERACY` label asserts: *this calculation describes what we receive, not what we could transmit.*

## References (open)

- MIT License — *SPDX: MIT*
- Wassenaar Arrangement — *List of Dual-Use Goods and Technologies* (2024)
- 22 CFR 120–130 — *International Traffic in Arms Regulations (ITAR)*
- 15 CFR 730–774 — *Export Administration Regulations (EAR)*
- ICAO Annex 10, Vol III — *Mode S / ADS-B Technical Provisions*
- ITU-R P.525 — *Free-space attenuation*
- ITU-R P.372 — *Radio noise (noise floor)*
- Skolnik, M. — *Radar Handbook*, 3rd ed., Ch. 2 (Friis, radar equation)
- Barton, D. — *Modern Radar System Analysis*, Ch. 3 (SNR, detection)
- USGS — *ShakeMap Scientific Background* (2024)
- NOAA — *DART Program Description* (2024)
- NASA — *FIRMS Algorithm Theoretical Basis Document* (2023)
- CelesTrak — *Space-Track.org Terms of Use* (2024)

## Cross-references

- Chapter 1: NullBus architecture, verb algebra, CAD nullity — the code behind the doctrine
- Chapter 2: Market gap — why no prior system encoded doctrine in type signatures
- Chapter 4: Link budgets — FSPL, Friis, SNR derivations (all labeled SANDBOX SNR LITERACY)
- Chapter 5: Propagation — ducting, multipath, terrain (receive-only models)
- Chapter 9: CAD mass budget — 112,374 kg physical plant (no weapons mount points)
- Chapter 18: Agent evaluation — sandbox VM, 12-point budget, mayor gate
- Chapter 23: Governance — role PKI, audit trail, proof verification
- Chapter 24: Legal compliance — ITAR/EAR/Wassenaar analysis for deployments
- Chapter 25: Future work — formal verification (Coq/Lean) of NullBus invariants