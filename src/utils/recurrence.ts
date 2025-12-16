import { convertToSelectedTimezone } from './timezone';

// Maps replicated from MonthlyCalenderScreen for consistent parsing
const DAY_MAP: { [key: string]: number } = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const MONTH_MAP: { [key: string]: number } = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const WEEK_TEXT_MAP: { [key: string]: number } = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  last: -1,
};

const pad2 = (n: number) => String(n).padStart(2, '0');

export const formatYMD = (date: Date) => {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

export const formatYMDTHMS = (date: Date) => {
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}T${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
};

const getNthWeekdayOfMonth = (
  year: number,
  monthIndex: number,
  dayOfWeek: number,
  occurrence: number,
): Date | null => {
  const isLast = occurrence === -1;
  let dayCount = 0;
  const date = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
  for (let d = 1; d <= lastDayOfMonth; d++) {
    date.setDate(d);
    if (date.getDay() === dayOfWeek) {
      dayCount++;
      if (!isLast && dayCount === occurrence) return new Date(date);
    }
  }
  if (isLast && dayCount > 0) {
    let lastDate = new Date(year, monthIndex, 1);
    let finalDayCount = 0;
    for (let d = 1; d <= lastDayOfMonth; d++) {
      lastDate.setDate(d);
      if (lastDate.getDay() === dayOfWeek) {
        finalDayCount++;
        if (finalDayCount === dayCount) return new Date(lastDate);
      }
    }
  }
  return null;
};

// Core generator copied/adapted from MonthlyCalenderScreen
export const generateRecurringInstances = (
  event: any,
  viewStartDate: Date,
  viewEndDate: Date,
  selectedTimeZone: string,
): Array<{ date: Date; event: any; startDate: Date; endDate: Date }> => {
  const result: Array<{ date: Date; event: any; startDate: Date; endDate: Date }> = [];

  const startTimeData = convertToSelectedTimezone(event.fromTime, selectedTimeZone);
  const endTimeData = convertToSelectedTimezone(event.toTime, selectedTimeZone);
  if (!startTimeData || !endTimeData) return result;

  const startDate = startTimeData.date;
  const endDate = endTimeData.date;
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return result;

  const repeatType: string | undefined =
    event.repeatEvent ?? event.list?.find((i: any) => i.key === 'repeatEvent')?.value;
  if (!repeatType || repeatType === 'Does not repeat') {
    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    if (s >= viewStartDate && s <= viewEndDate) {
      result.push({ date: startDate, event, startDate, endDate });
    }
    return result;
  }

  const repeatTypeLower = repeatType.toLowerCase();
  const customMatch = repeatType.match(
    /^Every (\d+) (day|week|month|year)s?(?:\s+on\s+([^(]+))?(?:\s+\((?:(\d+) times|until ([^)]+))\))?$/i,
  );

  let customInterval = 1;
  let customUnit = '';
  let customDays: string[] = [];
  let customEndType = 'never';
  let customEndAfter = 0;
  let customEndDate: Date | null = null;

  if (customMatch) {
    customInterval = parseInt(customMatch[1]);
    customUnit = customMatch[2].toLowerCase();
    if (customMatch[3]) customDays = customMatch[3].split(',').map(d => d.trim().toLowerCase());
    if (customMatch[4]) {
      customEndType = 'after';
      customEndAfter = parseInt(customMatch[4]);
    } else if (customMatch[5]) {
      customEndType = 'on';
      customEndDate = new Date(customMatch[5].trim());
    }
  }

  let nextDate = new Date(startDate);
  nextDate.setHours(0, 0, 0, 0);
  if (nextDate < viewStartDate) {
    const daysDiff = Math.floor((viewStartDate.getTime() - nextDate.getTime()) / (24 * 60 * 60 * 1000));
    if (repeatTypeLower.includes('day') || customUnit === 'day') {
      const back = Math.floor(daysDiff / (customInterval || 1));
      nextDate.setDate(nextDate.getDate() + back * (customInterval || 1));
    } else if (repeatTypeLower.includes('week') || customUnit === 'week') {
      const back = Math.floor(daysDiff / (7 * (customInterval || 1)));
      nextDate.setDate(nextDate.getDate() + back * 7 * (customInterval || 1));
    } else {
      nextDate = new Date(viewStartDate);
      nextDate.setHours(0, 0, 0, 0);
    }
    if (nextDate < startDate) nextDate = new Date(startDate);
  }

  const isAnnualEvent = repeatTypeLower.includes('year');
  const limitFromNow = new Date();
  limitFromNow.setFullYear(limitFromNow.getFullYear() + (isAnnualEvent ? 10 : 1));
  let limitDate = new Date(Math.min(viewEndDate.getTime(), limitFromNow.getTime()));
  if (customEndDate && customEndDate < limitDate) limitDate = customEndDate;

  let occurrenceCount = 1;
  let iteration = 0;
  const maxIterations = isAnnualEvent ? 50 : 366 * 2;

  const addInstance = (d: Date) => {
    if (d >= viewStartDate && d <= viewEndDate) {
      result.push({ date: new Date(d), event, startDate, endDate });
    }
  };

  // include original if in range
  const startDayInstance = new Date(startDate);
  startDayInstance.setHours(0, 0, 0, 0);
  if (startDayInstance >= viewStartDate && startDayInstance <= viewEndDate) addInstance(startDayInstance);

  while (nextDate <= limitDate && iteration < maxIterations) {
    iteration++;
    if (customEndType === 'after' && occurrenceCount >= customEndAfter) break;

    let hasMoved = false;
    if (customMatch) {
      if (customUnit === 'day') {
        nextDate.setDate(nextDate.getDate() + customInterval);
        hasMoved = true;
      } else if (customUnit === 'week') {
        if (customDays.length > 0) {
          const targetDayNumbers = customDays.map(d => DAY_MAP[d]).filter(n => n !== undefined);
          if (targetDayNumbers.length === 0) {
            nextDate.setDate(nextDate.getDate() + 7 * customInterval);
            hasMoved = true;
          } else {
            let found = false;
            let checked = 0;
            const maxCheck = 7 * customInterval + 7;
            const startTime = new Date(startDate);
            startTime.setHours(0, 0, 0, 0);
            while (!found && checked < maxCheck) {
              nextDate.setDate(nextDate.getDate() + 1);
              checked++;
              const day = nextDate.getDay();
              if (targetDayNumbers.includes(day)) {
                const daysDiff = Math.floor((nextDate.getTime() - startTime.getTime()) / (24 * 60 * 60 * 1000));
                const weekNumber = Math.floor(daysDiff / 7);
                if (weekNumber % customInterval === 0) found = true;
              }
            }
            hasMoved = found;
          }
        } else {
          nextDate.setDate(nextDate.getDate() + 7 * customInterval);
          hasMoved = true;
        }
      } else if (customUnit === 'month') {
        const currentDay = nextDate.getDate();
        nextDate.setMonth(nextDate.getMonth() + customInterval);
        if (nextDate.getDate() < currentDay) nextDate.setDate(0);
        hasMoved = true;
      } else if (customUnit === 'year') {
        nextDate.setFullYear(nextDate.getFullYear() + customInterval);
        hasMoved = true;
      }
    } else if (repeatTypeLower === 'daily' || repeatTypeLower === 'every day') {
      nextDate.setDate(nextDate.getDate() + 1);
      hasMoved = true;
    } else if (
      repeatTypeLower.startsWith('weekly on') ||
      repeatTypeLower === 'weekly' ||
      repeatTypeLower === 'every week'
    ) {
      nextDate.setDate(nextDate.getDate() + 7);
      hasMoved = true;
    } else if (
      repeatTypeLower === 'bi-weekly' ||
      repeatTypeLower === 'every 2 weeks'
    ) {
      nextDate.setDate(nextDate.getDate() + 14);
      hasMoved = true;
    } else if (repeatTypeLower === 'monthly' || repeatTypeLower === 'every month') {
      const currentDay = nextDate.getDate();
      nextDate.setMonth(nextDate.getMonth() + 1);
      if (nextDate.getDate() < currentDay) nextDate.setDate(0);
      hasMoved = true;
    } else if (repeatTypeLower === 'yearly' || repeatTypeLower === 'every year') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      hasMoved = true;
    } else if (repeatTypeLower.includes('weekday') || repeatTypeLower.includes('monday to friday')) {
      do {
        nextDate.setDate(nextDate.getDate() + 1);
      } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
      hasMoved = true;
    }

    const annualMatch = repeatType.match(/^Annually on (\w+) (\d+)$/i);
    if (annualMatch) {
      const monthName = annualMatch[1].toLowerCase();
      const dayNumber = parseInt(annualMatch[2]);
      let nextYear = nextDate.getFullYear();
      let nextMonth = MONTH_MAP[monthName];
      let nextDay = dayNumber;
      if (nextDate.getMonth() > nextMonth || (nextDate.getMonth() === nextMonth && nextDate.getDate() >= nextDay)) {
        nextYear++;
      }
      nextDate.setFullYear(nextYear);
      nextDate.setMonth(nextMonth);
      nextDate.setDate(nextDay);
      hasMoved = true;
    }

    const monthlyWeekdayMatch = repeatType.match(/^Monthly on the (\w+) (\w+)$/i);
    if (monthlyWeekdayMatch) {
      const occurrenceText = monthlyWeekdayMatch[1].toLowerCase();
      const weekdayName = monthlyWeekdayMatch[2].toLowerCase();
      const occurrence = WEEK_TEXT_MAP[occurrenceText];
      const dayOfWeek = DAY_MAP[weekdayName];
      let nextMonthDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 1);
      let year = nextMonthDate.getFullYear();
      let month = nextMonthDate.getMonth();
      let newDate = getNthWeekdayOfMonth(year, month, dayOfWeek, occurrence);
      while (!newDate || newDate.getTime() <= nextDate.getTime()) {
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        year = nextMonthDate.getFullYear();
        month = nextMonthDate.getMonth();
        newDate = getNthWeekdayOfMonth(year, month, dayOfWeek, occurrence);
        if (nextMonthDate.getTime() > limitDate.getTime() + 31 * 24 * 60 * 60 * 1000 || iteration > maxIterations) {
          break;
        }
      }
      if (newDate) {
        nextDate = newDate;
        hasMoved = true;
      }
    }

    const monthlyLastMatch = repeatType.match(/^Monthly on the last (\w+)$/i);
    if (monthlyLastMatch && !monthlyWeekdayMatch) {
      const weekdayName = monthlyLastMatch[1].toLowerCase();
      const dayOfWeek = DAY_MAP[weekdayName];
      let nextMonthDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 1);
      let year = nextMonthDate.getFullYear();
      let month = nextMonthDate.getMonth();
      let newDate = getNthWeekdayOfMonth(year, month, dayOfWeek, -1);
      while (!newDate || newDate.getTime() <= nextDate.getTime()) {
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        year = nextMonthDate.getFullYear();
        month = nextMonthDate.getMonth();
        newDate = getNthWeekdayOfMonth(year, month, dayOfWeek, -1);
        if (nextMonthDate.getTime() > limitDate.getTime() + 31 * 24 * 60 * 60 * 1000 || iteration > maxIterations) {
          break;
        }
      }
      if (newDate) {
        nextDate = newDate;
        hasMoved = true;
      }
    }

    if (!hasMoved) break;
    if (nextDate <= limitDate) {
      addInstance(nextDate);
      occurrenceCount++;
    }
    if (result.length > 366) break;
  }

  return result;
};

// Expand into concrete instances with adjusted fromTime/toTime strings
export const expandEventsForRange = (
  events: any[],
  viewStartDate: Date,
  viewEndDate: Date,
  selectedTimeZone: string,
) => {
  const expanded: any[] = [];
  (events || []).forEach(ev => {
    const instances = generateRecurringInstances(ev, viewStartDate, viewEndDate, selectedTimeZone);
    instances.forEach(({ date: instanceDate, startDate, endDate }) => {
      // Use the original start/end time (hours/minutes/seconds) on the instance date
      const startHour = startDate.getHours();
      const startMinute = startDate.getMinutes();
      const startSecond = startDate.getSeconds();
      const endHour = endDate.getHours();
      const endMinute = endDate.getMinutes();
      const endSecond = endDate.getSeconds();

      const instanceStartDate = new Date(instanceDate);
      instanceStartDate.setHours(startHour, startMinute, startSecond, 0);

      const duration = endDate.getTime() - startDate.getTime();
      const instanceEndDate = new Date(instanceStartDate.getTime() + duration);

      expanded.push({
        ...ev,
        fromTime: formatYMDTHMS(instanceStartDate),
        toTime: formatYMDTHMS(instanceEndDate),
        instanceDate: formatYMD(instanceStartDate),
      });
    });
  });
  return expanded;
};
