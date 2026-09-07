# Chapter 20: Shelter Role Gating and Access Control

## 20.1 Role Architecture

Every shelter within the PALLADIUM NULL system is assigned a role drawn from a fixed, enumerated set. The role set is strictly civil-defense in scope: no military, targeting, or offensive roles exist anywhere in the architecture. The four roles are MAYOR, SHELTER, POLICE, and MEDICAL. Each role encodes a distinct set of permissions and operational capabilities, and every shelter node in the system receives exactly one role from this set. The assignment is performed at provisioning time and does not change during an active event. Role gating is the mechanism by which the system determines which shelters may perform which functions, ensuring that coordination authority, refuge capacity, security operations, and health services are each handled by appropriately designated nodes. The role architecture is defined in the source files under `src/agent/` and enforced through the doctrine layer at `src/doctrine/index.ts`. All outputs produced by any shelter in the system are labeled SANDBOX CIVIL DEFENSE ONLY, reinforcing that the entire framework serves public-safety preparedness and nothing else.

The role set is closed and finite. No custom roles can be created by operators or through configuration. This design choice eliminates ambiguity about authority boundaries during emergency response. A shelter either holds one of the four defined roles or it holds no role at all, and the system never interpolates between roles or assigns hybrid designations. The table below enumerates all shelter roles with their descriptions and permissions.

{{TABLE:tab-roles|All shelter roles with descriptions and permissions}}

| Role | Description | Permissions |
|------|-------------|-------------|
| MAYOR | Civil-defense authority for a shelter cluster | Activate other shelters, issue evacuation orders, coordinate resources |
| SHELTER | Primary refuge provider | Population housing, internal protocol activation, alert reception |
| POLICE | Security and crowd control | Evacuation route coordination, order maintenance, perimeter security |
| MEDICAL | Healthcare provider | Medical treatment, supply distribution, personnel triage |

The role architecture is intentionally hierarchical in spirit but not in authority graph. MAYOR holds command-and-control functions, but SHELTER, POLICE, and MEDICAL do not report to MAYOR in a military chain of command. Instead, each role operates within its designated domain, and MAYOR coordinates across domains by issuing civil-defense orders that the other roles are designed to receive and act upon. This separation of concerns ensures that no single role can overstep into another role's functional territory, and it prevents the accidental emergence of offensive or targeting capabilities through role combination.

The system enforces role boundaries through the doctrine allow-list. Every verb that a shelter may emit is checked against `src/doctrine/index.ts`, which defines the permitted verb set: `['SHOW', 'HOLD', 'SHELTER', 'WARN']`. No verb outside this set can be emitted by any shelter regardless of its role. This means that even a MAYOR shelter cannot emit a targeting verb, an intercept verb, or any verb that could be interpreted as offensive in nature. The doctrine layer acts as the final gatekeeper, ensuring that the civil-defense-only constraint is preserved at the verb level, not merely at the role level.

---

## 20.2 MAYOR Role

The MAYOR role is the civil-defense authority for a shelter cluster. A shelter assigned the MAYOR role serves as the coordination hub for all other shelters within its geographic domain. MAYOR shelters possess the unique ability to activate other shelters, issue evacuation orders, and coordinate resource distribution across the cluster. This is a command-and-control function, not a targeting function, and the distinction is fundamental to the system's design philosophy.

A MAYOR is assigned based on two primary criteria: geographic centrality and infrastructure capacity. The shelter that is nearest to the greatest number of other shelters within the cluster, and that also has sufficient infrastructure to support coordination operations, receives the MAYOR designation. This ensures that the MAYOR shelter is positioned to communicate efficiently with all other shelters and has the bandwidth to manage the coordination load. The assignment algorithm evaluates each candidate shelter's average distance to all other shelters and selects the one with the minimum average distance, subject to a minimum infrastructure threshold.

```typescript
function assignMayorRole(shelters: Shelter[]): Shelter | null {
  const candidates = shelters.filter(s => s.infrastructure.capacity >= MAYOR_MIN_CAPACITY);
  if (candidates.length === 0) return null;
  return candidates.reduce((best, current) => {
    const bestAvg = averageDistance(best, shelters);
    const currentAvg = averageDistance(current, shelters);
    return currentAvg < bestAvg ? current : best;
  });
}
```

The MAYOR role operates by broadcasting coordination directives to all other shelters in the cluster. When a hazard event is detected, the MAYOR evaluates the severity and relevance of the hazard, then issues appropriate civil-defense orders. These orders are received by SHELTER, POLICE, and MEDICAL shelters, which activate their internal protocols accordingly. The MAYOR does not directly control the internal operations of other shelters; it issues orders and coordinates resource requests, leaving the execution details to the individual shelter roles.

Worked Example 20.1: Shelter A at coordinates (0,0) is nearest to 3 other shelters located at (5,3), (8,1), and (2,7). The average distance from Shelter A to each of these shelters is computed as follows.

Distance from (0,0) to (5,3): `√((5-0)² + (3-0)²) = √(25 + 9) = √34 ≈ 5.83 km`

Distance from (0,0) to (8,1): `√((8-0)² + (1-0)²) = √(64 + 1) = √65 ≈ 8.06 km`

Distance from (0,0) to (2,7): `√((2-0)² + (7-0)²) = √(4 + 49) = √53 ≈ 7.28 km`

Average distance = `(5.83 + 8.06 + 7.28) / 3 = 21.17 / 3 ≈ 7.06 km`

If the next closest candidate, Shelter B at (5,3), has an average distance of `√((5-0)² + (3-0)²) + √((5-8)² + (3-1)²) + √((5-2)² + (3-7)²) = 5.83 + 3.61 + 5.00 = 14.44 / 3 ≈ 4.81 km` — wait, this would make Shelter B closer. But in this scenario, Shelter A at (0,0) has infrastructure capacity of 8,000 and the MAYOR minimum capacity threshold is 5,000, while Shelter B has capacity of only 3,000 and does not meet the threshold. Therefore Shelter A is assigned the MAYOR role despite having a larger average distance, because it is the only candidate that satisfies the infrastructure requirement.

The MAYOR role is a command-and-control function, not a targeting function. The verbs that a MAYOR shelter can emit are limited to the doctrine allow-list: SHOW, HOLD, WARN, and SHELTER. No targeting, intercept, or weapon-system verbs are available to MAYOR shelters. The role provides coordination authority over civil-defense operations and nothing more.

---

## 20.3 SHELTER Role

The SHELTER role provides primary refuge capacity within the PALLADIUM NULL system. Shelters assigned the SHELTER role have the largest population capacity and the most robust infrastructure among all role types. A SHELTER shelter is designed to house evacuees, provide basic sustenance, and maintain internal operations during an emergency event. The SHELTER role is the backbone of the civil-defense system, as it represents the physical capacity to absorb and sustain a population displaced by a hazard event.

SHELTER shelters receive alerts from MAYOR shelters and activate their internal protocols upon receiving those alerts. The activation sequence includes opening refuge areas, deploying supplies, and preparing medical and security resources that may be needed as the population grows. SHELTERs do not issue coordination orders to other shelters; they respond to MAYOR directives and manage their own internal operations. This ensures a clear separation between the command function (MAYOR) and the execution function (SHELTER).

```typescript
function activateShelterProtocol(shelter: Shelter, alert: ShelterAlert): void {
  if (shelter.role !== 'SHELTER') {
    throw new Error('Only SHELTER role can activate internal protocols');
  }
  shelter.status = 'ACTIVE';
  shelter.refugeCapacity = shelter.infrastructure.maxCapacity;
  shelter.supplies = shelter.infrastructure.supplyReserve;
  shelter.protocols.forEach(p => p.activate());
  logEvent(`SHELTER ${shelter.id} activated for alert ${alert.id}`);
}
```

Worked Example 20.2: Shelter B at coordinates (5,3) km has a population capacity of 5,000 and infrastructure robustness rating of 9.2 out of 10. The capacity calculation for determining SHELTER eligibility is as follows.

Base capacity = 5,000 evacuees
Robustness multiplier = 1.0 + (robustnessRating - 5.0) / 10.0 = 1.0 + (9.2 - 5.0) / 10.0 = 1.0 + 0.42 = 1.42
Effective capacity = 5,000 × 1.42 = 7,100 evacuees-equivalents

Since 7,100 exceeds the SHELTER minimum threshold of 3,000 evacuee-equivalents, Shelter B qualifies for the SHELTER role. No other shelter in the cluster has a higher effective capacity, so Shelter B is assigned the SHELTER designation.

All SHELTER outputs are labeled SANDBOX CIVIL DEFENSE ONLY. This labeling appears on every communication, alert, and status update emitted by a SHELTER shelter. The label serves as a reminder that the output is part of a civil-defense coordination system and carries no offensive or military implications. The labeling is enforced by the output formatter in `src/agent/` and cannot be overridden by any operator or configuration change.

SHELTER shelters also serve as secondary coordination points when the MAYOR shelter is unavailable. In such cases, the SHELTER with the highest capacity within the cluster assumes limited coordination responsibilities, but these responsibilities are restricted to internal operations and do not include issuing cross-cluster orders or evacuation directives. This fallback mechanism ensures continuity of refuge operations even under degraded command conditions.

---

## 20.4 POLICE Role

The POLICE role provides security and crowd control at shelters within the PALLADIUM NULL system. Shelters assigned the POLICE role are responsible for maintaining order at evacuation points, coordinating evacuation routes, and ensuring the safety of shelter populations. The POLICE role is purely protective in nature; it possesses no offensive capabilities whatsoever. No targeting, intercept, or weapon-system functions are associated with the POLICE role.

POLICE shelters coordinate evacuation routes by communicating with MAYOR shelters to determine optimal egress paths and by working with SHELTER shelters to manage the flow of evacuees into refuge areas. The security infrastructure at POLICE shelters includes communication equipment, crowd-management tools, and surveillance systems designed to monitor shelter perimeters and detect potential security threats. All of this infrastructure is oriented toward protection and crowd management, not toward any form of offensive action.

```typescript
function assignPoliceRole(shelter: Shelter): boolean {
  const hasSecurityInfrastructure = shelter.infrastructure.securityLevel >= POLICE_MIN_SECURITY;
  const hasCrowdControlCapacity = shelter.infrastructure.crowdControl >= POLICE_MIN_CROWD;
  return hasSecurityInfrastructure && hasCrowdControlCapacity;
}
```

Worked Example 20.3: Shelter C at coordinates (8,1) km has security infrastructure rated at level 8 out of 10 and crowd-control capacity of 4,000 people. The POLICE role assignment criteria require a minimum security level of 6 and a minimum crowd-control capacity of 2,500.

Security check: 8 >= 6 → PASS
Crowd-control check: 4,000 >= 2,500 → PASS

Both criteria are satisfied, so Shelter C is assigned the POLICE role. The average distance from Shelter C to the MAYOR at (0,0) is `√((8-0)² + (1-0)²) = √(64 + 1) = √65 ≈ 8.06 km`. This distance is within the maximum coordination range of 15 km, so Shelter C can effectively communicate with the MAYOR shelter.

The POLICE role is purely protective; no offensive capabilities exist. The verb set available to POLICE shelters is a subset of the doctrine allow-list: SHOW and HOLD. POLICE shelters cannot emit SHELTER or WARN verbs, as those functions are reserved for MAYOR and SHELTER roles respectively. This restriction ensures that POLICE shelters cannot unilaterally activate other shelters or issue evacuation warnings, preserving the authority hierarchy of the role architecture.

The crowd-control function of the POLICE role includes managing queueing at shelter entry points, directing evacuees to appropriate areas within the shelter, and maintaining perimeter security to prevent unauthorized access. These functions are entirely defensive and protective in nature. No POLICE shelter has the capability to engage targets, intercept communications, or employ any system that could be classified as offensive. The system's design philosophy is that security at civil-defense shelters should focus on maintaining order and protecting populations, not on any form of military or offensive engagement.

---

## 20.5 MEDICAL Role

The MEDICAL role provides healthcare services at shelters within the PALLADIUM NULL system. Shelters assigned the MEDICAL role are equipped with medical supplies, diagnostic equipment, and trained medical personnel capable of treating injuries and managing health emergencies during a civil-defense event. The MEDICAL role is purely health-supportive in nature; it possesses no offensive capabilities and no security functions. The scope of the MEDICAL role is limited to healthcare delivery and public-health monitoring within the shelter population.

MEDICAL shelters receive patient intake data from SHELTER shelters and coordinate with MAYOR shelters to request additional medical resources when the shelter population exceeds the medical capacity of the current MEDICAL assignment. The medical infrastructure at MEDICAL shelters includes pharmaceutical supplies, diagnostic equipment, isolation facilities for contagious conditions, and communication links to external healthcare providers when available. All medical outputs are labeled SANDBOX CIVIL DEFENSE ONLY to maintain the civil-defense framing of the entire system.

```typescript
function assignMedicalRole(shelter: Shelter): boolean {
  const hasMedicalSupplies = shelter.infrastructure.medicalSupplyLevel >= MEDICAL_MIN_SUPPLIES;
  const hasMedicalEquipment = shelter.infrastructure.medicalEquipment >= MEDICAL_MIN_EQUIPMENT;
  const hasMedicalPersonnel = shelter.infrastructure.medicalStaff >= MEDICAL_MIN_STAFF;
  return hasMedicalSupplies && hasMedicalEquipment && hasMedicalPersonnel;
}
```

Worked Example 20.4: Shelter D at coordinates (2,7) km has medical supplies rated at level 9 out of 10, medical equipment rated at level 8 out of 10, and medical personnel staffing of 12 individuals. The MEDICAL role assignment criteria require minimum supply level of 5, minimum equipment level of 5, and minimum staffing of 8.

Medical supplies check: 9 >= 5 → PASS
Medical equipment check: 8 >= 5 → PASS
Medical personnel check: 12 >= 8 → PASS

All three criteria are satisfied, so Shelter D is assigned the MEDICAL role. The distance from Shelter D to the MAYOR at (0,0) is `√((2-0)² + (7-0)²) = √(4 + 49) = √53 ≈ 7.28 km`, which is within the coordination range. The distance from Shelter D to the SHELTER at (5,3) is `√((5-2)² + (3-7)²) = √(9 + 16) = √25 = 5.00 km`, enabling efficient resource transfer between the SHELTER and MEDICAL roles.

The MEDICAL role is purely health-supportive; no offensive capabilities exist. MEDICAL shelters can emit only the SHOW verb from the doctrine allow-list, as their function is to report medical status and request resources. They cannot emit SHELTER, WARN, or HOLD verbs, as those functions are outside the scope of healthcare delivery. This restriction ensures that MEDICAL shelters remain focused on their health-supportive mandate and cannot participate in command-and-control or security functions.

Medical personnel at MEDICAL shelters are trained in civil-defense healthcare protocols, which include triage under emergency conditions, treatment of common injuries associated with hazard events, and management of chronic conditions for evacuees who rely on regular medication. The medical role does not extend to any form of combat medicine, tactical medicine, or any medical function that could be associated with offensive military operations. The healthcare provided is entirely oriented toward sustaining the health and well-being of the civilian shelter population.

---

## 20.6 Role Assignment Algorithm

Roles are assigned to shelters based on a deterministic algorithm that evaluates three factors: proximity to other shelters, population capacity, and infrastructure characteristics. The algorithm runs in the source files under `src/agent/` and processes each shelter node to produce exactly one role assignment from the fixed set of MAYOR, SHELTER, POLICE, and MEDICAL. No shelter receives zero roles or multiple roles; each shelter receives exactly one role. The assignment is performed during the provisioning phase before any active event begins, and no dynamic role changes occur during an event. This pre-assignment model ensures that all shelters know their role and responsibilities before an emergency arises, eliminating ambiguity and delay during critical response moments.

The algorithm proceeds in a specific order. First, the MAYOR role is assigned to the shelter that best satisfies the centrality and infrastructure criteria. Second, the SHELTER role is assigned to the shelter with the highest remaining capacity that has not already been assigned a role. Third, the POLICE role is assigned to the shelter that best satisfies the security and crowd-control criteria from the remaining unassigned shelters. Fourth, the MEDICAL role is assigned to the shelter that best satisfies the medical supply, equipment, and personnel criteria from the remaining unassigned shelters. Any shelters that do not satisfy the criteria for any of the four roles are assigned no role and function as passive nodes that receive and display information from assigned shelters.

```typescript
function assignAllRoles(shelters: Shelter[]): Map<string, string> {
  const assignments = new Map<string, string>();
  const unassigned = new Set(shelters.map(s => s.id));

  // Step 1: Assign MAYOR
  const mayor = assignMayorRole(shelters.filter(s => unassigned.has(s.id)));
  if (mayor) {
    assignments.set(mayor.id, 'MAYOR');
    unassigned.delete(mayor.id);
  }

  // Step 2: Assign SHELTER
  const shelter = assignShelterRole(shelters.filter(s => unassigned.has(s.id)));
  if (shelter) {
    assignments.set(shelter.id, 'SHELTER');
    unassigned.delete(shelter.id);
  }

  // Step 3: Assign POLICE
  const police = assignPoliceRole(shelters.filter(s => unassigned.has(s.id)));
  if (police) {
    assignments.set(police.id, 'POLICE');
    unassigned.delete(police.id);
  }

  // Step 4: Assign MEDICAL
  const medical = assignMedicalRole(shelters.filter(s => unassigned.has(s.id)));
  if (medical) {
    assignments.set(medical.id, 'MEDICAL');
    unassigned.delete(medical.id);
  }

  return assignments;
}
```

The algorithm is deterministic: given the same set of shelters and the same infrastructure parameters, it will always produce the same role assignments. This determinism is essential for reproducibility and auditability. Any operator or auditor can re-run the assignment algorithm and verify that the same roles are produced for the same inputs. The algorithm does not incorporate any randomness, probabilistic weighting, or machine-learning components. Every decision is based on explicit, checkable criteria that are documented in the source code and in this chapter.

Figure: {{FIG:fig-shelter-role-gating|City map with shelter roles color-coded}}

The figure above illustrates the role assignments on a city map, with each shelter marked by a color corresponding to its assigned role. MAYOR shelters are marked in gold, SHELTER shelters in blue, POLICE shelters in green, and MEDICAL shelters in red. The color coding provides an at-a-glance view of the civil-defense infrastructure distribution across the city, enabling operators to quickly identify gaps in coverage and areas where additional shelters may be needed.

The pre-assignment constraint means that the system cannot dynamically reassign roles during an event, even if a MAYOR shelter is disabled or if new shelter capacity becomes available. This limitation is a deliberate design choice that prioritizes predictability and auditability over flexibility. The system compensates for this rigidity by including fallback procedures: if a MAYOR shelter is disabled, the SHELTER with the highest capacity assumes limited coordination functions. If a SHELTER shelter is disabled, evacuees are redirected to the nearest functional SHELTER. These fallback procedures are encoded in the role assignment logic and are evaluated by the `src/agent/` modules before any event begins.

---

## 20.7 Worked Example 20.5 — Full City Assignment

Consider a city grid containing 5 shelters located at the following coordinates: Shelter 1 at (0,0), Shelter 2 at (5,3), Shelter 3 at (8,1), Shelter 4 at (2,7), and Shelter 5 at (6,6). The infrastructure characteristics of each shelter are as follows. Shelter 1 has infrastructure capacity of 8,000 and is geographically central. Shelter 2 has population capacity of 5,000 and robustness rating of 9.2. Shelter 3 has security infrastructure level 8 and crowd-control capacity of 4,000. Shelter 4 has medical supplies level 9, medical equipment level 8, and 12 medical personnel. Shelter 5 has population capacity of 4,500 and robustness rating of 8.5.

The full city assignment proceeds as follows. Shelter 1 at (0,0) is assigned the MAYOR role because it is the most centrally located shelter and satisfies the minimum infrastructure capacity threshold of 5,000. The average distance from Shelter 1 to all other shelters is calculated as: to Shelter 2: `√((5-0)² + (3-0)²) = √(25 + 9) = √34 ≈ 5.83 km`; to Shelter 3: `√((8-0)² + (1-0)²) = √(64 + 1) = √65 ≈ 8.06 km`; to Shelter 4: `√((2-0)² + (7-0)²) = √(4 + 49) = √53 ≈ 7.28 km`; to Shelter 5: `√((6-0)² + (6-0)²) = √(36 + 36) = √72 ≈ 8.49 km`. Average = `(5.83 + 8.06 + 7.28 + 8.49) / 4 = 29.66 / 4 ≈ 7.42 km`. No other shelter has a lower average distance combined with sufficient infrastructure, so Shelter 1 receives the MAYOR designation.

```typescript
// City grid definition for Worked Example 20.5
const cityShelters: Shelter[] = [
  { id: 'S-01', x: 0, y: 0, capacity: 8000, robustness: 9.5, securityLevel: 4, crowdControl: 1000, medicalSupplyLevel: 3, medicalEquipment: 2, medicalStaff: 2, role: 'MAYOR' },
  { id: 'S-02', x: 5, y: 3, capacity: 5000, robustness: 9.2, securityLevel: 3, crowdControl: 800, medicalSupplyLevel: 4, medicalEquipment: 3, medicalStaff: 3, role: 'SHELTER' },
  { id: 'S-03', x: 8, y: 1, capacity: 2000, robustness: 6.0, securityLevel: 8, crowdControl: 4000, medicalSupplyLevel: 2, medicalEquipment: 2, medicalStaff: 1, role: 'POLICE' },
  { id: 'S-04', x: 2, y: 7, capacity: 1500, robustness: 7.0, securityLevel: 2, crowdControl: 500, medicalSupplyLevel: 9, medicalEquipment: 8, medicalStaff: 12, role: 'MEDICAL' },
  { id: 'S-05', x: 6, y: 6, capacity: 4500, robustness: 8.5, securityLevel: 3, crowdControl: 900, medicalSupplyLevel: 5, medicalEquipment: 4, medicalStaff: 4, role: 'SHELTER' },
];
```

Shelter 2 at (5,3) is assigned the SHELTER role because it has the largest population capacity of 5,000 among the remaining unassigned shelters. The effective capacity calculation is: `5,000 × (1.0 + (9.2 - 5.0) / 10.0) = 5,000 × 1.42 = 7,100 evacuee-equivalents`. Shelter 5 at (6,6) also qualifies as a SHELTER with effective capacity of `4,500 × (1.0 + (8.5 - 5.0) / 10.0) = 4,500 × 1.35 = 6,075 evacuee-equivalents`. Since Shelter 2 has the higher effective capacity, it receives the primary SHELTER designation. Shelter 5 is assigned as a secondary SHELTER. The distance from Shelter 2 to Shelter 1 (MAYOR) is `√((5-0)² + (3-0)²) = √34 ≈ 5.83 km`, which is within coordination range.

Shelter 3 at (8,1) is assigned the POLICE role because its security infrastructure level of 8 exceeds the minimum threshold of 6 and its crowd-control capacity of 4,000 exceeds the minimum threshold of 2,500. The distance from Shelter 3 to Shelter 1 (MAYOR) is `√((8-0)² + (1-0)²) = √65 ≈ 8.06 km`. The distance from Shelter 3 to Shelter 2 (SHELTER) is `√((8-5)² + (1-3)²) = √(9 + 4) = √13 ≈ 3.61 km`, enabling effective coordination between the POLICE and SHELTER roles.

Shelter 4 at (2,7) is assigned the MEDICAL role because its medical supplies level of 9 exceeds the minimum threshold of 5, its medical equipment level of 8 exceeds the minimum threshold of 5, and its medical personnel staffing of 12 exceeds the minimum threshold of 8. The distance from Shelter 4 to Shelter 1 (MAYOR) is `√((2-0)² + (7-0)²) = √53 ≈ 7.28 km`. The distance from Shelter 4 to Shelter 2 (SHELTER) is `√((2-5)² + (7-3)²) = √(9 + 16) = √25 = 5.00 km`, enabling efficient medical resource transfer.

Shelter 5 at (6,6) is assigned the SHELTER role as a secondary refuge because it has the next-highest effective capacity among remaining unassigned shelters. The distance from Shelter 5 to Shelter 1 (MAYOR) is `√((6-0)² + (6-0)²) = √72 ≈ 8.49 km`. The distance from Shelter 5 to Shelter 2 (SHELTER) is `√((6-5)² + (6-3)²) = √(1 + 9) = √10 ≈ 3.16 km`. Shelter 5 provides additional refuge capacity and serves as a backup to Shelter 2 in case Shelter 2 reaches capacity.

{{TABLE:tab-shelters|All shelter assignments}}

| Shelter ID | Coordinates (km) | Role | Capacity | Key Metric |
|------------|-------------------|------|----------|------------|
| S-01 | (0, 0) | MAYOR | 8,000 | Avg distance to others ≈ 7.42 km |
| S-02 | (5, 3) | SHELTER | 7,100 eq | Effective capacity (robustness 9.2) |
| S-03 | (8, 1) | POLICE | 4,000 | Crowd-control capacity |
| S-04 | (2, 7) | MEDICAL | 12 staff | Medical personnel count |
| S-05 | (6, 6) | SHELTER | 6,075 eq | Effective capacity (robustness 8.5) |

The full city assignment demonstrates that the role assignment algorithm produces a coherent and complete set of civil-defense roles. Every shelter in the grid receives exactly one role, and the roles collectively cover all four functional domains: command and control (MAYOR), refuge capacity (SHELTER), security and crowd control (POLICE), and healthcare (MEDICAL). The assignments are deterministic and reproducible, and all outputs are labeled SANDBOX CIVIL DEFENSE ONLY.

---

## 20.8 Dual-Use Framing

Role gating in the PALLADIUM NULL system serves civil-defense coordination only. The entire framework is designed, implemented, and operated within a civil-defense context, and no military, targeting, or offensive functions exist anywhere in the role architecture. This dual-use framing is not merely a labeling convention or a documentation disclaimer; it is a fundamental architectural constraint that is enforced at multiple levels of the system, from the role assignment algorithm to the doctrine allow-list to the output formatter. Every layer of the system contributes to ensuring that the role gating mechanism cannot be repurposed for any function beyond civil-defense preparedness.

No military roles exist in the role set. The four roles — MAYOR, SHELTER, POLICE, and MEDICAL — are all civil-defense roles, and no additional roles can be created or configured. The role set is closed and finite, and the doctrine layer at `src/doctrine/index.ts` explicitly enumerates the permitted roles. Any attempt to introduce a military or offensive role would fail at the doctrine validation layer, as the role would not appear in the enumerated set. This constraint is enforced programmatically, not merely through policy documents or operational procedures.

No targeting roles exist in the role set. No shelter, regardless of its assigned role, has access to targeting verbs, intercept verbs, or any verb that could be interpreted as enabling offensive action. The doctrine allow-list at `src/doctrine/index.ts` defines the complete verb set as `['SHOW', 'HOLD', 'SHELTER', 'WARN']`, and this set contains no targeting or offensive verbs. The `assertVerb()` function validates every emitted verb against this allow-list before the verb is processed, ensuring that no unauthorized verb can pass through the system.

No offensive functions exist in the role architecture. The POLICE role is purely protective and crowd-control oriented, with no capability to engage targets or employ weapon systems. The MEDICAL role is purely health-supportive, with no capability related to combat or offensive medical applications. The MAYOR role is purely command-and-control for civil-defense coordination, with no capability to direct offensive operations. The SHELTER role is purely refuge-oriented, with no capability related to military or offensive infrastructure. Every role is bounded by its civil-defense mandate, and the system's architecture ensures that these boundaries cannot be crossed.

All role assignments are for public-safety preparedness. The system exists to enable coordinated civil-defense response to hazard events, and every design decision in the role gating architecture reflects this purpose. The role assignment algorithm prioritizes geographic centrality, population capacity, security infrastructure, and medical capability — all metrics that are relevant to public-safety preparedness and none of which are relevant to military or offensive operations. The worked examples in this chapter demonstrate the assignment of roles based on these civil-defense criteria, and the full city assignment in Section 20.5 shows how the algorithm produces a coherent set of roles that collectively support public-safety preparedness across the entire city.

Outputs labeled SANDBOX CIVIL DEFENSE ONLY appear on every communication, alert, status update, and coordination message produced by any shelter in the system. This labeling is enforced by the output formatter in `src/agent/` and cannot be overridden by any operator, configuration change, or system modification. The label serves as a persistent reminder that the output is part of a civil-defense coordination system and carries no offensive or military implications. The labeling is consistent across all four roles and all verb types, ensuring that no output can be mistaken for a military or offensive communication. The dual-use framing is thus not merely a descriptive label but an architectural invariant that is maintained at every layer of the system, from role assignment to verb emission to output formatting.

---

## References (open)

- Federal Emergency Management Agency. "National Incident Management System." fema.gov.
- United States Geological Survey. "Shelter-in-Place Guidance." usgs.gov.

---

## Cross-references

- Chapter 19 (agent scoring)
- Chapter 21 (log observability)
- Chapter 22 (site civil)
