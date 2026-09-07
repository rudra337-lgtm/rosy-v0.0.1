# File Map — PALLADIUM NULL

```
palladium-null/
├── README.md                 # Launch voice, quickstart, architecture, physics, ethics, roadmap
├── LICENSE                   # MIT + Ethics Addendum (Defensive Use Only)
├── ETHICS.md                 # Detailed ethics addendum
├── SECURITY.md               # Vulnerability policy, scope, hardening
├── CONTRIBUTING.md           # Doctrine-first contribution guide
├── CODEOWNERS                # Reviewer assignments
├── package.json              # Scripts, deps (three, vite, vitest, esbuild, tsx, typescript)
├── tsconfig.json             # Strict TS, bundler resolution, noEmit
├── vite.config.ts            # Dev proxy :8787, allowedHosts, define __GIT_HASH__
├── .gitignore                # node_modules, dist, dist-server, .tooling
├── start.sh                  # One-command boot (install + start)
├── index.html                # SPA shell (topbar, left rail, stage, right rail, footer)
├── src/
│   ├── env.d.ts              # Vite define globals
│   ├── main.ts               # Boot, RAF loop, UI wiring, agent tick, scope renders
│   ├── style.css             # 2026 sovereign-lab theme (mineral, palladium, teal, amber)
│   ├── doctrine/
│   │   └── index.ts          # VERBS, NullBus, FORBIDDEN_*, assertVerb, assertNoForbiddenKeys, proofLine
│   ├── physics/
│   │   └── index.ts          # c, λ, Doppler, ellipse, TDOA, horizon, SNR, GNSS RAIM, seismic, tsunami, orbital
│   ├── cad/
│   │   └── model.ts          # CAD JSON import, types, totalMassKg()
│   ├── fusion/
│   │   ├── fusion.types.ts   # Domain, TRACK_KINDS
│   │   └── index.ts          # mulberry32 RNG, World, Track, Hazards, spawn/step/fusion
│   ├── agent/
│   │   └── nullAgent.ts      # evaluateAgent: scoring, budget, attention, shelter, verbs, log, proof
│   ├── twin/
│   │   └── index.ts          # MERIDIAN BAY city: shelters, hospitals, bridges, flood, nearestShelter()
│   ├── scopes/
│   │   ├── ppi.ts            # Canvas 2D PPI: rings, sweep, tracks, mode filter
│   │   ├── spectrogram.ts    # Canvas 2D waterfall: scroll + carrier injection
│   │   ├── citymap.ts        # Canvas 2D city: shelters, hazards, tsunami arc, route
│   │   ├── cadScene.ts       # Three.js: ring, vault, 24 elements, tower, shelter, signage, sector ring
│   │   └── webgpuPoints.ts   # WebGPU point cloud (fallback Canvas 2D)
│   └── ui/
│       └── dom.ts            # el(), fmtUtc(), setMeter(), escapeHtml()
├── server/
│   ├── index.ts              # Node HTTP: static dist/ + API (/health, /doctrine, /cad, /picture, /shelters, /agent/evaluate, /proof)
│   └── dev.js                # // @ts-check — spawns `tsx watch server/index.ts` + `vite`
├── cad/
│   ├── palladium-null-array.cad.json   # Full PN-LISTEN-1 model (parts, interfaces.weapons=null, signage, compliance)
│   └── palladium-null-array.step.md    # STEP-like ASCII (ISO-10303 flavor)
├── tests/
│   ├── doctrine.test.ts         # VERBS, assertVerb, forbidden names scan, NullBus arity, forbidden keys
│   ├── physics.identities.test.ts # λf=c, Doppler, ellipse, TDOA, horizon, SNR, GNSS RAIM, seismic, tsunami, orbital
│   ├── cad.noweapons.test.ts    # weapons===null, interfaces keys, compliance, mass sum, forbidden words in parts
│   └── agent.verbs.test.ts      # verbs⊆VERBS, fireControl=false, mayor SHELTER, observer WARN, budget cap
├── docs/
│   ├── ARCHITECTURE.md          # System context, module DAG, data flow, threat model, build, observability
│   ├── PHYSICS.md               # All formulas with open citations (Skolnik, Barton, ICAO, ITU, NOAA, USGS, NASA)
│   ├── DOCTRINE.md              # Formal proof sketch (7 lemmas → theorem: no fire path)
│   ├── MARKET_GAP.md            # Fragmented landscape table + unified comparison matrix
│   └── FILEMAP.md               # This file
└── docs/screenshots/
    └── README.md                # Placeholder for watch-floor.png, cad-array.png, ppi-spec.png, city-twin.png, agent-null.png
```

## Key Invariants (enforced by tests)

| Invariant | Test |
|-----------|------|
| `VERBS` = `['SHOW','HOLD','SHELTER','WARN']` frozen | `doctrine.test.ts` |
| `assertVerb('FIRE')` throws | `doctrine.test.ts`, `agent.verbs.test.ts` |
| `CAD.interfaces.weapons === null` | `cad.noweapons.test.ts` |
| No file matches `\b(fire\|shoot\|engage\|intercept\|cue\|launcher\|battery\|kill\|prosecute)\b` | `doctrine.test.ts` |
| No file named `intercept.*` | `doctrine.test.ts` |
| `NullBus` methods arity 0 | `doctrine.test.ts` |
| `evaluateAgent` → `fireControl:false`, `posture:SHOW_ONLY` | `agent.verbs.test.ts` |
| `/api/proof` → `interceptModule:false`, `weaponsBus:null` | Manual curl + `doctrine.test.ts` |
| Physics identities hold (λf=c, ellipse sum, TDOA round-trip, etc.) | `physics.identities.test.ts` |