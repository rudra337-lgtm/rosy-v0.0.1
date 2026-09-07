# Chapter 29: Operational Security and Hardening

## 29.1 Threat Model for Civil Defense

PALLADIUM NULL faces threats from:
- **Nation-states:** Aiming to disable civil defense before an attack
- **Terrorists:** Seeking to cause panic via false alarms or system disruption
- **Insiders:** Disgruntled operators or infiltrators
- **Criminals:** Ransomware targeting shelter access
- **Natural disasters:** Physical destruction of infrastructure

The security model assumes adversaries with nation-state capabilities. All communications are cryptographically protected. All software is auditable. All infrastructure is hardened against physical attack.

## 29.2 Defense in Depth Strategy

**Layer 1: Physical**
- Tamper-evident enclosures on all electronics
- Seismic-rated equipment racks
- RF shielding (Faraday cage) for sensitive electronics
- Biometric access control (fingerprint + PIN) to shelters

**Layer 2: Network**
- Network segmentation: Control network isolated from internet
- VPN for all external communications (WireGuard)
- Intrusion detection system (IDS) monitoring all traffic
- Denial-of-service protection (rate limiting, SYN cookies)

**Layer 3: Host**
- Full disk encryption (LUKS on Linux, BitLocker on Windows)
- Secure boot with TPM 2.0
- Application whitelisting (only approved binaries execute)
- Microservices isolation (Docker containers, non-root users)

**Layer 4: Application**
- Input validation (OWASP Top 10 compliance)
- Output encoding to prevent XSS
- Parameterized queries to prevent SQL injection
- Authentication via OAuth 2.0 / OpenID Connect

**Layer 5: Data**
- AES-256-GCM at rest
- TLS 1.3 in transit
- Cryptographic signing of all decisions
- Blockchain-style hash chaining for logs (Chapter 21)

## 29.3 Worked Example 29.1: Access Control Audit

**Scenario:** Quarterly review of access logs.

**Query:** All authentication events in past 90 days.

**Results:**
- Total attempts: 45,231
- Successful: 42,118 (93.1%)
- Failed: 3,113 (6.9%)
- Lockouts: 23 (repeated failures)
- Unusual patterns: 2

**Analysis:**
- Failed attempts cluster at 02:00-04:00 (scripted attacks?)
- All successful logins from authorized IP ranges
- Two successful logins from unusual locations (investigate as potential compromise)
- Account 'j.doe' accessed 3× more logs than average (normal for admin, verify work logs)

**Action:** Require hardware security keys (FIDO2) for all admin access. Investigate the two unusual logins (found to be remote access during vacation, confirmed legitimate).

## 29.4 Worked Example 29.2: Network Segmentation

**Architecture:**
- **Red network:** Sensor data (untrusted)
- **Orange network:** Processing and fusion ( semi-trusted)
- **Green network:** Command and control (trusted, air-gapped)

**Isolation:**
- Red ↔ Orange: Unidirectional gateway (data diode) prevents C2 malware from reaching sensors
- Orange ↔ Green: API calls only, no direct connection

**Testing:** Attempted to send data from Red to Green:
```
$ nc 10.0.3.15 22  # Try to SSH from Red to Green
Connection timed out

$ curl -X POST https://api.c2.internal/command  # Try API
HTTP/1.1 403 Forbidden
```

**Result:** Segmentation holds. Malware on sensor network cannot reach command systems.

## 29.5 Worked Example 29.3: Incident Response Playbook

**Scenario:** Detected: Malware signature on sensor node SN-42.

**Response plan:**
1. **Isolate (0-2 min):** Automatically disconnect SN-42 from network (VLAN quarantine)
2. **Analyze (2-15 min):** Snapshot VM, run memory forensics, check for data exfiltration
3. **Eradicate (15-60 min):** Re-image from known-good golden image
4. **Recover (60-90 min):** Restore to service, verify functionality
5. **Learn (Post-incident):** Update signatures, patch vulnerability, document

**Metrics:**
- Mean Time to Detect (MTTD): 45 seconds (automated)
- Mean Time to Contain (MTTC): 3 minutes
- Mean Time to Recover (MTTR): 75 minutes

**Post-incident:** Vulnerability was an unpatched FFmpeg library. Patched across fleet within 4 hours of detection.

## 29.6 Worked Example 29.4: Backup and Recovery Test

**Test:** Full system restore from backups.

**Backup schedule:**
- Incremental: Every 6 hours
- Full: Daily at 02:00
- Offsite: Weekly to geographically separate location (500 km)

**Recovery objectives:**
- Recovery Time Objective (RTO): 4 hours (system back online)
- Recovery Point Objective (RPO): 6 hours (maximum data loss)

**Test procedure:**
1. Shutdown production (simulated)
2. Restore from latest full backup (800 GB)
3. Apply incrementals since full backup (3 hrs worth)
4. Verify data integrity (hash comparison)
5. Start services, verify API health

**Results:**
- Time to restore: 2 hr 14 min (within 4 hr RTO)
- Data loss: 0 (incrementals up to RPO)
- Verification: All 41 unit tests pass, 15 hundred log entries verified

## 29.7 Security Monitoring and SIEM

All security events feed into a Security Information and Event Management (SIEM) system:

**Sources:**
- Windows Event Logs
- Linux syslog/auditd
- Network flow data (NetFlow/sFlow)
- Application logs (Chapter 21)
- IDS alerts (Suricata)

**Correlation rules:**
- Multiple failed logins → brute force attempt
- Unusual outbound traffic → data exfiltration
- New process creation → malware execution
- Log deletion → anti-forensics attempt

**Response:**
- Automated: Block IP, disable account, quarantine host
- Manual: Alert security operations center (SOC) for investigation

## 29.8 Physical Security Measures

**Perimeter:**
- 3 m fencing with razor wire
- Bollards to prevent vehicle ramming
- Motion sensors (IR + microwave)
- 24/7 CCTV with 30-day retention

**Interior:**
- Mantraps at all entrances (two-door interlock)
- Blast-resistant walls (for critical equipment)
- Fire suppression (clean agent, not water for electronics)
- EMP shielding for critical control systems

**Personnel:**
- Background checks (criminal, credit, drug)
- Two-person rule for sensitive areas (no single person has full access)
- Regular security training (phishing simulations, social engineering defense)

## 29.9 Dual-Use Framing

All security measures protect **civil-defense infrastructure** for public safety. The same techniques used to protect power plants and water treatment facilities apply here. We protect against:
- Theft of resources (copper, fuel)
- Vandalism
- Sabotage of public safety systems
- Terrorist attacks on civilian infrastructure

We do not plan for combat or military operations. The thickness of walls is for blast protection from adjacent explosions (e.g., industrial accidents), not for withstanding direct military attacks.

## References

- NIST. "Framework for Improving Critical Infrastructure Cybersecurity." NIST CSF 2.0.
- ISO. "ISO/IEC 27001:2022 Information Security Management."
- OWASP. "OWASP Top 10: 2021." Open Web Application Security Project.

## Cross-references

- Chapter 6 (proof)/Chapter 21 (logging), Chapter 27 (API), Chapter 30 (roadmap)
