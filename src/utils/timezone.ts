import { isValidTimezone } from '../constants/timezones';

export const parseCustomDateString = (dateStr: string): Date | null => {
  if (!dateStr) return null;

  const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second ?? '00'),
  };
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
    ist: 'Asia/Kolkata', // Indian Standard Time
    utc: 'GMT', // UTC
    gmt: 'GMT', // GMT
    est: 'America/New_York', // Eastern Standard Time
    pst: 'America/Los_Angeles', // Pacific Standard Time
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
// Fix: Accept eventTimeZone (the timezone in which the event was created)
export const convertToSelectedTimezone = (
  dateStr: string,
  displayTimeZone: string,
  eventTimeZone?: string,
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
  };
} | null => {
  console.log(
    `Converting dateStr: "${dateStr}" to timezone: "${displayTimeZone}"`,
  );

  if (!dateStr) {
    console.warn('No dateStr provided');
    return null;
  }

  const parts = parseCustomDateString(dateStr);
  if (
    !parts ||
    isNaN(parts.year) ||
    isNaN(parts.month) ||
    isNaN(parts.day) ||
    isNaN(parts.hour) ||
    isNaN(parts.minute) ||
    isNaN(parts.second)
  ) {
    console.warn('Invalid parsed date:', parts);
    return null;
  }
  // Always treat the date string as local to the event's timezone
  let eventTz = eventTimeZone || displayTimeZone;
  // Validate eventTz before using
  if (!isValidTimezone(eventTz)) {
    console.warn(`Invalid event timezone: ${eventTz}, falling back to 'UTC'`);
    eventTz = 'UTC';
  }
  const { year, month, day, hour, minute, second } = parts;
  // Get the offset for the event's timezone at that local time
  // 1. Create a Date as if the local time is in UTC
  const fakeUtcDate = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second),
  );
  // 2. Find the offset between UTC and the event's timezone at that time
  const getOffsetMinutes = (date, tz) => {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const partsArr = dtf.formatToParts(date);
    const get = type => Number(partsArr.find(p => p.type === type)?.value);
    const tzYear = get('year');
    const tzMonth = get('month');
    const tzDay = get('day');
    const tzHour = get('hour');
    const tzMinute = get('minute');
    const tzSecond = get('second');
    // The difference between UTC and the formatted time is the offset
    const utc = {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      second: date.getUTCSeconds(),
    };
    const local = {
      year: tzYear,
      month: tzMonth,
      day: tzDay,
      hour: tzHour,
      minute: tzMinute,
      second: tzSecond,
    };
    const utcMinutes =
      Date.UTC(
        utc.year,
        utc.month - 1,
        utc.day,
        utc.hour,
        utc.minute,
        utc.second,
      ) / 60000;
    const localMinutes =
      Date.UTC(
        local.year,
        local.month - 1,
        local.day,
        local.hour,
        local.minute,
        local.second,
      ) / 60000;
    return localMinutes - utcMinutes;
  };
  const offsetMinutes = getOffsetMinutes(fakeUtcDate, eventTz);
  // 3. Subtract the offset to get the real UTC time
  const utcDate = new Date(fakeUtcDate.getTime() - offsetMinutes * 60000);
  // 4. Format/display in the displayTimeZone
  try {
    let validTimeZone = normalizeTimezone(displayTimeZone);
    // Validate timezone before using
    if (!isValidTimezone(validTimeZone)) {
      console.error(
        `Invalid display timezone: ${validTimeZone}, falling back to UTC`,
      );
      validTimeZone = 'UTC';
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
    const partsArr = dtf.formatToParts(utcDate);
    const get = type => Number(partsArr.find(p => p.type === type)?.value);
    const displayValues = {
      year: get('year'),
      month: get('month'),
      day: get('day'),
      hour: get('hour'),
      minute: get('minute'),
      second: get('second'),
      timezone: validTimeZone,
    };
    return {
      date: utcDate,
      displayValues,
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
  displayTimeZone: string,
  eventTimeZone?: string,
): Date | null => {
  const converted = convertToSelectedTimezone(
    dateStr,
    displayTimeZone,
    eventTimeZone,
  );
  const displayValues = converted?.displayValues;
  if (!displayValues) return null;
  return new Date(
    displayValues.year,
    displayValues.month - 1,
    displayValues.day,
    displayValues.hour,
    displayValues.minute,
    displayValues.second,
  );
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
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
    2,
    '0',
  )} ${String(hour).padStart(2, '0')}:${String(minute).padStart(
    2,
    '0',
  )}:${String(second).padStart(2, '0')}`;
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
      dateParts.second,
    );
  } catch (error) {
    console.error('Error getting current time in timezone:', error);
    return now;
  }
};
