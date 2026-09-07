# Chapter 18: Hazard Engine and Risk Assessment

## 18.1 Hazard Engine Architecture

The PALLADIUM NULL hazard engine evaluates the threat level from natural disasters and infrastructure failures across the shelter network. It consumes sensor data, applies physics-based models, and outputs a risk score for each shelter.

The engine operates in continuous loop: ingest sensor data → run hazard models → compute risk scores → trigger alerts if thresholds exceeded → log decisions. This runs at 10 Hz (10 evaluations per second) to ensure rapid response.

Risk scores are dimensionless values from 0.0 (no hazard) to 1.0 (immediate danger). Thresholds are set by civil defense protocols: 0.3 = monitor, 0.7 = prepare, 0.9 = evacuate.

## 18.2 Hazard Types and Models

The engine handles five hazard classes:

**1. Seismic (Chapter 13):** Ground shaking intensity, liquefaction potential, structural collapse risk
**2. Tsunami (Chapter 14):** Inundation depth, arrival time, flow velocity
**3. Wildfire (Chapter 13):** Rate of spread, radiant heat flux, ember attack
**4. Flood (Chapter 22):** Water depth, flow velocity, debris impact
**5. Orbital debris (Chapter 15):** Impact probability, kinetic energy, fragmentation risk

Each module implements physics from earlier chapters. The engine runs them in parallel using the actor model, with each hazard type in its own thread to prevent blocking.

## 18.3 Worked Example 18.1: Seismic Risk Score Calculation

**Scenario:** M 5.8 earthquake, 15 km from SHELTER-NORTH.

**Step 1: Ground motion**
- Intensity I = 5.8 - 1.4·log₁₀(15 + 5) = 5.8 - 1.4·log₁₀(20) = 5.8 - 1.4×1.301 = 5.8 - 1.821 = 3.979
- Peak Ground Acceleration (PGA) = 10^(I/3 - 0.5) ≈ 0.12 g

**Step 2: Building vulnerability**
- SHELTER-NORTH is reinforced concrete (code: RC-1)
- Collapse probability at 0.12g: P = 0.02 (2%)

**Step 3: Population at risk**
- Occupancy: 50 persons
- Expected casualties: 50 × 0.02 = 1 person

**Step 4: Risk score normalization**
- Max expected casualties for any shelter: 5 (worst case)
- Risk score = 1 / 5 = 0.20

**Result:** Risk = 0.20 (yellow alert). Continue monitoring; no evacuation needed yet.

## 18.4 Worked Example 18.2: Tsunami Risk Score

**Scenario:** M 7.2 offshore earthquake, 45 km from coast, depth 4000 m.

**Step 1: ETA calculation (Chapter 14)**
- v = √(9.81 × 4000) = 198 m/s
- Distance: 60 km to SHELTER-COASTAL
- ETA = 60,000 m / 198 m/s = 303 s = 5.05 minutes

**Step 2: Wave height estimate**
- Offshore wave height: 2 m (from seismic moment)
- Coastal amplification (Green's Law): H ∝ h^(-1/4)
- At 10 m depth: H = 2 × (4000/10)^(1/4) = 2 × 3.98 = 7.96 m

**Step 3: Shelter protection**
- SHELTER-COASTAL is 15 m elevation → Wave height 7.96 m < 15 m elevation → Safe
- BUT: Runup can double height → 15.9 m > 15 m elevation → Marginal

**Step 4: Risk score**
- Margin of safety: 15 - 7.96 = 7.04 m (uncertain due to runup)
- Risk = 0.65 (orange alert). Evacuate to higher ground within 4 minutes.

## 18.5 Worked Example 18.3: Wildfire Risk Score

**Scenario:** Fire detected 3 km from SHELTER-EAST, wind 15 km/h from west.

**Step 1: Rate of spread**
- Using Rothermel (Chapter 16): ROS = 0.5 × (1 + 0.05×4.17) × (1 + 0.05) = 0.66 m/s
- Time to shelter: 3000 m / 0.66 m/s = 4545 s = 75.8 minutes

**Step 2: Radiant heat flux**
- At 100 m: q" = 20 kW/m² (critical for skin burns)
- Fire front will reach 100 m from shelter in (3000-100)/0.66 = 4394 s = 73 minutes

**Step 3: Evacuation time**
- Population: 50 persons
- Walking speed: 1.2 m/s
- Distance to safe zone: 1 km
- Time needed: 1000/1.2 = 833 s = 13.9 minutes

**Step 4: Margin**
- Time available: 73 minutes
- Time needed: 14 minutes
- Margin: 59 minutes
- Risk score: 0.35 (monitor situation, prepare evacuation)

## 18.6 Worked Example 18.4: Combined Hazard Assessment

**Scenario:** Earthquake triggers tsunami near coastal city.

**Shelters affected:**
1. SHELTER-NORTH (Inland, high): Seismic risk 0.20, Tsunami risk 0.00 → Composite 0.20
2. SHELTER-COASTAL (Low, harbor): Seismic risk 0.45, Tsunami risk 0.85 → Composite 0.92
3. SHELTER-HILL (Mid elevation): Seismic risk 0.30, Tsunami risk 0.15 → Composite 0.35

**Decision matrix:**
- SHELTER-COASTAL: Immediate evacuation (0.92 > 0.90 threshold)
- SHELTER-HILL: Prepare for evacuation (0.35)
- SHELTER-NORTH: Monitor (0.20)

The engine generates this decision table in 83 ms after receiving sensor data.

## 18.7 Risk Aggregation and Uncertainty

The engine propagates uncertainty using Monte Carlo sampling. Running 1000 scenarios with slightly varied parameters produces a distribution of risk scores.

**Example uncertainty quantification:**
- Input uncertainty: Magnitude M 5.8 ± 0.3, distance 15 ± 2 km
- Output distribution: Risk score mean = 0.20, StdDev = 0.04
- 95% CI: [0.12, 0.28]

This prevents over-confidence in precise-looking numbers. The display shows "Risk: 0.20 ± 0.04" rather than a false-precision "0.20".

**Sensitivity analysis:**
- If magnitude is 6.1 instead of 5.8: Risk jumps to 0.31
- If distance is 10 km instead of 15 km: Risk jumps to 0.35
- The system is most sensitive to distance; sensor placement prioritizes minimizing distance uncertainty.

## 18.8 Decision Triggers and Protocols

Actions are triggered by risk score thresholds crossing upward:

```ts
if (riskScore < 0.3) {
  status = 'NORMAL';
  enableSensors();
} else if (riskScore < 0.7) {
  status = 'ALERT';
  notifyOperators();
  prepareEvacuation();
} else {
  status = 'EMERGENCY';
  evacuateAll();
  activateBackupPower();
}
```

**Hysteresis:** Once triggered at 0.7, the score must drop below 0.6 to de-escalate. This prevents oscillation near the threshold.

**Escalation:** If risk > 0.95 for more than 60 seconds, the system declares a general emergency and locks down all shelters regardless of individual scores.

## 18.9 Dual-Use Framing

The hazard engine is a **life-safety system, not a targeting system**. It evaluates risks to protect populations, not to target them. The physics models are identical to those used by city planners and insurance companies.

All outputs are for evacuation and shelter management. No offensive capabilities are computed, no weapons are aimed, and no damage is inflicted.

## References

- Cornell, C.A. "Engineering Seismic Risk Analysis." Bulletin of the Seismological Society, 1968.
- NRC. "Review of the Department of Homeland Security's Approach to Risk Analysis." National Academies Press, 2010.
- USGS. "Hazard Assessment Methodologies." Open-File Reports.

## Cross-references

- Chapter 13 (seismic), Chapter 14 (tsunami), Chapter 16 (world simulator), Chapter 20 (shelter role gating)
