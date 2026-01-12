# Timezone Quick Reference

## Common Timezone IDs

### Americas

```typescript
'America/New_York'; // Eastern Time
'America/Chicago'; // Central Time
'America/Denver'; // Mountain Time
'America/Los_Angeles'; // Pacific Time
'America/Anchorage'; // Alaska Time
'America/Phoenix'; // Arizona (no DST)
'America/Toronto'; // Eastern Canada
'America/Mexico_City'; // Mexico City
'America/Sao_Paulo'; // São Paulo, Brazil
'America/Argentina/Buenos_Aires'; // Buenos Aires
```

### Europe

```typescript
'GMT'; // Greenwich Mean Time
'Europe/London'; // UK/Ireland
'Europe/Paris'; // Central European Time
'Europe/Berlin'; // Central European Time
'Europe/Amsterdam'; // Central European Time
'Europe/Rome'; // Central European Time
'Europe/Moscow'; // Moscow Standard Time
'Europe/Athens'; // Eastern European Time
'Europe/Istanbul'; // Turkey
```

### Asia

```typescript
'Asia/Kolkata'; // India (IST)
'Asia/Shanghai'; // China
'Asia/Hong_Kong'; // Hong Kong
'Asia/Tokyo'; // Japan
'Asia/Seoul'; // South Korea
'Asia/Bangkok'; // Thailand
'Asia/Dubai'; // UAE
'Asia/Jerusalem'; // Israel
'Asia/Karachi'; // Pakistan
```

### Australia/Pacific

```typescript
'Australia/Sydney'; // Eastern Australia
'Australia/Melbourne'; // Victoria
'Australia/Brisbane'; // Queensland
'Australia/Perth'; // Western Australia
'Australia/Darwin'; // Northern Territory
'Pacific/Auckland'; // New Zealand
'Pacific/Fiji'; // Fiji Islands
'Pacific/Honolulu'; // Hawaii
```

## Usage Patterns

### 1. Get All Timezones for Dropdown

```typescript
import { getTimezoneArray } from '../constants/timezones';

const zones = getTimezoneArray();
// Maps to FlatList or Picker
```

### 2. Check if Timezone is Valid

```typescript
import { isValidTimezone } from '../constants/timezones';

if (isValidTimezone(userInput)) {
  // Safe to use
}
```

### 3. Convert Event Time to Display Timezone

```typescript
import { convertToSelectedTimezone } from '../utils/timezone';
import { useSettingsStore } from '../stores/useSetting';

const { selectedTimeZone } = useSettingsStore();
const eventTime = convertToSelectedTimezone(event.fromTime, selectedTimeZone);

if (eventTime) {
  console.log(
    `${eventTime.displayValues.hour}:${eventTime.displayValues.minute}`,
  );
}
```

### 4. Get Human-Readable Timezone Label

```typescript
import { getTimezoneLabel } from '../constants/timezones';

const label = getTimezoneLabel('Asia/Kolkata');
// Returns: "Chennai, Kolkata, Mumbai, New Delhi"
```

### 5. Set User's Timezone Selection

```typescript
import { useSettingsStore } from '../stores/useSetting';

const { setSelectedTimeZone } = useSettingsStore();

// This will persist to AsyncStorage automatically
setSelectedTimeZone('America/New_York');
```

## Important Notes

### Date String Format

All date conversions expect format: `YYYYMMDDTHHmmss`

- ✅ Correct: `'20240115T143000'`
- ❌ Wrong: `'2024-01-15 14:30:00'`

### Time Arithmetic

When converting to different timezones:

```typescript
// The date object returned is always UTC
// displayValues contain the time in selected timezone
const result = convertToSelectedTimezone(dateStr, 'America/New_York');
const utcDate = result?.date; // Original UTC time
const displayTime = result?.displayValues; // EST/EDT time
```

### Handling Invalid Timezones

```typescript
// Set action will be rejected
setSelectedTimeZone('Invalid/Zone'); // ⚠️ Does nothing, logs warning

// Conversion will fallback to GMT
const result = convertToSelectedTimezone(dateStr, 'Invalid/Zone');
// Falls back to GMT if validation fails
```

## Migration from Old Timezone System

The old system used shortcodes: `'ist' | 'utc' | 'est' | 'pst'`

New system automatically converts these:

- `'ist'` → `'Asia/Kolkata'`
- `'utc'` → `'GMT'`
- `'est'` → `'America/New_York'`
- `'pst'` → `'America/Los_Angeles'`

Conversion happens transparently in `normalizeTimezone()`.

## Accessing All 92 Timezones

```typescript
import { ALL_TIMEZONES } from '../constants/timezones';

// Get all as object
const allTz = ALL_TIMEZONES;

// List all IDs
const ids = Object.keys(ALL_TIMEZONES);
// ['Pacific/Midway', 'Pacific/Honolulu', 'America/Juneau', ...]

// List with labels
const entries = Object.entries(ALL_TIMEZONES);
entries.forEach(([id, label]) => {
  console.log(`${id}: ${label}`);
});
```

## Device System Timezone

Detect device's system timezone:

```typescript
import { getSystemTimezone } from '../constants/timezones';

const deviceTz = getSystemTimezone();
// Returns IANA timezone or 'GMT' as fallback
```

## Common Gotchas

1. **Case Sensitivity**: Timezones are case-sensitive

   - ✅ `'America/New_York'`
   - ❌ `'america/new_york'`

2. **Underscore vs Hyphen**: Use underscore for multi-word cities

   - ✅ `'America/New_York'`
   - ❌ `'America/New-York'`

3. **GMT vs UTC**: Both are supported, but use `'GMT'` from the list

   - ✅ `'GMT'` (recommended)
   - ⚠️ `'Etc/UTC'` (avoided to reduce confusion)

4. **Daylight Saving Time**: Intl API handles DST automatically
   - No manual DST adjustment needed
   - Conversion is handled by the browser/device

## Performance Tips

1. Use `useMemo` when filtering timezone list in components
2. FlatList is already optimized in TimeZoneModal
3. Cache timezone validation results if checking frequently
4. Convert times only when displaying, not in sorted comparisons

## Testing Timezone Features

```typescript
// Test date conversion
const result = convertToSelectedTimezone('20240115T143000', 'Asia/Kolkata');
expect(result?.displayValues.hour).toBe(20); // 14:30 UTC + 5:30 = 20:00 IST

// Test timezone validation
expect(isValidTimezone('Asia/Kolkata')).toBe(true);
expect(isValidTimezone('Invalid')).toBe(false);

// Test timezone array
const zones = getTimezoneArray();
expect(zones.length).toBeGreaterThan(0);
expect(zones[0].id).toBeDefined();
```
