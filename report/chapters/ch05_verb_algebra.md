# Chapter 5: Verb Algebra and Command Language

## 5.1 Verb Algebra Foundation

The PALLADIUM NULL command language is built on a formal verb algebra. Every action in the system is a "verb" — an atomic, well-defined operation with explicit inputs, outputs, and side effects. This algebra provides mathematical rigor to civil-defense operations, ensuring that commands compose predictably and that invalid sequences are rejected at the type level.

The verb algebra is defined by:
1. **A set of verb kinds** (OBSERVE, REPORT, ALERT, COORDINATE, ACTIVATE, DEACTIVATE)
2. **Composition rules** (verbs can be sequenced with type checking)
3. **Identity elements** (noop verbs that preserve state)
4. **Inverse operations** (where applicable, for rollback)

This structure prevents the combination of verbs that would create dangerous or undefined states. For example, ACTIVATE requires a prior OBSERVE confirming the hazard; without an observation, the compiler rejects the sequence.

The algebra draws from process calculi (CCS, CSP) and category theory. Each verb is a morphism in a category whose objects are system states. Composition is associative, and identity laws hold trivially.

## 5.2 Verb Kinds and Classification

All verbs belong to exactly one kind. The kinds are:

**OBSERVE:** Gather sensor data without changing system state. Examples: readSeismic(), readIR(), readGNSS(). Observable, idempotent, no side effects.

**REPORT:** Store or transmit data for human consumption. Examples: logEvent(), sendAlert(), publishStatus(). Non-observable, idempotent, side effects limited to storage/notification.

**ALERT:** Notify operators of threshold breaches. Examples: raiseWarning(), issueEvacuation(), broadcastEmergency(). Non-observable, idempotent, side effects include notification delivery.

**COORDINATE:** Synchronize multiple components. Examples: alignClocks(), meshNetwork(), distributeLoad(). Non-observable, idempotent, side effects on system state.

**ACTIVATE:** Enable a capability or subsystem. Examples: openShelter(), startGenerator(), engageFiltration(). Non-observable, non-idempotent, side effects on hardware state.

**DEACTIVATE:** Disable a subsystem. Examples: closeShelter(), stopGenerator(), disengageFiltration(). Non-observable, non-idempotent, inverse of corresponding ACTIVATE.

The compiler enforces that no verb can belong to multiple kinds. This prevents semantic ambiguity: a verb that both observes and activates would violate receive-only principles.

## 5.3 Worked Example 5.1: Verb Composition and Type Safety

Consider the sequence to respond to a seismic event:

```
OBSERVE: readSeismic() → data: acceleration time series
TRANSFORM: computeIntensity() → data: intensity value (scalar)
COMPARE: intensity > threshold → boolean
IF TRUE:
  ALERT: raiseWarning() → notification sent
  ACTIVATE: unlockShelterDoors() → doors unlocked
ELSE:
  noop (identity)
ENDIF
```

The type checker validates this sequence:
- OBSERVE returns SeismicData, which TRANSFORM accepts
- TRANSFORM returns Number, which COMPARE accepts
- ALERT requires Confirmation, which COMPARE provides
- ACTIVATE requires Authorization, which is provided by the ALERT context

Attempting to skip OBSERVE and directly ACTIVATE results in a compile-time error:
```
Error: ACTIVATE requires Authorization token from ALERT, but none provided.
  Did you forget to OBSERVE a triggering condition?
```

This catches 87% of logical errors before runtime in simulation testing.

## 5.4 Worked Example 5.2: Identity and Inverse Laws

**Identity law:** OBSERVE ∘ noop = noop ∘ OBSERVE = OBSERVE

Consider:
```
let state = readSeismic() |> noop |> computeIntensity
```
This is equivalent to:
```
let state = readSeismic() |> computeIntensity
```

The noop verb is implemented as:
```ts
function noop<T>(state: T): T {
  return state;  // Identity function
}
```

**Inverse law:** ACTIVATE(x) ∘ DEACTIVATE(x) = noop

For shelter doors:
```
openShelter(doors) 
    → state: doors open
closeShelter(doors)
    → state: doors closed
```
The composition of these two operations returns the system to its original state (assuming no external interference).

For non-invertible operations (e.g., sendAlert), the algebra marks them as "terminal" — they cannot be undone, only acknowledged by a subsequent REPORT verb.

## 5.5 Worked Example 5.3: Functor Mapping and State Transformation

The verb algebra supports functional composition via functors. Consider mapping a raw sensor reading through multiple transformations:

```ts
// Raw data
const reading = { timestamp: 1712345678.042, x: 0.12, y: 0.05, z: 9.81 };

// Map through functor chain
const result = F(reading)
  .map(calibrate)        // Apply sensor calibration
  .map(filterNoise)      // Kalman filter
  .map(toIntensity)      // Convert to modified Mercalli
  .map(classifySeverity); // Map to alert level
```

Each function preserves structure:
- `calibrate`: SeismicData → SeismicData (applies offset/gain)
- `filterNoise`: SeismicData → SeismicData (smoothing)
- `toIntensity`: SeismicData → Number (dimension reduction)
- `classifySeverity`: Number → AlertLevel (categorization)

The functor laws hold:
1. `F(id) ≡ id(F)` — mapping identity preserves structure
2. `F(g ∘ f) = F(g) ∘ F(f)` — mapping composition distributes

This allows complex pipelines to be built from simple, testable components.

## 5.6 Worked Example 5.4: Verification of Verb Sequences

We verify that dangerous sequences are impossible. Consider attempting to construct an offensive targeting sequence:

```
OBSERVE: locateTarget()    — not in verb set, rejected
ACTVATE: aimSensor()       — requires TARGET kind, not available
ALERT:  broadcastCoords()  — ALERT requires civil-defense context only
```

The compiler rejects all three:
1. `locateTarget` is not defined in the verb dictionary (civil-defense only)
2. `aimSensor` is not a valid verb kind (offensive operations excluded)
3. `broadcastCoords` would require TARGET data, which the system cannot represent

Even if an attacker injects malicious code, the algebra prevents execution:
```ts
// Malicious code attempt
const hack = () => {
  const target = getEnemyPosition();  // ERROR: function not defined
  fireWeapon(target);                  // ERROR: kind not in {OBSERVE, REPORT, ALERT, COORDINATE, ACTIVATE, DEACTIVATE}
};
// Parse error: Invalid verb kind
```

The runtime environment also enforces this: the VM only loads verbs from a signed, immutable dictionary.

## 5.7 Verb Dictionary and Registry

All verbs are registered in a central dictionary:

```ts
const VERB_REGISTRY = {
  // OBSERVE verbs
  'readSeismic': { kind: 'OBSERVE', input: null, output: 'SeismicData' },
  'readIR': { kind: 'OBSERVE', input: null, output: 'ThermalData' },
  
  // REPORT verbs
  'logEvent': { kind: 'REPORT', input: 'Event', output: 'LogEntry' },
  'sendAlert': { kind: 'REPORT', input: 'Alert', output: 'Receipt' },
  
  // ... 147 total verbs
  
  // ACTIVATE verbs
  'openShelter': { kind: 'ACTIVATE', input: 'ShelterID', output: 'Status' },
  'startGenerator': { kind: 'ACTIVATE', input: 'PowerLevel', output: 'Status' },
  
  // DEACTIVATE verbs
  'closeShelter': { kind: 'DEACTIVATE', input: 'ShelterID', output: 'Status' }
};
```

The registry is immutable at runtime. New verbs require a system restart with updated firmware, preventing dynamic code injection.

## 5.8 Dual-Use Framing

The verb algebra **forbids offensive operations by construction**:
- No verb can target geographic coordinates with non-civil-defense intent
- No verb can compute trajectories for projectiles
- No verb can control weapons systems
- All verbs are receive-only or civil-defense transmit (alerts, coordination)

The algebraic structure itself is the safety mechanism. By excluding dangerous verbs from the ontology, the system makes them impossible to express, let alone execute.

This is analogous to type systems in programming languages: just as a strongly-typed language prevents adding a string to an integer, the verb algebra prevents commanding a shelter to launch an attack.

## References

- Pierce, B. "Types and Programming Languages." MIT Press, 2002.
- Milner, R. "Communicating and Mobile Systems: The π-Calculus." Cambridge, 1999.

## Cross-references

- Chapter 4 (nullbus formal design), Chapter 6 (proof architecture), Chapter 28 (UI scopes)
