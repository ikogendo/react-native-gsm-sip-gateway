# Understanding: Device Configuration

> Device-specific auto-configuration based on device ID.

## Phase: EXPLORING

## Hypothesis

The application auto-configures itself based on device ID to support different hardware configurations and SIP accounts.

## Sources

- `telon-gateway-app/src/Gateway.js` - `start()` method, device ID mapping
- `README.md` - Device configuration table

## Validated Understanding

### Device ID to Configuration Mapping

```javascript
let deviceId = DeviceInfo.getDeviceId();

if (deviceId == "sp7731cea") {
  tConfig = { ReplaceDialer: true, Permissions: true };
  sConfig = { name: "50015", username: "50015", password: "pass50015" };
} else if (deviceId == "Impress_City") {
  tConfig = { ReplaceDialer: false, Permissions: false };
  sConfig = { name: "50014", username: "50014", password: "pass50014" };
} else if (deviceId == "Impress_Tor") {
  tConfig = { ReplaceDialer: true, Permissions: true };
  sConfig = { name: "50017", username: "50017", password: "pass50017" };
} else if (deviceId == "QC_Reference_Phone") { // Redmi 4A
  tConfig = { ReplaceDialer: true, Permissions: true, fas: false };
  sConfig = { name: "50019", username: "50019", password: "pass50019" };
} else if (deviceId == "MSM8937") { // Redmi 5A
  tConfig = { ReplaceDialer: true, Permissions: true, fas: false };
  sConfig = { name: "50018", username: "50018", password: "pass50018" };
} else {
  // Default fallback
  tConfig = { ReplaceDialer: false, Permissions: false };
  sConfig = { name: "50016", username: "50016", password: "pass50016" };
}
```

### Configuration Table

| Device ID | Device Name | SIP Account | ReplaceDialer | Permissions | FAS |
|-----------|-------------|-------------|---------------|-------------|-----|
| `sp7731cea` | Unknown | 50015 | true | true | - |
| `Impress_City` | Unknown | 50014 | false | false | - |
| `Impress_Tor` | Unknown | 50017 | true | true | - |
| `QC_Reference_Phone` | Redmi 4A | 50019 | true | true | false |
| `MSM8937` | Redmi 5A | 50018 | true | true | false |
| Default | - | 50016 | false | false | - |

### Configuration Parameters

#### Telephony Configuration (`tConfig`)

| Parameter | Type | Purpose |
|-----------|------|---------|
| `ReplaceDialer` | boolean | Replace default dialer app |
| `Permissions` | boolean | Request elevated telephony permissions |
| `fas` | boolean | Disable FAS (Voice over LTE) - device-specific |

#### SIP Configuration (`sConfig`)

| Parameter | Format | Purpose |
|-----------|--------|---------|
| `name` | string | SIP account display name |
| `username` | string | SIP username for authentication |
| `password` | string | SIP password for authentication |

### Configuration Flow

```
Gateway.start()
│
├─> Get: deviceId = DeviceInfo.getDeviceId()
│
├─> Match: Device ID → Configuration
│   ├─ Known device: Use specific config
│   └─ Unknown device: Use fallback (50016)
│
├─> Initialize: tEndpoint with tConfig
└─> Initialize: sEndpoint with sConfig
```

### Key Insights

1. **Hardcoded Mapping**: Device-to-config mapping is hardcoded in source
2. **No Dynamic Config**: No external configuration file or API
3. **SIP Account per Device**: Each physical device has unique SIP account
4. **Dialer Replacement**: Some devices replace default dialer, others don't
5. **FAS Disabled**: Redmi devices (4A, 5A) have FAS disabled

### Potential Issues

1. **Scalability**: Adding new devices requires code changes
2. **Security**: Passwords hardcoded in source (`pass50015`, etc.)
3. **Maintenance**: Device IDs may change with firmware updates
4. **Fallback Behavior**: Default config (50016) may not work on unknown devices

### Device Identification

```javascript
// Using react-native-device-info
import DeviceInfo from 'react-native-device-info';
let deviceId = DeviceInfo.getDeviceId();
```

Returns hardware-specific identifier (e.g., `MSM8937`, `sp7731cea`).

## Children Identified

| Child | Hypothesis | Status |
|-------|------------|--------|
| `device-detection` | Device ID detection mechanism | PENDING |
| `config-parameters` | Configuration parameter meanings | PENDING |
| `security-concerns` | Hardcoded credentials issue | PENDING |

## Dependencies

- **Uses**: `react-native-device-info` library
- **Used by**: Gateway initialization (`start()` method)

## Key Insights

1. **Static Mapping**: Configuration is static, not dynamic
2. **Credential Exposure**: SIP passwords visible in source code
3. **Device-Specific Behavior**: Different devices have different capabilities
4. **Fallback Strategy**: Default config for unknown devices

## ADR Candidates

1. **Hardcoded Configuration** - Why not external config file or API?
2. **Credential Storage** - Security concern: passwords in source
3. **Device-Specific SIP Accounts** - One account per device strategy

## Flow Recommendation

- **Type**: SDD (Spec-Driven Development)
- **Confidence**: High
- **Rationale**: Technical implementation detail, internal service logic

## Synthesis

> Will be updated after children complete

[pending children completion]

## Bubble Up

- Device configuration via hardcoded device ID mapping
- Each device has unique SIP account (50014-50019)
- ReplaceDialer/Permissions vary by device
- Security concern: passwords hardcoded in source
- FAS disabled on Redmi devices (4A, 5A)

---

*Phase: EXPLORING | Depth: 1 | Parent: root*
