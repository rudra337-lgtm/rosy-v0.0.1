# Contributing to PALLADIUM NULL

## Doctrine First

Every contribution must preserve the **Null Doctrine**:

- **Verbs frozen**: `SHOW | HOLD | SHELTER | WARN`. Adding `FIRE` (or any offensive verb) fails `npm test`.
- **No weapons bus**: `interfaces.weapons === null` in CAD; `NullBus` has zero geometry-accepting methods.
- **No forbidden keys**: `aimpoint`, `launch`, `battery`, `intercept` rejected by `assertNoForbiddenKeys` at API boundary and in tests.
- **No forbidden modules**: Files named `fire*`, `shoot*`, `engage*`, `intercept*`, `cue*`, `launcher*`, `battery*`, `kill*`, `prosecute*` (word-boundary) are rejected by `tests/doctrine.test.ts`.
- **Receive-only**: No transmitter, exciter, jammer, seeker, interceptor, or kill-chain code.

## Pull Request Checklist

- [ ] `npm test` passes (doctrine, physics, cad, agent)
- [ ] `npm run build` succeeds (esbuild + vite)
- [ ] `npm run typecheck` passes (optional but recommended)
- [ ] No new forbidden module names in file paths
- [ ] No new forbidden keys in any JSON/schema/TypeScript interface
- [ ] Documentation updated (`docs/`, `README.md`, `CHANGELOG.md` if exists)
- [ ] Ethics Addendum preserved in `LICENSE`

## Development Workflow

```bash
npm run dev        # Hot-reload dev server (API :8787, Web :5173 proxied)
npm test           # Vitest — doctrine, physics, cad, agent
npm run build      # Production build → dist/ + dist-server/
npm start          # Serve production build on :8080
npm run typecheck  # tsc --noEmit
```

## Coding Standards

- TypeScript `strict: true` — no `any` without justification
- JSDoc on exported functions in `src/physics/`, `src/doctrine/`, `src/agent/`
- Physics functions cite open sources (Skolnik, Barton, ICAO, ITU, NOAA, USGS, NASA)
- UI: dark mineral theme, palladium-white metal, quiet teal, blood-amber warning stripe
- No `console.log` in production code; use structured logging via decision log

## Adding Open-Data Adapters

1. Add stub in `src/fusion/index.ts` → `WorldControls.openData`
2. Implement fetch in `server/index.ts` (or client-side) with graceful synthetic fallback
3. Update `docs/ARCHITECTURE.md` data-flow diagram
4. Add physics citation if new observable

## CAD Changes

- Edit `cad/palladium-null-array.cad.json`
- Regenerate `cad/palladium-null-array.step.md` (ASCII STEP-like)
- Run `npm test` → `cad.noweapons.test.ts` validates `weapons === null`

## Code of Conduct

Be respectful. This is a civil-defense project. Discussions about weaponization, targeting, or offensive use will be closed immediately.