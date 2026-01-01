import moment from 'moment-timezone';

interface TimeSlot {
  start: string;
  end: string;
  noData?: string;
}

interface ScheduleDay {
  date: Date | string;
  time: TimeSlot[];
}

// Generate a light color with good contrast
export const generateLightColorWithContrast = (): string => {
  const colors = [
    '#FFE5E5', // Light red
    '#E5F3FF', // Light blue
    '#E5FFE5', // Light green
    '#FFF5E5', // Light orange
    '#F0E5FF', // Light purple
    '#FFE5F5', // Light pink
    '#E5FFFF', // Light cyan
    '#FFF0E5', // Light peach
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Convert time slots to UTC based on timezone
export const convertToUTC = (
  schedules: {
    repeat_week?: Record<string, TimeSlot[]>;
    manual_schedule?: ScheduleDay[];
    availability_schedule_day?: ScheduleDay[];
  },
  timezone: string
): any[] => {
  const utcSchedules: any[] = [];

  // Handle repeat_week schedule
  if (schedules.repeat_week) {
    Object.keys(schedules.repeat_week).forEach((day) => {
      const daySlots = schedules.repeat_week![day];
      daySlots.forEach((slot: TimeSlot) => {
        if (!slot.noData) {
          // Convert day name to day number (0 = Sunday, 6 = Saturday)
          const dayMap: Record<string, number> = {
            Sun: 0,
            Mon: 1,
            Tue: 2,
            Wed: 3,
            Thu: 4,
            Fri: 5,
            Sat: 6,
          };

          const dayNumber = dayMap[day];
          const startTime = moment.tz(slot.start, 'h:mm A', timezone);
          const endTime = moment.tz(slot.end, 'h:mm A', timezone);

          utcSchedules.push({
            day: dayNumber,
            start: startTime.utc().format('HH:mm:ss'),
            end: endTime.utc().format('HH:mm:ss'),
            type: 'repeat_week',
          });
        }
      });
    });
  }

  // Handle manual_schedule
  if (schedules.manual_schedule) {
    schedules.manual_schedule.forEach((scheduleDay: ScheduleDay) => {
      const date = moment(scheduleDay.date).tz(timezone);
      scheduleDay.time.forEach((slot: TimeSlot) => {
        if (!slot.noData) {
          const startTime = moment.tz(
            `${date.format('YYYY-MM-DD')} ${slot.start}`,
            'YYYY-MM-DD h:mm A',
            timezone
          );
          const endTime = moment.tz(
            `${date.format('YYYY-MM-DD')} ${slot.end}`,
            'YYYY-MM-DD h:mm A',
            timezone
          );

          utcSchedules.push({
            date: startTime.utc().format('YYYY-MM-DD'),
            start: startTime.utc().format('HH:mm:ss'),
            end: endTime.utc().format('HH:mm:ss'),
            type: 'manual_schedule',
          });
        }
      });
    });
  }

  // Handle availability_schedule_day
  if (schedules.availability_schedule_day) {
    schedules.availability_schedule_day.forEach((scheduleDay: ScheduleDay) => {
      const date = moment(scheduleDay.date).tz(timezone);
      scheduleDay.time.forEach((slot: TimeSlot) => {
        if (!slot.noData) {
          const startTime = moment.tz(
            `${date.format('YYYY-MM-DD')} ${slot.start}`,
            'YYYY-MM-DD h:mm A',
            timezone
          );
          const endTime = moment.tz(
            `${date.format('YYYY-MM-DD')} ${slot.end}`,
            'YYYY-MM-DD h:mm A',
            timezone
          );

          utcSchedules.push({
            date: startTime.utc().format('YYYY-MM-DD'),
            start: startTime.utc().format('HH:mm:ss'),
            end: endTime.utc().format('HH:mm:ss'),
            type: 'availability_schedule_day',
          });
        }
      });
    });
  }

  return utcSchedules;
};

// Handle repeat week schedule conversion
export const handleRepeatWeek = (
  scheduleRepeatWeek: Record<string, TimeSlot[]>
): any[] => {
  const schedules: any[] = [];
  Object.keys(scheduleRepeatWeek).forEach((day) => {
    const daySlots = scheduleRepeatWeek[day];
    daySlots.forEach((slot: TimeSlot) => {
      if (!slot.noData) {
        const dayMap: Record<string, number> = {
          Sun: 0,
          Mon: 1,
          Tue: 2,
          Wed: 3,
          Thu: 4,
          Fri: 5,
          Sat: 6,
        };
        schedules.push({
          day: dayMap[day],
          start: slot.start,
          end: slot.end,
        });
      }
    });
  });
  return schedules;
};

// Handle not repeat (manual schedule) conversion
export const handleNotRepeat = (manualScheduleDay: ScheduleDay[]): any[] => {
  return manualScheduleDay.map((scheduleDay: ScheduleDay) => {
    const date = moment(scheduleDay.date).format('YYYY-MM-DD');
    return {
      date,
      time: scheduleDay.time.map((slot: TimeSlot) => ({
        start: slot.start,
        end: slot.end,
      })),
    };
  });
};

// Handle custom recurrence (placeholder - needs full implementation)
export const handleCustom = (
  customTimeSlotValue: any,
  scheduleRepeatWeek: Record<string, TimeSlot[]>
): any[] => {
  // For now, treat custom similar to repeat_week
  // Full implementation would need to handle custom recurrence patterns
  return handleRepeatWeek(scheduleRepeatWeek);
};

// Handle availability schedule day
export const handleAvailabilityScheduleDay = (
  availabilityScheduleDay: ScheduleDay[],
  updatedSchedules: any[]
): any[] => {
  const availabilitySchedules = availabilityScheduleDay.map((scheduleDay: ScheduleDay) => {
    const date = moment(scheduleDay.date).format('YYYY-MM-DD');
    return {
      date,
      time: scheduleDay.time.map((slot: TimeSlot) => ({
        start: slot.start,
        end: slot.end,
      })),
    };
  });

  // Merge with existing schedules
  return [...updatedSchedules, ...availabilitySchedules];
};

// Update schedule array
export const updateSchedule = (prev: any[], updated: any[]): any[] => {
  // Merge and deduplicate schedules
  const combined = [...prev, ...updated];
  const uniqueSchedules = combined.filter((schedule, index, self) => {
    return index === self.findIndex((s) => {
      if (schedule.day !== undefined && s.day !== undefined) {
        return s.day === schedule.day && s.start === schedule.start && s.end === schedule.end;
      }
      if (schedule.date && s.date) {
        return s.date === schedule.date && s.start === schedule.start && s.end === schedule.end;
      }
      return false;
    });
  });
  return uniqueSchedules;
};

