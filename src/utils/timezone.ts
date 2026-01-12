import { isValidTimezone } from '../constants/timezones';

export const parseCustomDateString = (dateStr: string): Date | null => {
  if (!dateStr) return null;

  const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second ?? "00")
  );

};

/**
 * Validates and normalizes timezone IDs
 * Handles both IANA timezone names and legacy short codes
 */
const normalizeTimezone = (tz: string): string => {
  if (!tz) return 'UTC';
  
  // If it's already a valid IANA timezone, use it directly
  if (isValidTimezone(tz)) {
    return tz;
  }

  // Handle legacy timezone codes for backward compatibility
  const lowerTz = tz.toLowerCase();
  const legacyMapping: Record<string, string> = {
    'ist': 'Asia/Kolkata',           // Indian Standard Time
    'utc': 'GMT',                    // UTC
    'gmt': 'GMT',                    // GMT
    'est': 'America/New_York',       // Eastern Standard Time
    'pst': 'America/Los_Angeles',    // Pacific Standard Time
  };

  return legacyMapping[lowerTz] || tz;
};

/**
 * Converts a date string to the selected timezone
 * Returns both the original UTC date and display values in the target timezone
 * 
 * @param dateStr - Date string in format: YYYYMMDDTHHmmss
 * @param selectedTimeZone - IANA timezone name (e.g., 'Asia/Kolkata', 'America/New_York')
 * @returns Object with UTC date and display values, or null if conversion fails
 */
export const convertToSelectedTimezone = (
  dateStr: string,
  selectedTimeZone: string
): { 
  date: Date; 
  displayValues: { 
    year: number; 
    month: number; 
    day: number; 
    hour: number; 
    minute: number; 
    second: number;
    timezone: string;
  } 
} | null => {
  console.log(`Converting dateStr: "${dateStr}" to timezone: "${selectedTimeZone}"`);

  if (!dateStr) {
    console.warn('No dateStr provided');
    return null;
  }

  const date = parseCustomDateString(dateStr);
  if (!date || isNaN(date.getTime())) {
    console.warn('Invalid parsed date:', date);
    return null;
  }
  console.log('Parsed UTC date:', date, 'ISO:', date.toISOString());

  try {
    const validTimeZone = normalizeTimezone(selectedTimeZone);
    
    // Validate timezone before using
    try {
      new Intl.DateTimeFormat('en-US', {
        timeZone: validTimeZone,
      });
    } catch (e) {
      console.error(`Invalid timezone: ${validTimeZone}, falling back to UTC`);
      return convertToSelectedTimezone(dateStr, 'GMT');
    }

    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: validTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = dtf.formatToParts(date);
    console.log('Intl.DateTimeFormat parts:', parts);

    const dateParts: Record<string, number> = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        dateParts[part.type] = Number(part.value);
      }
    }
    console.log('Extracted date parts:', dateParts, 'for timezone:', validTimeZone);

    if (
      !dateParts.year ||
      !dateParts.month ||
      !dateParts.day ||
      dateParts.hour === undefined ||
      dateParts.minute === undefined ||
      dateParts.second === undefined
    ) {
      console.warn('Incomplete date parts after timezone conversion:', dateParts);
      return null;
    }

    // ✅ Return BOTH: original UTC date for sorting + display values for showing
    return {
      date: date, // Original UTC Date object (for comparisons/sorting)
      displayValues: {
        year: dateParts.year,
        month: dateParts.month,
        day: dateParts.day,
        hour: dateParts.hour,
        minute: dateParts.minute,
        second: dateParts.second,
        timezone: validTimeZone,
      }
    };
  } catch (error) {
    console.error('Error during timezone conversion:', error);
    return null;
  }
};

/**
 * Convert a date string to a Date object that reflects the selected timezone's wall-clock time.
 * This is useful for formatting and duration calculations that should respect the user's timezone selection.
 */
export const convertToTimezoneDate = (
  dateStr: string,
  selectedTimeZone: string,
): Date | null => {
  const converted = convertToSelectedTimezone(dateStr, selectedTimeZone);
  const displayValues = converted?.displayValues;

  if (!displayValues) return null;

  const { year, month, day, hour, minute, second } = displayValues;
  return new Date(year, month - 1, day, hour, minute, second);
};

/**
 * Formats display values to readable string
 * @param displayValues - Display values from convertToSelectedTimezone
 * @returns Formatted date-time string
 */
export const formatDisplayValues = (displayValues: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}): string => {
  const { year, month, day, hour, minute, second } = displayValues;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
};

/**
 * Get current time in specified timezone
 * @param timezone - IANA timezone name
 * @returns Current date and time in the timezone
 */
export const getCurrentTimeInTimezone = (timezone: string): Date => {
  const validTimeZone = normalizeTimezone(timezone);
  const now = new Date();
  
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: validTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = dtf.formatToParts(now);
    const dateParts: Record<string, number> = {};
    
    for (const part of parts) {
      if (part.type !== 'literal') {
        dateParts[part.type] = Number(part.value);
      }
    }

    return new Date(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day,
      dateParts.hour,
      dateParts.minute,
      dateParts.second
    );
  } catch (error) {
    console.error('Error getting current time in timezone:', error);
    return now;
  }
};