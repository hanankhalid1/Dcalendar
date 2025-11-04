export const parseCustomDateString = (dateStr: string): Date | null => {
  // Example input: "20250925T093000"
  // Parse into YYYY, MM, DD, HH, mm, ss parts
  if (!dateStr) return null;

  const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    Number(year),
    Number(month) - 1, // JS months are 0-indexed
    Number(day),
    Number(hour),
    Number(minute),
    Number(second) || 0
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


export const convertToSelectedTimezone = (dateStr: string, selectedTimeZone: string): Date | null => {
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
  console.log('Parsed date:', date);

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
    console.log('Extracted date parts:', dateParts);

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

    const convertedDate = new Date(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day,
      dateParts.hour,
      dateParts.minute,
      dateParts.second
    );

    console.log('Constructed converted Date:', convertedDate);
    return convertedDate;
  } catch (error) {
    console.error('Error during timezone conversion:', error);
    return null;
  }
};
