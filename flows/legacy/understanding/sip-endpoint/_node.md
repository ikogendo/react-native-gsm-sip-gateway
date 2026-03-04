# Understanding: SIP Endpoint

> SIP protocol integration using react-native-sip2 library.

## Phase: EXPLORING

## Hypothesis

The SIP endpoint handles:
1. Account creation and registration
2. Incoming/outgoing SIP call management
3. Call state propagation to gateway bridge
4. Network connectivity monitoring

## Sources

- `telon-gateway-app/src/Gateway.js` - `sEndpointInit()`, SIP event handlers
- `telon-gateway-app/package.json` - react-native-sip2 dependency

## Validated Understanding

### SIP Account Configuration

```javascript
{
  "name": "50015",              // Device-specific
  "username": "50015",
  "password": "pass50015",
  "domain": "192.168.88.254",   // Internal SIP server
  "regServer": "",              // Empty (uses domain)
  "transport": "UDP",
  "regTimeout": 3600,
  "regOnAdd": true,             // Auto-register on account creation
  "network": {
    "useAnyway": true,
    "useWifi": true,
    "use3g": true,
    "useEdge": true,
    "useGprs": true,
    "useInRoaming": true,
    "useOtherNetworks": true
  }
}
```

### SIP Event Handlers

| Event | Handler | Purpose |
|-------|---------|---------|
| `registration_changed` | `onRegistrationChanged` | Monitor SIP registration status |
| `connectivity_changed` | `onConnectivityChanged` | Network connectivity changes |
| `call_received` | `onSipCallReceived` | **KEY**: Incoming SIP → trigger GSM call |
| `call_changed` | `onSipCallChanged` | Call state updates (early media, etc.) |
| `call_terminated` | `onSipCallTerminated` | **KEY**: Hangup → propagate to GSM |
| `call_screen_locked` | `onCallScreenLocked` | Android-only screen lock |

### Call Flow: SIP → GSM

1. **Incoming SIP Call** (`onSipCallReceived`):
   ```
   SIP call received
   ├─> Check: sip2tele enabled? (yes)
   ├─> Store: this.sipCall = call
   ├─> Check test numbers:
   │   ├─ 50014-50019: Fast answer, return
   │   ├─ 3333: Answer, destination="900"
   │   ├─ 4444: Activate audio session
   │   └─ Default: Make GSM call to +<destination>
   └─> this.tEndpoint.makeCall(1, destination, options)
   ```

2. **SIP Call Terminated** (`onSipCallTerminated`):
   ```
   SIP call disconnected
   ├─> Check: state == PJSIP_INV_STATE_DISCONNECTED
   ├─> Check: sendHangup flag (prevent duplicate)
   └─> this.tEndpoint.hangupCall(this.teleCall)
   ```

3. **Call State Changes** (`onSipCallChanged`):
   - Currently empty (no-op)
   - Could handle: PJSIP_INV_STATE_INCOMING, CONNECTING, CONFIRMED

### Test Numbers

| Number | Behavior |
|--------|----------|
| 50014-50019 | Fast answer (test accounts) |
| 3333 | Answer + destination="900" |
| 4444 | Answer + activate audio session |

### Key Flags

- `sip2tele=true` - Enable SIP→GSM bridging
- `conf.sendHangup` - Prevent duplicate hangup signals
- `conf.sendSipHangup` - Control SIP hangup propagation

## Children Identified

| Child | Hypothesis | Status |
|-------|------------|--------|
| `account-management` | Account creation, registration lifecycle | PENDING |
| `call-handling` | Incoming/outgoing call processing | PENDING |
| `network-config` | Network connectivity and transport settings | PENDING |

## Dependencies

- **Uses**: `react-native-sip2` library
- **Used by**: Gateway bridge logic, telephony endpoint (via call bridging)

## Key Insights

1. **Auto-Registration**: `regOnAdd: true` triggers immediate registration
2. **Network Agnostic**: Configured to work on any network type
3. **UDP Transport**: Fixed transport protocol (no TCP/TLS option)
4. **Hardcoded Server**: `192.168.88.254` is hardcoded (internal infrastructure)
5. **Event-Driven**: All SIP operations are event-driven (no polling)

## ADR Candidates

1. **SIP Server Address** - Why `192.168.88.254`? Internal network decision
2. **UDP-Only Transport** - No TCP/TLS support (performance vs. reliability)
3. **Network Agnosticism** - `useAnyway: true` bypasses network restrictions

## Flow Recommendation

- **Type**: SDD (Spec-Driven Development)
- **Confidence**: High
- **Rationale**: Internal service integration, technical implementation detail

## Synthesis

> Will be updated after children complete

[pending children completion]

## Bubble Up

- SIP endpoint manages account registration and call lifecycle
- Event-driven architecture (call_received, call_terminated, etc.)
- SIP→GSM bridging triggered in `onSipCallReceived`
- Test numbers have special handling (fast answer, audio session)
- Hangup propagation controlled by `sendHangup` flag

---

*Phase: EXPLORING | Depth: 1 | Parent: root*
