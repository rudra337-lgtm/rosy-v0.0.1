# Screenshot Placeholders

Render the lab locally (`npm run dev` or `npm start`) and save screenshots here:

| File | Description | Suggested Size |
|------|-------------|----------------|
| `watch-floor.png` | Full watch floor: topbar, left rail (sensor clinic), CAD+GPU+PPI+spec+city, right rail (agent NULL) | 1920×1080 |
| `cad-array.png` | PN-LISTEN-1 Three.js view: 24-element ring, vault, calibration tower, shelter S-01, sector ring | 1200×800 |
| `ppi-spec.png` | PPI sweep + spectrogram waterfall side by side | 1200×600 |
| `city-twin.png` | Meridian Bay city map: shelters, flood polygon, tsunami arc, route line | 1000×700 |
| `agent-null.png` | Right rail: budget meter, attention card, shelter card, decision log, proof line | 800×1000 |

**Naming convention:** `kebab-case.png`, committed to `docs/screenshots/` (git LFS recommended for PNGs).

**Accessibility:** Each screenshot should have an accompanying `.txt` with alt-text for screen readers (e.g., `watch-floor.txt`).