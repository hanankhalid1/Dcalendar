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
// Dummy placeholder for your convertToSelectedTimezone function
// It should take a Date and return a Date in the selected timezone
const normalizeTimezone = (tz: string) => {
  if (!tz) return 'UTC';
  const lowerTz = tz.toLowerCase();

  switch (lowerTz) {
    case 'ist':
      return 'Asia/Kolkata';       // Indian Standard Time
    case 'utc':
      return 'Etc/UTC';            // UTC
    case 'est':
      return 'America/New_York';   // Eastern Standard Time
    case 'pst':
      return 'America/Los_Angeles';// Pacific Standard Time
    default:
      return tz;                   // return as-is if no mapping found
  }
};


export const convertToSelectedTimezone = (
  dateStr: string,
  selectedTimeZone: string
): { date: Date; displayValues: { year: number; month: number; day: number; hour: number; minute: number; second: number } } | null => {
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
    console.log('Extracted date parts (IST):', dateParts);

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
      }
    };
  } catch (error) {
    console.error('Error during timezone conversion:', error);
    return null;
  }
};