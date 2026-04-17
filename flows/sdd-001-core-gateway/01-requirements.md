# SDD 001: Core Gateway Service

> Specification for the Telon GSM-SIP Gateway core service logic.

**Status**: DRAFT  
**Type**: Internal Service  
**Date**: 2026-03-04  
**Source**: Legacy Analysis (`/legacy` command)

---

## 01. Requirements

### Overview

The Core Gateway Service provides bidirectional call state synchronization between SIP and GSM protocols, enabling SIP-initiated calls through GSM hardware.

### Functional Requirements

#### FR-1: SIP Call Handling
- **FR-1.1**: Receive incoming SIP calls via `react-native-sip2`
- **FR-1.2**: Extract destination number from SIP call
- **FR-1.3**: Initiate GSM call to destination number
- **FR-1.4**: Support test numbers with special behavior:
  - `50014-50019`: Fast answer (test accounts)
  - `3333`: Answer with destination "900"
  - `4444`: Answer with audio session activation

#### FR-2: GSM Call Handling
- **FR-2.1**: Monitor GSM call state changes
- **FR-2.2**: Reject all incoming GSM calls (security)
- **FR-2.3**: Track outgoing GSM calls initiated by SIP
- **FR-2.4**: Propagate GSM call states to SIP endpoint

#### FR-3: Call State Synchronization
- **FR-3.1**: Map GSM states to SIP equivalents:
  - `TELE_INV_STATE_CONNECTING` → Log only
  - `TELE_INV_STATE_DIALING` → `progressCall()` (early media)
  - `TELE_INV_STATE_ACTIVE` → `answerCall()`
  - `TELE_INV_STATE_DISCONNECTED` → `hangupCall()`
  - `BUSY` → `busyCall()`
- **FR-3.2**: Propagate SIP hangup to GSM
- **FR-3.3**: Propagate GSM hangup to SIP
- **FR-3.4**: Prevent duplicate hangup signals

#### FR-4: Device Configuration
- **FR-4.1**: Auto-detect device via `DeviceInfo.getDeviceId()`
- **FR-4.2**: Apply device-specific SIP credentials
- **FR-4.3**: Apply device-specific telephony settings
- **FR-4.4**: Fallback to default config for unknown devices

### Non-Functional Requirements

#### NFR-1: Performance
- **NFR-1.1**: Call setup time < 2 seconds (SIP→GSM)
- **NFR-1.2**: State propagation latency < 500ms

#### NFR-2: Reliability
- **NFR-2.1**: Handle call state changes without crashes
- **NFR-2.2**: Recover from endpoint initialization failures

#### NFR-3: Security
- **NFR-3.1**: Reject all incoming GSM calls
- **NFR-3.2**: Prevent unauthorized call initiation
- **NFR-3.3**: Require root access for elevated permissions

#### NFR-4: Maintainability
- **NFR-4.1**: Event-driven architecture for loose coupling
- **NFR-4.2**: Comprehensive logging for debugging

---

## 02. Specifications

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Gateway Class                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐              ┌──────────────┐        │
│  │  SIP         │              │  Telephony   │        │
│  │  Endpoint    │              │  Endpoint    │        │
│  │  (sip2)      │              │  (tele)      │        │
│  └──────┬───────┘              └───────┬──────┘        │
│         │                              │                │
│         ├──────────┬───────────────────┤                │
│         │          │                   │                │
│  ┌──────▼──────────▼───────────────┐   │                │
│  │    Event Handlers               │   │                │
│  │  - onSipCallReceived            │   │                │
│  │  - onSipCallChanged             │   │                │
│  │  - onSipCallTerminated          │   │                │
│  │  - onTeleCallReceived           │   │                │
│  │  - onTeleCallChanged            │   │                │
│  │  - onTeleCallTerminated         │   │                │
│  └─────────────┬───────────────────┘   │                │
│                │                       │                │
│         ┌──────▼───────────────────────▼──────┐        │
│         │    Call State Synchronization       │        │
│         │    (Distributed across handlers)    │        │
│         └─────────────────────────────────────┘        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Gateway Class

**Responsibility**: Main orchestrator for SIP↔GSM bridging

**Properties**:
```javascript
{
  teleCall: Call | null,        // Current GSM call
  sipCall: Call | null,         // Current SIP call
  conf: {                       // Configuration flags
    sendHangup: boolean,        // Prevent duplicate hangups
    sendSipHangup: boolean      // Control SIP hangup propagation
  },
  tEndpoint: TelephonyEndpoint, // GSM endpoint instance
  sEndpoint: SipEndpoint        // SIP endpoint instance
}
```

**Methods**:
```javascript
class Gateway {
  constructor()
  async start(): Promise<void>
  async tEndpointInit(tConfig): Promise<void>
  async sEndpointInit(sConfig): Promise<void>
  
  // SIP Event Handlers
  onSipCallReceived(call: SipCall): void
  onSipCallChanged(call: SipCall): void
  onSipCallTerminated(call: SipCall): void
  
  // Telephony Event Handlers
  onTeleCallReceived(call: TeleCall): void
  onTeleCallChanged(call: TeleCall): void
  onTeleCallTerminated(call: TeleCall): void
  
  destroy(): void
}
```

#### SIP Endpoint Integration

**Library**: `react-native-sip2`

**Configuration**:
```javascript
{
  name: string,              // Account display name
  username: string,          // SIP username
  password: string,          // SIP password
  domain: "192.168.88.254",  // SIP server
  regServer: "",             // Empty (uses domain)
  transport: "UDP",
  regTimeout: 3600,
  regOnAdd: true,
  network: {
    useAnyway: true,
    useWifi: true,
    use3g: true,
    useEdge: true,
    useGprs: true,
    useInRoaming: true,
    useOtherNetworks: true
  }
}
```

**Events**:
- `registration_changed`: Account registration status
- `connectivity_changed`: Network connectivity changes
- `call_received`: Incoming SIP call
- `call_changed`: Call state update
- `call_terminated`: Call ended

#### Telephony Endpoint Integration

**Library**: `react-native-tele`

**Configuration**:
```javascript
{
  ReplaceDialer: boolean,    // Replace default dialer
  Permissions: boolean,      // Request elevated permissions
  fas: boolean               // Disable FAS/VoLTE (device-specific)
}
```

**Events**:
- `call_received`: Incoming/outgoing GSM call
- `call_changed`: Call state update
- `call_terminated`: Call ended
- `connectivity_changed`: Network changes (TODO)

### Call Flow Specifications

#### SIP→GSM Call Flow

```
SIP Network          Gateway            GSM Network
    │                   │                    │
    │── INVITE ─────────│                    │
    │                   │ onSipCallReceived  │
    │                   │ Store: sipCall     │
    │                   │ Check test numbers │
    │                   │                    │
    │                   │ makeCall(1, dest)  │─── INVITE ──→│
    │                   │ Store: teleCall    │
    │                   │                    │
    │←── PROGRESS ──────│← progressCall() ───│← EARLY ──────│
    │                   │                    │
    │←── ANSWER ────────│← answerCall() ─────│← ACTIVE ─────│
    │                   │                    │
    │←── BYE ───────────│← hangupCall() ─────│← DISCONNECT ─│
```

#### GSM State → SIP Action Mapping

| GSM State | SIP Action | Method |
|-----------|-----------|--------|
| `TELE_INV_STATE_CONNECTING` | Log only | - |
| `TELE_INV_STATE_DIALING` | Send PROGRESS | `progressCall()` |
| `TELE_INV_STATE_ACTIVE` | Send ANSWER | `answerCall()` |
| `TELE_INV_STATE_DISCONNECTED` | Send HANGUP | `hangupCall()` |
| `BUSY` | Send BUSY | `busyCall()` |
| `TELE_INV_STATE_RINGING` | Send ANSWER | `answerCall()` |

### Test Number Specifications

| Number | Behavior | Use Case |
|--------|----------|----------|
| `50014-50019` | Fast answer | Test accounts |
| `3333` | Answer, destination="900" | Test routing |
| `4444` | Answer, activate audio | Audio test |

### Error Handling

#### Hangup Prevention

```javascript
// Pattern to prevent duplicate hangup signals
if (this.conf.sendHangup != true) {
  this.conf.sendHangup = true;  // Set flag FIRST
  this.sEndpoint.hangupCall(...); // Then send
}
```

**Known Issue**: Flag is never reset, which could block legitimate hangups in rapid succession.

#### Incoming Call Rejection

```javascript
onTeleCallReceived = (call) => {
  if (call._state == "TELE_INV_STATE_RINGING") {
    // Incoming: Reject immediately
    this.tEndpoint.hangupCall(call);
  } else {
    // Outgoing: Track
    this.teleCall = call;
  }
}
```

### Logging Requirements

- Log all call state changes with timestamps
- Log device ID and configuration on startup
- Log test number detection and handling
- Log hangup signal propagation

---

## 03. Dependencies

### External Libraries
- `react-native-sip2`: SIP protocol handling
- `react-native-tele`: GSM telephony operations
- `react-native-device-info`: Device identification
- `react-native-replace-dialer`: Default dialer replacement (optional)

### System Requirements
- Android 8.0+ (Oreo)
- Root access (Magisk module)
- Telephony permissions via Magisk

---

## 04. Testing Strategy

### Unit Tests
- [ ] Device configuration lookup
- [ ] Test number detection
- [ ] Hangup flag logic

### Integration Tests
- [ ] SIP call reception → GSM call initiation
- [ ] GSM state changes → SIP propagation
- [ ] Hangup propagation (both directions)

### Manual Tests
- [ ] Test numbers (50014-50019, 3333, 4444)
- [ ] Incoming call rejection
- [ ] Device-specific configurations

---

## 05. Open Issues

1. **Hangup Flag Bug**: `sendHangup` flag never reset
2. **Credential Exposure**: SIP passwords hardcoded in source
3. **State-Based Detection**: Incoming call detection via state (less reliable)

---

## Notes

> Added by /legacy on 2026-03-04

**Analysis Source**: `telon-gateway-app/src/Gateway.js`, `README.md`

**Coverage**: Core gateway logic, SIP/telephony integration, call bridging

---

*Generated by /legacy recursive traversal*
