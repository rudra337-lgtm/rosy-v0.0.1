# Ethics — PALLADIUM NULL

## Defensive Use Only

PALLADIUM NULL is **Null-Doctrine Civil Defense Software (NDCDS)**. Its sole purpose is to fuse open, receive-only observations into a watch floor that can warn a population and direct them to shelter. It **cannot** aim, launch, intercept, or engage.

### Core Commitments

1. **No Fire-Control Path** — The codebase contains no `WeaponsBus`, no `intercept` module, no `aimpoint` type, no `launch` function, no `battery` class, no `cue`/`engage`/`prosecute` verbs. The verb enum is frozen to `SHOW | HOLD | SHELTER | WARN`. Adding `FIRE` is a compile-time and test-time failure.

2. **No Transmitter** — The CAD model (`PN-LISTEN-1`) declares `interfaces.weapons === null` and `compliance.transmitter === "none"`. The equipment vault contains receivers, clocks, fusion, and the NULL BUS — **no exciter cavity exists**.

3. **Receive-Only Physics** — All physics functions are receive-only identities: wavelength, Doppler (display), TDOA geometry, radio horizon, SNR of *illuminators of opportunity* (textbook Friis), GNSS RAIM consistency, seismic intensity decay, tsunami travel time, orbital velocity. No jammer ERP, no seeker SNR, no interceptor Δv.

4. **Open Data Only** — Adapters stub to public sources: OpenSky-class ADS-B, coastal AIS, NOAA METAR, USGS seismic, FIRMS-class wildfire IR, CelesTrak-class TLEs. No restricted feeds.

5. **Agent NULL** — The watchstander only *sheds load* (display budget) and *names attention* (single track of interest). It emits `SHELTER` only to the `mayor` role when a hazard (flood, tsunami, seismic, wildfire) crosses threshold. It never emits `SHOOT`, `ENGAGE`, `FIRE`, `LAUNCH`.

6. **Proof Artifacts** — `GET /api/proof` returns `{ interceptModule: false, weaponsBus: null, typeofIntercept: "undefined" }`. The test suite (`npm test`) fails if any forbidden module, key, or verb appears.

### Dual-Use Acknowledgement

The physics of passive sensing (multistatic range-sum ellipses, TDOA hyperbolas, GNSS integrity monitoring) is inherently dual-use. We acknowledge this danger. This repository exists to demonstrate that **the same physics can be implemented with a formally verified defensive boundary** — and that the boundary can be enforced by the type system, the test suite, and the architecture.

### Responsible Deployment

- Validate all shelter directives against independent civil-defense authority feeds before public release.
- Treat `Agent NULL` output as *advisory*; the `mayor` role is a human-in-the-loop gate.
- Do not connect this software to any fire-control network, weapon datalink, or effector bus.
- Preserve the Ethics Addendum in all forks, containers, and derived works.

### Contact

Security/ethics concerns: open a GitHub Security Advisory or email `security@palladium-null.example`.