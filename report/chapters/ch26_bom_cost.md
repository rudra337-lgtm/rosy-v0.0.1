# Chapter 26: Bill of Materials and Cost Analysis

## 26.1 BOM Structure and Categories

The PALLADIUM NULL bill of materials (BOM) enumerates every component required to build, deploy, and maintain a network of civil-defense shelters. The BOM is hierarchical: System → Subsystem → Assembly → Component.

Costs are estimated for a mid-sized city deployment (20 shelters, 100,000 population). All prices are 2025 USD, excluding labor (which varies by region).

**Major categories:**
1. **Structural:** Foundation, frame, shelter pod
2. **Life Support:** Power, water, HVAC, sanitation
3. **Sensor Systems:** Seismic, IR, communication
4. **Communication:** Radios, mesh network, antennas
5. **Computing:** Edge processors, storage, displays
6. **Logistics:** Transport, installation, commissioning

## 26.2 Detailed Material Categories

### Structural (per tower)

| Item | Qty | Unit Cost | Total |
|------|-----|-----------|-------|
| Concrete mix (m³) | 12 | $180 | $2,160 |
| Steel rebar (kg) | 850 | $1.10 | $935 |
| Structural steel (kg) | 4,500 | $2.80 | $12,600 |
| Foundation bolts (set) | 24 | $45 | $1,080 |
| Anchor plates | 3 | $320 | $960 |
| **Subtotal** | | | **$17,735** |

### Life Support (per tower)

| Item | Capacity | Unit Cost | Total |
|------|----------|-----------|-------|
| Generator (kW) | 20 | $4,500 | $4,500 |
| Battery bank (kWh) | 50 | $8,000 | $8,000 |
| Water storage (L) | 5,000 | $0.80 | $4,000 |
| HVAC unit (ton) | 5 | $3,200 | $3,200 |
| Filtration system | 1 | $6,500 | $6,500 |
| **Subtotal** | | | **$26,200** |

### Sensor Systems (per tower)

| Sensor | Type | Cost |
|--------|------|------|
| 3-axis accelerometer | MEMS | $450 |
| IR camera | FLIR Boson | $4,200 |
| GNSS receiver | u-blox ZED-F9P | $550 |
| Wireless radio | LoRa SX1276 | $85 |
| Weather station | Davis Vantage | $1,200 |
| **Subtotal** | | **$6,485** |

## 26.3 Worked Example 26.1: Per-Shelter Capital Cost

**Container-based shelter (alternative to tower):**
- Shipping container (40 ft): $4,500
- Cut and reinforce openings: $3,200
- Blast doors (2): $8,500
- Interior build-out: $12,000
- HVAC (5 ton): $3,800
- Electrical (100A panel): $2,100
- Fire suppression: $4,500
- Communications (radio + antenna): $1,800

**Total per container shelter:** $40,400

**Tower-based shelter (from Chapters 24-25):**
- Structural: $17,735
- Life support: $26,200
- Sensors: $6,485
- Foundation labor (20%): $3,547
- **Total per tower:** $53,967

**Comparison:** 20 towers cost $1.079M; 20 containers cost $0.808M. Towers offer better sensor height and survivability; containers are cheaper and faster to deploy.

## 26.4 Worked Example 26.2: City-Wide Network Cost

**City parameters:**
- Population: 250,000
- Area: 400 km²
- Required coverage: 95% within 15 minutes
- Tower spacing: 2 km (from Chapter 22)

**Quantity calculation:**
- Area per tower: π × (1 km)² = 3.14 km²
- Towers needed: 400 / 3.14 = 127 towers
- Adjust for 95% coverage: 127 × 1.05 = 133 towers

**Total capital cost:**
- 133 × $53,967 = $7,177,611
- Soft costs (engineering, permitting): 20% = $1,435,522
- Commissioning: 10% = $717,761
- **Total: $9,330,894**

**Annual operating cost (15% of capital):** $1,400,000
**20-year lifecycle cost:** $9,330,894 + 20 × $1,400,000 = $37,330,894

## 26.5 Worked Example 26.3: Unit Cost Economics

**Cost per protected life:**
- Population: 250,000
- Towers: 133
- Capacity per tower: 50
- Total capacity: 6,650 (6.65% of population — shelter-in-place for 72 hours, not permanent housing)

Cost per immediate shelter space: $9,330,894 / 6,650 = $1,403
However, this shelters 250,000 people via rotation and rapid deployment.

**Cost per life saved (expected value):**
- Annual probability of M6+ earthquake: 2%
- Expected casualties without system: 150 deaths, 1000 injuries
- Reduction from system: 80% fewer casualties = 120 lives saved annually

**Value:** $9,330,894 / (120 lives × 20 years) = $3,888 per life-year saved
This is comparable to fire codes and building hardening costs.

## 26.6 Worked Example 26.4: Cost Optimization through Phasing

**Phase 1 (Year 1):** 30 towers in highest-risk zones (downtown, coastal)
- Cost: 30 × $53,967 = $1,619,010
- Protection: 30% of population at highest risk

**Phase 2 (Year 2-3):** 50 towers in medium-risk zones
- Cumulative: 80 towers, $4,317,360
- Protection: 65%

**Phase 3 (Year 4-5):** 53 towers in remaining areas
- Total: 133 towers, $9,330,894
- Protection: 95%

**Benefit:** Phasing delays $5.7M by 4 years. At 5% discount rate: NPV savings = $4.7M.

However, risk modeling shows that delaying phases 2-3 leaves 70% of population partially protected. The optimal strategy is to build phase 1 immediately and phases 2-3 as funding allows.

## 26.7 Budget Allocation Strategy

Recommended allocation:
- **40%** Structural (highest survivability impact)
- **25%** Life support (critical for 72-hour endurance)
- **15%** Sensors (detection capability)
- **10%** Communication (coordination)
- **5%** Computing (management)
- **5%** Contingency (unforeseen)

Sensitivity: A 10% increase in steel prices increases total cost by 1.26%. The design is robust to commodity price fluctuations.

## 26.8 Dual-Use Framing

This BOM is for **civil defense only**. All components are:
- Commercially available, dual-use items
- Primarily construction and safety equipment
- Export-controlled items excluded

The cost analysis assumes normal construction market conditions. Wartime economies would change procurement but not the underlying mathematics.

## References

- Means, R.S. "Building Construction Cost Data." Gordian, 2024.
- FEMA. "Hazard Mitigation Assistance Guidance." FEMA P-363, 2024.
- ASTM. "Standards for Concrete and Steel." ASTM International, 2024.

## Cross-references

- Chapter 24 (elements tower), Chapter 25 (shelters infrastructure), Chapter 30 (roadmap)
