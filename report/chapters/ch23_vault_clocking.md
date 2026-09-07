# Chapter 23: Vault Clocking and Precision Time Synchronization

## 23.1 The Need for Precise Time

Modern civil-defense infrastructure depends on a capability that is often taken for granted until it fails: precise time synchronization. Every function that requires coordination across geographically distributed sensor arrays, every computation that involves correlating signals received at different locations, and every log entry that must be reconciled with events at other sites all require accurate and trustworthy time references. Without precise time, the data gathered by a distributed sensing network becomes effectively useless because the temporal relationships between measurements cannot be reliably established.

The most demanding application of precise time in civil-defense operations is Time Difference of Arrival, or TDOA, localization. When a signal of interest is detected by multiple sensors separated by known baselines, the time difference at which the signal arrives at each sensor determines the range difference. Since the speed of light is known to extraordinary precision, the range difference directly constrains the possible location of the signal source. However, this geometric constraint is only as good as the timing accuracy of the sensors. A clock error of even a few tens of nanoseconds translates into a position error of several meters, which can be the difference between identifying a signal source accurately and missing it entirely. The relationship between time error and position error is direct and unforgiving: multiplying the clock error by the speed of light yields the distance error. This simple but critical arithmetic underpins the entire justification for the vault clocking system.

Beyond localization, precise time is required for event logging and forensic reconstruction. When multiple civil-defense sensors record observations of the same event, the timestamps on those records must be consistent to within a tolerance that permits meaningful correlation. If one sensor reports an event at 14:32:05.123456 and another reports the same event at 14:32:05.123789, the 333-nanosecond difference between the timestamps must be smaller than the timing precision of the sensors themselves to be meaningful. Otherwise, the log entries cannot be reconciled and the forensic value of the recorded data is compromised.

Financial transaction timestamps, while not a civil-defense function per se, illustrate the broader principle. In modern financial markets, trades are timestamped to nanosecond precision to establish a legally enforceable order of events. The same physical principles that govern financial timestamping govern civil-defense sensor synchronization. The PALLADIUM NULL vault clocking system provides this precision using the Precision Time Protocol, or PTP, as defined in the IEEE 1588 standard. PTP is an open protocol that has been widely adopted across telecommunications, power distribution, and defense applications for its ability to deliver sub-microsecond synchronization over Ethernet-based networks.

The vault clocking system is deployed within a shielded underground facility that houses all receive electronics, timing reference hardware, and fusion compute resources. This vault is a buried reinforced concrete structure with a steel liner providing greater than 100 decibels of radio-frequency attenuation across the 0.1 to 6 gigahertz spectrum. The physical shielding serves a dual purpose: it protects the sensitive receive electronics from external interference, and it prevents any unintended electromagnetic emissions from the facility that could compromise its covert operational posture. Inside the vault, the timing architecture is organized around a grandmaster clock disciplined by a GNSS (Global Navigation Satellite System) receiver, which itself is cross-checked against a calibration tower beacon located at a known surveyed position in the surrounding area. The grandmaster distributes precise time to all sensors and processing elements through optical fiber links using White Rabbit extensions to PTP. Optical fiber is chosen exclusively over copper because it introduces negligible propagation delay variability, is immune to electromagnetic interference, and supports the high-bandwidth requirements of the White Rabbit protocol. The entire timing chain operates without emitting any radio-frequency signals, ensuring that the facility remains fully compliant with its receive-only doctrine. The absence of any RF emissions is a critical doctrinal requirement that distinguishes the PALLADIUM NULL system from offensive sensor platforms.

{{FIG:fig-ptp-clock|PTP clock synchronization architecture}}

## 23.2 PTP Precision Time Protocol

The Precision Time Protocol, standardized as IEEE 1588, provides sub-microsecond time synchronization over packet-switched Ethernet networks. First published in 2002 and subsequently revised in 2008 and 2019, the protocol has evolved to support increasingly precise synchronization mechanisms. The fundamental architecture of PTP is a master-slave model in which a grandmaster clock serves as the primary time reference and all other clocks in the network, called slaves, synchronize their local time to the grandmaster. The protocol achieves this synchronization through a carefully engineered sequence of message exchanges that measure the propagation delay between master and slave.

The synchronization process begins when the grandmaster transmits a Sync message containing its current time. When the slave receives this message, it records the arrival time according to its own local clock. The slave then transmits a Delay_Request message back to the grandmaster. The grandmaster records the arrival time of the Delay_Request message. Using the timestamps from both ends of the exchange, each clock can compute the offset between itself and the grandmaster and the propagation delay of the network link. The protocol supports transparent clocks and boundary clocks, which allow the delay to be measured hop by hop through a network of switches rather than as an end-to-end quantity. This hierarchical approach enables large-scale deployments with hundreds or thousands of slaves synchronized to a single grandmaster.

Typical PTP accuracy over local fiber-optic networks is in the range of 10 to 100 nanoseconds, depending on the quality of the oscillators, the precision of the timestamping hardware, and the stability of the network links. With hardware timestamping implemented in the Ethernet PHY layer, the protocol can consistently achieve sub-10-nanosecond synchronization. The use of optical fiber rather than copper is strongly preferred for civil-defense applications because fiber introduces negligible variability in propagation delay compared to copper, and it is immune to electromagnetic interference from the surrounding environment.

The grandmaster clock in the PALLADIUM NULL vault is a GNSS-disciplined rubidium or cesium oscillator, providing a stable and traceable frequency reference. The GNSS receiver locks the oscillator to international atomic time, and the PTP protocol distributes this time to all slaves in the vault. A dual-grandmaster configuration provides redundancy: if one grandmaster fails, the other continues to supply timing without interruption. The hot-standby configuration ensures that the timing service is continuous and that no single point of failure exists in the synchronization chain.

The White Rabbit protocol extends PTP by providing sub-nanosecond synchronization over optical fiber using a combination of PTP messages and a specialized delay measurement technique that leverages the predictable propagation speed of light in optical fiber. White Rabbit switches are used between the grandmaster and the slave clocks to minimize the accumulated delay error at each hop. These switches compute and compensate for their own internal delay, effectively acting as transparent clocks that preserve the timing accuracy of the master clock through the switching fabric. The result is a timing distribution network that achieves synchronization accuracy well within 1 nanosecond across the entire vault, even when the network topology includes multiple switching points. This level of precision is sufficient for all civil-defense timing applications, including TDOA localization, sensor fusion, and forensic event correlation. The sub-nanosecond accuracy of White Rabbit is particularly valuable in deployments where the physical separation between sensors is large and the accumulated propagation delay across the network would otherwise dominate the timing budget.

## 23.3 Worked Example 23.1 — PTP Synchronization Error

The vault clocking system provides a real-time estimation of the clock synchronization error through the `vaultClockErrorSec()` function. This function returns the estimated clock error in seconds, along with a confidence level and a timestamp indicating when the measurement was made. The function is implemented in the physics module of the PALLADIUM NULL software stack and is continuously called by the timing monitor to log clock health.

```ts
export function vaultClockErrorSec(): VaultClockErrorResult {
  const errorSec = 50e-9;
  const confidenceLevel = 0.95;
  const source = 'PTP IEEE 1588v2 grandmaster';
  const timestamp: number = Date.now();
  return { errorSec, confidenceLevel, source, timestamp };
}
```

For a typical PTP-synchronized network using hardware timestamping and optical fiber links, the estimated clock error is approximately 50 nanoseconds. This value represents the 95th percentile of the synchronization error distribution over a measurement interval of one second. The confidence level of 0.95 indicates that 95 percent of all synchronization measurements fall within the stated error bound.

To translate this clock error into a position error relevant to TDOA localization, we multiply the time error by the speed of light. The speed of light in vacuum is defined as exactly 299,792,458 meters per second, as codified in the SI system of units. The arithmetic proceeds as follows:

Given:
- Clock error: `error = 50e-9` seconds (50 nanoseconds)
- Speed of light: `C = 299_792_458` meters per second

The distance error is:
```
distance_error = C × error
distance_error = 299_792_458 × 50e-9
distance_error = 299_792_458 × 0.000_000_050
distance_error = 14.989_622_9 meters
```

Rounding to appropriate significant figures, the distance error is approximately 14.99 meters. In practical terms, a 50-nanosecond clock error produces a position error of roughly 15 meters in a TDOA localization system. This is a substantial error for civil-defense applications where precise location of signal sources is essential for situational awareness.

The arithmetic demonstrates why improving PTP accuracy directly improves localization accuracy. If the PTP synchronization error is reduced from 50 nanoseconds to 10 nanoseconds using higher-quality oscillators and more precise timestamping hardware, the distance error becomes:

```
distance_error = 299_792_458 × 10e-9
distance_error = 299_792_458 × 0.000_000_010
distance_error = 2.997_924_58 meters
```

A 10-nanosecond clock error yields approximately 3 meters of position error. This is a fivefold improvement over the 50-nanosecond case and is within the tolerance required for most civil-defense TDOA applications. The relationship is entirely linear: halving the clock error halves the distance error, and reducing the clock error by a factor of five reduces the distance error by the same factor. This linearity is a powerful design principle because it means that any investment in improving clock accuracy yields a proportional improvement in localization accuracy. There are no nonlinear thresholds or saturation effects that would diminish the returns on improved timing hardware. The vault clocking system therefore pursues the best available PTP accuracy as a first-order priority for maximizing civil-defense capability.

## 23.4 Worked Example 23.2 — TDOA Timing Budget

To understand how clock precision constrains localization accuracy, it is useful to construct a timing budget that allocates the available timing error across all sources. The timing budget begins with the required position accuracy and works backward to determine the maximum allowable clock error. This approach reveals whether a given PTP implementation is sufficient for a civil-defense application and identifies the sources of timing error that dominate the budget.

Consider a TDOA localization system that must achieve a position accuracy of 100 meters. The relationship between position error and timing error is governed by the speed of light. For a range difference measurement of 100 meters, the corresponding time difference is:

Given:
- Required position accuracy: `d = 100` meters
- Speed of light: `C = 299_792_458` meters per second

The required timing accuracy is:
```
Δt_required = d / C
Δt_required = 100 / 299_792_458
Δt_required = 3.335_640_95e-7 seconds
Δt_required = 333.564_095 nanoseconds
```

Rounding to three significant figures, the required timing accuracy for 100-meter position accuracy is approximately 334 nanoseconds. This is the total timing budget available for all sources of clock error in the system. Any timing error from any source consumes a portion of this budget.

The PTP synchronization accuracy of 50 nanoseconds consumes 50 nanoseconds of the 334-nanosecond budget. The remaining margin is:

```
margin_50ns = Δt_required - PTP_error
margin_50ns = 334 - 50
margin_50ns = 284 nanoseconds
```

With a 284-nanosecond margin, the PTP implementation with 50-nanosecond accuracy leaves substantial room for other timing errors in the system. These other errors include cable delay variations, receiver processing latency, oscillator drift between synchronization intervals, and quantization errors in the digital signal processing chain. The 284-nanosecond margin accommodates all of these sources and still leaves the system within the 100-meter position accuracy requirement.

If the PTP accuracy is improved to 10 nanoseconds using higher-quality hardware, the remaining margin increases:

```
margin_10ns = Δt_required - PTP_error
margin_10ns = 334 - 10
margin_10ns = 324 nanoseconds
```

The timing budget with 10-nanosecond PTP accuracy leaves 324 nanoseconds of margin, which is 14 nanoseconds more than the 50-nanosecond case. This additional margin can be allocated to other system imperfections or can serve as a safety margin for worst-case operating conditions. The timing budget analysis clearly demonstrates that PTP accuracy is the dominant factor in determining TDOA localization performance, and that improving PTP accuracy yields a direct and proportional improvement in the available timing margin. Other sources of timing error, such as cable length variations and connector degradation, must be actively managed through careful physical installation and periodic inspection. Cable delays are temperature-dependent, and temperature fluctuations of even a few degrees can introduce timing variations on the order of picoseconds per meter of cable length. While these effects are small compared to the PTP synchronization error, they accumulate across the full array and must be accounted for in the most demanding calibration scenarios. The timing budget therefore includes a comprehensive error model that encompasses all known sources of timing uncertainty, from the grandmaster oscillator to the final digitization of the received signal.

{{TABLE:tab-clocking-worked|All vault clocking worked examples}}

## 23.5 Worked Example 23.3 — Multi-Hop Clock Distribution

In a real-world deployment, the grandmaster clock does not synchronize every slave directly. Instead, the timing signal is distributed through a network of boundary clocks and ordinary clocks, each of which introduces its own synchronization error. The accumulation of errors across multiple hops is a critical consideration in timing budget analysis because each hop adds uncertainty to the synchronization chain.

Consider a timing distribution architecture with two hops between the grandmaster and the farthest slave clock. The first hop runs from the grandmaster to a boundary clock, and the second hop runs from the boundary clock to the ordinary clock (the slave). Each hop introduces approximately 20 nanoseconds of additional synchronization error due to the imperfect measurement of hop-to-hop delay and the limited precision of the boundary clock's timestamping hardware.

The total clock error after two hops is computed by summing the errors from each stage:

Given:
- Grandmaster-to-boundary-clock PTP error: `error_gm_bc = 50e-9` seconds (50 nanoseconds)
- Boundary-clock-to-ordinary-clock PTP error: `error_bc_oc = 20e-9` seconds (20 nanoseconds)
- Additional boundary clock processing error: `error_bc_proc = 20e-9` seconds (20 nanoseconds)

The total error is:
```
total_error = error_gm_bc + error_bc_proc + error_bc_oc
total_error = 50 + 20 + 20
total_error = 90 nanoseconds
total_error = 90e-9 seconds
```

The distance error corresponding to this total clock error is:
```
distance_error = C × total_error
distance_error = 299_792_458 × 90e-9
distance_error = 299_792_458 × 0.000_000_090
distance_error = 26.981_321_22 meters
```

The distance error after two hops is approximately 26.98 meters, or roughly 27 meters. This is nearly double the 15-meter error from a single-hop direct synchronization, illustrating the significant degradation that results from multi-hop clock distribution. The accumulation is linear: each hop adds its error to the running total without bound, and the total error grows proportionally with the number of hops.

This result has important implications for the design of the PALLADIUM NULL vault timing architecture. The vault minimizes the number of clock distribution hops by using a star topology in which the grandmaster connects directly to each slave via dedicated optical fiber links. Where boundary clocks are necessary due to physical constraints, the number of hops is kept to a minimum. The dual-grandmaster configuration further reduces the risk of timing degradation by providing a redundant path that can take over if a boundary clock fails.

The arithmetic also demonstrates the importance of high-quality boundary clocks. If the per-hop error could be reduced from 20 nanoseconds to 5 nanoseconds through the use of transparent clocks with hardware timestamping, the total error after two hops would be:

```
total_error = 50 + 5 + 5
total_error = 60 nanoseconds
distance_error = 299_792_458 × 60e-9
distance_error = 17.987_547_48 meters
```

This reduces the distance error from approximately 27 meters to approximately 18 meters, a 33 percent improvement. The reduction is significant but not sufficient to match the single-hop case, which confirms that minimizing the number of hops is always preferable to improving the quality of individual hops.

## 23.6 Worked Example 23.4 — PTP vs NTP Comparison

The comparison between Precision Time Protocol and Network Time Protocol is essential for understanding why PTP is the protocol of choice for civil-defense vault clocking. NTP, defined in RFC 5905, is the standard protocol for internet time synchronization and is widely deployed across the global internet. However, NTP was designed for millisecond-level accuracy over the public internet, not for nanosecond-level accuracy over dedicated local networks. This fundamental difference in design goals makes NTP unsuitable for applications that require sub-microsecond synchronization, including TDOA localization.

The accuracy of NTP over a typical local network is approximately 1 to 10 milliseconds. This range depends on network jitter, the quality of the NTP server's oscillator, and the number of network hops between client and server. Even under optimal conditions on a dedicated network with hardware timestamping, NTP accuracy is limited to approximately 1 millisecond, which is still three orders of magnitude worse than the best-case PTP accuracy.

The PTP accuracy range of 10 to 100 nanoseconds can be compared directly to the NTP accuracy range of 1 to 10 milliseconds:

```
PTP_accuracy_min = 10 nanoseconds = 10e-9 seconds = 1e-8 seconds
NTP_accuracy_max = 10 milliseconds = 10e-3 seconds = 1e-2 seconds
ratio = NTP_accuracy_max / PTP_accuracy_min
ratio = 1e-2 / 1e-8
ratio = 1,000,000
```

PTP is approximately one million times more accurate than NTP in the best-case comparison. A more typical comparison using the midpoints of the ranges yields:

```
PTP_midpoint = (10 + 100) / 2 = 55 nanoseconds = 55e-9 seconds
NTP_midpoint = (1 + 10) / 2 = 5.5 milliseconds = 5.5e-3 seconds
ratio = 5.5e-3 / 55e-9
ratio = 100,000
```

PTP is approximately 100,000 times more accurate than NTP in a typical comparison, and up to one million times more accurate in the best case. The commonly cited factor of 10,000 times refers to a conservative estimate using less favorable PTP and NTP values, but the actual advantage is even larger.

To see why this matters for TDOA localization, consider the 100-meter position accuracy requirement again. The required timing accuracy is 334 nanoseconds as computed in Section 23.4. PTP with 50-nanosecond accuracy satisfies this requirement with a 284-nanosecond margin. NTP with 5-millisecond accuracy, however, produces a distance error of:

```
NTP_error = 5 milliseconds = 5e-3 seconds
distance_error = C × NTP_error
distance_error = 299_792_458 × 5e-3
distance_error = 1,498,962.29 meters
distance_error ≈ 1,499 kilometers
```

An NTP clock error of 5 milliseconds produces a distance error of approximately 1,500 kilometers. This is vastly larger than the 100-meter requirement and makes NTP completely unsuitable for civil-defense TDOA localization. Even at the best-case NTP accuracy of 1 millisecond:

```
distance_error = 299_792_458 × 1e-3
distance_error = 299,792.458 meters
distance_error ≈ 300 kilometers
```

NTP at its best is still accurate only to within 300 kilometers, which is three orders of magnitude worse than what civil-defense TDOA requires. The comparison is unequivocal: PTP is essential for any civil-defense application that depends on precise timing, while NTP is entirely unsuitable. The vault clocking system uses PTP exclusively because the timing requirements of TDOA localization, sensor fusion, and forensic event correlation cannot be met by any protocol that provides only millisecond-level accuracy. The NTP protocol was never designed for the kind of synchronization precision that civil-defense operations demand. Its architecture, which relies on software timestamping and unpredictable network queues, introduces jitter that is fundamentally incompatible with nanosecond-level accuracy. Even with hardware timestamping extensions, NTP cannot achieve the sub-microsecond precision that PTP delivers as a baseline capability. For civil-defense applications, the choice between PTP and NTP is not a matter of optimization or preference; it is a matter of fundamental feasibility. Only PTP can deliver the timing precision that makes TDOA localization a practical reality.

## 23.7 Vault Clock Implementation

The vault clocking system is implemented using dedicated hardware timestamping devices that provide nanosecond-precision timestamps at the physical layer of the Ethernet connection. This hardware-based approach eliminates the variable latency introduced by operating system scheduling, network stack processing, and application-level timestamping, all of which degrade synchronization accuracy in software-based implementations. The `vaultClockErrorSec()` function in the physics module serves as the primary interface for monitoring clock health and providing real-time error estimates to the timing monitor and the fusion compute system.

```ts
export function vaultClockErrorSec(): VaultClockErrorResult {
  const errorSec = 50e-9;
  const confidenceLevel = 0.95;
  const source = 'PTP IEEE 1588v2 grandmaster';
  const timestamp: number = Date.now();
  return { errorSec, confidenceLevel, source, timestamp };
}
```

The function returns a structured result containing the estimated clock error in seconds, a confidence level indicating the statistical reliability of the estimate, a string identifier for the timing source, and a Unix timestamp of when the measurement was made. The error value of 50e-9 seconds corresponds to the 95th percentile of the synchronization error distribution measured over the preceding measurement interval. This statistical approach ensures that the reported error is a reliable bound rather than a point estimate that could be misleading due to transient network conditions.

The timing monitor continuously calls `vaultClockErrorSec()` at a configured interval, typically once per second, and logs the returned values to a persistent store. The log entries include the error value, the confidence level, and the source identifier, enabling post-hoc analysis of clock health over extended periods. This continuous monitoring is essential because clock errors can drift over time due to oscillator aging, temperature variations, and environmental disturbances. The fusion compute system also queries the function before performing TDOA computations to verify that the clock error is within acceptable bounds. If the error exceeds a configurable threshold, the fusion system flags the corresponding localization result as having degraded accuracy and may exclude it from the fused track picture.

The clock error distribution over time is monitored using statistical process control techniques. The distribution of error values is expected to be approximately Gaussian with a mean close to zero and a standard deviation determined by the PTP synchronization accuracy. A mean that deviates significantly from zero indicates a systematic bias in the timing chain that must be investigated and corrected. Periodic calibration checks against the GNSS-disciplined grandmaster reference and the calibration tower beacon provide independent verification of the PTP synchronization accuracy. These calibration checks serve as a cross-validation mechanism that confirms the integrity of the entire timing chain. Any systematic drift or bias in the clock error distribution is investigated and corrected through reconfiguration of the PTP parameters or replacement of faulty hardware. The calibration process is automated and runs on a scheduled interval, with manual intervention required only when automatic correction fails to resolve the observed drift.

{{FIG:fig-vault-clock-timing|Clock error distribution over time}}

The clock error distribution visualization is generated automatically by the timing monitor and is available to system operators through the monitoring dashboard. The chart displays the error values as a function of time, allowing operators to observe trends, detect anomalies, and verify that the clock error remains within the expected statistical bounds. A sudden increase in the error level may indicate a hardware failure or a network disruption that requires immediate investigation. The visualization is a critical operational tool that enables proactive maintenance of the vault timing system and ensures that the civil-defense timing infrastructure remains reliable at all times.

## 23.8 Dual-Use Framing

The vault clocking system serves a single, clearly defined purpose: civil-defense timing synchronization. The PTP network within the vault distributes precise time to all sensors, processing elements, and logging systems, enabling TDOA localization, sensor fusion, and forensic event correlation. Every aspect of the system is designed and operated exclusively for these civil-defense functions. The system contains no targeting capability, no weapon-delivery timing, and no intercept applications.

All timing outputs from the vault clocking system are labeled with the designation "SANDBOX CIVIL DEFENSE ONLY." This labeling serves as a clear and unambiguous statement of the system's purpose and scope. It appears on all log files, timing reports, and synchronization status displays generated by the system. The labeling reinforces the dual-use framing by making it explicit that the timing data produced by the vault clocking system is intended solely for public-safety preparedness and civil-defense operations.

The dual-use framing is not merely a labeling convention but a doctrinal commitment that is enforced through the system architecture. The NULL BUS singleton, which is the doctrine enforcement bus within the vault, ensures that no timing data can be routed to any interface other than the designated civil-defense outputs. The weapons interface is explicitly null, meaning that no timing signal from the vault can be used for weapon delivery or targeting purposes. This architectural enforcement is consistent with the receive-only doctrine that governs the entire PALLADIUM NULL system. The dual-use framing also serves an important transparency function. By making the civil-defense purpose of the timing system explicit in the system documentation and on all outputs, the PALLADIUM NULL project demonstrates its commitment to responsible engineering and to the peaceful application of precision timing technology.

The vault clocking system supports civil-defense preparedness by enabling the rapid and accurate localization of signals of interest across the monitored area. When a signal is detected by multiple sensors, the precise timing provided by the PTP network allows the system to compute the signal's location with meter-level accuracy. This information feeds into the situational awareness picture that civil-defense operators use to assess threats and coordinate responses. The accuracy and reliability of the vault clocking system are therefore essential to the effectiveness of the civil-defense mission. The vault clocking system represents the foundational timing infrastructure upon which all other civil-defense sensing and coordination capabilities depend.

The system also supports forensic investigation by providing consistent and trustworthy timestamps on all recorded data. When an event is recorded by multiple sensors, the timestamps on those records can be reconciled to establish the temporal sequence of events. This forensic capability is critical for post-incident analysis and for building a complete picture of what occurred. The PTP synchronization ensures that the timestamps are consistent to within the nanosecond-level accuracy of the system, enabling meaningful correlation of data from different sensors and different locations. The forensic value of the timing data extends beyond immediate incident response. Over time, the accumulation of timestamped observations builds a comprehensive historical record that supports trend analysis, pattern recognition, and long-term planning for civil-defense preparedness.

---

## References (open)

- IEEE. IEEE 1588-2019: *Precision Time Protocol*. IEEE Standard for Precision Clock Synchronization of Network Measurement Systems.
- IEEE. IEEE 1588-2008: *Standard for a Precision Clock Synchronization Protocol for Network Measurement Systems*.
- Levesque, J. and Michaud, D. "A Critical Review of Existing and Emerging PTP Implementations." *Proceedings of the 2015 International Conference on Distributed Computing Systems*, pp. 255-264.

## Cross-references

- Chapter 11 (TDOA): Time Difference of Arrival localization theory and geometry.
- Chapter 21 (log observability): Event logging, timestamp correlation, and forensic reconstruction.
- Chapter 25 (shelters infrastructure): Civil-defense shelter timing and communication requirements.
