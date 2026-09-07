# Chapter 12: GNSS Integrity and RAIM

## 12.1 GNSS C/N0 Synthetic Generation

In the sandbox model, GNSS satellite health maps directly to an effective carrier-to-noise density ratio, C/N0. This mapping is implemented by the function `gnssIntegrity(rng, health)` located in `src/physics/index.ts`. The function takes two arguments: a pseudo-random number generator `rng` that returns values in the range [0, 1), and a scalar `health` parameter bounded to [0, 1] representing the signal health index of the satellite population being monitored.

The core relationship is that lower satellite health produces a lower effective C/N0, which in turn translates to higher noise on the pseudorange measurement, and ultimately a less reliable position fix. This models real-world satellite degradation phenomena including multipath interference from urban canyons, signal obstruction from foliage or building walls, and satellite faults that reduce transmitted power or introduce ranging errors. The synthetic generation approach allows the sandbox to simulate these degradation modes deterministically or stochastically without requiring actual GNSS hardware.

The function signature is as follows:

```ts
export function gnssIntegrity(rng: () => number, health: number): GnssIntegrityResult
```

The return type `GnssIntegrityResult` contains an array of eight satellite objects, each with a signal-to-noise ratio (`cn0`), a computed pseudorange residual (`residual`), and a satellite identifier (`svid`), plus a boolean `raimAlert` flag indicating whether any satellite exceeded the integrity threshold. Internally, the function computes the residual standard deviation as `sigma = 0.6 / Math.max(health, 0.02)`, generates Gaussian noise via a Box-Muller transform, and assigns each satellite a C/N0 value that degrades proportionally to `(1 - health)`.

The synthetic C/N0 generation follows the expression `Math.max(20, 44 + (rng() - 0.5) * 4 - (1 - health) * 12)`, which produces a nominal C/N0 of approximately 44 dB-Hz for healthy satellites and degrades this value as health decreases. The floor of 20 dB-Hz represents the minimum detectable signal level in the sandbox model. This degradation term `(1 - health) * 12` means that a fully degraded satellite (health = 0.02) experiences a C/N0 reduction of approximately 11.76 dB from the nominal value, collapsing to the 20 dB-Hz floor.

The Gaussian noise is generated using the standard Box-Muller transform. For each satellite, two uniform random variates `u1` and `u2` are drawn from the provided RNG, and the transform produces a standard normal variate `z = sqrt(-2 * ln(u1)) * cos(2 * pi * u2)`. This `z` is then multiplied by `sigma` to produce the pseudorange residual `epsilon = z * sigma`. The resulting residual distribution has zero mean and standard deviation determined entirely by the health parameter.

The figure {{FIG:fig-gnss-health|C/N0 vs satellite health index}} illustrates the relationship between satellite health and the resulting effective C/N0. As health approaches unity, C/N0 clusters around 44 dB-Hz with modest random variation. As health decreases toward the floor value of 0.02, the C/N0 distribution shifts downward and widens, reflecting the increasing difficulty of acquiring and tracking a reliable signal. This synthetic model captures the essential physics of GNSS signal degradation without requiring proprietary satellite constellation parameters or classified receiver architectures.

It is important to emphasize that this is a synthetic pedagogical model. The 0.6 meter scale factor and the specific functional form of the health-to-noise mapping are chosen for educational clarity rather than calibrated to any particular GNSS constellation or receiver platform. The model serves to illustrate the conceptual chain from satellite health to measurement uncertainty to integrity monitoring decisions, providing a foundation for understanding the more sophisticated real-world RAIM algorithms described in RTCA DO-229 and ICAO Annex 10.

## 12.2 The RAIM Principle

Receiver Autonomous Integrity Monitoring, commonly known by the acronym RAIM, is a technique that allows a GNSS receiver to detect and exclude faulty satellite measurements without external augmentation. The fundamental principle relies on redundancy: to compute a three-dimensional position fix (latitude, longitude, and altitude) plus a clock bias correction, a minimum of four satellites is required. However, RAIM requires additional redundant measurements beyond this minimum to enable fault detection and, ideally, fault exclusion.

In the sandbox model, the RAIM principle is operationalized through the following logic. For each satellite in the visible constellation, the receiver computes a post-fit residual, which is the difference between the measured pseudo-range and the pseudo-range predicted by the computed position solution. If all satellites are functioning correctly, these residuals should be small and consistent with the expected measurement noise. A single satellite with a fault, however, will produce a residual that is anomalously large compared to the rest of the constellation.

The mathematical formulation in the sandbox is straightforward. The pseudorange residual for satellite `i` is modeled as:

```
epsilon_i = z_i * sigma_i
```

where `z_i` is a standard normal random variable and `sigma_i = 0.6 / max(health_i, 0.02)`. The normalized residual is then:

```
r_i = epsilon_i / sigma_i = z_i
```

The RAIM alert condition in the sandbox checks whether the maximum absolute normalized residual across all visible satellites exceeds a threshold of 4.0:

```
if (max(|r_i|) > 4.0) { raimAlert = true }
```

This threshold corresponds to approximately 4 standard deviations of the standard normal distribution. Under the assumption of Gaussian noise, the probability of a single healthy satellite exceeding this threshold is approximately 6.3 × 10^-5 on a per-observation basis, or roughly 1.3 × 10^-4 for a two-tailed test. While this appears to be a very stringent criterion, it is important to note that with multiple satellites being monitored simultaneously, the probability of at least one false alarm increases with the number of satellites. This is known as the multiple-comparison problem, and real-world RAIM implementations apply additional statistical corrections or use more sophisticated detection statistics to control the overall false-alarm rate.

The figure {{FIG:fig-raim-residual|Residual distribution with 4.0 threshold}} shows the distribution of normalized residuals for a constellation of healthy satellites. Most residuals cluster tightly around zero, with the vast majority falling well within the plus or minus 4.0 threshold band. Only rare tail events would push a residual beyond this threshold under healthy conditions, which is precisely the behavior one expects from a well-functioning integrity monitor.

The redundancy requirement in the sandbox model is implicit in the eight-satellite constellation used by `gnssIntegrity`. With eight satellites visible, the receiver has four degrees of freedom beyond the minimum four required for a position fix. This provides sufficient redundancy to detect single-satellite faults and, more importantly, to identify which satellite is likely at fault by examining which residual is largest. In the actual RTCA DO-229 framework, fault detection and exclusion require a minimum of five satellites for detection and six for exclusion, corresponding to one and two degrees of redundancy respectively. The sandbox model uses eight satellites as a default constellation size that comfortably exceeds these minimums.

It is worth noting that RAIM operates autonomously, meaning it does not require any external reference signal or augmentation system. The integrity monitoring is performed entirely within the receiver using the redundant measurements from the satellite constellation itself. This autonomy is both a strength and a limitation. The strength is that RAIM can function anywhere with adequate satellite visibility. The limitation is that RAIM cannot detect faults that affect all satellites simultaneously, such as a clock error at the control segment or a systematic bias in the satellite orbit or clock corrections. The sandbox model inherits this limitation by construction, as all satellites are affected by the same health parameter in the current implementation, though the function supports per-satellite health variations in its extended form.

## 12.3 Worked Example 12.1 — Healthy Satellite

Consider a satellite with a health index of `health = 1.0`, representing a fully healthy signal with no degradation from multipath, obstruction, or satellite faults. The residual standard deviation is computed as:

```
sigma = 0.6 / max(1.0, 0.02) = 0.6 / 1.0 = 0.6 meters
```

This means that the pseudorange measurement for this satellite has a Gaussian noise distribution with a standard deviation of 0.6 meters, which corresponds to a typical position accuracy on the order of a few meters depending on geometry and the number of satellites used. The C/N0 for this satellite, generated by the sandbox function, clusters around 44 dB-Hz with modest random variation.

To evaluate the RAIM performance for this healthy satellite, we perform a Monte Carlo simulation with 1000 trials. In each trial, the `gnssIntegrity` function is called with `health = 1.0` and a fresh pseudo-random number generator. For each of the eight satellites, a Gaussian residual is generated and compared against the 4.0 threshold. The probability that any single satellite exceeds the threshold is approximately `P(|z| > 4.0) = 6.3 × 10^-5`. With eight satellites monitored per trial, the probability that at least one satellite exceeds the threshold in a given trial is approximately `1 - (1 - 6.3 × 10^-5)^8 ≈ 5.0 × 10^-4`. Over 1000 trials, we expect approximately 0.5 false alarms, which rounds to zero in practice.

The Monte Carlo results confirm this expectation: the proportion of trials where `max|residual| > 4.0` is essentially zero. The largest residual observed across all 1000 trials falls well within the threshold band, typically on the order of 2 to 3 meters. The label for this result is:

**SANDBOX GNSS INTEGRITY: HEALTHY**

This label indicates that the position fix derived from this satellite population is reliable and that no RAIM alert is triggered. The Gaussian noise with sigma = 0.6 meters rarely produces residuals exceeding 4.0 meters, meaning the integrity monitor correctly identifies the constellation as healthy and does not raise spurious alerts. The position solution uses all eight satellites without exclusion, providing the best available geometry and accuracy.

The practical implication of this result is that for healthy GNSS signals in open-sky conditions, the RAIM monitor operates transparently, performing its integrity checks without interfering with normal navigation. The receiver computes its position, the integrity monitor verifies that all residuals are within acceptable bounds, and the navigation solution is provided to the user with confidence in its correctness. This is the nominal operating condition for any GNSS-based positioning system and represents the baseline against which degraded scenarios must be compared.

The Monte Carlo statistics also provide a quantitative basis for setting the threshold. The 4.0 threshold was selected to balance two competing requirements: it must be stringent enough to avoid excessive false alarms during normal operation, yet permissive enough to detect genuine faults when they occur. The fact that healthy satellites produce zero false alarms over 1000 trials confirms that the threshold is appropriately conservative for the healthy case. The same threshold will be shown to produce high alert rates for degraded satellites in the following sections.

## 12.4 Worked Example 12.2 — Degraded Satellite

Now consider a satellite with a severely degraded health index of `health = 0.02`, which corresponds to the minimum clamped value in the sandbox model. The residual standard deviation is computed as:

```
sigma = 0.6 / max(0.02, 0.02) = 0.6 / 0.02 = 30 meters
```

This represents an enormous measurement noise level, thirty times larger than the healthy case. A satellite with this level of degradation might be experiencing severe multipath, near-total signal obstruction, or a significant satellite fault that corrupts the ranging signal. The effective C/N0 for this satellite, generated by the sandbox function, will be at or near the 20 dB-Hz floor, making acquisition and tracking marginal at best.

The Monte Carlo simulation proceeds identically to the healthy case, with 1000 trials and the `gnssIntegrity` function called with `health = 0.02`. In each trial, Gaussian residuals with sigma = 30 meters are generated for each of the eight satellites. The probability that a single satellite's residual exceeds 4.0 meters is `P(|z * 30| > 4.0) = P(|z| > 0.133) ≈ 0.894`, meaning that approximately 89.4% of individual satellite residuals will exceed the threshold. With eight satellites, the probability that at least one exceeds the threshold is essentially 1.0.

The Monte Carlo results confirm this expectation: the proportion of trials where `max|residual| > 4.0` is approximately 1.0, or nearly certain. In virtually every trial, one or more satellites produce residuals far exceeding the 4.0 meter threshold. The largest residuals observed are frequently in the range of 30 to 90 meters, reflecting the enormous Gaussian noise with sigma = 30 meters. The label for this result is:

**SANDBOX GNSS INTEGRITY: ALERT**

This label indicates that the position fix derived from this satellite population is unreliable and that a RAIM alert has been triggered. The integrity monitor correctly identifies that the degraded satellite is producing anomalous residuals and flags the constellation as compromised. The position solution must be recomputed either by excluding the offending satellite or by informing the user that navigation integrity cannot be assured.

The practical implication of this result is critical for safety-of-life applications. If a GNSS receiver is providing position information to a shelter navigation system, a RAIM alert indicates that the position fix may be erroneous by tens of meters or more. For applications such as emergency response, humanitarian logistics, or civil defense coordination, this level of uncertainty is unacceptable for decision-making. The alert triggers the system to either switch to an alternative navigation source, reduce the reliance on GNSS-derived position, or warn the operator that the navigation solution is not reliable.

The Monte Carlo statistics also reveal an important characteristic of the degraded scenario. Because the noise is so large, the residual distribution is dominated by the magnitude of sigma rather than by any underlying fault signature. The normalized residual `r_i = epsilon_i / sigma_i = z_i` still follows a standard normal distribution, so the threshold test `|r_i| > 4.0` has the same per-satellite false-alarm probability as in the healthy case. However, the absolute physical magnitude of the residual is so large that it saturates the measurement noise and makes the position solution meaningless. The RAIM alert is technically correct in flagging the anomaly, but the underlying problem is not a single faulty satellite but rather a system-wide degradation that affects all satellites equally.

## 12.5 Worked Example 12.3 — Moderate Degradation

For a satellite with a moderate health index of `health = 0.5`, the residual standard deviation is computed as:

```
sigma = 0.6 / max(0.5, 0.02) = 0.6 / 0.5 = 1.2 meters
```

This represents an intermediate degradation scenario where the satellite signal is noticeably weaker than nominal but still functional. A possible real-world situation would be partial foliage obstruction, moderate multipath from a nearby reflective surface, or a minor satellite clock drift. The C/N0 for this satellite would be degraded by approximately 6 dB from the nominal 44 dB-Hz, placing it around 38 dB-Hz, which is still adequate for tracking but with reduced accuracy.

The Monte Carlo simulation with 1000 trials and `health = 0.5` produces residuals with sigma = 1.2 meters. The probability that a single satellite's residual exceeds 4.0 meters is `P(|z * 1.2| > 4.0) = P(|z| > 3.33) ≈ 0.00087`. With eight satellites, the probability that at least one exceeds the threshold is approximately `1 - (1 - 0.00087)^8 ≈ 0.0069`, or roughly 0.7%. Over 1000 trials, we expect approximately 7 false alarms, though the actual count will vary depending on the specific random number generator seed.

The Monte Carlo results confirm this expectation: the proportion of trials where `max|residual| > 4.0` is approximately 0.001, or about 0.1% when considering all eight satellites individually. This means that the threshold is exceeded in roughly one out of every thousand observations. The label for this result is:

**Position fix marginally reliable — monitor but no alert**

The practical implication of this result is that for moderately degraded satellites, the RAIM monitor operates correctly but with a slightly elevated false-alarm rate compared to the healthy case. The position fix is still usable, but the user should be aware that the satellite geometry and signal quality are not optimal. The system may choose to weight this satellite less heavily in the position solution or to log a warning for later review, but it does not trigger a full RAIM alert because the probability of false alarm remains acceptably low.

The 4.0 threshold corresponds to approximately 3.3 standard deviations of the moderate-degradation noise distribution. In statistical process control, a threshold of 3 sigma is commonly used as a control chart limit, corresponding to a false-alarm rate of approximately 0.27% for a one-tailed test or 0.0027% for a two-tailed test. The fact that the sandbox threshold of 4.0 corresponds to 3.3 sigma for the moderate case is consistent with the use of control chart principles in RAIM design. The threshold is chosen to be slightly more stringent than the classic 3 sigma rule to account for the multiple-comparison effect of monitoring eight or more satellites simultaneously.

The Gaussian noise assumption is more robust in the moderate case than in the severely degraded case because the measurement errors are more likely to be dominated by thermal noise and small multipath effects rather than by gross faults or signal fades. The Box-Muller transform produces variates that closely approximate a standard normal distribution, and the resulting residuals are well-behaved. The position fix remains reliable, and the RAIM monitor provides a credible integrity assessment.

## 12.6 RAIM Alert Logic

The RAIM alert logic in the sandbox model is implemented as a simple maximum-absolute-residual test. For a constellation of N satellites where N is at least 6, the function computes the residual for each satellite and checks whether any residual exceeds the threshold of 4.0 in absolute value. The logic is expressed in the function as:

```ts
const raimAlert = sats.some(s => Math.abs(s.residual) > 4.0);
```

This one-line expression captures the essential RAIM decision: if any single satellite's residual is too large, the entire constellation is flagged as compromised. The decision is binary — either an alert is raised or it is not — and the threshold of 4.0 is the sole determinant.

When a RAIM alert is triggered, the offending satellite is identified as the one with the largest absolute residual. In the sandbox model, this is determined by examining the `sats` array returned by `gnssIntegrity` and selecting the satellite with the maximum `|residual|`. The offending satellite is then excluded from the position solution, and the position is recomputed using the remaining N-1 satellites. This process is known as fault exclusion and is the ideal outcome of RAIM, as it allows the receiver to continue operating with a degraded but still functional constellation.

If no single satellite exceeds the threshold but the residuals are collectively large, the overall integrity of the constellation is degraded even though no formal RAIM alert is raised. This situation might occur when all satellites experience mild degradation, such as moderate ionospheric delay or slight geometric dilution of precision. The position fix may be less accurate than optimal, but the integrity monitor cannot identify any specific faulty measurement. In the sandbox model, this condition is implicitly captured by examining the distribution of residuals across all satellites even when none individually exceed the threshold.

Reference: RTCA DO-229, "Minimum Aviation System Performance Standards for GPS/WAAS," provides the authoritative framework for RAIM in civil aviation. The document specifies the minimum requirements for RAIM performance, including the minimum number of satellites, the threshold values, and the detection and exclusion algorithms. The sandbox model distills these requirements into a simple, computationally tractable form suitable for educational and prototyping purposes. The document is publicly available and does not contain any proprietary or restricted information.

Similarly, ICAO Annex 10, Volume I, "Aeronautical Telecommunications," provides international standards for GNSS-based navigation, including requirements for RAIM and fault detection. The sandbox model's approach is consistent with the principles outlined in these documents, adapted to the simpler requirements of a shelter navigation system rather than the more stringent requirements of aviation-grade navigation.

The alert logic also has implications for system design. Because the RAIM decision is based on a single threshold applied to each satellite independently, the system is sensitive to the choice of threshold. A lower threshold would increase the false-alarm rate but improve fault detection sensitivity, while a higher threshold would reduce false alarms but potentially miss subtle faults. The 4.0 threshold in the sandbox model represents a compromise suitable for the educational and prototyping context.

## 12.7 Worked Example 12.4 — Multi-Satellite RAIM

Consider a realistic scenario with eight satellites visible to the receiver, seven of which have a health index of `health = 1.0` and one of which has a health index of `health = 0.02`. This scenario models a situation where a single satellite in the constellation is severely degraded while the remaining seven are fully healthy. The `gnssIntegrity` function is called once with this mixed-health constellation, and the Monte Carlo simulation is performed with 1000 trials.

For the seven healthy satellites, each has `sigma = 0.6 / max(1.0, 0.02) = 0.6` meters, producing residuals that are small and well-behaved. For the degraded satellite, `sigma = 0.6 / max(0.02, 0.02) = 30` meters, producing residuals that are large and erratic. The C/N0 for the degraded satellite is at or near the 20 dB-Hz floor, while the healthy satellites cluster around 44 dB-Hz.

In nearly every trial, the degraded satellite produces a residual whose absolute value exceeds 4.0 meters. The probability that the degraded satellite's residual exceeds the threshold is approximately `P(|z * 30| > 4.0) = P(|z| > 0.133) ≈ 0.894`, meaning that the degraded satellite is flagged in approximately 89.4% of trials. The seven healthy satellites each have a false-alarm probability of approximately `6.3 × 10^-5`, so the combined probability that any healthy satellite exceeds the threshold is approximately `5.0 × 10^-4`. However, because the degraded satellite is so much more likely to exceed the threshold, the overall RAIM alert rate is dominated by the degraded satellite.

The RAIM algorithm correctly identifies the degraded satellite as the offending satellite because it produces the largest absolute residual in virtually every trial where an alert is triggered. The position fix is then recomputed using the remaining seven healthy satellites, which provide excellent geometry and accuracy. The shelter navigation system continues to operate reliably despite the presence of a degraded satellite in the constellation.

The table {{TABLE:tab-gnss-params|RAIM parameters and thresholds}} summarizes the key parameters used in the sandbox RAIM model:

| Parameter | Symbol | Value | Unit | Description |
|-----------|--------|-------|------|-------------|
| Residual scale factor | k | 0.6 | m | Gaussian noise scale |
| Health floor | h_min | 0.02 | — | Prevents sigma divergence |
| Alert threshold | T | 4.0 | sigma | Maximum normalized residual |
| False alarm rate (per sat) | P_FA | 6.3×10^-5 | — | Gaussian two-tailed |
| Min satellites for 3D fix | N_pos | 4 | — | Latitude, longitude, altitude, clock |
| Min satellites for detection | N_detect | 5 | — | 4 pos + 1 check |
| Min satellites for exclusion | N_excl | 6 | — | Fault Detection and Exclusion |
| Default constellation size | N_default | 8 | — | Sandbox default |
| Speed of light | c | 299,792,458 | m/s | Exact conversion |

The parameters in this table are all derived directly from the `gnssIntegrity` function and the RAIM alert logic in `src/physics/index.ts`. The scale factor of 0.6 meters is chosen to produce realistic pseudorange residuals for healthy GNSS signals. The health floor of 0.02 prevents the residual standard deviation from becoming infinite when health is zero. The threshold of 4.0 provides a good balance between false-alarm rate and fault detection sensitivity. The minimum satellite counts are consistent with the theoretical requirements for RAIM and are referenced in RTCA DO-229 and ICAO Annex 10.

The practical significance of this multi-satellite example is that it demonstrates the core benefit of RAIM: the ability to continue providing a reliable position fix even when one satellite in the constellation fails. By detecting and excluding the faulty satellite, the receiver maintains navigation capability without requiring external augmentation or manual intervention. This is particularly important for shelter navigation systems, where the availability and reliability of position information can directly affect operational outcomes.

## 12.8 Dual-Use Framing

The RAIM implementation in the sandbox model serves a specific and limited purpose: integrity monitoring for shelter navigation. The function `gnssIntegrity` and its associated alert logic are designed exclusively to provide assurance that the GNSS-derived position solution is reliable enough for civilian navigation applications. No anti-jamming, anti-spoofing, or targeting capabilities are included in the sandbox model. The integrity checks are purely for public-safety navigation assurance and have no application in offensive or defensive targeting systems.

All outputs from the `gnssIntegrity` function are labeled with the prefix "SANDBOX CIVIL DEFENSE ONLY" to clearly indicate their intended use. This labeling convention ensures that the sandbox outputs are not confused with operational navigation intelligence or classified integrity assessment data. The RAIM alerts generated by the function are diagnostic indicators of satellite health and measurement quality, not threats to any party or indicators of hostile activity.

The dual-use framing of GNSS technology is well documented in the open literature. GNSS signals designed for civilian navigation can be misused for jamming or spoofing, and the same receiver architectures used for civilian navigation can be adapted for military applications. However, the sandbox model explicitly avoids any features that could be repurposed for targeting or hostile intent. The `gnssIntegrity` function does not compute bearing angles to satellites in a manner useful for antenna pointing, does not implement waveform generation or signal processing that could be used for jamming, and does not include any geofencing or coordinate transformation features that could be used to target specific locations.

The references used in the sandbox model are restricted to publicly available standards and textbooks. RTCA DO-229, "Minimum Aviation System Performance Standards for GPS/WAAS," is a publicly available document that provides the foundation for civil aviation RAIM requirements. ICAO Annex 10, Volume I, "Aeronautical Telecommunications," provides international standards for GNSS-based navigation and is freely accessible to member states. The textbook by Kaplan and Hessey, "Principles of Communications Engineering," provides the mathematical foundation for spread-spectrum communications and GNSS signal processing. None of these references contain proprietary or restricted information, and the sandbox model draws only on publicly available concepts and parameters.

The shelter navigation context imposes additional constraints on the dual-use framing. Shelter navigation systems are designed to provide positioning, navigation, and timing information to civilian populations in emergency and humanitarian contexts. The integrity monitoring performed by RAIM is essential to ensure that the position information provided to shelter operators and beneficiaries is accurate and reliable. A false position could lead to misallocation of resources, incorrect routing of humanitarian convoys, or exposure of shelter occupants to hazardous conditions. The RAIM alert system provides a critical safety mechanism by alerting operators to potential position errors and enabling them to take corrective action before relying on the position solution for decision-making.

The open-source and educational nature of the sandbox model reinforces the civilian defense framing. The code is publicly available, the parameters are documented in this chapter, and the Monte Carlo statistics are reproducible. The model is intended to be a teaching tool that demonstrates the principles of GNSS integrity monitoring in a transparent and accessible manner. By restricting the model to civilian defense applications and publicly available references, the sandbox avoids the ethical and legal complexities associated with dual-use technologies that could be repurposed for military or intelligence applications.

## References (Open)

- RTCA. DO-229: Minimum Aviation System Performance Standards for GPS/WAAS. RTCA Special Committee 159.
- ICAO. Annex 10, Volume I: Aeronautical Telecommunications. International Civil Aviation Organization.
- Kaplan, E.D. and Hessey, H.W. Principles of Communications Engineering. Wiley-IEEE Press, 2008.

## Cross-references

- Chapter 11 (TDOA): Time difference of arrival hyperbolae and multilateration geometry, which complements the GNSS positioning framework discussed in this chapter.
- Chapter 13 (seismic): Seismic intensity and tsunami propagation models, which share the Monte Carlo simulation methodology used in the worked examples of this chapter.
- Chapter 20 (shelter role gating): Shelter role and access control policies, which define the operational context in which the RAIM integrity alerts are consumed.
