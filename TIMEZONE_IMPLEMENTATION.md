# Timezone Implementation Guide

## Overview

This document describes the complete timezone handling implementation for the Dcalendar mobile app. The app now supports all IANA timezone identifiers and properly respects the user's selected timezone when retrieving and displaying event and task dates.

## Key Changes

### 1. **Timezone Configuration** (`src/constants/timezones.ts`)

- **New file** containing all 92 supported IANA timezones
- Provides helper functions for timezone management:
  - `getTimezoneArray()` - Returns sorted array of timezones for UI rendering
  - `getTimezoneLabel(timezoneId)` - Gets human-readable label for a timezone
  - `isValidTimezone(timezoneId)` - Validates timezone IDs
  - `getSystemTimezone()` - Retrieves device's system timezone

### 2. **Settings Store Update** (`src/stores/useSetting.ts`)

- **Changed** `selectedTimeZone` from limited options (`'ist' | 'utc' | 'est' | 'pst'`) to accept any valid IANA timezone
- **Default timezone** now set to `'Asia/Kolkata'` (IANA format)
- **Added validation** in `setSelectedTimeZone()` to ensure only valid timezones are stored
- Timezone selection is persisted to AsyncStorage automatically via Zustand

### 3. **Timezone Utility Enhancement** (`src/utils/timezone.ts`)

- **Improved `convertToSelectedTimezone()`**:

  - Now accepts full IANA timezone names (e.g., 'Asia/Kolkata', 'America/New_York')
  - Maintains backward compatibility with legacy codes ('ist', 'utc', 'est', 'pst')
  - Validates timezones before conversion
  - Returns timezone in display values for tracking
  - Gracefully falls back to UTC on invalid timezone

- **New helper functions**:
  - `formatDisplayValues()` - Formats date/time display values as readable strings
  - `getCurrentTimeInTimezone()` - Gets current time in any timezone
  - `normalizeTimezone()` - Normalizes legacy codes to IANA format

### 4. **Settings Screen UI Update** (`src/screens/SettingsScreen.tsx`)

- **Enhanced TimeZoneModal**:

  - Displays all 92 timezones in alphabetically sorted list
  - Includes **search functionality** to filter timezones
  - Shows both timezone ID (e.g., 'Asia/Kolkata') and human-readable label
  - Optimized rendering with FlatList for performance
  - Responsive design for both phones and tablets

- **Updated imports** to use new timezone functions
- **Added styles** for timezone search and list rendering

## Implementation Details

### Supported Timezones

All major IANA timezone identifiers are supported, including:

- **Americas**: US regions (EST, PST, CST), Canada, South America
- **Europe**: UK, Western/Central/Eastern European zones
- **Africa**: Cairo, Nairobi, Casablanca regions
- **Asia**: India, China, Japan, Thailand, Middle East
- **Australia/Pacific**: Major Australian cities, Pacific islands

### Usage Examples

#### Getting Timezone Array for UI

```typescript
import { getTimezoneArray } from '../constants/timezones';

const timezones = getTimezoneArray();
// Returns sorted array:
// [
//   { id: 'UTC', label: 'Coordinated Universal Time (UTC)', timezone: 'UTC' },
//   { id: 'America/Los_Angeles', label: 'Pacific Time', timezone: 'America/Los_Angeles' },
//   ...
// ]
```

#### Setting Selected Timezone

```typescript
import { useSettingsStore } from '../stores/useSetting';

const { setSelectedTimeZone } = useSettingsStore();

// Valid timezone
setSelectedTimeZone('America/New_York'); // ✅ Works

// Invalid timezone (rejected)
setSelectedTimeZone('Invalid/Timezone'); // ⚠️ Validation fails
```

#### Converting Dates to Timezone

```typescript
import { convertToSelectedTimezone } from '../utils/timezone';

const dateString = '20240115T143000'; // 2024-01-15 14:30:00 UTC
const result = convertToSelectedTimezone(dateString, 'Asia/Kolkata');

console.log(result?.displayValues);
// {
//   year: 2024,
//   month: 1,
//   day: 15,
//   hour: 20, // 14:30 UTC + 5:30 IST = 20:00
//   minute: 0,
//   second: 0,
//   timezone: 'Asia/Kolkata'
// }
```

#### Getting Current Time in Timezone

```typescript
import { getCurrentTimeInTimezone } from '../utils/timezone';

const istTime = getCurrentTimeInTimezone('Asia/Kolkata');
const nyTime = getCurrentTimeInTimezone('America/New_York');
```

## Migration Path for Existing Data

The implementation includes **backward compatibility**:

- Legacy timezone codes ('ist', 'utc', 'est', 'pst') are automatically converted to IANA format
- Users upgrading from old version will have their settings preserved
- The `normalizeTimezone()` function handles the mapping internally

## Testing

Comprehensive test suite available in `src/utils/timezone.test.ts`:

- Timezone array generation and sorting
- Timezone validation
- Date conversion accuracy
- Display formatting
- System timezone detection
- Edge cases and error handling

Run tests with:

```bash
yarn test
```

## Performance Considerations

1. **FlatList Optimization**: TimeZoneModal uses FlatList with:

   - `maxToRenderPerBatch={10}` - Renders 10 items at a time
   - `updateCellsBatchingPeriod={50}` - Updates every 50ms
   - Prevents UI lag with large timezone list

2. **Memoization**: Uses `useMemo` for:

   - Timezone array generation
   - Search filtering
   - Prevents unnecessary recalculations

3. **Lazy Loading**: Timezone data loaded only when modal opens

## Integration with Event Display

When displaying events in calendar views (Week, Month screens):

```typescript
import { convertToSelectedTimezone } from '../utils/timezone';
import { useSettingsStore } from '../stores/useSetting';

const { selectedTimeZone } = useSettingsStore();

// Convert event time to user's selected timezone
const eventStart = convertToSelectedTimezone(event.fromTime, selectedTimeZone);
const eventEnd = convertToSelectedTimezone(event.toTime, selectedTimeZone);

// Display the converted times
console.log(
  `Event: ${eventStart?.displayValues.hour}:${eventStart?.displayValues.minute}`,
);
```

## Future Enhancements

Potential improvements for future versions:

1. **Daylight Saving Time** - Add DST detection and handling
2. **Auto-detection** - Implement geolocation-based timezone suggestions
3. **Quick Access** - Add common timezone shortcuts for faster selection
4. **Time Zone Abbreviations** - Display UTC offset (e.g., UTC+05:30)
5. **Timezone Notifications** - Alert users when timezone changes affect upcoming events

## Troubleshooting

### Timezone not updating in UI

- Clear app cache and restart
- Check AsyncStorage persistence in device console
- Verify timezone ID is valid using `isValidTimezone()`

### Events showing wrong time

- Confirm device timezone setting is correct
- Check selected timezone in Settings
- Verify date string format is `YYYYMMDDTHHmmss`

### Search not working

- Ensure search query isn't empty
- Verify TextInput is properly focused
- Check timezone array has valid data

## Files Modified

1. ✅ `src/constants/timezones.ts` - New
2. ✅ `src/stores/useSetting.ts` - Updated
3. ✅ `src/utils/timezone.ts` - Enhanced
4. ✅ `src/screens/SettingsScreen.tsx` - Updated with new UI
5. ✅ `src/utils/timezone.test.ts` - New test suite

## Related Files That May Need Updates

- `src/screens/WeekScreen.tsx` - Already using `convertToSelectedTimezone()`
- `src/screens/MonthlyCalendar.tsx` - May need timezone conversion
- `src/components/EventCard.tsx` - May display times that need timezone conversion
- Other screens displaying event times should use the timezone conversion utilities
