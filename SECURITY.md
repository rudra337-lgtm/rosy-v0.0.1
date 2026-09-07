# Security Policy — PALLADIUM NULL

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x-lab | ✅ Lab / research |

## Reporting a Vulnerability

Open a **GitHub Security Advisory** (private) at:
https://github.com/your-org/palladium-null/security/advisories/new

Or email: `security@palladium-null.example`

We will acknowledge within 48 hours and coordinate disclosure.

## Scope

This project is **defensive civil-defense software**. Its attack surface is intentionally minimal:

- **No network services** that accept untrusted input beyond the documented API (`/api/*`).
- **No fire-control, weapon, or effector interfaces** — the type system forbids them.
- **No transmitter/emitter control** — hardware abstraction does not exist.
- **Open data only** — adapters consume public feeds; no credentialed ingestion.

### In Scope
- Denial-of-service via API flood
- Prototype pollution / injection in `/api/agent/evaluate` (guarded by `assertNoForbiddenKeys`)
- XSS via track labels in UI (mitigated by `escapeHtml`)
- Dependency supply-chain (monitored via `npm audit`)

### Out of Scope
- Weaponization of the codebase (by design impossible — see `ETHICS.md`)
- RF emitter control (no such abstraction exists)
- Classified data handling (not supported)

## Hardening

- `npm audit` runs in CI
- SBOM generated at build (`@cyclonedx/bom` — optional)
- Reproducible build: `npm run build` → deterministic `dist/` + `dist-server/`
- Zero-trust roles: `observer`, `physicist`, `mayor`, `auditor` — no `weapons-officer`

## Disclosure Timeline

1. Report received → 48h acknowledgment
2. Triage → 7 days for severity assessment
3. Fix development → target 30 days for `lab` versions
4. Coordinated disclosure → publish advisory + patch release

## Recognition

Contributors of valid security reports will be credited in `SECURITY.md` and release notes (unless anonymity requested).