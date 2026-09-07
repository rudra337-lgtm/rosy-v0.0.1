# Chapter 7: Electromagnetic Fundamentals for Civil-Defense Reception

This chapter establishes the electromagnetic vocabulary required throughout the remainder of the Palladium Null report. All formulas are derived from first principles and implemented in the module `src/physics/index.ts`. The chapter addresses passive radio reception only; no transmitter design, beamforming, or focusing operations are described. Every concept herein applies exclusively to the civilian-defense reception scenario: detecting, measuring, and characterizing electromagnetic signals that arrive at a fixed or mobile receive site from distant emitters whose identity, location, and intent are unknown. The reader should understand that the physics described is deliberately neutral with respect to the source of the signal. The same wavelength relationships, Doppler shifts, and path-loss mathematics apply whether the emitter is a commercial radio station, a GNSS satellite, or an unidentified radar. This neutrality is intentional and is maintained through the dual-use framing discussed in Section 7.9.

## 7.1 SI Foundations: Exact Constants

The International System of Units (SI), as revised in 2019, defines several fundamental constants with zero experimental uncertainty. Two constants are of primary importance for the radiative simulations presented in this report: the speed of light in vacuum and the Boltzmann constant. The speed of light is exact by definition because the metre itself is defined in terms of the distance light travels in a specified fraction of a second. Specifically, the 1983 CGPM resolution fixed the numerical value of c at exactly 299,792,458 metres per second. This is not a measurement; it is a definition. There is no error bar attached to this number, and any experiment that appears to contradict it is necessarily wrong at the level of the definition. The Boltzmann constant was similarly fixed in the 2019 SI redefinition: k_B = 1.380649 × 10⁻²³ J/K, exact by fiat. This constant relates the mean kinetic energy of particles in a gas to the thermodynamic temperature and appears directly in the thermal noise floor calculations that arise in Chapter 9 on signal-to-noise ratios. The exactness of these two constants is not merely a historical curiosity. It means that a simulation of radiative propagation written in code can reproduce the same numerical results on every machine, at every time, without reference to any external calibration table. The deterministic nature of these constants is foundational to the reproducibility of all quantitative work in this report. Other physical constants used in the wider simulation framework include the gravitational constant G = 6.67430 × 10⁻¹¹ m³ kg⁻¹ s⁻² and the standard gravitational parameter of Earth μ_Earth = 398,600.4418 km³/s², but these are not exact and carry the uncertainty of their last measurement. For the purposes of electromagnetic propagation, however, only c and k_B require attention because they enter the core wavelength, frequency, and noise-floor equations. The implementation in `src/physics/index.ts` encodes these values as exported constants so that every downstream calculation references the same exact numbers. The relevant code is shown below.

```ts
export const C = 299_792_458;
export const K_BOLTZMANN = 1.380_649e-23;
```

The table referenced below summarizes all exact SI constants used throughout this report and the companion chapters. It serves as the canonical reference for the numerical values that appear in every formula.

{{TABLE:tab-physics-constants|CODATA-exact SI constants used throughout}}

### 7.1.1 Why Exactness Matters for Civil-Defense Simulation

When a civil-defense reception system must determine whether a detected signal is a legitimate broadcast or an anomalous emission, the numerical precision of the underlying physics model affects the confidence of the classification. If the speed of light were known only to six significant figures, then a frequency measurement precise to nine significant figures would produce a wavelength with artificial round-off error that could, in principle, shift a detected signal across a regulatory boundary. The exactness of c eliminates this source of error entirely. Similarly, the exactness of k_B means that the thermal noise floor computed for any antenna system is known without ambiguity. This matters for the shelter-siting analysis in Chapter 20, where the signal-to-noise ratio at a proposed receiver location determines whether the site is viable for civil-defense communications. The reader will encounter the Boltzmann constant again in Chapter 9, where it appears in the Johnson-Nyquist noise formula.

## 7.2 Wavelength and Frequency

Electromagnetic radiation in vacuum is characterized by two reciprocal quantities: frequency f, measured in hertz (cycles per second), and wavelength λ, measured in metres. The relationship between them is governed by the speed of light, which acts as the proportionality constant. The fundamental duality is expressed by two equivalent formulas:

$$
\lambda = \frac{c}{f}, \quad f = \frac{c}{\lambda}
$$

The first formula converts a frequency specification into the physical length of one complete oscillation of the electric field. The second does the reverse. This duality is not merely notational; it determines the physical scale of every antenna, the diffraction behavior at every obstacle, and the propagation regime—whether the signal travels in a line-of-sight fashion, diffracts around the curvature of the Earth, or penetrates through atmospheric layers. In civil-defense contexts, the wavelength determines whether a signal can be received by a portable antenna mounted on a vehicle or whether it requires a fixed array at a shelter site. The wavelength also determines the angular resolution of any receiving system, since the diffraction-limited beamwidth scales as λ/D where D is the aperture diameter.

| Band | Frequency Range | Typical Wavelength | Civil-Defense Relevance |
|------|----------------|-------------------|------------------------|
| FM Radio | 88–108 MHz | 2.78–3.41 m | Baseline broadcast monitoring |
| DVB-T UHF | 470–862 MHz | 0.35–0.64 m | Television signal surveillance |
| GNSS L1 | 1575.42 MHz | 0.1903 m | Positioning and timing reference |
| GNSS L2 | 1227.60 MHz | 0.2440 m | Dual-frequency ionospheric correction |
| Starlink Ku | 12–18 GHz | 0.0167–0.0250 m | Satellite broadband monitoring |
| Starlink Ka | 26.5–40 GHz | 0.0075–0.0113 m | High-frequency propagation study |

The table above lists the principal civil-defense frequency bands that appear throughout this report. Each row gives the frequency range, the corresponding wavelength computed as c divided by the frequency, and a brief note on why that band matters for civil-defense reception. The GNSS L1 and L2 bands are particularly important because they provide the timing reference used in Time-Difference-of-Arrival calculations described in Chapter 11. The Ku and Ka bands from Starlink are included because their short wavelengths make them sensitive to atmospheric attenuation, which becomes relevant when assessing whether a signal can survive propagation through rain or fog.

{{FIG:fig-wavelength-spectrum|Wavelength vs frequency across civil-defense bands}}

### 7.2.1 Propagation Regimes and Wavelength

The wavelength alone determines which propagation regime dominates at a given frequency. When the wavelength is much larger than the obstacles in the environment, diffraction dominates and the signal bends around buildings and terrain features. When the wavelength is much smaller than the obstacles, the signal behaves more like optical rays and is blocked or reflected. The transition between these regimes occurs when the wavelength is comparable to the size of the obstacles. For civil-defense reception, this means that FM radio signals at 3-metre wavelengths can diffract around hills and buildings, while Ka-band signals at 8-millimetre wavelengths are essentially line-of-sight and are blocked by any opaque obstacle. This distinction is critical when siting a civil-defense shelter: a shelter located in a deep valley may receive FM signals through diffraction but may be completely shadowed by terrain at Ku-band frequencies. The horizon-geometry analysis in Chapter 8 formalizes this distinction by computing the radio horizon distance as a function of antenna height and the effective Earth radius.

### 7.2.2 The Implementation of Wavelength and Frequency Conversion

The `src/physics/index.ts` module provides two functions for converting between frequency and wavelength. These are the most fundamental operations in the entire physics library, and every other function in the module depends on them directly or indirectly. The function `wavelengthM` takes a frequency in hertz and returns the corresponding wavelength in metres. The function `frequencyHz` takes a wavelength in metres and returns the corresponding frequency in hertz. Both functions are pure and deterministic, depending only on the exact constant c.

```ts
export function wavelengthM(fHz: number): number {
  return C / fHz;
}
export function frequencyHz(lambdaM: number): number {
  return C / lambdaM;
}
```

The `+0` idiom that appears in the `dopplerShiftHz` function, discussed in Section 7.3, is not present here because division of a positive constant by a positive argument always yields a positive result. There is no sign ambiguity in the wavelength and frequency conversions.

## 7.3 Doppler Shift

The Doppler effect describes the change in observed frequency when there is relative motion between a source of electromagnetic waves and a receiver. The physical mechanism is straightforward: if the source is moving away from the receiver, each successive wavefront is emitted from a position slightly farther from the receiver than the previous one. The distance between successive wavefronts, as measured by the receiver, is therefore increased, which corresponds to a lower observed frequency. Conversely, if the source is moving toward the receiver, the wavefronts are compressed and the observed frequency increases. For electromagnetic waves in vacuum, the relativistic Doppler formula reduces to the classical approximation when the velocity v is much smaller than the speed of light c, which is the case for all practical civil-defense scenarios involving vehicles, aircraft, and satellites. The classical formula for a receding source is:

$$
f_{\text{obs}} = f_{\text{src}} \left(1 - \frac{v}{c}\right)
$$

where v is the radial velocity positive when the source is receding. The frequency shift Δf = f_obs − f_src is therefore:

$$
\Delta f = -\frac{v}{c} f_{\text{src}}
$$

The negative sign is a direct consequence of the sign convention: positive velocity means receding, which means the observed frequency is lower than the source frequency, which means the shift is negative. This convention is used consistently throughout the report and is implemented in the `dopplerShiftHz` function in `src/physics/index.ts`. The function takes two arguments: the source frequency in hertz and the radial velocity in metres per second, and returns the frequency shift in hertz. The implementation adds `+ 0` to normalize negative zero to positive zero, a defensive measure that prevents `-0` from appearing in output when the velocity is exactly zero.

```ts
export function dopplerShiftHz(fHz: number, vRadialMps: number): number {
  return -(vRadialMps / C) * fHz + 0; // +0 normalizes -0 to +0
}
```

The Doppler shift is a first-order effect in v/c. For a commercial jet at 250 m/s and a carrier frequency of 1 GHz, the shift is approximately 834 Hz, which is a fractional change of 8.34 × 10⁻⁷. For the International Space Station at 7.5 km/s, the fractional change is approximately 2.5 × 10⁻⁵. These numbers are small, but they are measurable with modern receivers and are the basis for the velocity-estimation techniques discussed in Chapter 11. The TDOA (Time-Difference-of-Arrival) methods in that chapter rely on the fact that the Doppler shift can be used to disambiguate between different signal paths that arrive at slightly different times.

{{FIG:fig-doppler-geometry|Doppler geometry: source, observer, velocity vector, wavefronts}}

### 7.3.1 Sign Convention and Its Physical Meaning

The sign convention used in this report requires careful attention because it differs from some textbook treatments. In the convention adopted here, the radial velocity v is positive when the source moves away from the observer. This means that a positive velocity always produces a negative frequency shift, corresponding to a redshift. This convention has the advantage of being consistent with the sign convention used in the radial velocity term of the free-space path loss calculation, where a positive range rate also corresponds to increasing distance. The convention is maintained throughout Chapters 7 through 11 and should not be confused with the convention used in some radar textbooks where the sign of the Doppler shift is defined relative to the radar rather than the source. The reader who encounters a different convention in an external reference should convert carefully.

### 7.3.2 Practical Significance for Civil-Defense Reception

In a civil-defense monitoring scenario, the Doppler shift provides information about the motion of the signal source relative to the receiver. For a fixed receiver and a moving emitter, the measured Doppler shift can be converted into a radial velocity, which in turn constrains the possible trajectories of the emitter. This is particularly relevant for tracking aircraft or space objects that may be transmitting signals of interest. The Doppler shift also affects the design of the receiver: if the expected range of Doppler shifts is known, the receiver's frequency tracking loop can be sized appropriately to avoid losing lock. The velocity estimates derived from Doppler measurements feed into the TDOA hyperbolic positioning algorithms described in Chapter 11, where the combination of range and range-rate measurements provides a two-dimensional fix on the emitter's position.

## 7.4 Free-Space Path Loss (ITU-R P.525)

Free-space path loss is the reduction in power density that occurs as an electromagnetic wave propagates outward from an isotropic radiator in the absence of any reflections, diffraction, or absorption. The phenomenon is purely geometric: the total transmitted power is spread over the surface of an expanding sphere, and the surface area of a sphere grows as the square of the radius. Therefore, the power density at any point is inversely proportional to the square of the distance from the source. In decibels, this manifests as a loss that increases logarithmically with range. The ITU-R Recommendation P.525 provides the standard formulation for the free-space path loss between two isotropic antennas separated by a distance R in free space:

$$
\text{FSPL} = 20 \log_{10}\left(\frac{4\pi R}{\lambda}\right) \text{ dB}
$$

The derivation begins with the Friis transmission equation for isotropic antennas. The received power P_r is related to the transmitted power P_t by:

$$
P_r = P_t \left(\frac{\lambda}{4\pi R}\right)^2
$$

Taking the negative logarithm of the ratio P_r / P_t and multiplying by 20 yields the path-loss formula above. The factor 4π arises from the surface area of a sphere of radius R divided by the effective area of an isotropic antenna, which is λ²/(4π). The path loss increases by 6.02 dB every time the range is doubled, since 20·log₁₀(2) = 6.0206. This relationship is explored in detail in Section 7.8. The free-space path loss is the theoretical minimum loss; any real propagation environment will add additional loss due to atmospheric absorption, ground reflections, diffraction around obstacles, and other effects. Nevertheless, the free-space model is the essential baseline against which all real-world propagation measurements are compared. It is the first term in the link budget and provides the reference level from which all other losses are computed. The function `freeSpacePathLossDb` in `src/physics/index.ts` implements this formula directly, taking the frequency in hertz and the range in kilometres as inputs.

```ts
export function freeSpacePathLossDb(fHz: number, rangeKm: number): number {
  const lambda = wavelengthM(fHz);
  const r = rangeKm * 1000;
  return 20 * Math.log10(4 * Math.PI * r / lambda);
}
```

The function first converts the range from kilometres to metres so that both R and λ are in the same units. It then computes the argument of the logarithm and returns the result in decibels. The function is pure and deterministic for a given frequency and range, making it suitable for batch processing and simulation.

{{FIG:fig-fspl-curves|FSPL vs range at 100 MHz, 1 GHz, 10 GHz}}

### 7.4.1 The 6.02 dB Per Doubling Rule

The relationship between range doubling and path loss deserves explicit attention because it is one of the most practically important results in this chapter. When the range R is doubled, the argument of the logarithm in the FSPL formula doubles, and the logarithm of a doubled argument increases by log₁₀(2) ≈ 0.30103. Multiplied by 20, this gives 6.0206 dB. This means that every time the distance from a signal source doubles, the received power drops by approximately 6 dB, which is a factor of 4 in linear power. This rule applies regardless of frequency, although the absolute value of the path loss depends on frequency through the wavelength term. The practical implication for civil-defense siting is significant: a shelter that is twice as far from a potential emitter receives a signal that is one-quarter as powerful. If the signal was already near the sensitivity threshold of the receiver at the closer location, it will be well below the threshold at the farther location. This geometric decay is the single most important factor in determining the coverage area of any civil-defense reception site.

### 7.4.2 Comparison with Real-World Propagation

The free-space model is an idealization. In practice, signals in the urban and suburban environments where civil-defense shelters are typically located experience additional losses from building occlusion, ground-bounce reflections, and atmospheric absorption. The ITU-R P.526 recommendation provides a diffraction-loss model that extends the free-space formulation to account for the presence of obstacles along the propagation path. Chapter 8 presents the radio-horizon model that determines whether a path is line-of-sight or obstructed, which is the first step in determining whether the free-space model or a diffraction model should be used. The atmospheric absorption models for specific bands, including the oxygen and water-vapor absorption lines that affect signals above 10 GHz, are discussed in the context of the Starlink Ku and Ka bands in the tables above. The reader should understand that the free-space path loss is a lower bound; real-world path loss is always equal to or greater than the free-space value.

## 7.5 Worked Example 7.1 — Wavelength

This example demonstrates the straightforward application of the wavelength formula λ = c / f at three frequencies that are representative of the civil-defense bands listed in Section 7.2. The constant c is exact at 299,792,458 m/s, and the arithmetic below shows every step so that the reader can verify the computation independently.

**Example 7.1a: FM Radio at 100 MHz**

The frequency is 100 MHz, which is 100 × 10⁶ Hz = 1 × 10⁸ Hz. The wavelength is:

$$
\lambda = \frac{c}{f} = \frac{299{,}792{,}458 \text{ m/s}}{100{,}000{,}000 \text{ Hz}} = 2.99792458 \text{ m}
$$

The result is approximately 2.9979 metres, or roughly 3 metres. This is consistent with the common knowledge that FM radio antennas are approximately half a metre to a metre in length, since a practical antenna is typically a fraction of the wavelength. The `wavelengthM` function in `src/physics/index.ts` computes this exactly:

```ts
wavelengthM(100e6) // returns 2.99792458
```

**Example 7.1b: Wi-Fi and Starlink-like Signal at 2.4 GHz**

The frequency is 2.4 GHz, which is 2.4 × 10⁹ Hz. The wavelength is:

$$
\lambda = \frac{299{,}792{,}458}{2{,}400{,}000{,}000} = 0.12491352 \text{ m}
$$

This is approximately 0.1249 metres, or about 12.5 centimetres. At this wavelength, a practical antenna is on the order of 6 centimetres, which is the size of a typical Wi-Fi antenna. The `wavelengthM` function confirms this:

```ts
wavelengthM(2.4e9) // returns 0.12491352416666667
```

**Example 7.1c: GNSS L1 at 1575.42 MHz**

The GNSS L1 frequency is 1575.42 MHz, which is 1,575,420,000 Hz. The wavelength is:

$$
\lambda = \frac{299{,}792{,}458}{1{,}575{,}420{,}000} = 0.190302 \text{ m}
$$

This is approximately 0.1903 metres, or about 19 centimetres. The GNSS L1 wavelength is a key parameter in the TDOA calculations described in Chapter 11, where the precision of range measurements depends directly on the carrier wavelength. The `wavelengthM` function returns:

```ts
wavelengthM(1575.42e6) // returns 0.19029879965469567
```

The small differences in the last digits of these results are due to the exact arithmetic of floating-point representation in the JavaScript/TypeScript runtime, but they are negligible for any practical civil-defense application.

## 7.6 Worked Example 7.2 — Free-Space Path Loss

This example computes the free-space path loss at 100 MHz for ranges of 1 km and 10 km, and at 1 GHz and 10 GHz for a range of 1 km. The purpose is to demonstrate the logarithmic nature of the loss and to establish reference values that are used in later chapters. The path loss is computed using the formula FSPL = 20·log₁₀(4πR/λ), with R in metres and λ in metres.

**Example 7.2a: 100 MHz at R = 1 km**

The wavelength at 100 MHz was computed in Example 7.1a as 2.9979 m. The range is 1 km = 1000 m. The argument of the logarithm is:

$$
\frac{4\pi R}{\lambda} = \frac{4\pi \times 1000}{2.9979} = \frac{12566.37}{2.9979} = 4191.2
$$

The path loss is:

$$
\text{FSPL} = 20 \log_{10}(4191.2) = 20 \times 3.6223 = 72.45 \text{ dB}
$$

The `freeSpacePathLossDb` function in `src/physics/index.ts` computes this as `freeSpacePathLossDb(100e6, 1)` which returns approximately 72.447 dB.

**Example 7.2b: 100 MHz at R = 10 km**

At 10 km, the range is 10,000 m and the wavelength is unchanged. The argument of the logarithm is:

$$
\frac{4\pi \times 10{,}000}{2.9979} = 41912
$$

The path loss is:

$$
\text{FSPL} = 20 \log_{10}(41912) = 20 \times 4.6223 = 92.45 \text{ dB}
$$

The increase from the 1 km case is exactly 20·log₁₀(10) = 20 dB, which is consistent with the inverse-square law: increasing the range by a factor of 10 reduces the power density by a factor of 100, which is 20 dB. The `freeSpacePathLossDb` function returns `freeSpacePathLossDb(100e6, 10)` ≈ 92.447 dB.

**Example 7.2c: 1 GHz at R = 1 km**

At 1 GHz, the wavelength is 299,792,458 / 1,000,000,000 = 0.29979 m. The argument of the logarithm is:

$$
\frac{4\pi \times 1000}{0.29979} = \frac{12566.37}{0.29979} = 41912
$$

The path loss is:

$$
\text{FSPL} = 20 \log_{10}(41912) = 92.45 \text{ dB}
$$

Note that this is identical to the 100 MHz at 10 km result. This is not a coincidence: increasing the frequency by a factor of 10 has the same effect on the path loss as increasing the range by a factor of 10, because both appear linearly in the argument of the logarithm. The `freeSpacePathLossDb` function confirms this: `freeSpacePathLossDb(1e9, 1)` ≈ 92.447 dB.

**Example 7.2d: 10 GHz at R = 1 km**

At 10 GHz, the wavelength is 0.029979 m. The argument of the logarithm is:

$$
\frac{4\pi \times 1000}{0.029979} = 419120
$$

The path loss is:

$$
\text{FSPL} = 20 \log_{10}(419120) = 20 \times 5.6223 = 112.45 \text{ dB}
$$

This is 20 dB higher than the 1 GHz at 1 km case, again because the frequency has increased by a factor of 10. The `freeSpacePathLossDb` function returns `freeSpacePathLossDb(10e9, 1)` ≈ 112.447 dB.

The reference values established in this example are used throughout the remainder of the report, particularly in Chapter 9 where the signal-to-noise ratio is computed for various civil-defense scenarios. The reader should internalize the 6.02 dB-per-doubling rule and the logarithmic scaling with both range and frequency, as these are the two most important quantitative relationships in the chapter.

## 7.7 Worked Example 7.3 — Doppler Shift

This example applies the Doppler shift formula Δf = −(v/c)·f to three representative scenarios: a commercial jet aircraft, and the International Space Station. Each scenario illustrates a different order of magnitude for the velocity and demonstrates how the fractional frequency shift scales with both v and f.

**Example 7.3a: Commercial Jet at 250 m/s, f = 1 GHz**

A commercial jet cruise speed is approximately 250 m/s, which is about 900 km/h or 540 mph. At a carrier frequency of 1 GHz, the Doppler shift is:

$$
\Delta f = -\frac{v}{c} f = -\frac{250}{299{,}792{,}458} \times 10^9 = -\frac{250 \times 10^9}{299{,}792{,}458}
$$

Computing the fraction: 250 / 299,792,458 = 8.3387 × 10⁻⁷. Multiplying by 10⁹ gives:

$$
\Delta f = -833.87 \text{ Hz} \approx -834 \text{ Hz}
$$

The `dopplerShiftHz` function in `src/physics/index.ts` computes this as `dopplerShiftHz(1e9, 250)` which returns approximately −833.87. The negative sign confirms that the source is receding, consistent with the sign convention established in Section 7.3.

**Example 7.3b: Commercial Jet at 250 m/s, f = 10 GHz**

At 10 GHz, the same velocity produces a shift that is exactly ten times larger:

$$
\Delta f = -\frac{250}{299{,}792{,}458} \times 10^{10} = -8338.7 \text{ Hz} \approx -8.34 \text{ kHz}
$$

The `dopplerShiftHz` function returns `dopplerShiftHz(10e9, 250)` ≈ −8338.7 Hz. This example illustrates why higher-frequency systems are more sensitive to Doppler effects: for the same velocity, the frequency shift scales linearly with the carrier frequency. This property is exploited in radar systems, where higher frequencies provide greater Doppler resolution for velocity estimation. In the civil-defense context, this means that a monitoring system operating at 10 GHz can detect smaller velocity differences than one operating at 1 GHz, but it also means that the signal is more susceptible to atmospheric attenuation as discussed in Section 7.2.

**Example 7.3c: International Space Station at 7.5 km/s, f = 1.5 GHz**

The International Space Station orbits at approximately 7.5 km/s = 7500 m/s. At a frequency of 1.5 GHz, the Doppler shift is:

$$
\Delta f = -\frac{7500}{299{,}792{,}458} \times 1.5 \times 10^9
$$

Computing the fraction: 7500 / 299,792,458 = 2.5018 × 10⁻⁵. Multiplying by 1.5 × 10⁹ gives:

$$
\Delta f = -37,527 \text{ Hz} \approx -37.5 \text{ kHz}
$$

The `dopplerShiftHz` function returns `dopplerShiftHz(1.5e9, 7500)` ≈ −37,527 Hz. This is a substantial shift—37.5 kilohertz on a 1.5 gigahertz carrier—representing a fractional change of 2.5 × 10⁻⁵. At this magnitude, the Doppler shift is easily detectable by any conventional receiver and is the basis for the satellite-tracking techniques described in Chapter 11. The sign convention again confirms that the ISS is receding when it is moving away from the receiver, and approaching when moving toward the receiver. As the ISS passes overhead, the Doppler shift sweeps from positive (approaching) through zero (at closest approach) to negative (receding), producing the characteristic Doppler sweep that is a familiar signature of low Earth orbit passes.

## 7.8 Worked Example 7.4 — Range Doubling

This example quantifies the relationship between range doubling and path loss, establishing the 6.02 dB per doubling rule and exploring its practical implications for civil-defense shelter siting. The derivation is straightforward from the free-space path loss formula, and the numerical results are independent of frequency.

**Example 7.4a: 1 km to 2 km**

When the range doubles from 1 km to 2 km, the path loss increases by:

$$
\Delta \text{FSPL} = 20 \log_{10}\left(\frac{2R}{R}\right) = 20 \log_{10}(2) = 20 \times 0.30103 = 6.02 \text{ dB}
$$

This is the fundamental building block. The absolute values of the path loss at each range are irrelevant to the doubling rule; only the ratio matters. At 100 MHz, the path loss at 1 km is 72.45 dB and at 2 km is 78.47 dB, a difference of exactly 6.02 dB.

**Example 7.4b: 1 km to 4 km**

Doubling twice (1 km → 2 km → 4 km) gives a total increase of:

$$
\Delta \text{FSPL} = 2 \times 20 \log_{10}(2) = 40 \log_{10}(2) = 12.04 \text{ dB}
$$

This can also be verified directly: the path loss at 4 km is 20·log₁₀(4) × 20 = 92.45 dB + 20·log₁₀(4) = 92.45 + 12.04 = 104.49 dB (relative to 1 km at 72.45 dB).

**Example 7.4c: 1 km to 8 km**

Doubling three times (1 km → 2 km → 4 km → 8 km) gives:

$$
\Delta \text{FSPL} = 3 \times 20 \log_{10}(2) = 60 \log_{10}(2) = 18.06 \text{ dB}
$$

At 100 MHz, the path loss at 8 km is 72.45 + 18.06 = 90.51 dB.

### 7.8.1 Practical Implications for Shelter Siting

The 6.02 dB per doubling rule has direct consequences for the placement of civil-defense reception shelters. If a signal from a distant emitter is received at a power level that is just above the receiver's sensitivity threshold at a distance of 1 km, then at 2 km the signal will be 6 dB weaker—half the power—and at 4 km it will be 12 dB weaker—one-quarter the power. For many practical receiver systems, a 6 dB reduction is sufficient to push the signal from a usable level to a level buried in the noise floor. The signal-to-noise ratio calculations in Chapter 9 formalize this by showing the exact threshold at which a signal becomes undetectable given a specific receiver noise figure and bandwidth. The practical implication is that shelter sites should be sited as close as practicable to the anticipated emitter locations, subject to other constraints such as structural hardening, access control, and proximity to personnel. Where geographic constraints force a shelter to be at a greater distance from an emitter, the received signal power drops by 6 dB for every factor-of-two increase in range, and this must be compensated for by increasing the antenna gain, reducing the receiver noise figure, or increasing the integration time. The trade-off between these compensation strategies is explored in detail in Chapter 9.

## 7.9 Dual-Use Framing

Every concept introduced in this chapter describes passive electromagnetic reception and measurement. The wavelength formulas, the Doppler shift calculations, the free-space path loss model, and the worked examples all address the same fundamental question: given a signal that arrives at a receiver from a source whose identity and location are unknown, what can be determined about the signal and its source from the measurements alone? The answer is that a great deal can be determined: the frequency content reveals the type of emitter, the Doppler shift reveals the radial velocity, and the path loss constrains the range. These are powerful analytical tools, and they are the tools that this report describes. However, it is essential to be explicit about what this report does not describe.

The chapter does not address transmitter design, antenna focusing, beamforming toward targets, or any technique that would concentrate electromagnetic energy in a direction. The signal-to-noise ratio calculations in Chapter 9 are presented as reception-sensitivity metrics, not as link-budget tools for designing jamming or interception systems. The TDOA hyperbolic positioning methods in Chapter 11 are framed as techniques for determining the location of an unknown emitter, not for guiding a directed-energy weapon to that location. This framing is not a legal disclaimer; it is a structural choice that reflects the intent of the report. The mathematics of electromagnetism is symmetric: the same equations that describe how a receiver measures a signal also describe how a transmitter emits one. The report chooses to use only one half of this symmetry.

Every output in this report is labeled with the designation "SANDBOX CIVIL DEFENSE ONLY." This label appears on all figures, all tables, and all numerical results. It serves as a reminder that the tools and techniques described are intended solely for the purpose of civil defense: monitoring broadcast signals, tracking space objects, measuring ionospheric conditions, and providing early warning of natural hazards. The reader is assumed to understand that the same physics that enables these civil-defense applications can be applied in other contexts, and that the responsibility for ensuring appropriate use rests with the operator, not with the physics. The dual-use framing is consistent with the ethics discussion in Chapter 3 and with the formal design constraints documented in Chapter 4.

This chapter establishes the physics vocabulary for the remainder of the report. The reader who has internalized the relationships between frequency and wavelength, the sign convention for Doppler shifts, the logarithmic nature of path loss, and the 6.02 dB-per-doubling rule is prepared to engage with the horizon-geometry analysis in Chapter 8, the signal-to-noise ratio framework in Chapter 9, and the TDOA hyperbolic positioning methods in Chapter 11. Each of these chapters builds directly on the foundations laid here, and the cross-references below indicate where each concept is carried forward.

## References (open)

- International Bureau of Weights and Measures. *The International System of Units (SI)*, 9th ed. Bureau International des Poids et Mesures, 2019.
- ITU-R. Recommendation P.525: *Simple Free-Space Propagation Model*. International Telecommunication Union, 2023.
- Skolnik, M. *Introduction to Radar Systems*, 3rd ed. McGraw-Hill Education, 2001.

## Cross-references

- **Chapter 8** (Radio Horizon, Diffraction & Refraction): extends the free-space model to account for the 4/3 Earth-radius effective model and computes the radio horizon distance as a function of antenna height.
- **Chapter 9** (Signal-to-Noise Ratio Literacy): applies the Boltzmann constant k_B and the free-space path loss formula to compute receiver sensitivity and detection thresholds.
- **Chapter 11** (TDOA Hyperbolae): uses the wavelength and Doppler shift concepts from this chapter to derive the range and range-rate measurements that feed into hyperbolic positioning algorithms.
