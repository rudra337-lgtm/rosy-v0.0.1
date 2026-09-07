# Chapter 02 — Market Gap & Prior Art (2026 Landscape)

## 2.1 Fragments: The Open Sensor Ecosystem

As of 2026, the civil-defense sensor landscape is **fragmented by domain, license, and interface**. No single open platform fuses the six open feeds (air, sea, ground, space, fire, weather) into a coherent operating picture with a formal no-fire guarantee. This section surveys the major open and semi-open services that PALLADIUM NULL integrates as upstream sources.

### 2.1.1 Air: OpenSky Network / ADS-B Exchange

**OpenSky Network** (opensky-network.org) operates the largest open ADS-B receiver network, with >3,000 connected sensors worldwide. It provides:

- **Historical data**: Full-message archive (2014–present), downloadable as Parquet/CSV
- **Live API**: REST + WebSocket, rate-limited (400 req/day anonymous, higher with registration)
- **Coverage**: ~85% of global commercial traffic at FL200+; sparse below 5,000 ft and over oceans
- **License**: Open Database License (ODbL) — requires share-alike for derived databases

**ADS-B Exchange** (adsbexchange.com) offers a commercial API with "unfiltered" data (no military/privacy filtering). Their free tier is limited; enterprise tiers cost $500–5,000/month. Neither service provides fusion with other domains, shelter logic, or a null doctrine.

### 2.1.2 Sea: MarineTraffic / AISHub / exactEarth

**MarineTraffic** (marinetraffic.com) aggregates AIS from >20,000 shore stations and satellites. Features:

- **Vessel database**: 600,000+ vessels, port calls, ETA predictions
- **API**: REST, tiered pricing (free: 100 req/day; paid: $200–10,000/month)
- **Coverage**: Coastal >95%; open ocean ~60% (satellite AIS gaps)
- **License**: Proprietary; no redistribution

**AISHub** (aishub.net) provides raw NMEA streams from volunteer stations. **exactEarth** (now Spire Maritime) offers satellite AIS with global revisit ~1 hr. Neither fuses with air/space/ground domains.

### 2.1.3 Ground: USGS / IRIS / NEIC

**USGS Earthquake Hazards Program** (earthquake.usgs.gov) provides:

- **Real-time feeds**: GeoJSON (past hour/day/week), WebSocket (cometd)
- **ShakeMap**: Instrumental intensity, PGA, PGV, PSA per event
- **Products**: Finite-fault models, aftershock forecasts, PAGER alerts
- **License**: Public domain (U.S. Government work)

**IRIS** (iris.edu) offers waveform data (miniseed), station metadata (StationXML), and derived products. **NEIC** (National Earthquake Information Center) is the USGS authoritative source. These are seismic-only; no air/sea/space fusion.

### 2.1.4 Space: CelesTrak / Space-Track / NASA ODQN

**CelesTrak** (celestrak.org) distributes TLEs (Two-Line Elements) for all tracked objects:

- **GP/GPV data**: Daily updates, 30-day archives
- **Supplements**: Celestrak-specific catalogs (Starlink, OneWeb, debris)
- **License**: Free for non-commercial; commercial requires agreement

**Space-Track** (space-track.org) is the U.S. Space Force official catalog (requires account, ITAR-restricted for some data). **NASA ODQN** (Orbital Debris Quarterly News) publishes debris environment assessments. None provide real-time conjunction screening fused with terrestrial domains.

### 2.1.5 Fire: NASA FIRMS / MODIS / VIIRS

**FIRMS** (Fire Information for Resource Management System, firms.modaps.eosdis.nasa.gov) provides:

- **MODIS**: 1 km resolution, 2x daily (Terra/Aqua)
- **VIIRS**: 375 m resolution, 2x daily (Suomi-NPP, NOAA-20)
- **Delivery**: Active fire hotspots (CSV, shapefile, WMS, API)
- **Latency**: ~3 hrs from observation to publication
- **License**: Public domain (NASA)

FIRMS detects active fires; it does not model perimeter growth, smoke transport, or evacuation routing.

### 2.1.6 Weather: NOAA NEXRAD / NWS / METAR

**NEXRAD Level II** (Amazon S3 open bucket `noaa-nexrad-level2`) provides:

- **Radar moments**: Reflectivity (Z), velocity (V), spectrum width (W)
- **Resolution**: 0.5° azimuth, 250 m range (super-res)
- **Volume scans**: 4–6 min (VCP 12/212/215)
- **License**: Public domain

**METAR/TAF** (aviationweather.gov) provides hourly airport observations and forecasts. **NWS API** (api.weather.gov) serves alerts, forecasts, grid points. Weather is the best-fused domain (NWS + radar + satellite) but remains siloed from seismic/space/fire.

### 2.1.7 Commercial Digital Twins

**Cesium ion**, **ArcGIS Velocity**, **Unity Digital Twin**, **NVIDIA Omniverse** offer 3D visualization and streaming pipelines for multi-source data. They are **platforms, not products** — they require customers to build fusion logic, doctrine, and governance. Licensing is commercial (per-seat, per-GB, per-MAU). None enforce a null constraint; all support military/defense use cases.

{{FIG:web-adsb-globe|Global ADS-B coverage density from OpenSky Network (2024), showing coastal concentration and oceanic gaps}}

{{FIG:web-seismograph|USGS seismic station distribution (IRIS/GSN), highlighting coverage gaps in oceans and polar regions}}

{{FIG:web-dart-buoy|NOAA DART buoy locations (Pacific/Atlantic/Indian Ocean), tsunami travel-time contours from Cascadia subduction zone}}

## 2.2 Why Fusion Remained Absent

Three structural barriers prevented a unified open receive-only picture before PALLADIUM NULL:

### 2.2.1 License Walls

| Source | License | Fusion Blocker |
|--------|---------|----------------|
| OpenSky | ODbL | Share-alike infects derived databases |
| MarineTraffic | Proprietary | No redistribution, no derived works |
| AISHub | Custom | Non-commercial only, no commercial fusion |
| exactEarth/Spire | Commercial | Per-seat, per-vessel, NDAs |
| Space-Track | ITAR/USG | Account required, redistribution prohibited |
| FIRMS | Public domain | ✓ Combinable |
| NEXRAD | Public domain | ✓ Combinable |
| USGS | Public domain | ✓ Combinable |
| CelesTrak | Free non-commercial | Commercial fusion requires agreement |

**Result**: A fused product inheriting ODbL + proprietary + ITAR components cannot be legally distributed as open source. PALLADIUM NULL solves this by **consuming feeds at runtime only** — no redistribution of upstream data. The fused picture is generated on the user's infrastructure from live streams; the compendium documents the *method*, not the *data*.

### 2.2.2 No Open Doctrine

Every existing platform treats doctrine as **configuration**, not **architecture**:

- OpenSky: No doctrine; raw messages only
- MarineTraffic: Commercial rules (privacy, sanctions) baked into API
- USGS: Scientific products; no civil-defense action verbs
- FIRMS: Hotspots only; no shelter/evacuation logic
- CelesTrak: Orbital elements only; no conjunction *action*
- Commercial twins: Doctrine = customer's problem

PALLADIUM NULL encodes doctrine in **type signatures** (NullBus, verb algebra, `interfaces.weapons === null`). The doctrine is not a policy document — it is a compile-time invariant.

### 2.2.3 No Null Constraint

No prior system formalizes **"cannot fire"** as a machine-checked property:

- Military C2 systems (JBC-P, GCCS-J, STC) have fire-control paths by design
- Civilian ATC (ERAM, STARS) have no weapons but no formal proof of absence
- Open-source SDR projects (dump1090, readsb, gr-air-modes) are receive-only by hardware but lack architectural enforcement
- Academic testbeds (OpenRadar, OpenATC) model sensors, not doctrine

The **NullBus singleton with zero geometry-accepting methods** and the **test suite as theorem prover** (`typeof intercept === 'undefined'`) are, to our knowledge, novel in the 2026 landscape.

## 2.3 PALLADIUM NULL's Position

PALLADIUM NULL occupies a unique coordinate in the design space:

| Axis | PALLADIUM NULL | OpenSky | MarineTraffic | USGS/FIRMS | Commercial Twins |
|------|----------------|---------|---------------|------------|------------------|
| Domains fused | 6 (air/sea/ground/space/fire/weather) | 1 (air) | 1 (sea) | 1 each | Configurable |
| Data license | Runtime consumption only | ODbL | Proprietary | Public domain | Customer data |
| Doctrine | Compile-time (NullBus) | None | Commercial | Scientific | Customer-built |
| No-fire proof | Machine-checked (41 tests) | Hardware-only | N/A | N/A | Not enforced |
| Verbs | SHOW/HOLD/SHELTER/WARN (frozen) | N/A | N/A | N/A | Configurable |
| Roles | Observer/Physicist/Mayor/Auditor | N/A | N/A | N/A | RBAC |
| Shelter logic | Built-in (12 zones, 5 km/h) | No | No | No | Custom |
| Deploy target | Portable Node 22 (single binary) | Cloud API | Cloud API | Cloud API | Cloud/K8s |
| Cost | Zero (open source) | Free/paid tiers | Paid tiers | Free | $10k–$1M+ |

**Position statement**: PALLADIUM NULL is the **first and only** open-source, receive-only, multi-domain civil-defense operating picture with a **formal, machine-verified no-fire guarantee** and **built-in shelter doctrine**.

## 2.4 Comparison Table

{{TABLE:tab-market-gap|Feature matrix vs OpenSky, MarineTraffic, USGS, FIRMS, CelesTrak, commercial digital twins}}

| Feature | PALLADIUM NULL | OpenSky | MarineTraffic | USGS ShakeMap | NASA FIRMS | CelesTrak | Commercial Twins |
|---------|----------------|---------|---------------|---------------|------------|-----------|------------------|
| **Air domain (ADS-B)** | ✓ Live + replay | ✓ Live + archive | ✗ | ✗ | ✗ | ✗ | ✓ (connector) |
| **Sea domain (AIS)** | ✓ Live + replay | ✗ | ✓ Live + archive | ✗ | ✗ | ✗ | ✓ (connector) |
| **Ground (seismic)** | ✓ USGS + IRIS | ✗ | ✗ | ✓ Authoritative | ✗ | ✗ | ✓ (connector) |
| **Space (TLE/SGP4)** | ✓ CelesTrak + ODQN | ✗ | ✗ | ✗ | ✗ | ✓ TLEs | ✓ (connector) |
| **Fire (MODIS/VIIRS)** | ✓ FIRMS hotspots | ✗ | ✗ | ✗ | ✓ Authoritative | ✗ | ✓ (connector) |
| **Weather (NEXRAD/METAR)** | ✓ Level II + API | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (connector) |
| **Multi-domain fusion** | ✓ Core architecture | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (customer) |
| **Null doctrine (no-fire)** | ✓ Compile-time proof | Hardware only | N/A | N/A | N/A | N/A | ✗ |
| **Verb set** | SHOW/HOLD/SHELTER/WARN (frozen) | N/A | N/A | N/A | N/A | N/A | Configurable |
| **Role-based verbs** | Observer/Physicist/Mayor/Auditor | N/A | N/A | N/A | N/A | N/A | RBAC |
| **Shelter logic** | 12 zones, 5 km/h isochrones | No | No | No | No | No | Custom |
| **Agent scoring** | 12-pt budget, formula | No | No | No | No | No | Custom |
| **Open source** | ✓ MIT + addendum | ✓ (ODbL) | ✗ | ✓ (public domain) | ✓ (public domain) | ✓ (non-comm) | ✗ |
| **Self-hostable** | ✓ Portable Node | ✗ (API only) | ✗ (API only) | ✗ (API only) | ✗ (API only) | ✗ (API only) | ✓ (K8s/cloud) |
| **Offline-capable** | ✓ (cached tiles/data) | ✗ | ✗ | ✗ | ✗ | ✗ | Partial |
| **ITAR-free** | ✓ | ✓ | ✓ | ✓ | ✓ | Partial (Space-Track) | Varies |

## 2.5 Worked Example 2.1: Coverage Gap Quantification

Consider a **Category 4 hurricane** approaching Meridian Bay. The fused picture requires:

| Domain | Source | Coverage Gap | Impact on Picture |
|--------|--------|--------------|-------------------|
| Air | OpenSky | No receivers in storm core (evacuated) | Loss of ADS-B above FL100 in eyewall |
| Sea | AISHub | Coastal stations offline (power loss) | Vessel positions stale > 30 min |
| Ground | USGS | Seismic noise floor raised by microseisms | M < 2.5 events masked |
| Space | CelesTrak | TLEs unaffected | Conjunction screening nominal |
| Fire | FIRMS | MODIS/VIIRS overpass 3 hr latency | New ignitions detected late |
| Weather | NEXRAD | Radar survives (hardened) | Primary situational source |

**Quantified gap**: During the 6-hour landfall window, the fused picture degrades to **weather-only** for air/sea domains. PALLADIUM NULL's shelter logic (5 km/h walk isochrones) remains valid because it depends on **static geometry** (shelter locations, road network, flood polygon) not live sensors. This illustrates the design principle: **static civil-defense infrastructure outlives dynamic sensor availability**.

## References (open)

- OpenSky Network — *Historical Database & Live API Documentation* (2024)
- MarineTraffic — *API Documentation & Coverage Maps* (2024)
- AISHub — *Data Feed Specification* (2023)
- Spire Maritime — *Satellite AIS Product Sheet* (2024)
- USGS Earthquake Hazards Program — *Real-time Feeds & ShakeMap Guide* (2024)
- IRIS Data Services — *Web Services API* (2024)
- CelesTrak — *Space-Track & GP Data FAQ* (2024)
- NASA FIRMS — *User Guide: Active Fire Data* (2024)
- NOAA NWS — *API Documentation v1.6* (2024)
- NOAA NCEI — *NEXRAD Level II on AWS* (2024)
- ITU-R M.1371-5 — *Technical characteristics of AIS*
- ICAO Doc 9871 — *Technical Provisions for Mode S Services*
- ODbL 1.0 — *Open Database License*
- ITAR 22 CFR 120–130 — *International Traffic in Arms Regulations*

## Cross-references

- Chapter 1: System boundaries — why PALLADIUM NULL consumes these feeds at runtime only
- Chapter 3: Null doctrine — how the no-fire constraint shapes fusion architecture
- Chapter 4: Link budgets — detection range for each sensor type under adverse weather
- Chapter 13: Sensor fusion pipeline — correlation, deduplication, track management
- Chapter 18: Agent evaluation — how degraded sensor availability affects scoring
- Chapter 23: Governance — licensing compliance for fused output