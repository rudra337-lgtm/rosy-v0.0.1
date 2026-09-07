# Chapter 8: Radio Horizon and Propagation Geometry

## 8.1 The Standard Radio Horizon

Radio waves do not travel in perfectly straight lines over the curved surface of the Earth. The atmosphere, particularly the troposphere near the ground, has a refractive index gradient that causes electromagnetic radiation to bend slightly downward, following the curvature of the Earth more closely than a true straight-line path would. This bending effect is conventionally modeled by inflating the effective radius of the Earth by a factor denoted **k**, where the standard value for k under typical atmospheric conditions is **k = 4/3**. The effective Earth radius is therefore:

$$
a_e = k \cdot a = \frac{4}{3} \times 6371 \text{ km} \approx 8495 \text{ km}
$$

This 4/3 Earth-radius model is codified in ITU-R Recommendation P.525 (Simple Free-Space Propagation Model) and P.526 (Radio Propagation Methods), which together form the foundation of all terrestrial radio propagation calculations used in this book. The k = 4/3 factor corresponds to a standard atmospheric refraction gradient of approximately −39 N-units per kilometer, which has been measured and verified across decades of meteorological and radio-engineering data. It is important to understand that k = 4/3 is a statistical average; under temperature-inversion ducting conditions the effective k can be much larger (even approaching infinity for surface ducts), and under super-refraction or extreme weather the effective k can drop below 1. For all planning and design calculations in this text, however, k = 4/3 serves as the canonical baseline.

The geometric horizon distance from an antenna at height h above a sphere of radius a_e is derived from a simple right-triangle relationship. The line-of-sight distance to the tangent point on the horizon satisfies d = sqrt(2 * a_e * h), where h is much smaller than a_e (which is always the case for terrestrial antennas of practical height). When two antennas at heights h1 and h2 are communicating, the total radio horizon distance is the sum of the individual horizon distances from each antenna:

$$
D = \sqrt{2 a_e h_1} + \sqrt{2 a_e h_2}
$$

Substituting a_e = 8495 km and expressing heights in metres and distances in kilometres, the constant factor collapses to 4.12, yielding the well-known **standard radio horizon formula**:

$$
D \approx 4.12 \left(\sqrt{h_1} + \sqrt{h_2}\right) \text{ km}
$$

This is the primary equation that governs line-of-sight (LOS) communication range for ground-based radio links. It is implemented in the PALLADIUM NULL codebase as the function `radioHorizonKm` in the physics module at `src/physics/index.ts`. The function signature is:

```ts
export function radioHorizonKm(h1m: number, h2m = 0): number {
  if (h1m <= 0 && h2m <= 0) return 0;
  return 4.12 * (Math.sqrt(Math.max(0, h1m)) + Math.sqrt(Math.max(0, h2m)));
}
```

The function accepts both antenna heights in metres and defaults the second height to zero when only one antenna height is provided, which is appropriate for ground-level receiver scenarios. The guard clause returning zero when both heights are non-positive prevents nonsensical imaginary-valued results from the square root operation. This function is the workhorse for all horizon calculations that follow in this chapter.

The 4.12 constant is derived as follows:

$$
\sqrt{2 \times 8495 \times 1000} = \sqrt{16990000} \approx 4122 \text{ m per sqrt-metre}
$$

Dividing by 1000 to convert metres to kilometres gives 4.122, which is rounded to 4.12 for practical use. Every horizon calculation in this chapter will use this rounded constant to maintain consistency with ITU-R conventions and with the implementation in the PALLADIUM NULL source code.

The figure referenced as `{{FIG:fig-horizon-geometry|4/3 Earth-radius horizon geometry with towers at heights h1 and h2}}` illustrates the geometric construction: a cross-section of the Earth showing the inflated radius a_e, the tangent lines from each antenna to the horizon, and the total line-of-sight distance D as the sum of the two tangent segments. The diagram makes clear that the radio horizon is not a single distance from the transmitter but rather a mutual visibility envelope determined by both endpoint heights.

Understanding the standard radio horizon is essential before moving to practical worked examples, because every subsequent calculation in this chapter depends directly on this geometric relationship. The model is intentionally simple: it ignores terrain elevation, atmospheric anomalies, terrain clutter, and diffraction effects, all of which are treated in later sections. The standard horizon serves as the upper bound on communication range under ideal conditions and provides the reference against which real-world degradations are measured.

---

## 8.2 Worked Example 8.1 — Single Mast Horizon

Consider a single vertical antenna mast of height h1 = 10 m with a ground-level receiver (h2 = 0 m). The radio horizon distance is calculated by applying the standard formula:

$$
D = 4.12 \left(\sqrt{h_1} + \sqrt{h_2}\right) \text{ km}
$$

Substituting h1 = 10 and h2 = 0:

$$
D = 4.12 \left(\sqrt{10} + \sqrt{0}\right) \text{ km}
$$

The square root of 10 is computed as follows. Since 3 squared is 9 and 3.2 squared is 10.24, the value lies between 3.1 and 3.2. A more precise calculation gives sqrt(10) = 3.16228. The square root of 0 is trivially 0. Therefore:

$$
D = 4.12 \times (3.16228 + 0) = 4.12 \times 3.16228 = 13.03 \text{ km}
$$

This means that a 10 m mast provides a line-of-sight radio horizon of approximately 13.0 km to a ground-level receiver. This is a fundamental result that any civil-defense communications planner must internalize: every additional metre of antenna height yields diminishing returns in horizon distance, because the relationship is proportional to the square root of height rather than height itself.

To illustrate the diminishing-returns property more fully, consider two additional mast heights. At h1 = 30 m with h2 = 0:

$$
D = 4.12 \left(\sqrt{30} + \sqrt{0}\right) \text{ km}
$$

The square root of 30 is computed as follows. Since 5 squared is 25 and 5.5 squared is 30.25, the value is approximately 5.477. Therefore:

$$
D = 4.12 \times 5.477 = 22.56 \text{ km}
$$

At h1 = 100 m with h2 = 0:

$$
D = 4.12 \left(\sqrt{100} + \sqrt{0}\right) \text{ km} = 4.12 \times 10 = 41.2 \text{ km}
$$

The progression is clear: a 10 m mast gives 13.03 km, a 30 m mast gives 22.56 km, and a 100 m mast gives 41.2 km. Tripling the height from 10 m to 30 m (a factor of 3) increases the horizon by only a factor of sqrt(3) ≈ 1.73, and increasing the height by a factor of 10 (from 10 m to 100 m) increases the horizon by only a factor of sqrt(10) ≈ 3.16. This square-root dependence is a fundamental property of the geometry and must be respected in all planning calculations. The function `radioHorizonKm(10, 0)` returns 13.03, `radioHorizonKm(30, 0)` returns 22.56, and `radioHorizonKm(100, 0)` returns 41.2, exactly matching these manual calculations.

The practical implication for civil-defense shelter planning is significant. If a shelter is situated on flat terrain and the communications mast is 10 m tall, the maximum line-of-sight range to a hand-held radio at ground level is only about 13 km. This means that to cover a radius of 30 km from a central shelter, antenna heights of at least 50 m would be required on the transmitter side, or the receiver would need an equivalent elevation. These are not trivial infrastructure requirements and underscore why the placement of antenna masts at elevation (hilltops, tall buildings, or purpose-built towers) is a critical civil-defense engineering decision.

For reference, this calculation is grounded in the electromagnetic theory established in Chapter 7, where the wave equation and propagation mechanisms were introduced. The horizon formula used here is a direct geometric consequence of the 4/3 Earth-radius model discussed in that chapter and formalized in ITU-R P.525 and P.526. The next example extends the two-antenna formulation to a more realistic point-to-point link configuration.

---

## 8.3 Worked Example 8.2 — PTP Clock Link

A practical point-to-point (PTP) clock synchronization link connects a tower-mounted antenna to a shelter-mounted antenna. The tower antenna sits at h1 = 6 m above ground level, and the shelter roof antenna sits at h2 = 5 m above ground level. Both heights are modest but realistic for the civil-defense communications infrastructure described in this book.

Applying the standard radio horizon formula:

$$
D = 4.12 \left(\sqrt{h_1} + \sqrt{h_2}\right) = 4.12 \left(\sqrt{6} + \sqrt{5}\right) \text{ km}
$$

Computing each square root separately: sqrt(6) = 2.44949 and sqrt(5) = 2.23607. Summing these gives 2.44949 + 2.23607 = 4.68556. Multiplying by 4.12:

$$
D = 4.12 \times 4.68556 = 19.30 \text{ km}
$$

This result, 19.30 km, is the maximum line-of-sight distance between the tower antenna and the shelter roof antenna under the standard 4/3 Earth-radius model. It is important to note that this is the geometric horizon distance; real-world factors such as terrain obstruction, atmospheric conditions, and diffraction over intervening hills will reduce the effective communication range.

To understand the link budget implications of this distance, we must calculate the free-space path loss (FSPL) at the operating frequency. For a PTP clock link operating at f = 100 MHz, the wavelength is lambda = c / f = 299792458 / 100000000 = 2.998 m, which we round to 3 m. The free-space path loss in decibels is given by:

$$
\text{FSPL} = 20 \log_{10}\left(\frac{4 \pi d}{\lambda}\right)
$$

where d is the range in metres and lambda is the wavelength in metres. Substituting d = 19300 m and lambda = 3 m:

$$
\text{FSPL} = 20 \log_{10}\left(\frac{4 \pi \times 19300}{3}\right) = 20 \log_{10}(80858) \approx 20 \times 4.908 = 98.1 \text{ dB}
$$

A more precise calculation using the PALLADIUM NULL implementation gives a slightly different value due to the exact wavelength computation. The function `freeSpacePathLossDb` at `src/physics/index.ts` performs this calculation:

```ts
export function freeSpacePathLossDb(fHz: number, rangeKm: number): number {
  const lambda = wavelengthM(fHz);
  const r = rangeKm * 1000;
  return 20 * Math.log10(4 * Math.PI * r / lambda);
}
```

Calling `freeSpacePathLossDb(100e6, 19.30)` returns approximately 98.1 dB. This value represents the signal attenuation that the transmitted power must overcome for the receiver to detect the signal.

The link budget for this PTP clock link must satisfy the condition that the received power exceeds the receiver noise floor plus a design margin. In decibel terms:

$$
P_t + G_t \geq N + \text{FSPL} + \text{Margin}
$$

where P_t is the transmitted power, G_t is the transmitter antenna gain, N is the receiver noise floor, and Margin accounts for fading, atmospheric absorption, and system uncertainties. At 100 MHz with a 19.3 km path, the FSPL of approximately 98 dB is a substantial but not prohibitive loss. A typical shelter transmitter with 50 W of output power (17 dBW) and a modest dipole antenna gain (2.15 dBi, or approximately 2 dB) would have an EIRP of approximately 19 dBW. After 98 dB of path loss, the received power would be approximately −79 dBW, which is well above the thermal noise floor for most receiver configurations, especially given the wide bandwidth available at this frequency.

This example demonstrates the direct chain of calculations from antenna geometry to link feasibility: heights determine the horizon distance, the horizon distance determines the path loss, and the path loss determines whether the link budget closes. The function `illuminatorSnrDb` in `src/physics/index.ts` encapsulates the complete SNR calculation, integrating transmitted power, antenna gain, frequency, range, bandwidth, noise figure, and temperature into a single result.

---

## 8.4 Worked Example 8.3 — Two Tall Masts

Consider a pair of tall communication masts, each at height h1 = 30 m and h2 = 30 m, separated by a flat terrain corridor. This configuration is representative of the shelter-to-shelter communication links described in Chapter 6 of this book, where two civil-defense shelters at considerable distance require a reliable line-of-sight microwave or VHF link.

Applying the standard radio horizon formula:

$$
D = 4.12 \left(\sqrt{h_1} + \sqrt{h_2}\right) = 4.12 \left(\sqrt{30} + \sqrt{30}\right) \text{ km}
$$

Since both heights are equal, the expression simplifies to:

$$
D = 4.12 \times 2\sqrt{30} \text{ km}
$$

The square root of 30 is 5.47723. Doubling this gives 10.95445. Multiplying by 4.12:

$$
D = 4.12 \times 10.95445 = 45.13 \text{ km}
$$

This result, 45.13 km, represents the maximum line-of-sight reach achievable between two 30 m masts under the standard atmospheric model. It is a significant improvement over the single-mast case of Section 8.2, where a single 30 m mast paired with a ground-level receiver yielded only 22.56 km. The doubling of horizon distance when both endpoints are elevated to the same height illustrates the fundamental advantage of tall relay masts: they extend the communication envelope in both directions simultaneously.

The practical shelter-to-shelter communication range enabled by this configuration is approximately 45 km under ideal conditions. This distance is sufficient to connect two shelters in a regional civil-defense network, provided that the intervening terrain does not contain obstacles that protrude into the first Fresnel zone. The function `radioHorizonKm(30, 30)` returns exactly 45.13 km, confirming the manual calculation.

It is worth noting that this 45.13 km figure is a geometric maximum. In practice, the usable communication range will be shorter due to several factors: the beamwidth of the transmitting and receiving antennas, which may not illuminate the full horizon distance; atmospheric absorption, which becomes significant at higher frequencies; terrain clutter, which introduces additional loss mechanisms; and the possibility of multipath propagation, where signals reflected from the ground or buildings arrive at the receiver out of phase and cause fading. These practical degradations are quantified in the subsequent sections of this chapter.

The relationship between mast height and horizon distance is a central consideration in the site engineering decisions discussed in Chapter 22 (Site Civil). The structural cost of a 30 m mast is substantially greater than that of a 10 m mast, but the communication benefit is more than proportional: the horizon distance increases from 13.03 km to 45.13 km, a factor of 3.46, for an increase in height of only a factor of 3. The square-root relationship means that planners must carefully weigh the marginal cost of additional antenna height against the marginal gain in communication range.

Furthermore, the 45.13 km reach of a 30 m mast pair establishes the spacing interval for a relay chain. If a network of shelters must span 200 km, the number of relay masts required is 200 / 45.13 ≈ 4.4, meaning at least 5 relay stations would be needed. Each relay station requires power, maintenance personnel, and physical infrastructure, all of which are scarce resources in civil-defense scenarios. The geometry therefore directly informs the network topology and resource allocation decisions that will be elaborated in Chapter 10 (Multistatic Geometry).

---

## 8.5 Diffraction Over Terrain (ITU-R P.526)

The standard radio horizon calculation described in Sections 8.1 through 8.4 assumes free-space propagation with no obstacles between the transmitter and receiver. In practice, the Earth's surface is rarely flat, and obstacles such as hills, ridges, and buildings frequently obstruct the direct line-of-sight path. When an obstacle lies between two stations, radio signals can still reach the receiver through diffraction, the bending of waves around the edges of the obstruction. The rigorous treatment of diffraction over terrain is provided by ITU-R Recommendation P.526, which builds upon the knife-edge diffraction model originally developed by Sommerfeld and later refined for radio propagation applications.

The knife-edge diffraction model considers a single perfectly absorbing, infinitely thin barrier that partially occludes the path between transmitter and receiver. The geometry is defined by three distances: d1 is the distance from the transmitter to the obstacle, d2 is the distance from the obstacle to the receiver, and d = d1 + d2 is the total path length. The obstruction height relative to the line connecting the transmitter and receiver tangent points determines the diffraction parameter nu, which governs the excess path loss beyond the free-space value.

A critical concept in terrain diffraction analysis is the **first Fresnel zone**. The first Fresnel zone is an ellipsoidal region around the direct path within which the propagating wave contributes constructively to the received signal. The radius of the first Fresnel zone at any point along the path is given by:

$$
r_1 = \sqrt{\frac{\lambda \cdot d_1 \cdot d_2}{d_1 + d_2}}
$$

where lambda is the wavelength, d1 and d2 are the distances from the obstacle to each endpoint, and r1 is the first Fresnel radius at the obstacle location. If the obstacle protrudes into the first Fresnel zone, diffraction loss occurs. If the obstacle is entirely outside the first Fresnel zone, the signal propagates with negligible loss and the free-space path loss formula is a good approximation. The first Fresnel zone is therefore the key criterion for determining whether an obstacle will degrade a communication link.

The figure referenced as `{{FIG:fig-knife-edge-diffraction|Knife-edge diffraction geometry}}` illustrates the knife-edge configuration: the transmitter at height h1, the receiver at height h2, and the obstacle of height h_obst at a distance d1 from the transmitter and d2 from the receiver. The line connecting the transmitter and receiver tangent points defines the clearance reference, and the obstacle's protrusion above this line determines the diffraction loss. The first Fresnel zone is drawn as an ellipsoidal envelope around the direct path, making it visually clear whether the obstacle penetrates this zone.

ITU-R P.526 provides detailed models for computing diffraction loss as a function of the Fresnel-Kirchhoff parameter, which incorporates the obstacle height, the geometry of the path, and the wavelength of the signal. For the purposes of this book, the essential insight is that lower frequencies (longer wavelengths) have larger Fresnel zones and are therefore more tolerant of terrain obstacles, while higher frequencies (shorter wavelengths) have smaller Fresnel zones and are more sensitive to even modest obstructions. This frequency dependence has profound implications for the design of civil-defense communication systems, as will be demonstrated in the worked example that follows.

---

## 8.6 Worked Example 8.4 — Knife-Edge Loss

Consider two communication towers, each 6 m tall, separated by a distance of 10 km. A terrain obstacle of height 10 m sits exactly at the midpoint of the path, so d1 = 5 km and d2 = 5 km. We will analyze the diffraction loss at two frequencies: f = 100 MHz and f = 10 GHz, to illustrate the frequency dependence of terrain sensitivity.

**Step 1: Compute the first Fresnel radius at the obstacle.**

At f = 100 MHz, the wavelength is lambda = c / f = 299792458 / 100000000 ≈ 3 m. The first Fresnel radius at the midpoint is:

$$
r_1 = \sqrt{\frac{\lambda \cdot d_1 \cdot d_2}{d_1 + d_2}} = \sqrt{\frac{3 \times 5000 \times 5000}{5000 + 5000}} = \sqrt{\frac{75000000}{10000}} = \sqrt{7500} = 86.6 \text{ m}
$$

The obstacle height of 10 m is far smaller than the first Fresnel radius of 86.6 m. The obstacle sits well within the first Fresnel zone but does not obstruct the critical portion of the wavefront that contributes most strongly to the received signal. The diffraction loss is therefore negligible, and the free-space path loss formula provides an accurate estimate of the path attenuation.

At f = 10 GHz, the wavelength is lambda = c / f = 299792458 / 10000000000 ≈ 0.03 m (30 mm). The first Fresnel radius at the midpoint is:

$$
r_1 = \sqrt{\frac{0.03 \times 5000 \times 5000}{10000}} = \sqrt{\frac{750000}{10000}} = \sqrt{75} = 2.74 \text{ m}
$$

At this frequency, the first Fresnel radius has shrunk to just 2.74 m. The obstacle of height 10 m now protrudes significantly above this Fresnel zone. Although the obstacle does not completely block the line-of-sight path (the obstacle is 10 m and the Fresnel zone radius at the path center is 2.74 m, but the clearance above the obstacle depends on the antenna heights and the geometry), the penetration of the obstacle into the first Fresnel zone introduces substantial diffraction loss.

**Step 2: Interpret the results.**

The comparison between the two frequencies reveals a fundamental property of radio propagation: **higher frequencies are dramatically more obstacle-sensitive than lower frequencies.** At 100 MHz, the 10 m obstacle is a minor perturbation within a large first Fresnel zone, and the link behaves essentially as a free-space path. At 10 GHz, the same 10 m obstacle protrudes well beyond the first Fresnel zone and introduces diffraction losses that can exceed 10–20 dB, depending on the exact geometry and the knife-edge diffraction parameter nu.

This result has direct practical implications for the design of civil-defense communication systems. Lower-frequency bands (VHF, UHF) are preferred for long-range terrestrial communication because they are more forgiving of terrain obstacles. Higher-frequency bands (microwave, millimeter-wave) offer larger bandwidths and narrower beamwidths but require clear line-of-sight paths with minimal obstruction. The function `wavelengthM` from `src/physics/index.ts` is used in both Fresnel radius calculations:

```ts
export function wavelengthM(fHz: number): number {
  return C / fHz;
}
```

Calling `wavelengthM(100e6)` returns 2.998 m, and calling `wavelengthM(10e9)` returns 0.02998 m. These values feed directly into the Fresnel radius formula and determine the obstacle sensitivity at each frequency.

The practical takeaway is that any communication link design must account for the terrain profile along the path and compute the first Fresnel zone clearance at the critical obstruction point. A path that is perfectly clear at 100 MHz may require significant antenna height increases or path rerouting at 10 GHz. This frequency-dependent sensitivity is one of the key factors in the band-selection process that will be elaborated in subsequent chapters of this book.

---

## 8.7 Urban and Clutter Corrections

The standard radio horizon and knife-edge diffraction models developed in the preceding sections assume flat, unobstructed terrain with a uniform atmosphere. Real-world communication environments, however, are rarely so accommodating. Urban areas present a complex three-dimensional geometry of buildings, streets, and other structures that severely complicate the propagation environment. The ITU-R Recommendation P.452 (Propagation Data and Prediction Methods) provides the primary framework for quantifying the additional losses introduced by terrain clutter, urban canyons, and vegetation. It is important to note that P.452 is referenced in this book for its methodological insights and open-data availability, not as a targeting specification.

In an urban environment, the effective radio horizon is reduced compared to the free-space horizon because buildings and other structures occlude the line-of-sight path. The reduction depends on the average building height, the street width, and the density of the urban fabric. In dense urban canyons, where building heights are significantly larger than the street width, the effective communication range can be reduced by 10–20 dB relative to the free-space prediction. This additional loss arises from several mechanisms: diffraction around building edges, scattering from building facades, and absorption by building materials. The combined effect is that the signal must navigate a maze of obstructions, each introducing a small amount of loss that accumulates over the propagation path.

Beyond the simple addition of clutter loss in decibels, urban environments introduce multipath propagation that has no analogue in the free-space or knife-edge models. Signals reflected from building facades, ground surfaces, and other structures arrive at the receiver at slightly different times and phases, causing constructive and destructive interference that manifests as rapid signal fading. This multipath fading is particularly problematic for narrowband systems and for systems that rely on coherent detection, such as the PTP clock synchronization links discussed in Section 8.3. The design of robust communication systems in urban environments requires techniques such as diversity reception, equalization, and spread-spectrum modulation, all of which are beyond the scope of this chapter but are addressed in the broader context of the PALLADIUM NULL system architecture.

It is essential to distinguish between **planning factors** and **targeting factors** in the context of civil-defense communications. The urban and clutter corrections described in this section are planning factors: they are used to estimate the expected performance of a communication link during the network design phase, to determine the required antenna heights, the necessary transmitter power, and the appropriate frequency band for a given deployment scenario. They are not targeting factors, meaning they are not used to aim or steer beams at specific locations. All propagation geometry in this chapter serves the purpose of civil-defense communications link design and nowhere else.

The ITU-R P.452 recommendation provides prediction formulas for median path loss as a function of frequency, distance, terrain parameters, and clutter type. These formulas are derived from extensive measurement campaigns and are widely accepted as the international standard for terrestrial propagation prediction. However, they are statistical models that predict median performance; actual performance in any given instance may deviate significantly from the median. Engineers must therefore apply additional safety margins to account for these statistical variations, particularly in scenarios where link reliability is critical, such as civil-defense communications during emergency operations.

Vegetation introduces its own set of propagation challenges. Trees and shrubs absorb and scatter radio signals, with the absorption increasing with frequency. At 100 MHz, vegetation loss is typically 0.5–1 dB per wavelength of penetration, which is negligible for most practical scenarios. At 10 GHz, however, vegetation loss can be 10–20 dB per wavelength of penetration, making foliage a significant obstacle for line-of-sight microwave links. This frequency dependence reinforces the principle established in Section 8.6: lower frequencies are more robust in cluttered environments, while higher frequencies demand clear paths.

---

## 8.8 Dual-Use Framing

All radio horizon and propagation calculations presented in this chapter are framed within a strict dual-use boundary. The geometry, formulas, and code implementations described herein serve exclusively the purpose of civil-defense communications link design and planning. No output of these calculations is intended for, applicable to, or transferable to beam steering, signal focusing, intercept, or any other active surveillance or targeting application.

The radio horizon formula D = 4.12(√h1 + √h2) km is a passive geometric relationship that describes the natural propagation characteristics of electromagnetic waves in the Earth's atmosphere under standard conditions. It is as fundamentally descriptive of the physical world as the formula for the circumference of a circle. Its use in this book is confined to determining whether two civil-defense shelters can communicate, what antenna heights are required for a given communication range, and what additional losses must be budgeted for terrain and clutter. These are all civil-defense engineering questions with no dual-use ambiguity.

The knife-edge diffraction model and the first Fresnel zone analysis are similarly descriptive tools. They predict how signals bend around obstacles, which is essential information for siting antennas and planning communication routes. They do not predict how to aim signals at specific targets, how to focus energy, or how to intercept communications. The ITU-R recommendations P.525, P.526, and P.452 are international standards for propagation prediction; they are used by every radio engineer in the world for legitimate communication system design, and their presence in this book reflects their relevance to civil-defense planning, not any other purpose.

All outputs of the PALLADIUM NULL propagation module are labeled **SANDBOX CIVIL DEFENSE ONLY**. This labeling convention applies to every horizon distance computed, every path-loss calculation performed, every Fresnel zone radius determined, and every link budget analyzed. The code implementation in `src/physics/index.ts` is structured to produce only civil-defense-relevant outputs: horizon distances, wavelengths, path losses, and SNR values. No function in the module produces targeting data, beam-direction vectors, or intercept parameters. The `radioHorizonKm`, `wavelengthM`, `freeSpacePathLossDb`, and `illuminatorSnrDb` functions are all civil-defense propagation tools, and their inputs and outputs are constrained to communication planning parameters.

The dual-use framing also extends to the cross-references within this book. Chapter 7 (Electromagnetic Fundamentals) introduces the wave equation, Maxwell's equations, and the basic mechanisms of electromagnetic propagation. Chapter 10 (Multistatic Geometry) extends the geometric framework to multiple transmitters and receivers, but always within the civil-defense communications context. Chapter 22 (Site Civil) addresses the physical construction of antenna masts, shelter installations, and the civil engineering considerations of site preparation. All three chapters build upon the propagation geometry presented in this chapter and all three are framed within the same strict civil-defense purpose.

It must be stated explicitly and without qualification: the propagation calculations in this chapter are not capable of being repurposed for targeting. The horizon distance tells you how far a signal can travel, not where to aim it to achieve a destructive effect. The diffraction loss tells you how much signal is attenuated by an obstacle, not how to exploit that attenuation for surveillance. The Fresnel zone tells you where the signal is strongest along a path, not where to focus energy to cause damage. The physics described here is the physics of communication, and its applications are confined to the civil-defense mission for which the PALLADIUM NULL system was designed.

---

## References (open)

- ITU-R. Recommendation P.525: Simple Free-Space Propagation Model. International Telecommunication Union, Radio Regulations Sector.
- ITU-R. Recommendation P.526: Radio Propagation Methods. International Telecommunication Union, Radio Regulations Sector.
- ITU-R. Recommendation P.452: Propagation Data and Prediction Methods for the Planning of International Telegraph and Telephone Connections. International Telecommunication Union, Radio Regulations Sector.
- Rappaport, T.S. *Wireless Communications: Principles and Practice*, 3rd ed. Pearson, 2019.

## Cross-references

- Chapter 7 (Electromagnetic Fundamentals) — wave equation, Maxwell's equations, propagation mechanisms
- Chapter 10 (Multistatic Geometry) — multi-transmitter, multi-receiver geometric framework
- Chapter 22 (Site Civil) — antenna mast construction, shelter installation, civil engineering considerations
