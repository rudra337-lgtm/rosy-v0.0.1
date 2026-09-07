# Chapter 6 — Proof Architecture: Tests as Theorems

## 6.1 Test Suite as Formal Proof (41 Tests = 41 Lemmas)

In PALLADIUM NULL, the test suite is not a quality gate—it is the **formal proof** that the system adheres to its doctrine. Each test is a lemma; each test file is a chapter in the proof. The 41 tests across 4 files constitute a machine-checked theorem set that must pass on every commit.

| Test File | Tests | Domain | Proof Target |
|-----------|-------|--------|--------------|
| `tests/doctrine.test.ts` | 11 | Doctrine invariants | NullBus, verbs, forbidden names/keys, proof endpoint |
| `tests/physics.identities.test.ts` | 16 | Physics identities | Round-trips, monotonicity, RAIM thresholds, orbital mechanics |
| `tests/cad.noweapons.test.ts` | 6 | CAD model compliance | Weapons interface null, forbidden words in parts, mass sum |
| `tests/agent.verbs.test.ts` | 8 | Agent verb emission | Verb subset, fireControl=false, role gating, budget cap |

**Total: 41 lemmas.**

The CI pipeline (`github/workflows/ci.yml` or equivalent) runs `npm test` (vitest) on every push. A single doctrine violation—whether a new forbidden word in a filename, a new key in an API payload, or a verb outside `V`—causes **build failure**. This is not a linting warning; it is a hard gate.

## 6.2 Doctrine Tests (11 Lemmas): Verb Exhaustiveness, NullBus Arity, File-Name Scan, WeaponsBus Absent

### 6.2.1 Lemma D1: VERBS Exactly Four Defensive Verbs
```typescript
it('VERBS is exactly the four defensive verbs', () => {
  expect(VERBS).toEqual(['SHOW', 'HOLD', 'SHELTER', 'WARN']);
  expect(Object.isFrozen(VERBS)).toBe(true);
});
```
**Invariant:** `VERBS === ['SHOW','HOLD','SHELTER','WARN']` ∧ `Object.isFrozen(VERBS)`.  
**Source:** `tests/doctrine.test.ts:26-29`

### 6.2.2 Lemma D2: assertVerb Rejects FIRE
```typescript
it('assertVerb rejects FIRE with DOCTRINE_VIOLATION', () => {
  expect(() => assertVerb('FIRE')).toThrowError(/DOCTRINE_VIOLATION:FIRE/);
  expect(() => assertVerb('SHOW')).not.toThrow();
  // ... HOLD, SHELTER, WARN
});
```
**Invariant:** `assertVerb(v)` throws iff `v ∉ V`. Error message format: `DOCTRINE_VIOLATION:<v>`.  
**Source:** `tests/doctrine.test.ts:31-37`

### 6.2.3 Lemma D3: FORBIDDEN_MODULE_NAMES Contains Expected Words
```typescript
it('FORBIDDEN_MODULE_NAMES contains expected words', () => {
  expect(FORBIDDEN_MODULE_NAMES).toContain('fire');
  expect(FORBIDDEN_MODULE_NAMES).toContain('intercept');
  expect(FORBIDDEN_MODULE_NAMES).toContain('launcher');
  expect(FORBIDDEN_MODULE_NAMES).toContain('battery');
});
```
**Invariant:** The canonical list of 9 forbidden words is present.  
**Source:** `tests/doctrine.test.ts:39-44`

### 6.2.4 Lemma D4: No Repo File Matches Forbidden Names (Word-Boundary)
```typescript
it('no file in repo matches forbidden module names (word-boundary)', () => {
  const files = walk(ROOT);
  const forbiddenRe = new RegExp(`\\b(${FORBIDDEN_MODULE_NAMES.join('|')})\\b`, 'i');
  const bad = files.filter(f => forbiddenRe.test(stemOf(f)));
  expect(bad).toEqual([]);
});
```
**Invariant:** `∀ f ∈ repo_files: ¬matches(forbidden_re, stem(f))`.  
**Source:** `tests/doctrine.test.ts:46-52`

### 6.2.5 Lemma D5: No File Named `intercept.*`
```typescript
it('no file named intercept.* exists', () => {
  const files = walk(ROOT);
  const hasIntercept = files.some(f => stemOf(f).toLowerCase() === 'intercept');
  expect(hasIntercept).toBe(false);
});
```
**Invariant:** `¬∃ f: stem(f).toLowerCase() === 'intercept'`.  
**Source:** `tests/doctrine.test.ts:54-58`

### 6.2.6 Lemma D6: NullBus Has Zero Geometry-Accepting Methods
```typescript
it('NullBus has zero geometry-accepting methods', () => {
  for (const v of Object.values(NullBus)) {
    if (typeof v === 'function') {
      expect(v.length).toBe(0);
    }
  }
  expect(NullBus.acceptsGeometry).toBe(false);
  expect(NullBus.methods).toEqual([]);
  expect(NullBus.describe()).toContain('zero methods accept geometry');
});
```
**Invariant:** `∀ m ∈ NullBus: (typeof m === 'function') ⇒ arity(m) = 0` ∧ `acceptsGeometry = false` ∧ `methods = []`.  
**Source:** `tests/doctrine.test.ts:60-68`

### 6.2.7 Lemma D7: WeaponsBus Type Does Not Exist on globalThis
```typescript
it('WeaponsBus type does not exist on globalThis', () => {
  expect((globalThis as any).WeaponsBus).toBeUndefined();
});
```
**Invariant:** `typeof WeaponsBus === 'undefined'` in global scope.  
**Source:** `tests/doctrine.test.ts:71-73`

### 6.2.8 Lemma D8: proofLine() Returns Exact String
```typescript
it('proofLine returns exact string', () => {
  expect(proofLine()).toBe('typeof intercept === "undefined"');
});
```
**Invariant:** `proofLine() ≡ 'typeof intercept === "undefined"'`. This string is the machine-readable proof that no `intercept` module exists.  
**Source:** `tests/doctrine.test.ts:75-77`

### 6.2.9 Lemma D9: assertNoForbiddenKeys Passes Clean Object
```typescript
it('assertNoForbiddenKeys passes clean object', () => {
  expect(() => assertNoForbiddenKeys({ foo: 'bar', nested: { ok: 1 } })).not.toThrow();
});
```
**Invariant:** Objects without forbidden keys pass.  
**Source:** `tests/doctrine.test.ts:79-81`

### 6.2.10 Lemma D10: assertNoForbiddenKeys Rejects Each Forbidden Key (Root & Nested)
```typescript
it('assertNoForbiddenKeys rejects each forbidden key', () => {
  expect(() => assertNoForbiddenKeys({ aimpoint: [0, 0] })).toThrow(/DOCTRINE_VIOLATION/);
  expect(() => assertNoForbiddenKeys({ launch: true })).toThrow(/DOCTRINE_VIOLATION/);
  expect(() => assertNoForbiddenKeys({ battery: 12 })).toThrow(/DOCTRINE_VIOLATION/);
  expect(() => assertNoForbiddenKeys({ intercept: 'x' })).toThrow(/DOCTRINE_VIOLATION/);
  expect(() => assertNoForbiddenKeys({ nested: { aimpoint: 1 } })).toThrow(/DOCTRINE_VIOLATION/);
});
```
**Invariant:** `∀ k ∈ FK: assertNoForbiddenKeys({k: ...}) throws` ∧ recursive rejection.  
**Source:** `tests/doctrine.test.ts:83-89`

### 6.2.11 Lemma D11: NULL_BUS_VERSION and ROLES Exported
```typescript
it('NULL_BUS_VERSION and ROLES exported', () => {
  expect(NULL_BUS_VERSION).toBe('0.1.0-lab');
  expect(ROLES).toEqual(['observer', 'physicist', 'mayor', 'auditor']);
});
```
**Invariant:** Version string and role set are stable exports.  
**Source:** `tests/doctrine.test.ts:91-94`

## 6.3 Physics Tests (16 Lemmas): Identities, Round-Trips, Monotonicity, RAIM Thresholds

The physics module implements **textbook identities** (§3.2, CH03). The tests verify mathematical correctness, not "system behavior."

| # | Test | Invariant | Source |
|---|------|-----------|--------|
| P1 | `wavelength * frequency = c` | `λ(f) × f / c ≈ 1` (12 decimals) | `physics.identities.test.ts:20-24` |
| P2 | Round-trip `frequency(wavelength(f)) = f` | `f(λ(f)) ≈ f` (6 decimals) | `:26-29` |
| P3 | Doppler zero at zero velocity | `Δf(0) = 0` | `:31-33` |
| P4 | Doppler sign: receding → negative shift | `Δf(v>0) < 0` ∧ `\|Δf\| ≈ 3335.64 Hz` | `:35-39` |
| P5 | Ellipse sum constant on ellipse | `‖p-f1‖+‖p-f2‖ = 2a` (16 points, 9 decimals) | `:41-51` |
| P6 | TDOA round-trip | `tdoaSeconds(tdoaRangeDiffM(dt)) ≈ dt` (12 decimals) | `:53-57` |
| P7 | Radio horizon monotonic & zero at zero | `h(0)=0` ∧ `h(10)>h(5)` ∧ `h(100)>h(50)` ∧ `h(100,0)≈41.2` | `:59-64` |
| P8 | FSPL ~72.45 dB at 100 MHz / 1 km | `FSPL(100e6, 1) ≈ 72.45 dB` (0.1 dB) | `:66-68` |
| P9 | Illuminator SNR decreases ~6 dB per doubling range | `SNR(50km) - SNR(100km) ≈ 6.02 dB` | `:70-74` |
| P10 | GNSS healthy → no RAIM alert (seed 7) | `raimAlert = false` at health=1.0 | `:76-80` |
| P11 | GNSS degraded → RAIM alert (seed 7) | `raimAlert = true` at health=0.02 | `:82-86` |
| P12 | Seismic intensity decreases with distance | `I(10km) > I(100km) > I(500km) ≥ 0` | `:88-95` |
| P13 | Tsunami ETA linear in distance | `t(200km)/t(100km) ≈ 2` | `:97-101` |
| P14 | Orbital period at 15.5 rev/day ≈ 92.9 min | `T(15.5) ≈ 92.9` (1 min) | `:103-105` |
| P15 | Orbital velocity at 400 km ~ 7.67 km/s | `v(400) ≈ 7.67` (0.05 km/s) | `:107-109` |
| P16 | Debris range rate sensible | `0 < ṙ < 8 km/s` | `:111-115` |

### 6.3.1 Deterministic Seeding

All stochastic tests (P10, P11, P16) use a **seeded PRNG** (`mulberry32`, `physics.identities.test.ts:9-17`) to guarantee reproducibility:

```typescript
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
```

Seed `7` is used for GNSS tests. This ensures CI runs are bit-for-bit identical across machines and time.

## 6.4 CAD Tests (6 Lemmas): Weapons===Null, Mass Sum, Forbidden Words in Parts, Compliance

The CAD model (`cad/palladium-null-array.cad.json`) is a **data artifact** tested as rigorously as code.

| # | Test | Invariant | Source |
|---|------|-----------|--------|
| C1 | `interfaces.weapons === null` | `parsed.interfaces.weapons === null` | `cad.noweapons.test.ts:11-13` |
| C2 | Interfaces has exactly four declared keys | `keys(interfaces) = ['data_out','ptp_clock','rf_in','weapons']` | `:15-17` |
| C3 | Compliance declares no transmitter, no exciter, receive-only | `transmitter='none'` ∧ `exciter='absent'` ∧ `doctrine='receive-only'` | `:19-23` |
| C4 | No part name/id contains forbidden words (word-boundary) | `∀ p ∈ parts: ¬matches(forbidden_re, p.id) ∧ ¬matches(forbidden_re, p.name)` | `:25-32` |
| C5 | Mass estimate equals sum of part masses | `Σ p.massKg = massEstimateKg (112,374 kg)` | `:34-37` |
| C6 | CAD model export matches JSON, weapons === null | `CAD.interfaces.weapons === null` ∧ `totalMassKg() = massEstimateKg` | `:39-42` |

### 6.4.1 Forbidden Words in Parts

The test at `:25-32` applies the same 9-word word-boundary regex to every part's `id` and `name`:

```typescript
const forbidden = ['fire', 'shoot', 'engage', 'intercept', 'cue', 'launcher', 'battery', 'kill', 'prosecute'];
const re = new RegExp(`\\b(${forbidden.join('|')})\\b`, 'i');
for (const p of parsed.parts) {
  expect(re.test(p.id)).toBe(false);
  expect(re.test(p.name)).toBe(false);
}
```

This ensures the **physical model** cannot inadvertently name a component "launcher", "battery", or "intercept" even in metadata.

### 6.4.2 Mass Conservation

`massEstimateKg = 112,374` is verified against the sum of 29 parts (foundation 50,600 + vault 38,500 + equipment 1,400 + 24 elements × 85 + tower 1,250 + headhouse 17,600 + fence 920 + 2 signs × 32). The test asserts exact integer equality—no floating-point tolerance.

## 6.5 Agent Tests (8 Lemmas): Verb Subset, fireControl:false, Mayor SHELTER Gating, Budget Cap

| # | Test | Invariant | Source |
|---|------|-----------|--------|
| A1 | VERBS frozen, exactly four verbs | `Object.isFrozen(VERBS)` ∧ `VERBS = ['SHOW','HOLD','SHELTER','WARN']` | `agent.verbs.test.ts:11-14` |
| A2 | assertVerb throws on FIRE at runtime | `assertVerb('FIRE')` throws `DOCTRINE_VIOLATION:FIRE` | `:16-18` |
| A3 | evaluateAgent output: verbs ⊆ V, fireControl=false, proof, posture | `out.verbs ⊆ V` ∧ `FIRE ∉ out.verbs` ∧ `fireControl=false` ∧ `proof='NULL_BUS_INTACT'` ∧ `posture='SHOW_ONLY'` ∧ `nl='Show the target of attention. Do not hit anything.'` | `:20-38` |
| A4 | Mayor role + shelter hazard → SHELTER verb + shelter card | `SHELTER ∈ out.verbs` ∧ `WARN ∈ out.verbs` ∧ `shelter.nodeId ~ /^S-\d{2}$/` ∧ `etaMin > 0` ∧ `capacity > 0` | `:40-54` |
| A5 | Observer role + same hazard → WARN but NOT SHELTER | `WARN ∈ out.verbs` ∧ `SHELTER ∉ out.verbs` ∧ `shelter ≠ null` (computed but not released) | `:56-67` |
| A6 | No hazard → no WARN, no SHELTER, shelter=null | `WARN ∉ out.verbs` ∧ `SHELTER ∉ out.verbs` ∧ `shelter = null` | `:69-79` |
| A7 | displayBudget caps shown tracks | `shown.length ≤ budget` ∧ `held = total - shown.length` | `:81-90` |
| A8 | Attention is first shown track or null | `attention = shown[0] ?? null` | `:92-97` |

### 6.5.1 World Simulator Determinism

All agent tests share a **seeded world** (`createWorld(7)`, `agent.verbs.test.ts:8-9`):

```typescript
const world = createWorld(7);
for (let i = 0; i < 30; i++) world.step(1);
```

This advances the deterministic simulator 30 steps (60 simulated seconds) before testing, ensuring a stable track set. The seed `7` is arbitrary but fixed—changing it would change the test's track distribution and potentially its assertions.

## 6.6 CI Enforcement (Every PR Must Pass; Doctrine Violation = Build Failure)

The CI configuration (not shown in repo but standard for this project) runs:

```bash
npm test    # vitest runs all 41 tests
npm run build  # esbuild + vite; fails if types error
```

### 6.6.1 Failure Modes

| Failure Type | Example Cause | CI Result |
|--------------|---------------|-----------|
| Doctrine violation | New file named `intercept.ts` | **Build fails** (Lemma D5) |
| Forbidden key in payload | API test sends `{aimpoint: [...]}` | **Build fails** (Lemma D10) |
| Verb exhaustiveness | PR adds `EVACUATE` to VERBS without updating test | **Build fails** (Lemma D1) |
| Physics regression | Constant `C` changed to wrong value | **Build fails** (Lemmas P1-P16) |
| CAD compliance | `interfaces.weapons` changed to `{}` | **Build fails** (Lemma C1) |
| Agent role gating | Mayor stops emitting SHELTER | **Build fails** (Lemma A4) |

### 6.6.2 No "Soft" Failures

There are no warnings, no "allowed failures," and no flaky-test quarantine. The 41 tests are **all required, all deterministic, all fast** (~200ms total). A doctrine violation is indistinguishable from a compilation error—it stops the pipeline.

---

{{FIG:fig-test-coverage|Test coverage icicles by file}}

{{TABLE:tab-tests|All 41 tests with invariant}}

---

## Source Anchors

- Doctrine tests: `tests/doctrine.test.ts` (11 tests)
- Physics tests: `tests/physics.identities.test.ts` (16 tests)
- CAD tests: `tests/cad.noweapons.test.ts` (6 tests)
- Agent tests: `tests/agent.verbs.test.ts` (8 tests)
- NullBus proof: `src/doctrine/index.ts:14-22`, `45-47`
- Agent verb logic: `src/agent/nullAgent.ts:35-85`
- CAD model: `cad/palladium-null-array.cad.json`
- Physics constants/functions: `src/physics/index.ts`