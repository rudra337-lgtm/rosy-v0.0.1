# Chapter 27: Build API and System Architecture

## 27.1 API Architecture Overview

The PALLADIUM NULL build API provides a RESTful interface to the civil-defense system. It follows a layered architecture: Presentation (HTTP/JSON), Business Logic (TypeScript), and Data Access (SQLite/PostgreSQL).

All endpoints are **receive-only by design**. The API accepts GET requests for state queries and POST requests for civil-defense commands only. No endpoints accept targeting data, weapon commands, or offensive configurations.

The API runs on Node.js with Express. It implements:
- OpenAPI 3.0 specification
- JWT authentication with role-based access control (RBAC)
- Rate limiting (1000 requests/minute)
- Request/response logging (Chapter 21)
- CORS configured for same-origin only

## 27.2 Endpoint Reference

### Health and Status

**GET /api/health**
Returns system health.
```json
{
  "status": "healthy",
  "timestamp": "2025-03-15T14:23:17.042Z",
  "version": "0.1.0-lab",
  "sheltersOnline": 132,
  "totalShelters": 133
}
```

**GET /api/readiness**
Returns readiness metrics.
```json
{
  "sensorCoverage": 0.98,
  "communicationUptime": 0.999,
  "lastDrill": "2025-03-01T00:00:00Z",
  "nextMaintenance": "2025-04-01T00:00:00Z"
}
```

### Doctrine and Proof

**GET /api/doctrine**
Returns the civil-defense doctrine statement.

**GET /api/proof**
Returns cryptographic proof of system constraints (Chapter 6).
```json
{
  "interceptModule": false,
  "weaponsBus": null,
  "typeofIntercept": "undefined",
  "offensiveCapabilities": []
}
```

## 27.3 Worked Example 27.1: Health Check Request

**Client request:**
```http
GET /api/health HTTP/1.1
Host: localhost:8080
Authorization: Bearer <jwt-token>
```

**Server processing:**
1. Verify JWT signature (Ed25519, 256-bit)
2. Check token expiration (15-minute window)
3. Query health monitor service
4. Aggregate subsystem statuses
5. Return JSON response

**Response time:** 12 ms (p95)

**Error handling:**
- 401 Unauthorized: Invalid or expired token
- 503 Service Unavailable: Health monitor unreachable
- 500 Internal Server Error: Unexpected exception

The health endpoint is hit by the load balancer every 5 seconds. A failure triggers automatic failover to a backup instance.

## 27.4 Worked Example 27.2: Doctrine Retrieval Flow

**Request:** `GET /api/doctrine`

**Code path:**
```ts
// server/index.ts
app.get('/api/doctrine', authenticate, async (req, res) => {
  try {
    const doctrine = await DoctrineService.getCurrent();
    res.json({
      version: doctrine.version,
      effectiveDate: doctrine.effectiveDate,
      principles: doctrine.principles,
      restrictions: doctrine.restrictions,
      hash: doctrine.sha256
    });
  } catch (err) {
    logger.error('Doctrine fetch failed', { error: err });
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**Security:** The doctrine is signed with the project's private key. Clients verify the signature to ensure they haven't received a tampered version.

## 27.5 Worked Example 27.3: Proof Verification Protocol

**Request:** `GET /api/proof`

**Purpose:** Prove that offensive capabilities are disabled.

**Verification steps performed by client:**
1. Check `interceptModule === false`
2. Check `weaponsBus === null`
3. Check `typeofIntercept === "undefined"`
4. Verify `offensiveCapabilities` array is empty
5. Verify the response signature against the known public key

If any check fails, the client assumes the system is compromised and enters degraded mode (no automatic actions, manual operation only).

**Testing:** Unit tests verify that even if a developer adds an offensive function, it cannot be exported (the build system rejects it) or called (the runtime denies it).

## 27.6 Worked Example 27.4: Shelter Status Query

**Request:** `GET /api/shelters?status=active&limit=10`

**Response:**
```json
[
  {
    "id": "SH-001",
    "location": { "lat": 34.0522, "lon": -118.2437 },
    "status": "OPEN",
    "occupancy": 23,
    "capacity": 50,
    "riskScore": 0.15,
    "lastUpdate": "2025-03-15T14:20:00Z"
  },
  {
    "id": "SH-002",
    "location": { "lat": 34.0622, "lon": -118.2537 },
    "status": "OPEN",
    "occupancy": 45,
    "capacity": 50,
    "riskScore": 0.22,
    "lastUpdate": "2025-03-15T14:19:45Z"
  }
]
```

**Pagination:** Uses cursor-based pagination (`?cursor=eyJpZCI6IlNILTAwMiJ9&limit=20`) to avoid offset drift during real-time updates.

**WebSocket subscription:** Clients can subscribe to `/ws/shelters` for real-time updates instead of polling.

## 27.7 API Security and Rate Limiting

**Authentication:** JWT with RS256 (asymmetric) or EdDSA (Ed25519). Keys rotated daily.

**Authorization:** Role-based:
- PUBLIC: /api/health, /api/proof
- OPERATOR: /api/shelters, /api/doctrine, /api/logs (read)
- MAYOR: /api/shelters (write), /api/alerts (dispatch)
- ADMIN: All endpoints, user management

**Rate limiting:** 
- 100 requests/minute for public endpoints
- 1000 requests/minute for authenticated operators
- Sliding window algorithm using Redis

**Input validation:** All inputs validated with Zod schemas. SQL injection impossible due to parameterized queries. XSS prevented by output encoding.

## 27.8 Dual-Use Framing

The API is **defensive only**:
- No endpoints accept coordinates for targeting
- No endpoints accept weapon parameters
- No endpoints accept intercept trajectories
- All "command" endpoints are for civil-defense actions (open shelter, issue alert, power on)

The codebase physically lacks functions that could be exposed via API. Even if an attacker gained code execution, they could not make the system compute a targeting solution because that math isn't implemented anywhere.

## References

- Fielding, R.T. "Architectural Styles and the Design of Network-based Software Architectures." UC Irvine, 2000.
- OpenAPI Initiative. "OpenAPI Specification Version 3.0.3." Linux Foundation.

## Cross-references

- Chapter 4 (nullbus), Chapter 6 (proof), Chapter 21 (logging), Chapter 29 (ops security)
