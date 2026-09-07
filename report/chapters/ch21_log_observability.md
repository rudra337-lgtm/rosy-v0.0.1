# Chapter 21: Decision Log and Observability

## 21.1 Decision Log Architecture

The PALLADIUM NULL decision log provides complete observability into every action taken by the civil-defense system. Every alert, every routing change, every sensor reading, and every operator intervention is recorded in an immutable, append-only log. This architecture serves two critical purposes: (1) post-incident forensic analysis to improve future response, and (2) real-time monitoring of system health and decision quality.

The log architecture follows a write-once-read-many (WORM) model. Once an entry is written, it cannot be modified or deleted. This immutability is enforced at the storage layer, not just by application logic. The log is replicated across three physically separated nodes to survive regional disasters.

Each log entry contains: timestamp (PTP-synchronized, nanosecond precision), event type, source component, affected shelters, decision rationale, confidence score, and cryptographic hash of the previous entry (blockchain-style chaining). This creates an auditable trail that cannot be tampered with retroactively.

The observability layer sits on top of the log, providing dashboards, alerts, and query interfaces. Operators can trace any decision back to its source data, review the algorithm's reasoning, and verify that civil-defense protocols were followed correctly.

## 21.2 Log Format and Structure

Every log entry follows a strict JSON Schema:

```ts
interface DecisionLogEntry {
  timestamp: string;        // ISO 8601 with nanosecond precision
  eventType: 'ALERT' | 'ROUTE' | 'SENSOR' | 'OPERATOR' | 'SYSTEM';
  component: string;        // e.g., 'fusion-engine', 'hazard-engine', 'ui'
  shelterIds: string[];     // affected shelters
  decision: string;         // human-readable decision description
  rationale: string;        // algorithmic reasoning trace
  confidence: number;       // 0.0 to 1.0
  dataHash: string;         // SHA-256 of input data
  prevHash: string;         // SHA-256 of previous log entry
  signature: string;        // Ed25519 signature
}
```

The `dataHash` field allows independent verification that the input data was not modified after the decision was made. The `prevHash` creates a chain: any modification to a historical entry breaks all subsequent hashes, making tampering immediately detectable.

Storage uses a columnar format (Parquet) for efficient querying. Each day's log is a separate file, compressed and archived to cold storage after 90 days. Hot storage keeps the last 30 days on NVMe SSD for sub-millisecond query latency.

## 21.3 Worked Example 21.1: Seismic Alert Entry

At 2025-03-15T14:23:17.000042Z, the seismic sensor network detects ground motion. The hazard engine evaluates the event:

```json
{
  "timestamp": "2025-03-15T14:23:17.000042Z",
  "eventType": "ALERT",
  "component": "hazard-engine",
  "shelterIds": ["SHELTER-NORTH", "SHELTER-EAST", "SHELTER-CENTRAL"],
  "decision": "Issue seismic alert to 3 shelters within 15 km radius",
  "rationale": "seismicIntensity(M=5.2, d=12km) = 5.2 - 1.4*log10(17) = 5.2 - 1.4*1.230 = 5.2 - 1.723 = 3.477",
  "confidence": 0.94,
  "dataHash": "sha256:a1b2c3d4e5f6...",
  "prevHash": "sha256:f6e5d4c3b2a1...",
  "signature": "ed25519:..."
}
```

The rationale field shows the complete calculation: magnitude 5.2 earthquake at 12 km distance produces intensity 3.477 on the modified Mercalli scale. This exceeds the alert threshold of 3.0, triggering the alert. The confidence of 0.94 reflects the uncertainty in the hypocenter location (±2 km).

An operator reviewing this entry can verify: (1) the physics calculation is correct, (2) the threshold logic was applied properly, (3) the affected shelters are indeed within 15 km, and (4) the confidence score is justified by the sensor data quality.

## 21.4 Worked Example 21.2: FCRA Audit Query

During a quarterly audit, inspectors need to verify that all alerts followed proper protocols. They query the log for all ALERT entries in the past 90 days:

```sql
SELECT * FROM decision_log
WHERE eventType = 'ALERT'
  AND timestamp > NOW() - INTERVAL '90 days'
ORDER BY timestamp DESC
LIMIT 1000
```

The query returns 847 alerts. The audit script verifies each entry:
1. Check that `confidence >= 0.85` (minimum threshold for automated alerts)
2. Verify that `shelterIds` matches the computed hazard radius
3. Recalculate the physics formula in `rationale` and compare to logged result
4. Verify the cryptographic chain is unbroken

Three entries fail verification: two have miscalculated intensities (off by 0.01 due to rounding), one has a shelter outside the radius. These are flagged for manual review. The audit trail shows exactly which entries are suspect and why.

## 21.5 Worked Example 21.3: Real-Time Dashboard Query

The operations dashboard displays current system health. A live query runs every 5 seconds:

```ts
const recentDecisions = await db.query(`
  SELECT component, COUNT(*) as count, AVG(confidence) as avgConfidence
  FROM decision_log
  WHERE timestamp > NOW() - INTERVAL '5 minutes'
  GROUP BY component
`);
```

Results show:
- fusion-engine: 145 decisions, avg confidence 0.91
- hazard-engine: 23 alerts, avg confidence 0.89
- shelter-router: 67 routes, avg confidence 0.95
- ui-layer: 412 operator views, no confidence (human decisions)

The dashboard alerts if any component's average confidence drops below 0.85, or if decision volume exceeds 1000/minute (possible sensor malfunction).

## 21.6 Worked Example 21.4: Incident Forensics

After a wildfire near SHELTER-EAST, investigators reconstruct the timeline:

1. **14:02:15** - IR satellite detects 2-acre fire at 34.05°N, 118.24°W
2. **14:02:16** - Fusion engine correlates with weather station data (wind 15 mph NE)
3. **14:02:17** - Hazard engine computes fire perimeter, growth rate 0.5 acres/min
4. **14:02:18** - Alert issued to SHELTER-EAST (8.2 km downwind)
5. **14:02:19** - Evacuation route computed avoiding fire path
6. **14:02:20** - MAYOR role at SHELTER-EAST acknowledges alert
7. **14:02:25** - Shelter beacon activated, population count begins

Each step is logged with nanosecond precision. The 5-second delay from detection to acknowledgment meets the 10-second requirement. The log proves the system responded correctly.

## 21.7 Observability Metrics and Dashboards

Key metrics exposed to operators:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Alert latency | < 5 seconds | > 10 seconds |
| Decision confidence | > 0.90 | < 0.85 |
| Log write latency | < 50 ms | > 200 ms |
| Storage usage | < 70% | > 85% |
| Chain integrity | 100% | < 100% |

The confidence metric tracks how certain the system is about its decisions. A drop suggests sensor degradation or unusual conditions. The chain integrity metric ensures no tampering has occurred.

Dashboards show: real-time alert map, decision volume by hour, confidence distribution by component, and storage growth rate. These run on dedicated observability servers, not on the critical path.

## 21.8 Tamper Detection and Blockchain Verification

The hash chain provides cryptographic proof of log integrity. To verify:

```ts
function verifyLogChain(entries: DecisionLogEntry[]): boolean {
  for (let i = 1; i < entries.length; i++) {
    const expected = sha256(JSON.stringify(entries[i-1]));
    if (entries[i].prevHash !== expected) return false;
    if (!verifyEd25519(entries[i].signature, entries[i])) return false;
  }
  return true;
}
```

This verification runs daily as a background job. Any failure triggers an immediate security alert. The Ed25519 signature uses a hardware security module (HSM) with keys that never leave the device.

For external auditors, a Merkle tree is published daily. The root hash is signed and timestamped, allowing anyone to verify entry inclusion without downloading the entire log.

## References

- Kleppmann, M. "Designing Data-Intensive Applications." O'Reilly, 2017.
- Narayanan, A. et al. "Bitcoin and Cryptocurrency Technologies." Princeton University Press, 2016.
- IEEE. IEEE 1588-2019: Precision Time Protocol.

## Cross-references

- Chapter 6 (proof architecture), Chapter 19 (agent scoring), Chapter 27 (build API)
