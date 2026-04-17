# Understanding: Project Root

> Entry point for recursive understanding. Children are top-level logical domains discovered in the Telon GSM-SIP Gateway application.

## Phase: EXPLORING

## Project Overview

The **Telon GSM-SIP Gateway** is a React Native Android application that bridges GSM telephony and SIP (Session Initiation Protocol) communications. It enables bidirectional call routing between GSM hardware and SIP infrastructure.

## Hypothesis

Based on initial scan of `telon-gateway-app/src/`:

1. **Core Gateway Logic** - `Gateway.js` contains the main bidirectional bridge logic
2. **SIP Endpoint Integration** - Uses `react-native-sip2` for SIP protocol handling
3. **Telephony Endpoint Integration** - Uses `react-native-tele` for GSM operations
4. **Device-Specific Configuration** - Auto-configuration based on device ID
5. **Call State Synchronization** - Manages call lifecycle across both protocols

## Sources

| File | Purpose |
|------|---------|
| `telon-gateway-app/src/Gateway.js` | Main gateway logic, SIP↔GSM bridging |
| `telon-gateway-app/src/event-handler.js` | Event handling stub (minimal) |
| `telon-gateway-app/package.json` | Dependencies and configuration |
| `README.md` | Project documentation and architecture |

## Validated Understanding

### Architecture Components

1. **Gateway Class** - Main orchestrator:
   - Initializes both SIP and Telephony endpoints
   - Handles call lifecycle events (received, changed, terminated)
   - Manages call bridging between protocols

2. **SIP→GSM Flow** (`sip2tele=true`):
   - Incoming SIP call → Extract destination → Make GSM call
   - Special test numbers (50014-50019, 3333, 4444) have fast-answer behavior
   - Audio session activation for specific test cases

3. **GSM→SIP Flow** (`tele2sip=false` - currently disabled):
   - Outgoing GSM calls tracked
   - Incoming GSM calls rejected (security)
   - Call state propagation to SIP endpoint

4. **Device Configuration**:
   ```
   sp7731cea      → 50015 (ReplaceDialer: true)
   Impress_City   → 50014 (ReplaceDialer: false)
   Impress_Tor    → 50017 (ReplaceDialer: true)
   QC_Reference   → 50019 (ReplaceDialer: true, fas: false)
   MSM8937        → 50018 (ReplaceDialer: true, fas: false)
   Default        → 50016 (fallback)
   ```

5. **SIP Configuration**:
   - Server: `192.168.88.254`
   - Transport: UDP
   - Registration timeout: 3600s
   - Network: WiFi, 3G, Edge, GPRS, roaming supported

## Children Identified

Logical domains for deeper exploration:

| Child | Hypothesis | Priority | Status |
|-------|------------|----------|--------|
| `sip-endpoint` | SIP account management, registration, call handling | High | PENDING |
| `telephony-endpoint` | GSM call operations, state management | High | PENDING |
| `call-bridging` | Audio routing, call state synchronization | High | PENDING |
| `device-configuration` | Device-specific auto-configuration logic | Medium | PENDING |
| `security-model` | Incoming call rejection, permission management | Medium | PENDING |

## Dependencies

- **External Libraries**:
  - `react-native-tele` - GSM/telephony operations
  - `react-native-sip2` - SIP protocol handling
  - `react-native-device-info` - Device identification
  - `react-native-replace-dialer` - Default dialer replacement (optional)

- **System Dependencies**:
  - Android 8.0+ (Oreo)
  - Root access (Magisk module)
  - Telephony permissions via Magisk

## Key Insights

1. **Asymmetric Bridge**: SIP→GSM is enabled, GSM→SIP is disabled (`tele2sip=false`)
2. **Test Mode Support**: Special numbers trigger fast-answer and test behaviors
3. **State Flags**: `conf.sendHangup` prevents duplicate hangup signals
4. **Bridge Class**: Defined but not actively used (legacy/experimental)
5. **Hardcoded Configuration**: Device-to-SIP mapping is hardcoded in source

## ADR Candidates

1. **SIP Server Choice** - Why `192.168.88.254`? Internal infrastructure decision
2. **Device Configuration Strategy** - Hardcoded device ID mapping vs. dynamic config
3. **Unidirectional Bridge** - Why `tele2sip=false`? Security or design choice?
4. **Root Requirement** - Magisk module for elevated telephony permissions

## Flow Recommendation

| Module | Type | Confidence | Rationale |
|--------|------|------------|-----------|
| Core Gateway | SDD | High | Internal service logic, no stakeholder docs needed |
| Device Config | SDD | Medium | Technical implementation detail |
| Call Bridging | TDD | Medium | Correctness-critical (call state sync) |
| Security Model | ADR | High | Architectural decision on incoming call rejection |

## Synthesis

> Updated after children complete - COMPLETED

### From Children

| Domain | Key Insight |
|--------|-------------|
| **sip-endpoint** | Event-driven SIP handling, test numbers, auto-registration |
| **telephony-endpoint** | GSM call operations, state mapping, incoming rejection |
| **call-bridging** | Distributed bridge logic, hangup flag (potential bug: never reset) |
| **device-configuration** | Hardcoded device-to-SIP mapping, credential exposure risk |
| **security-model** | Unidirectional bridge, incoming call rejection, Magisk perms |

### Combined Understanding

The Telon GSM-SIP Gateway is a **unidirectional bridge** application that:

1. **Receives SIP calls** → Makes GSM calls automatically
2. **Rejects incoming GSM calls** → Security measure
3. **Synchronizes call states** → GSM states propagate to SIP
4. **Auto-configures per device** → Device ID → SIP account mapping

**Architecture**: Event-driven, no central bridge class
- SIP events → Trigger GSM operations
- GSM events → Propagate state to SIP
- Hangup prevention → `sendHangup` flag (potential bug)

**Security Model**:
- Incoming GSM calls rejected
- GSM→SIP initiation disabled (`tele2sip=false`)
- Root access required (Magisk)

**Known Issues**:
1. `sendHangup` flag never reset (could block legitimate hangups)
2. SIP credentials hardcoded in source
3. State-based incoming call detection (less reliable than direction-based)

## Children Spawned

All children completed:

```
✅ sip-endpoint
✅ telephony-endpoint
✅ call-bridging
✅ device-configuration
✅ security-model
```

---

*Phase: EXITING | Depth: 0 | Parent: none*
