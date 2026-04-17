# Understanding: Telephony Endpoint

> GSM telephony integration using react-native-tele library.

## Phase: EXPLORING

## Hypothesis

The telephony endpoint handles:
1. GSM call operations (make, answer, hangup)
2. Call state monitoring (ringing, dialing, active, disconnected)
3. Incoming call rejection (security model)
4. Call state propagation to SIP endpoint

## Sources

- `telon-gateway-app/src/Gateway.js` - `tEndpointInit()`, telephony event handlers
- `telon-gateway-app/package.json` - react-native-tele dependency

## Validated Understanding

### Telephony Configuration

```javascript
// Device-specific configurations
{
  ReplaceDialer: true/false,    // Replace default dialer app
  Permissions: true/false,      // Request elevated permissions
  fas: false                    // Disable FAS (Voice over LTE) on some devices
}
```

### Telephony Event Handlers

| Event | Handler | Purpose |
|-------|---------|---------|
| `call_received` | `onTeleCallReceived` | **KEY**: Incoming GSM calls (rejected) |
| `call_changed` | `onTeleCallChanged` | **KEY**: Call state changes → SIP propagation |
| `call_terminated` | `onTeleCallTerminated` | **KEY**: Hangup → propagate to SIP |
| `connectivity_changed` | (commented out) | TODO: Network changes |

### Call Flow: GSM Operations

1. **Incoming GSM Call** (`onTeleCallReceived`):
   ```
   GSM call received
   ├─> Check: state == TELE_INV_STATE_RINGING
   ├─> YES: Incoming call → REJECT (security)
   │        this.tEndpoint.hangupCall(call)
   └─> NO: Outgoing call → Track: this.teleCall = call
   ```

2. **Call State Changes** (`onTeleCallChanged`):
   ```
   Call state changed
   ├─> TELE_INV_STATE_CONNECTING → "Набор пошел" (dialing started)
   ├─> TELE_INV_STATE_DIALING    → Send PROGRESS to SIP (early media)
   ├─> TELE_INV_STATE_ACTIVE     → Send ANSWER to SIP
   ├─> TELE_INV_STATE_DISCONNECTED/ING → Send HANGUP to SIP
   ├─> BUSY                      → Send BUSY to SIP
   ├─> TELE_INV_STATE_RINGING    → Send ANSWER to SIP (incoming)
   └─> TELE_INV_STATE_UNKNOWN    → Log unknown state
   ```

3. **Call Terminated** (`onTeleCallTerminated`):
   ```
   GSM call terminated
   ├─> Check: direction == DIRECTION_INCOMING
   │        └─> YES: Ignore (no termination on incoming)
   ├─> Check: state == PJSIP_INV_STATE_DISCONNECTED
   └─> Check: sendHangup flag → this.sEndpoint.hangupCall(this.sipCall)
   ```

### Telephony States

| State | SIP Equivalent | Action |
|-------|---------------|--------|
| `TELE_INV_STATE_CONNECTING` | `PJSIP_INV_STATE_CALLING` | Log dialing |
| `TELE_INV_STATE_DIALING` | `PJSIP_INV_STATE_EARLY` | Send PROGRESS to SIP |
| `TELE_INV_STATE_ACTIVE` | `PJSIP_INV_STATE_CONFIRMED` | Send ANSWER to SIP |
| `TELE_INV_STATE_DISCONNECTED` | `PJSIP_INV_STATE_DISCONNECTED` | Send HANGUP to SIP |
| `TELE_INV_STATE_RINGING` | `PJSIP_INV_STATE_INCOMING` | Send ANSWER to SIP |
| `BUSY` | - | Send BUSY to SIP |

### Key Flags

- `tele2sip=false` - GSM→SIP bridging disabled (only outgoing GSM tracked)
- `conf.sendHangup` - Prevent duplicate hangup signals to SIP

### Make Call Flow (from SIP)

```javascript
// Called from onSipCallReceived
this.tEndpoint.makeCall(1, destination, options)
  .then((call1) => { this.teleCall = call1; });

// Parameters:
// 1 = slot/subscription ID (SIM slot)
// destination = phone number (e.g., "+79006367756")
// options = { headers: { "sim": "1" } }
```

## Children Identified

| Child | Hypothesis | Status |
|-------|------------|--------|
| `call-states` | GSM call state machine and transitions | PENDING |
| `outgoing-calls` | Making calls via GSM network | PENDING |
| `incoming-rejection` | Security model for rejecting incoming calls | PENDING |

## Dependencies

- **Uses**: `react-native-tele` library
- **Used by**: Gateway bridge logic, SIP endpoint (via call bridging)

## Key Insights

1. **Incoming Call Rejection**: All incoming GSM calls are automatically rejected
2. **State Mapping**: GSM states are mapped to SIP equivalents for bridging
3. **Early Media Support**: `TELE_INV_STATE_DIALING` triggers PROGRESS to SIP
4. **SIM Slot Selection**: `makeCall(1, ...)` uses SIM slot 1 (hardcoded)
5. **Asynchronous Operations**: `makeCall` returns promise, call stored for tracking

## ADR Candidates

1. **Incoming Call Rejection** - Security decision to reject all incoming GSM calls
2. **SIM Slot Selection** - Hardcoded to slot 1 (single-SIM assumption)
3. **Unidirectional Bridge** - `tele2sip=false` disables GSM→SIP initiation

## Flow Recommendation

- **Type**: SDD (Spec-Driven Development)
- **Confidence**: High
- **Rationale**: Internal service integration, technical implementation detail

## Synthesis

> Will be updated after children complete

[pending children completion]

## Bubble Up

- Telephony endpoint manages GSM call lifecycle
- Event-driven architecture (call_received, call_changed, call_terminated)
- Incoming GSM calls automatically rejected (security)
- Call state propagation to SIP (CONNECTING→DIALING→ACTIVE→DISCONNECTED)
- Hangup propagation controlled by `sendHangup` flag
- `tele2sip=false` means GSM→SIP initiation is disabled

---

*Phase: EXPLORING | Depth: 1 | Parent: root*
