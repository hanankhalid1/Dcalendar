// Returns true if the timezoneId is a valid IANA timezone
export const isValidTimezone = (timezoneId: string): boolean => {
  return !!timezoneId && moment.tz.names().includes(timezoneId);
};
/**
 * Comprehensive Timezone Configuration
 * Maps timezone identifiers to their display names and IANA timezone identifiers
 */



import moment from 'moment-timezone';


// Cache the timezone array at module level for performance
let _timezoneArray: Array<{ id: string; label: string; timezone: string }> | null = null;

// Only show the timezone name in the list for speed
export const getTimezoneArray = () => {
  if (_timezoneArray) return _timezoneArray;
  _timezoneArray = moment.tz.names().map((tz) => ({
    id: tz,
    label: tz, // Only show the name, not the offset
    timezone: tz,
  }));
  return _timezoneArray;
};

// Returns a user-friendly label for a timezone ID (with offset)
export const getTimezoneLabel = (timezoneId: string): string => {
  if (!timezoneId) return '';
  try {
    const offset = moment.tz(timezoneId).format('Z');
    return `${timezoneId} (GMT${offset})`;
  } catch {
    return timezoneId;
  }
};
