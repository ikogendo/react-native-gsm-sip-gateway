# Understanding: Security Model

> Security decisions for incoming call rejection and permission management.

## Phase: EXPLORING

## Hypothesis

The security model enforces:
1. Rejection of all incoming GSM calls (only SIP-initiated calls allowed)
2. Elevated permissions via Magisk for telephony operations
3. Unidirectional bridge (SIP→GSM enabled, GSM→SIP disabled)

## Sources

- `telon-gateway-app/src/Gateway.js` - `onTeleCallReceived()`, `onTeleCallTerminated()`
- `README.md` - Security features, Magisk permissions

## Validated Understanding

### Incoming GSM Call Rejection

**Core Security Decision**: All incoming GSM calls are automatically rejected.

```javascript
onTeleCallReceived = (call) => {
  // Check if incoming or outgoing
  if (call._state == "TELE_INV_STATE_RINGING") {
    // Incoming call → REJECT
    console.log(">>📱 📳 tEndpoint TELE_INV_STATE_RINGING");
    console.log("<<📱 tEndpoint.hangupCall");
    this.tEndpoint.hangupCall(call);  // Reject immediately
  } else {
    // Outgoing call → Track
    this.teleCall = call;
  }
}
```

**Rationale** (from README):
> "The application automatically rejects incoming GSM calls (for security)"

This prevents:
- Unauthorized calls through the gateway
- Bypass of SIP-based call routing
- Potential toll fraud or unauthorized access

### Unidirectional Bridge

```javascript
const sip2tele = true;   // SIP → GSM: ENABLED
const tele2sip = false;  // GSM → SIP: DISABLED
```

**Implications**:
- SIP calls can trigger GSM calls (gateway functionality)
- GSM calls cannot initiate SIP calls (security restriction)
- Only gateway-initiated GSM calls are tracked

### Permission Model

The application requires elevated permissions via Magisk:

```javascript
tConfig = {
  ReplaceDialer: true/false,   // Replace default dialer
  Permissions: true/false       // Request elevated permissions
}
```

**Magisk Permissions** (from README):
```xml
<uses-permission android:name="android.permission.READ_LOGS" />
<uses-permission android:name="android.permission.CAPTURE_AUDIO_OUTPUT" />
<uses-permission android:name="android.permission.READ_PRECISE_PHONE_STATE" />
<uses-permission android:name="android.permission.MODIFY_PHONE_STATE" />
```

These permissions require:
- Root access (Magisk module)
- System-level privileges
- Device-specific configuration

### Call Direction Detection

```javascript
// In onTeleCallReceived
if (call._state == "TELE_INV_STATE_RINGING") {
  // Incoming: state is RINGING when received
} else {
  // Outgoing: state is CONNECTING/DIALING when tracked
}
```

**Problem**: This detection is state-based, not direction-based. More robust:
```javascript
// Better approach (not used)
if (call._direction == "DIRECTION_INCOMING") { ... }
```

### Hangup Termination Guard

```javascript
onTeleCallTerminated = (call) => {
  // Prevent termination on incoming calls
  if (call._direction == "DIRECTION_INCOMING") {
    console.log("no termination on incoming");
    return;  // Ignore incoming call termination
  }
  // ... process hangup for outgoing calls
}
```

**Note**: This uses `call._direction` which is more explicit than state-based detection.

### Security Layers

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| **Call Rejection** | Auto-hangup incoming GSM | Prevent unauthorized access |
| **Unidirectional** | `tele2sip=false` | Prevent GSM→SIP initiation |
| **Permission Gates** | Magisk root access | System-level telephony control |
| **Device Binding** | Device-specific SIP accounts | Account isolation per device |

### Potential Security Concerns

1. **Hardcoded Credentials**: SIP passwords visible in source
   ```javascript
   sConfig = { username: "50015", password: "pass50015" };
   ```

2. **No Authentication**: No user authentication for gateway operations

3. **Fixed SIP Server**: Hardcoded server address (`192.168.88.254`)

4. **Root Requirement**: Magisk dependency limits deployment scenarios

5. **State-Based Detection**: Incoming call detection via state (not direction) could be unreliable

## Children Identified

| Child | Hypothesis | Status |
|-------|------------|--------|
| `incoming-rejection` | Automatic rejection of incoming GSM calls | PENDING |
| `permission-model` | Magisk-based elevated permissions | PENDING |
| `unidirectional-bridge` | SIP→GSM only, GSM→SIP disabled | PENDING |

## Dependencies

- **Uses**: Telephony endpoint (call direction detection)
- **Used by**: Gateway main logic, call bridging

## Key Insights

1. **Security by Rejection**: All incoming GSM calls rejected automatically
2. **Unidirectional Design**: Only SIP can initiate calls through gateway
3. **Root Required**: Magisk module for system-level permissions
4. **Device Isolation**: Each device has unique SIP account
5. **Credential Exposure**: Passwords hardcoded in source (security risk)

## ADR Candidates

1. **Incoming Call Rejection** - Architectural security decision
2. **Unidirectional Bridge** - Why `tele2sip=false`?
3. **Root Requirement** - Magisk dependency trade-offs
4. **Hardcoded Credentials** - Security concern: credential storage

## Flow Recommendation

- **Type**: ADR (Architectural Decision Record)
- **Confidence**: High
- **Rationale**: Core security architecture decisions

## Synthesis

> Will be updated after children complete

[pending children completion]

## Bubble Up

- Security model based on incoming call rejection
- Unidirectional bridge (SIP→GSM only)
- Magisk root access for elevated permissions
- Security concern: hardcoded SIP credentials
- State-based incoming call detection (potential reliability issue)

---

*Phase: EXPLORING | Depth: 1 | Parent: root*
