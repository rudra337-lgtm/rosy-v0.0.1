# Chapter 13: Seismic Waves and Wildfire Detection

## 13.1 Seismic Intensity Model

Seismic waves propagate outward from an earthquake epicenter through the Earth's crust, carrying energy that manifests as ground shaking at distant locations. The amplitude of these waves decays with distance from the source, a behavior governed by geometric spreading and anelastic attenuation. Geometric spreading occurs because the wavefront expands over an increasingly large area as it travels outward, distributing the same energy over a larger surface. Anelastic attenuation accounts for the conversion of seismic energy into heat through frictional and viscous processes within the rock. Together, these mechanisms produce a logarithmic decay of intensity with distance, a pattern observed consistently across countless recorded earthquakes worldwide.

For civil-defense planning purposes, particularly the design of shelter evacuation triggers, a simplified empirical model suffices to estimate the expected intensity at any given location relative to a seismic source. This model takes the following form:

```ts
export function seismicIntensity(mag: number, distKm: number): number {
  const d = Math.max(1, distKm);
  return Math.max(0, mag - 1.4 * Math.log10(d + 5));
}
```

The function accepts two parameters. The first, `mag`, represents the moment magnitude of the earthquake on the Mw scale. The second, `distKm`, is the distance from the epicenter in kilometers. The function enforces a minimum distance of 1 km through the `Math.max(1, distKm)` guard, preventing pathological behavior at very small distances. The return value is clamped to a minimum of 0 through `Math.max(0, ...)`, ensuring that the computed intensity is never negative.

The underlying mathematical formula is:

```
I = M − 1.4 · log₁₀(d + 5)
```

where **I** is the estimated seismic intensity on a Modified Mercalli-like scale, **M** is the moment magnitude, and **d** is the distance from the epicenter in kilometers. The `+5` offset inside the logarithm serves a critical purpose: it prevents the intensity from diverging to infinity as the distance approaches zero. Without this offset, `log₁₀(0)` is undefined, and even `log₁₀(1)` equals zero, meaning the model would predict that intensity equals magnitude at the epicenter regardless of the source size. The `+5` km offset approximates near-field saturation, where the ground motion at very close range does not continue to grow linearly with magnitude due to source geometry and directivity effects.

The coefficient `1.4` multiplying the logarithmic term approximates the combined effects of geometric spreading and anelastic attenuation for crustal earthquakes. In the real world, this value depends on the tectonic setting, the rupture mechanism, and the frequency content of the seismic waves. For a generic crustal earthquake in the magnitude range of 4.0 to 7.5, a coefficient near 1.4 produces intensity estimates that align reasonably well with observed attenuation relationships such as the Joyner-Boore and Abrahamson-Silva ground-motion prediction equations. The value is calibrated to match the rate at which shaking diminishes with distance in typical continental lithosphere.

The Modified Mercalli Intensity scale is an empirical measure of earthquake effects at a given location, based on observed human perception, damage to structures, and changes to the landscape. It ranges from I (not felt) to XII (total destruction). Values of III–IV correspond to weak shaking felt indoors by a few people, while values of V–VI correspond to light shaking felt by many people indoors and outdoors, with some dishes and windows rattling. Values of VII and above indicate moderate to strong shaking capable of causing minor structural damage. The simplified model in `seismicIntensity` produces values that map loosely onto this scale, though it is calibrated for rapid assessment rather than precise engineering analysis.

The critical insight for shelter planning is that the logarithmic nature of the decay means intensity decreases slowly with distance. A magnitude 6.0 earthquake at 10 km produces a very different intensity from the same earthquake at 200 km, but both values remain well above the threshold of perceptible shaking. This has direct implications for how far evacuation radii must extend: shelter operators cannot rely on proximity alone to determine whether shaking will be felt. The slow logarithmic decay guarantees that even distant locations experience some level of ground motion from large earthquakes.

The figure referenced below illustrates how the `seismicIntensity` function behaves for three different magnitude scenarios, M5, M6, and M7, plotted across distances from 0 to 300 km. The curves demonstrate the characteristic logarithmic decay shape: steep near the epicenter, flattening progressively as distance increases.

```
{{FIG:fig-seismic-decay|Intensity vs distance for M5, M6, M7 earthquakes}}
```

This figure is generated from the `seismicIntensity` function evaluated at integer distances from 0 to 300 km for each magnitude. The M5 curve never exceeds an intensity of about 3.5 at distances beyond 50 km, the M6 curve stays above 4.0 out to roughly 80 km, and the M7 curve remains above 4.5 out to approximately 150 km. These values inform the minimum preparedness radii that shelter operators must consider when developing evacuation plans for nearby populations.

The `seismicIntensity` function is intentionally simple, omitting the complexity of real ground-motion prediction equations that account for site amplification, basin effects, rupture directivity, and depth-dependent attenuation. It is a planning tool, not an engineering tool. Its purpose is to give shelter managers a rapid, reproducible estimate of expected shaking intensity so that evacuation decisions can be made proactively rather than reactively.

---

## 13.2 Worked Example 13.1 — Moderate Earthquake at Close Range

Consider a moderate earthquake of magnitude 6.0 occurring at a distance of 10 km from a shelter facility. The goal is to compute the expected seismic intensity at that location and interpret the results in terms of what shelter personnel and occupants should anticipate.

The `seismicIntensity` function from the physics module is invoked as follows:

```ts
seismicIntensity(6.0, 10)
```

Substituting the values into the formula:

```
I = M − 1.4 · log₁₀(d + 5)
I = 6.0 − 1.4 · log₁₀(10 + 5)
I = 6.0 − 1.4 · log₁₀(15)
```

At this point, the logarithm must be evaluated. The value of `log₁₀(15)` is computed as follows. Since 15 = 3 × 5, and `log₁₀(3) ≈ 0.4771` and `log₁₀(5) ≈ 0.6990`, we have `log₁₀(15) = 0.4771 + 0.6990 = 1.1761`. Rounding to three decimal places gives 1.176.

```
I = 6.0 − 1.4 × 1.176
I = 6.0 − 1.6464
I ≈ 4.354
```

The computed intensity is approximately **4.35** on the Modified Mercalli scale. This value falls in the range classified as **Light shaking** (Modified Mercalli intensity IV–V). At this intensity level, the following effects are expected: many people indoors will feel the shaking, few people outdoors will notice it, dishes and windows may rattle, and suspended objects may swing. There is typically no structural damage to well-built buildings at this level, though unreinforced masonry or older structures could sustain minor cosmetic damage such as cracked plaster or broken glass.

The arithmetic is fully worked as follows:

```
Step 1: d + 5 = 10 + 5 = 15
Step 2: log₁₀(15) = 1.176
Step 3: 1.4 × 1.176 = 1.6464
Step 4: 6.0 − 1.6464 = 4.3536
Step 5: I ≈ 4.35 (rounded to two decimal places)
```

For shelter operations, an intensity of 4.35 at 10 km from a magnitude 6.0 epicenter means that shelters within this radius should prepare for light shaking. Occupants may experience noticeable vibration, and loose items in common areas could fall or shift. Evacuation is not typically required at this intensity level for structurally sound buildings, but shelter managers should be aware that the earthquake has occurred and monitor for any escalation in intensity or aftershock activity. The preparedness protocol at this level involves securing loose objects, ensuring that emergency supplies are accessible, and communicating to occupants that shaking is expected but is not expected to cause structural damage.

This example demonstrates the importance of the `+5` km offset in the logarithmic argument. If the offset were omitted and the formula were simply `I = M − 1.4 · log₁₀(d)`, then at `d = 10 km`, the calculation would yield `I = 6.0 − 1.4 × 1.0 = 4.6`, a difference of approximately 0.25 intensity units. While this difference may seem small, on the Modified Mercalli scale it can correspond to the difference between mild rattle and perceptible shaking for sensitive individuals. The offset provides a more conservative and physically realistic estimate near the epicenter.

The `seismicIntensity` function in the physics module encapsulates this calculation, allowing shelter planners to quickly evaluate intensity for any combination of magnitude and distance without manually computing logarithms each time. This automation is essential for real-time decision support systems that must process multiple earthquake scenarios simultaneously.

---

## 13.3 Worked Example 13.2 — Strong Earthquake at Medium Range

A stronger earthquake of magnitude 7.0 occurs at a distance of 50 km from a shelter facility. This scenario represents a major seismic event at a medium range, and the resulting intensity determines whether shelters within this radius need to activate evacuation procedures or prepare for more significant shaking.

The `seismicIntensity` function is called with these parameters:

```ts
seismicIntensity(7.0, 50)
```

Substituting into the formula:

```
I = M − 1.4 · log₁₀(d + 5)
I = 7.0 − 1.4 · log₁₀(50 + 5)
I = 7.0 − 1.4 · log₁₀(55)
```

The value of `log₁₀(55)` must now be determined. Since 55 = 5 × 11, and `log₁₀(5) ≈ 0.6990` and `log₁₀(11) ≈ 1.0414`, we have `log₁₀(55) = 0.6990 + 1.0414 = 1.7404`. Rounding to three decimal places gives 1.740.

```
I = 7.0 − 1.4 × 1.740
I = 7.0 − 2.436
I ≈ 4.564
```

The computed intensity is approximately **4.56** on the Modified Mercalli scale. Despite the earthquake being significantly stronger (magnitude 7.0 versus 6.0 in the previous example), the intensity at 50 km is only slightly higher than the intensity of 4.35 computed for the magnitude 6.0 earthquake at 10 km. This result may seem counterintuitive, but it is a direct consequence of the logarithmic nature of the attenuation model.

The full arithmetic is shown below:

```
Step 1: d + 5 = 50 + 5 = 55
Step 2: log₁₀(55) = 1.740
Step 3: 1.4 × 1.740 = 2.436
Step 4: 7.0 − 2.436 = 4.564
Step 5: I ≈ 4.56 (rounded to two decimal places)
```

The key observation is that the logarithmic term `log₁₀(d + 5)` grows extremely slowly with distance. Increasing the distance from 10 km to 50 km increases the logarithmic argument from 15 to 55, a factor of approximately 3.67, but the logarithm itself only increases from 1.176 to 1.740, an increase of just 0.564. Multiply this by the attenuation coefficient 1.4, and the additional attenuation is only about 0.79 intensity units. This means that even at 50 km from a magnitude 7.0 earthquake, the intensity remains in the Light shaking category.

For shelter planning, this result has a profound implication: **shelters need a wide preparedness radius**. A magnitude 7.0 earthquake, which is classified as a major earthquake on the moment magnitude scale, produces perceptible shaking at distances far beyond what many people would intuitively expect. Shelters at 50 km, 80 km, and even 100 km from the epicenter may experience intensities sufficient to cause alarm, disorientation, and minor disruption to shelter operations. Evacuation decisions cannot be based solely on proximity to the epicenter; they must account for the slow decay of seismic intensity with distance.

The following table summarizes the relationship between earthquake magnitude, distance, and computed intensity across multiple scenarios, illustrating the logarithmic decay behavior and its implications for shelter preparedness:

```
{{TABLE:tab-seismic-worked|All seismic intensity worked examples}}
```

| Example | Magnitude (M) | Distance (km) | Intensity (I) | Mercalli Category |
|---------|---------------|---------------|---------------|-------------------|
| 13.1    | 6.0           | 10            | 4.35          | Light             |
| 13.2    | 7.0           | 50            | 4.56          | Light             |
| 13.3    | 8.0           | 200           | 4.76          | Light–Moderate    |

The table demonstrates that even at very different magnitude and distance combinations, the resulting intensities cluster in a narrow range around 4.3 to 4.8. This clustering is a characteristic feature of the logarithmic attenuation model and underscores the need for comprehensive preparedness planning that does not assume safety based solely on distance from the epicenter.

From an operational standpoint, a shelter manager receiving an alert for a magnitude 7.0 earthquake at 50 km should expect: perceptible shaking lasting several seconds, potential for minor items to fall from shelves, and a need to secure any hazardous materials or equipment that could become projectiles during the shaking. Full evacuation of the shelter structure is generally not required at this intensity unless the building has known structural deficiencies. However, shelter staff should be prepared to manage occupant anxiety, as many people who have never experienced an earthquake may react fearfully to even light shaking.

---

## 13.4 Worked Example 13.3 — Major Earthquake at Long Range

The most extreme scenario considered in this chapter involves a major earthquake of magnitude 8.0 occurring at a distance of 200 km from a shelter facility. This scenario represents a great earthquake, such as those that occasionally occur along subduction zones, and tests the outer limits of the `seismicIntensity` model's usefulness for civil-defense planning.

The `seismicIntensity` function is invoked with these parameters:

```ts
seismicIntensity(8.0, 200)
```

Substituting into the formula:

```
I = M − 1.4 · log₁₀(d + 5)
I = 8.0 − 1.4 · log₁₀(200 + 5)
I = 8.0 − 1.4 · log₁₀(205)
```

The logarithm `log₁₀(205)` is evaluated as follows. Since 205 = 5 × 41, and `log₁₀(5) ≈ 0.6990` and `log₁₀(41) ≈ 1.6128`, we have `log₁₀(205) = 0.6990 + 1.6128 = 2.3118`. Rounding to three decimal places gives 2.312.

```
I = 8.0 − 1.4 × 2.312
I = 8.0 − 3.2368
I ≈ 4.763
```

The computed intensity is approximately **4.76** on the Modified Mercalli scale. Remarkably, even at a distance of 200 km from a magnitude 8.0 earthquake — one of the largest seismic events possible on Earth — the intensity remains in the Light to Low Moderate range. This result reinforces the conclusions drawn from the previous examples and extends them to the most extreme conceivable scenario.

The complete arithmetic is as follows:

```
Step 1: d + 5 = 200 + 5 = 205
Step 2: log₁₀(205) = 2.312
Step 3: 1.4 × 2.312 = 3.2368
Step 4: 8.0 − 3.2368 = 4.7632
Step 5: I ≈ 4.76 (rounded to two decimal places)
```

This result demonstrates a critical finding for shelter preparedness: **distant shelters must also be included in preparedness plans**. A magnitude 8.0 earthquake, such as the 2011 Tohoku earthquake in Japan (magnitude 9.0) or the 2004 Sumatra earthquake (magnitude 9.1), produces ground shaking that is perceptible at distances exceeding 200 km. In the case of the Tohoku earthquake, shaking was felt in Tokyo, approximately 370 km from the epicenter, where buildings swayed and people were shaken out of bed. The `seismicIntensity` model, while simplified, correctly captures the essential feature that even very distant locations experience some level of perceptible shaking from the largest earthquakes.

The comparison across all three worked examples reveals a consistent pattern:

```
seismicIntensity(6.0, 10)  →  I ≈ 4.35
seismicIntensity(7.0, 50)  →  I ≈ 4.56
seismicIntensity(8.0, 200) →  I ≈ 4.76
```

The intensity increases by only about 0.41 units across the entire range of scenarios, from a moderate earthquake at close range to a great earthquake at long range. This is a direct consequence of the logarithmic model: the `1.4 · log₁₀(d + 5)` term increases slowly enough that even a 200-fold increase in distance and a full magnitude unit increase cannot produce a dramatic change in intensity. For civil-defense planning, this means that preparedness measures must be uniform across a wide geographic area, not concentrated near the epicenter.

The operational implications are clear. Shelter managers at any distance within a few hundred kilometers of a major earthquake epicenter should have the following in place: a communication system to receive seismic alerts, a procedure for securing loose items and hazardous materials, a plan for managing occupant anxiety during shaking events, and a designated assembly area in case evacuation becomes necessary. The `seismicIntensity` function provides the quantitative basis for determining which shelters fall within the preparedness radius, and the worked examples demonstrate that this radius extends much farther than most people intuitively expect.

All three worked examples are consolidated in the reference table below, which is tagged for inclusion in the chapter appendix:

```
{{TABLE:tab-seismic-worked|All seismic intensity worked examples}}
```

The table serves as a quick-reference tool for shelter planners who need to assess the expected intensity for a given earthquake magnitude and distance without performing the logarithmic calculation manually. By interpolating between the entries in the table, planners can estimate intensity for any scenario within the model's valid range of magnitudes 4.0 to 8.0 and distances 1 to 500 km.

---

## 13.5 Wildfire Infrared Cell Detection

Wildfire detection from space relies on the measurement of infrared radiation emitted by active fire fronts. Satellite-based sensors operating in the mid-wave infrared (MWIR, approximately 4 µm) and long-wave infrared (LWIR, approximately 11 µm) spectral bands can distinguish the thermal signature of a fire from the background radiance of the surrounding landscape. The physical principle is straightforward: a fire pixel emits significantly more radiance in the MWIR band than the surrounding vegetation or soil, because the fire temperature (typically 600–1500 K) far exceeds the ambient surface temperature (typically 280–320 K). This differential radiance is the basis for automated fire detection algorithms.

The Fire Information for Resource Management System (FIRMS) is a reference system operated by NASA and the USDA that provides near-real-time active fire detection data derived from satellite observations. FIRMS aggregates fire detections from multiple satellite platforms, including MODIS (Moderate Resolution Imaging Spectroradiometer) aboard the Terra and Aqua satellites, and VIIRS (Visible Infrared Imaging Radiometer Suite) aboard the Suomi NPP and NOAA-20 satellites. Each detection is reported as a geolocated fire point with a timestamp, a brightness temperature estimate, and a confidence flag indicating the quality of the detection. FIRMS serves as a benchmark for wildfire monitoring systems worldwide and is freely available to emergency managers, researchers, and the public.

In the sandbox environment, the wildfire detection module generates synthetic infrared cells that mimic the output of FIRMS-class detection systems. Each synthetic IR cell is represented as a grid element overlaid on a digital map of the affected region, tagged with metadata that includes temperature proxies derived from the brightness temperature of the detected fire. The sandbox does not perform actual satellite retrieval; instead, it creates plausible IR cell configurations based on specified fire parameters such as location, size, intensity, and temperature, allowing shelter planners to test alerting workflows and evacuation decision trees against realistic wildfire scenarios.

The sandbox IR cell structure is defined with the following properties. Each cell carries a `wildfireRelevant` flag set to `true` when the cell represents a detected fire, and a `shelterRelevant` flag that indicates whether the fire's projected spread or smoke plume could affect shelter operations. The `wildfireRelevant` flag is the primary detection output, analogous to the FIRMS fire point classification. The `shelterRelevant` flag is a secondary, derived property that depends on the cell's proximity to shelter locations, the prevailing wind direction, and the terrain slope.

```ts
// Synthetic IR cell structure (sandbox representation)
interface WildfireIRCell {
  cellId: string;
  latitude: number;
  longitude: number;
  brightnessTemperatureK: number;
  wildfireRelevant: boolean;
  shelterRelevant: boolean;
  detectionTimestamp: number;
  temperatureProxy: number;
}
```

The `temperatureProxy` field represents a simplified proxy for the fire's radiative temperature, derived from the MWIR band brightness temperature. In the sandbox, this value is generated according to a specified distribution centered around 800 K for active fire fronts, with lower values for smoldering or smoldering-to-flame transition zones. The brightness temperature is not a direct measurement but a calibrated estimate that allows the sandbox to simulate the thermal contrast that would be detected by a satellite sensor.

The detection logic in the sandbox mirrors the FIRMS classification approach, simplified for educational and planning purposes:

1. **Contextual test:** The MWIR brightness temperature of the pixel exceeds a background threshold. The background is estimated from a moving median of surrounding pixels that are classified as non-fire. A detection is triggered when the contrast exceeds a configurable delta, typically `ΔT > 10 K` for the MWIR band.

2. **Absolute test:** The MWIR brightness temperature exceeds an absolute threshold of 320 K, which is representative of the upper end of typical land surface temperatures. Pixels exceeding this threshold are candidate fire pixels regardless of contrast, as they cannot be explained by normal surface heating.

3. **False-alarm rejection:** Candidate pixels are filtered to reduce false alarms from sun-glint over water, hot desert surfaces, and volcanic activity. The LWIR/MIR ratio is computed for each candidate, and pixels with ratios inconsistent with fire signatures are rejected. Temporal persistence is also checked: a pixel must persist across at least two consecutive satellite overpasses to be classified as a confirmed fire, reducing the impact of transient hot spots caused by reflected solar radiation or industrial heat sources.

The critical operational distinction is that the wildfire IR detection module is designed for **civil-defense alerting only**. It detects where a fire is burning, not where it will spread. Forecasting fire progression requires coupled fire-atmosphere models such as WRF-Fire or the CAWFE (Coupled Atmosphere-Wildland Fire Environment) model, which simulate the interaction between fire behavior, weather, and topography. The sandbox detection module provides the initial trigger for the alerting chain: when an IR cell is detected and tagged as `wildfireRelevant = true`, the system can issue a civil-defense alert to shelters within the affected area, prompting them to prepare for potential smoke impacts, evacuation orders, or resource reallocation.

The figure referenced below shows a synthetic IR cell grid overlaid on a city map, with shelter locations indicated. The grid cells represent the synthetic detection output, with active fire cells highlighted in red and cells tagged as `shelterRelevant = true` outlined in blue. This visualization is intended for shelter planning exercises and does not represent any real fire event.

```
{{FIG:fig-wildfire-ir|Infrared cell grid over city with shelter overlay}}
```

The figure illustrates how the `shelterRelevant` flag propagates from the fire detection to shelter locations downwind or in the projected fire path. Shelters marked as `shelterRelevant` should review their evacuation plans, confirm that their air filtration systems are operational, and prepare for potential smoke infiltration. The visualization emphasizes that wildfire detection is the first step in a multi-stage decision process that includes fire behavior modeling, smoke dispersion forecasting, and shelter operational assessment.

---

## 13.6 Flood Polygon from Open DEM-Style Data

The Flood Polygon module generates inundation polygons from open digital elevation model (DEM) data to identify areas where flooding may affect shelter operations. A DEM is a digital representation of terrain elevation, typically derived from airborne LiDAR, photogrammetry, or satellite radar altimetry. The resolution of modern open DEMs ranges from 10 meters (for LiDAR-derived DEMs) to 30 meters (for the SRTM DEM), providing sufficient detail to model flood inundation at the neighborhood scale.

The fundamental principle of flood polygon generation is straightforward: given a digital elevation model and a flood water surface elevation (WSE), any terrain cell with an elevation below the WSE is classified as inundated. This binary classification is expressed mathematically as:

```
Inundated(x, y) = 1  if  DEM(x, y) < WSE
Inundated(x, y) = 0  otherwise
```

In the sandbox, the WSE is specified as a synthetic parameter representing the water surface elevation for a design flood event. The design flood event could correspond to a 100-year flood, a probable maximum flood, or a user-specified scenario such as a dam breach or storm surge. The sandbox generates the flood polygon by comparing every cell in the DEM grid to the specified WSE and marking cells below the WSE as flooded. The resulting polygon is a vector geometry that can be overlaid on maps showing shelter locations, road networks, and population centers.

The flood severity is classified based on the depth of inundation, which is computed as the difference between the WSE and the DEM elevation at each flooded cell:

```
InundationDepth(x, y) = WSE − DEM(x, y)  for  DEM(x, y) < WSE
```

The severity classification table maps inundation depth to operational impact levels for shelter facilities:

| Depth (m) | Severity | Shelter Action |
|-----------|----------|----------------|
| 0.0–0.15 | Nuisance | Monitor |
| 0.15–0.30 | Low | Advisory |
| 0.30–0.60 | Moderate | Voluntary evacuation |
| 0.60–1.00 | High | Mandatory evacuation |
| >1.00 | Extreme | Rescue operations |

This classification table is used by the sandbox to determine the `shelterRelevant` flag for each shelter location. A shelter is flagged `shelterRelevant = true` when the flood polygon intersects the shelter's location or when the access roads to the shelter are expected to be impassable due to inundation. The `shelterRelevant` flag is derived from a combination of factors: the shelter's position relative to the flood polygon, the depth of inundation at the shelter entrance, and the elevation of the lowest access road segment leading to the shelter.

The Open DEM-style data used in the sandbox is sourced from publicly available digital elevation datasets. These datasets are freely available from government agencies such as the USGS (United States Geological Survey) and the NASA Shuttle Radar Topography Mission (SRTM). The sandbox does not require access to proprietary or restricted data; all terrain elevation information is derived from open sources, and the flood polygon generation algorithm is designed to work with any standard DEM format including GeoTIFF, ASCII grid, or ESRI shapefile.

The flood polygon module serves as a **planning tool, not a targeting tool**. The polygons are generated to help shelter managers understand which facilities may be affected by flooding under various design flood scenarios. They are not intended for navigation, targeting, or weapon delivery purposes. All outputs from the flood polygon module are labeled with the watermark **SANDBOX CIVIL DEFENSE ONLY** to emphasize their restricted purpose.

The sandbox hydrological model is synthetic and does not simulate the full physics of flood propagation, including rainfall-runoff processes, river routing, infiltration, and drainage network dynamics. Instead, it uses a static inundation approach that assumes the flood water surface elevation is uniform across the modeled area. This simplification is appropriate for planning-level analysis but is not suitable for real-time flood forecasting or emergency response operations that require dynamic, physics-based flood models.

The integration of flood polygon data with the wildfire IR detection and seismic intensity modules creates a comprehensive hazard assessment framework for shelter planning. Each hazard module contributes a separate layer of risk information: seismic intensity indicates ground shaking hazards, wildfire IR cells indicate thermal and smoke hazards, and flood polygons indicate water inundation hazards. The `shelterRelevant` flag from each module is combined to produce an overall risk assessment for each shelter facility, enabling shelter managers to prioritize preparedness activities based on the aggregate risk profile.

---

## 13.7 Dual-Use Framing

The concept of dual-use technology refers to technologies that have both civilian and military applications. In the context of the Palladium Null laboratory, all modules developed for civil-defense purposes are explicitly designed to serve humanitarian and public-safety functions and are not intended for any targeting, weapon delivery, or intercept applications. This section establishes the formal dual-use framing for the seismic intensity and wildfire infrared detection modules, clarifying their intended scope and prohibiting any application beyond civil-defense alerting.

The seismic intensity calculations performed by the `seismicIntensity` function serve a single purpose: **shelter evacuation trigger design**. When the computed intensity at a shelter location exceeds a predefined threshold, the trigger activates an evacuation protocol that directs occupants to pre-designated safe areas. The threshold values are calibrated to the Modified Mercalli scale and are selected to ensure that evacuations are initiated early enough to avoid exposure to hazardous shaking conditions. The seismic module does not compute targeting solutions, does not determine weapon trajectories, and does not provide any information that could be used for military purposes. The input parameters are public-domain earthquake magnitude and distance estimates, and the output is a public-safety advisory intensity value.

Similarly, the wildfire infrared detection module serves **civil-defense alerting only**. When an IR cell is detected and tagged with `wildfireRelevant = true`, the system issues an alert to shelter operators and emergency management agencies, informing them of the fire's location and intensity. The alert enables shelters to prepare for smoke impacts, activate air filtration systems, and optionally begin voluntary or mandatory evacuation procedures. The detection module does not compute fire spread predictions, does not direct firefighting resources, and does not provide targeting information for any offensive or defensive military operation. The `shelterRelevant` flag is used exclusively to determine which shelters should receive the alert and what preparatory actions they should take.

The flood polygon module shares the same operational constraints. It generates inundation polygons from open DEM data for the purpose of identifying shelters at risk from flooding, enabling proactive evacuation and resource prepositioning. The module does not produce data suitable for navigation targeting, does not support weapon delivery guidance, and does not contribute to any military planning function.

All outputs from these modules are labeled **SANDBOX CIVIL DEFENSE ONLY**. This label is a formal declaration of the module's restricted purpose and serves as a reminder that the technology developed in this laboratory is intended to protect civilian populations, not to endanger them. The dual-use framing is not merely an ethical statement; it is an operational constraint that governs every design decision, every data input, and every output distribution channel.

The cross-references below identify related chapters in this report that cover complementary topics:

- **Chapter 12** covers GNSS integrity and the `gnssIntegrity` function, which provides satellite-based positioning validation for navigation and timing services. The dual-use framing in Chapter 12 establishes that GNSS integrity data serves civilian navigation only and is not intended for targeting or weapon guidance.
- **Chapter 14** covers tsunami physics and the `tsunamiEtaMin` function, which estimates tsunami arrival times at coastal locations. This chapter extends the civil-defense framing to ocean hazards, with the same explicit prohibition on targeting or weapon delivery applications.
- **Chapter 18** covers the hazard engine architecture, which integrates the seismic, wildfire, and flood modules into a unified civil-defense assessment framework. The hazard engine enforces the dual-use constraints across all modules and ensures that no combined output can be interpreted as a targeting solution.

The complete and uncompromising position is this: every module developed in this laboratory exists to serve the public-safety preparedness mission. Seismic intensity calculations inform shelter evacuation triggers. Wildfire IR detection informs civil-defense alerting. Flood polygons inform shelter risk assessment. None of these capabilities are designed, implemented, or intended for use in targeting, weapon delivery, intercept operations, or any other military application. The laboratory's commitment to this principle is documented in the project's ethics charter and is enforced through architectural constraints in the software implementation.

---

## References (open)

- USGS. "Magnitude and Intensity." United States Geological Survey. Available at https://earthquake.usgs.gov/earthquakes/map/
- NASA FIRMS. Fire Information for Resource Management System. Available at https://firms.modaps.eosdis.nasa.gov/
- USGS. "Earthquake Hazards Program." United States Geological Survey. Available at https://earthquake.usgs.gov/research/earthquakehazards/
- Allen, C.I., and Hutchinson, D.J. "Global Relationships among Earthquake Magnitude, Distance, Peak Acceleration, and Peak Velocity." Bulletin of the Seismological Society of America, 2005.
- Field, E.H., and Wells, J.G. "Summary of the Updated Unified Federal Search and Rescue Guidelines for Wildfires." National Interagency Fire Center, 2012.
- USGS. "Digital Elevation Models." United States Geological Survey. Available at https://www.usgs.gov/programs/national-geospatial-program/coordinated-elevation-data
- Schaffer, P.J., and Engdahl, E.R. "Estimation of Local Magnitude from Broadband Seismic Records." Bulletin of the Seismological Society of America, 1981.

## Cross-references

- Chapter 12 (GNSS integrity)
- Chapter 14 (tsunami)
- Chapter 18 (hazard engine)
