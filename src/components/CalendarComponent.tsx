import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSettingsStore } from '../stores/useSetting';
import { Fonts } from '../constants/Fonts';
import { moderateScale } from '../utils/dimensions';

interface CalendarComponentProps {
  onDateSelect?: (date: Date) => void;
  currentDate?: Date;
  selectedDate?: Date | null;
  isVisible?: boolean; // Add this to know when calendar becomes visible
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({
  onDateSelect,
  currentDate: propCurrentDate,
  selectedDate: propSelectedDate,
  isVisible,
}) => {
  // ✅ Get start of week setting from store
  const { selectedDay } = useSettingsStore();

  // ✅ Helper function to convert day name to numeric value (0=Sunday, 1=Monday, etc.)
  const getDayNumber = (dayName: string): number => {
    const dayMap: { [key: string]: number } = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    return dayMap[dayName] || 0;
  };

  // ✅ Get the numeric value for the start of week
  const startOfWeekNumber = getDayNumber(selectedDay);

  // Initialize with propCurrentDate if available, otherwise use today
  // This ensures the calendar always starts with the correct date when it mounts
  const [currentDate, setCurrentDate] = useState(() => {
    if (propCurrentDate) {
      // Normalize to noon to avoid timezone issues
      const normalized = new Date(
        propCurrentDate.getFullYear(),
        propCurrentDate.getMonth(),
        propCurrentDate.getDate(),
        12,
        0,
        0,
        0,
      );
      console.log('CalendarComponent: Initializing with propCurrentDate:', {
        date: `${
          normalized.getMonth() + 1
        }/${normalized.getDate()}/${normalized.getFullYear()}`,
      });
      return normalized;
    }
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    console.log('CalendarComponent: Initializing with today (no prop):', {
      date: `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`,
    });
    return today;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const date = propSelectedDate || new Date();
    // Normalize to noon to avoid timezone issues
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12,
      0,
      0,
      0,
    );
  });

  // Update local state when props change
  // Use a more reliable dependency that checks year, month, and date
  // This runs on mount and whenever the date prop changes
  useEffect(() => {
    if (propCurrentDate) {
      const normalizedDate = new Date(
        propCurrentDate.getFullYear(),
        propCurrentDate.getMonth(),
        propCurrentDate.getDate(),
        12,
        0,
        0,
        0,
      );
      // Always update to ensure sync with parent component
      // This is especially important when the calendar is opened after a date change
      setCurrentDate(prevDate => {
        const shouldUpdate =
          !prevDate ||
          prevDate.getFullYear() !== normalizedDate.getFullYear() ||
          prevDate.getMonth() !== normalizedDate.getMonth() ||
          prevDate.getDate() !== normalizedDate.getDate();

        if (shouldUpdate) {
          console.log('CalendarComponent: Updating currentDate from prop:', {
            old: prevDate
              ? `${
                  prevDate.getMonth() + 1
                }/${prevDate.getDate()}/${prevDate.getFullYear()}`
              : 'none',
            new: `${
              normalizedDate.getMonth() + 1
            }/${normalizedDate.getDate()}/${normalizedDate.getFullYear()}`,
          });
          return normalizedDate;
        }
        return prevDate;
      });
    } else {
      // If propCurrentDate is not provided, use today's date
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      setCurrentDate(today);
    }
  }, [
    propCurrentDate?.getFullYear(),
    propCurrentDate?.getMonth(),
    propCurrentDate?.getDate(),
  ]);

  // Force sync when calendar becomes visible
  // This ensures the calendar always shows the correct date when opened
  useEffect(() => {
    if (isVisible && propCurrentDate) {
      const normalizedDate = new Date(
        propCurrentDate.getFullYear(),
        propCurrentDate.getMonth(),
        propCurrentDate.getDate(),
        12,
        0,
        0,
        0,
      );
      console.log('CalendarComponent: Force syncing when visible - DETAILED:', {
        'Prop Year': propCurrentDate.getFullYear(),
        'Prop Month': propCurrentDate.getMonth(),
        'Prop Day': propCurrentDate.getDate(),
        'Normalized Year': normalizedDate.getFullYear(),
        'Normalized Month': normalizedDate.getMonth(),
        'Normalized Day': normalizedDate.getDate(),
        'Normalized Formatted': `${
          normalizedDate.getMonth() + 1
        }/${normalizedDate.getDate()}/${normalizedDate.getFullYear()}`,
        'Date Match Check':
          normalizedDate.getFullYear() === propCurrentDate.getFullYear() &&
          normalizedDate.getMonth() === propCurrentDate.getMonth()
            ? '✅ MATCH'
            : '❌ MISMATCH',
      });

      // Double-check: if there's a mismatch, log a warning
      if (
        normalizedDate.getFullYear() !== propCurrentDate.getFullYear() ||
        normalizedDate.getMonth() !== propCurrentDate.getMonth()
      ) {
        console.error('❌ CalendarComponent: Date normalization mismatch!', {
          expected: `${propCurrentDate.getFullYear()}-${propCurrentDate.getMonth()}`,
          actual: `${normalizedDate.getFullYear()}-${normalizedDate.getMonth()}`,
        });
      }

      setCurrentDate(normalizedDate);
    }
  }, [
    isVisible,
    propCurrentDate?.getFullYear(),
    propCurrentDate?.getMonth(),
    propCurrentDate?.getDate(),
  ]);

  useEffect(() => {
    if (propSelectedDate) {
      const normalizedDate = new Date(
        propSelectedDate.getFullYear(),
        propSelectedDate.getMonth(),
        propSelectedDate.getDate(),
        12,
        0,
        0,
        0,
      );
      setSelectedDate(prevDate => {
        if (
          !prevDate ||
          prevDate.getFullYear() !== normalizedDate.getFullYear() ||
          prevDate.getMonth() !== normalizedDate.getMonth() ||
          prevDate.getDate() !== normalizedDate.getDate()
        ) {
          return normalizedDate;
        }
        return prevDate;
      });
    }
  }, [
    propSelectedDate?.getFullYear(),
    propSelectedDate?.getMonth(),
    propSelectedDate?.getDate(),
  ]);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // ✅ Reorder weekDays array based on start of week setting
  const baseWeekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const weekDays = useMemo(() => {
    return [
      ...baseWeekDays.slice(startOfWeekNumber),
      ...baseWeekDays.slice(0, startOfWeekNumber),
    ];
  }, [startOfWeekNumber, selectedDay]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Create first day of month with fixed time
    const firstDay = new Date(year, month, 1, 12, 0, 0, 0);
    const lastDay = new Date(year, month + 1, 0, 12, 0, 0, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    console.log(
      `CalendarComponent - Building calendar for ${monthNames[month]} ${year}`,
    );
    console.log(
      `CalendarComponent - First day of month: ${firstDay.toLocaleDateString(
        'en-US',
        { weekday: 'long' },
      )} (day ${startingDayOfWeek})`,
    );
    console.log(`CalendarComponent - Days in month: ${daysInMonth}`);
    console.log(
      `CalendarComponent - Start of week setting: ${selectedDay} (numeric: ${startOfWeekNumber})`,
    );

    const days = [];

    // Add previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0, 12, 0, 0, 0);
    const prevMonthDays = prevMonth.getDate();

    // ✅ Calculate offset based on start of week setting
    // Adjust startingDayOfWeek relative to the custom start of week
    let adjustedStartingDay = (startingDayOfWeek - startOfWeekNumber + 7) % 7;

    // Fill in the days from the previous month that appear in the first week
    // adjustedStartingDay tells us how many previous month days we need
    for (let i = adjustedStartingDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isSelected: false,
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      // Create date with fixed time to avoid timezone issues
      const dayDate = new Date(year, month, day, 12, 0, 0, 0);
      const today = new Date();
      // Normalize today's date to avoid timezone issues
      const todayNormalized = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        12,
        0,
        0,
        0,
      );

      // Check if this is today's date (only in current month)
      const isToday =
        dayDate.getDate() === todayNormalized.getDate() &&
        dayDate.getMonth() === todayNormalized.getMonth() &&
        dayDate.getFullYear() === todayNormalized.getFullYear();

      // Check if this is the selected date (only if selectedDate is provided)
      const isSelected =
        selectedDate &&
        dayDate.getDate() === selectedDate.getDate() &&
        dayDate.getMonth() === selectedDate.getMonth() &&
        dayDate.getFullYear() === selectedDate.getFullYear();

      // Debug specific dates
      if (day === 22 && month === 8 && year === 2025) {
        console.log(
          `CalendarComponent - September 22, 2025: day of week = ${dayDate.getDay()}, should be 1 (Monday)`,
        );
      }

      days.push({
        day,
        isCurrentMonth: true,
        isSelected: isSelected || isToday, // Highlight if selected OR if it's today
        isToday: isToday,
      });
    }

    // Add next month's leading days to fill the grid (6 weeks * 7 days = 42 total)
    const totalGridSize = 42; // 6 weeks * 7 days
    const remainingDays = totalGridSize - days.length;
    console.log(
      `CalendarComponent - Days so far: ${days.length}, Need ${remainingDays} more days to reach ${totalGridSize}`,
    );

    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isSelected: false,
      });
    }

    console.log(`CalendarComponent - Total days in grid: ${days.length}`);
    console.log(
      `CalendarComponent - First few days:`,
      days
        .slice(0, 10)
        .map(d => `${d.day}(${d.isCurrentMonth ? 'current' : 'other'})`)
        .join(', '),
    );

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    // Normalize to noon to avoid timezone issues
    newDate.setHours(12, 0, 0, 0);
    console.log(
      'CalendarComponent - Navigated to:',
      newDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    );
    console.log('CalendarComponent - Notifying parent of month navigation:', {
      year: newDate.getFullYear(),
      month: newDate.getMonth(),
      formatted: `${
        newDate.getMonth() + 1
      }/${newDate.getDate()}/${newDate.getFullYear()}`,
    });
    setCurrentDate(newDate);
    // IMPORTANT: Notify parent component so it can update selectedDate and currentMonth
    // This ensures the header month display stays synchronized with the calendar
    onDateSelect?.(newDate);
  };

  const handleDatePress = (day: number) => {
    // Create date with fixed time to avoid timezone issues
    const selectedDateObj = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
      12,
      0,
      0,
      0,
    );
    console.log('CalendarComponent - Date selected:', selectedDateObj);
    console.log('CalendarComponent - Day of week:', selectedDateObj.getDay());
    setSelectedDate(selectedDateObj);
    onDateSelect?.(selectedDateObj);
  };

  // ✅ Recalculate calendar days when selectedDay changes
  const days = useMemo(() => {
    return getDaysInMonth(currentDate);
  }, [currentDate, selectedDay, startOfWeekNumber]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <Icon name="arrow-back" size={16} color="#6c757d" />
        </TouchableOpacity>

        <Text style={styles.monthYear}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <Icon name="arrow-forward" size={16} color="#6c757d" />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {weekDays.map((day, index) => (
          <Text key={index} style={styles.weekdayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {days.map((dayData, index) => (
          <TouchableOpacity
            key={index}
            style={styles.dayCell}
            onPress={() =>
              dayData.isCurrentMonth && handleDatePress(dayData.day)
            }
          >
            {dayData.isSelected &&
            !dayData.isToday &&
            dayData.isCurrentMonth ? (
              // Selected date (not today) - blue background with white text
              <View style={styles.selectedDay}>
                <Text style={styles.selectedDayText}>{dayData.day}</Text>
              </View>
            ) : dayData.isToday && dayData.isCurrentMonth ? (
              // Today - just blue text, no background
              <Text style={styles.todayDayText}>{dayData.day}</Text>
            ) : (
              // Regular day
              <Text
                style={[
                  styles.dayText,
                  !dayData.isCurrentMonth && styles.inactiveDayText,
                ]}
              >
                {dayData.day}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default CalendarComponent;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 0,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    width: 32,
    height: 32,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYear: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.latoBold,
    color: '#252B37',
    fontWeight: '700',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekdayText: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.latoMedium,
    color: '#717680',
    width: '13%',
    textAlign: 'center',
    minWidth: 40,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  dayCell: {
    width: '13%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    minWidth: 40,
  },
  dayText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.latoRegular,
    color: '#202020',
    fontWeight: '400',
  },
  inactiveDayText: {
    color: '#D0D5DD',
  },
  selectedDay: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#00AEEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.latoRegular,
    color: '#ffffff',
    fontWeight: '400',
  },
  todayDay: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayDayText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.latoRegular,
    color: '#00AEEF',
    fontWeight: '400',
  },
});
