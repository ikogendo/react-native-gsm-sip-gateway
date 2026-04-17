# Understanding: Call Bridging

> Bidirectional call state synchronization and audio routing between SIP and GSM.

## Phase: EXPLORING

## Hypothesis

Call bridging is the core functionality that:
1. Synchronizes call states between SIP and GSM endpoints
2. Routes audio between the two protocols
3. Manages call lifecycle across both networks
4. Prevents duplicate hangup signals

## Sources

- `telon-gateway-app/src/Gateway.js` - Bridge logic in event handlers
- `README.md` - Architecture documentation

## Validated Understanding

### Bridge Architecture

The application uses an **event-driven bridge** pattern rather than a dedicated bridge class:

```javascript
// Bridge class exists but is NOT actively used
class Bridges {
  constructor(tEndpoint, sEndpoint) {
    this.teleCall = null;
    this.sipCall = null;
    this.tEndpoint = new tEndpoint();
    this.sEndpoint = new sEndpoint();
  }
}

// Gateway uses direct event handlers instead
export default class Gateway {
  constructor() {
    this.teleCall = null;
    this.sipCall = null;
    this.tEndpoint = new teleEndpoint();
    this.sEndpoint = new sipEndpoint();
  }
}
```

### SIP → GSM Bridge Flow

```
SIP Call Received (onSipCallReceived)
│
├─> Store: this.sipCall = call
├─> Set: this.conf.sendHangup = false
│
├─> Check Test Numbers:
│   ├─ 50014-50019: Fast answer, return
│   ├─ 3333: destination="900", answer
│   ├─ 4444: destination="900", activate audio
│   └─ Default: Make GSM call
│
└─> this.tEndpoint.makeCall(1, destination, options)
    └─> Store: this.teleCall = call1
```

### GSM → SIP State Propagation

```
GSM Call Changed (onTeleCallChanged)
│
├─> TELE_INV_STATE_CONNECTING
│   └─> Log: "Набор пошел" (dialing started)
│
├─> TELE_INV_STATE_DIALING
│   └─> this.sEndpoint.progressCall(this.sipCall)
│       └─> Send early media to SIP
│
├─> TELE_INV_STATE_ACTIVE
│   └─> this.sEndpoint.answerCall(this.sipCall)
│       └─> Confirm call in SIP
│
├─> TELE_INV_STATE_DISCONNECTED/ING
│   └─> this.sEndpoint.hangupCall(this.sipCall)
│       └─> Terminate SIP call
│
├─> BUSY
│   └─> this.sEndpoint.busyCall(this.sipCall)
│
└─> TELE_INV_STATE_RINGING
    └─> this.sEndpoint.answerCall(this.sipCall)
```

### SIP → GSM Hangup Propagation

```
SIP Call Terminated (onSipCallTerminated)
│
├─> Check: state == PJSIP_INV_STATE_DISCONNECTED
├─> Check: this.conf.sendHangup != true
│   └─> Set: this.conf.sendHangup = true
│   └─> this.tEndpoint.hangupCall(this.teleCall)
│       └─> Terminate GSM call
```

### GSM → SIP Hangup Propagation

```
GSM Call Terminated (onTeleCallTerminated)
│
├─> Check: direction == DIRECTION_INCOMING
│   └─> YES: Ignore (no termination on incoming)
│
├─> Check: state == PJSIP_INV_STATE_DISCONNECTED
├─> Check: this.conf.sendHangup != true
│   └─> Set: this.conf.sendHangup = true
│   └─> this.sEndpoint.hangupCall(this.sipCall)
```

### Duplicate Hangup Prevention

The `conf.sendHangup` flag prevents infinite hangup loops:

```javascript
// Pattern in all hangup handlers
if (this.conf.sendHangup != true) {
  this.conf.sendHangup = true;  // Set flag FIRST
  this.sEndpoint.hangupCall(...); // Then send hangup
}
```

**Problem**: This flag is never reset, which means:
- After first hangup in either direction, subsequent hangups are blocked
- This could cause issues with rapid call state changes
- **Potential bug**: Flag should be reset when call is fully terminated

### Audio Routing

Audio bridging is handled implicitly by the native libraries:

1. **SIP Audio**: Managed by `react-native-sip2`
2. **GSM Audio**: Managed by `react-native-tele`
3. **Bridge**: Audio routing happens at native layer when both calls are active

Special handling:
```javascript
// Test number 4444: Explicit audio session activation
if (call._localNumber == "4444") {
  this.sEndpoint.activateAudioSession();
}
```

### Call State Synchronization Table

| GSM State | SIP Action | SIP State Equivalent |
|-----------|-----------|---------------------|
| CONNECTING | Log only | CALLING |
| DIALING | `progressCall()` | EARLY |
| ACTIVE | `answerCall()` | CONFIRMED |
| DISCONNECTED | `hangupCall()` | DISCONNECTED |
| BUSY | `busyCall()` | - |
| RINGING | `answerCall()` | INCOMING |

## Children Identified

| Child | Hypothesis | Status |
|-------|------------|--------|
| `state-sync` | Call state machine synchronization | PENDING |
| `hangup-prevention` | Duplicate hangup signal prevention | PENDING |
| `audio-routing` | Audio session management | PENDING |

## Dependencies

- **Uses**: SIP endpoint, Telephony endpoint
- **Used by**: Gateway main logic

## Key Insights

1. **Event-Driven Bridge**: No dedicated bridge class, logic in event handlers
2. **Flag-Based Prevention**: `sendHangup` flag prevents duplicate signals
3. **Potential Bug**: Flag never reset, could block legitimate hangups
4. **Test Mode Support**: Special numbers trigger different audio behaviors
5. **Implicit Audio**: Audio bridging happens at native layer

## ADR Candidates

1. **Event-Driven Architecture** - Why no dedicated bridge class?
2. **Flag-Based Prevention** - Simple but potentially buggy approach
3. **Audio Session Activation** - Manual activation only for test cases

## Flow Recommendation

- **Type**: TDD (Test-Driven Development)
- **Confidence**: Medium
- **Rationale**: Correctness-critical logic (call state sync, hangup prevention)

## Synthesis

> Will be updated after children complete

[pending children completion]

## Bubble Up

- Bridge logic is distributed across event handlers (no central bridge class)
- State synchronization: GSM states → SIP actions
- Hangup propagation: Bidirectional with flag-based prevention
- Potential bug: `sendHangup` flag never reset
- Audio routing: Implicit at native layer, explicit activation for tests

---

*Phase: EXPLORING | Depth: 1 | Parent: root*
