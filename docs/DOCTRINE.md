# Doctrine — PALLADIUM NULL (Formal Proof Sketch)

## Definitions

- **Verb Set** `V = {SHOW, HOLD, SHELTER, WARN}` — frozen `Object.freeze`, exhaustive.
- **NullBus** `NB` — singleton with `methods = []`, `acceptsGeometry = false`, `version = "0.1.0-lab"`.
- **Forbidden Module Names** `FMN = {fire, shoot, engage, intercept, cue, launcher, battery, kill, prosecute}` (word-boundary).
- **Forbidden Keys** `FK = {aimpoint, launch, battery, intercept}` — deep-schema rejection.
- **Agent Output** `O = {shown, held, attention, shelter, verbs⊆V, log, proof="NULL_BUS_INTACT", fireControl=false, posture="SHOW_ONLY", nl}`.

## Lemmas

### Lemma 1 (Verb Enum Exhaustiveness)
`VERBS` is a `const` tuple `['SHOW','HOLD','SHELTER','WARN']`.  
`assertVerb(v)` throws `DOCTRINE_VIOLATION:v` iff `v ∉ V`.  
`evaluateAgent` emits only verbs validated by `assertVerb`.  
**Test:** `tests/agent.verbs.test.ts` asserts `out.verbs ⊆ V` and `FIRE ∉ out.verbs`.

### Lemma 2 (NullBus Geometry Absence)
`NullBus` is a frozen object. Every value that is a function has `length === 0` (arity zero).  
No method accepts a geometry argument (no `Vector3`, `Track`, `Position`, `Aimpoint` types in signature).  
`NullBus.acceptsGeometry === false`.  
**Test:** `tests/doctrine.test.ts` iterates `Object.values(NullBus)` and asserts arity zero.

### Lemma 3 (CAD Weapons Interface Null)
`CAD.interfaces.weapons === null` (JSON literal).  
`tests/cad.noweapons.test.ts` asserts `JSON.parse(fs.readFileSync(...)).interfaces.weapons === null`.

### Lemma 4 (Forbidden Module Names Absent)
`walk(ROOT)` collects all file paths excluding `node_modules`, `.git`, `dist`, `dist-server`, `.tooling`.  
Regex `\b(fire|shoot|engage|intercept|cue|launcher|battery|kill|prosecute)\b` (case-insensitive) matches **zero** file stems.  
Explicitly: no file named `intercept.*`.  
**Test:** `tests/doctrine.test.ts`.

### Lemma 5 (Forbidden Keys Rejected)
`assertNoForbiddenKeys(obj, path)` recursively scans `obj`.  
Throws `DOCTRINE_VIOLATION` if any key (case-insensitive) equals one of `FK`.  
Applied at `/api/agent/evaluate` boundary and in `tests/agent.verbs.test.ts` on input/output.

### Lemma 6 (Agent Fire-Control Absence)
`evaluateAgent` returns `fireControl: false` (literal), `posture: "SHOW_ONLY"`, `proof: "NULL_BUS_INTACT"`.  
No code path sets `fireControl: true`.  
**Test:** `tests/agent.verbs.test.ts` asserts `out.fireControl === false` on all role/hazard combos.

### Lemma 7 (Proof Endpoint)
`GET /api/proof` returns:
```json
{
  "interceptModule": false,
  "weaponsBus": null,
  "typeofIntercept": "undefined",
  "cadWeaponsInterface": null,
  "forbiddenModuleNamesPresent": [],
  "doctrineProof": "typeof intercept === \"undefined\""
}
```
**Test:** Manual `curl` + `tests/doctrine.test.ts` validates `proofLine()`.

## Theorem (No Fire Path)

**Statement:** The PALLADIUM NULL codebase contains no computable path from sensor input to fire-control output.

**Proof Sketch:**

1. By Lemma 1, the only verbs the agent can emit are `V`. `FIRE ∉ V` by construction; `assertVerb` enforces this at runtime.
2. By Lemma 2, `NullBus` cannot carry geometry. No method exists that could transport an aimpoint, launch vector, or intercept solution.
3. By Lemma 3, the CAD model explicitly declares `interfaces.weapons === null` — the physical interface for fire-control is absent in the digital twin.
4. By Lemma 4, no module (file) in the repository implements forbidden functions. The filesystem itself is constrained.
5. By Lemma 5, the API boundary rejects any payload containing fire-control keys (`aimpoint`, `launch`, `battery`, `intercept`).
6. By Lemma 6, the agent’s output schema statically fixes `fireControl: false` and `posture: "SHOW_ONLY"`.
7. By Lemma 7, the running service exposes a proof endpoint that mechanically verifies `typeof intercept === "undefined"`.

Therefore, **this binary cannot compute intercept**. The harm path is absent by construction, enforced by the type system, the test suite, the CAD model, the API schema, and the running proof endpoint.

∎

## Amendment Process

To propose a doctrine change (e.g., new defensive verb `EVACUATE`):
1. Open issue with `doctrine-change` label
2. Update `VERBS` tuple + `assertVerb` + `ROLES` if needed
3. Update `tests/doctrine.test.ts` + `tests/agent.verbs.test.ts`
4. Update `docs/DOCTRINE.md` proof sketch
5. Require 2× doctrine-review approval + passing CI
6. Version bump: `0.x.0-lab` (breaking) or `0.1.x-lab` (additive defensive)

**No offensive verb will ever be accepted.**