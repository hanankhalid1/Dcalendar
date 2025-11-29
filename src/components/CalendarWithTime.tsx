import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale, scaleWidth, scaleHeight } from '../utils/dimensions';
import { colors, fontSize, spacing, borderRadius } from '../utils/LightTheme';

interface CalendarWithTimeProps {
  isVisible: boolean;
  onClose: () => void;
  onDateTimeSelect: (date: Date, time: string) => void;
  mode: 'from' | 'to';
  selectedDate?: Date;
  selectedTime?: string;
}

const CalendarWithTime: React.FC<CalendarWithTimeProps> = ({
  isVisible,
  onClose,
  onDateTimeSelect,
  mode,
  selectedDate: propSelectedDate,
  selectedTime: propSelectedTime,
}) => {
  const [currentMonth, setCurrentMonth] = useState(propSelectedDate || new Date()); // Current month
  const [selectedDate, setSelectedDate] = useState(propSelectedDate || new Date()); // Current date
  const [selectedTime, setSelectedTime] = useState(propSelectedTime || '11:30 AM');

  // Update internal state when props change
  useEffect(() => {
    if (propSelectedDate) {
      setSelectedDate(propSelectedDate);
      setCurrentMonth(propSelectedDate); // Also update the current month to show the selected date's month
    }
    if (propSelectedTime) {
      // Normalize time to prevent AM/PM duplication
      // Remove any duplicate AM/PM patterns before setting
      let normalizedTime = propSelectedTime.trim();
      
      // Extract the time part (HH:MM) and the period (AM/PM)
      // Match pattern: HH:MM followed by optional spaces and AM/PM (possibly duplicated)
      const timeMatch = normalizedTime.match(/^(\d{1,2}:\d{2})\s*(AM|PM).*$/i);
      
      if (timeMatch) {
        // Extract clean time and the last AM/PM (in case of duplicates)
        const timePart = timeMatch[1];
        // Find the last AM or PM in the string (handles duplicates)
        const lastPeriodMatch = normalizedTime.match(/(AM|PM)\s*$/i);
        const period = lastPeriodMatch ? lastPeriodMatch[1].toUpperCase() : '';
        
        normalizedTime = period ? `${timePart} ${period}` : timePart;
      } else {
        // If format doesn't match expected pattern, try to clean it
        // Remove any trailing duplicate AM/PM patterns
        normalizedTime = normalizedTime.replace(/\s+(AM|PM)(\s+(AM|PM))+$/gi, (match) => {
          // Extract the last AM/PM
          const lastMatch = match.match(/(AM|PM)\s*$/i);
          return lastMatch ? ` ${lastMatch[1].toUpperCase()}` : '';
        });
        
        // Also handle cases where AM/PM might be concatenated without spaces
        normalizedTime = normalizedTime.replace(/(AM|PM)(AM|PM)+$/gi, (match) => {
          const lastMatch = match.match(/(AM|PM)$/i);
          return lastMatch ? lastMatch[1].toUpperCase() : '';
        });
      }
      
      setSelectedTime(normalizedTime);
    }
  }, [propSelectedDate, propSelectedTime]);

  // Generate time slots from 12:00 AM to 11:55 PM in 5-minute intervals (full 24-hour range)
  // This includes all valid time intervals: 12:00, 12:05, 12:10, 12:15, 12:20, 12:25, etc.
  const generateTimeSlots = () => {
    const slots = [];
    // Generate all 24 hours (0 to 23) with 5-minute intervals
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        const timeString = time.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const canNavigateToPreviousMonth = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthIndex = currentDate.getMonth();

    return (
      currentMonth.getFullYear() > currentYear ||
      (currentMonth.getFullYear() === currentYear &&
        currentMonth.getMonth() > currentMonthIndex)
    );
  };

  const isSelectedDate = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const handleDateSelect = (date: Date) => {
    // Only allow selection of current date and future dates
    if (!isPastDate(date)) {
      setSelectedDate(date);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  // Helper function to convert time string to minutes for comparison
  const timeToMinutes = (timeString: string): number => {
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;

    if (period === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period === 'AM' && hours === 12) {
      totalMinutes -= 12 * 60;
    }

    return totalMinutes;
  };

  // Helper function to add minutes to a time string
  const addMinutesToTime = (timeString: string, minutesToAdd: number): string => {
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;

    if (period === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period === 'AM' && hours === 12) {
      totalMinutes -= 12 * 60;
    }

    totalMinutes += minutesToAdd;

    // Convert back to time string
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;

    let displayHours = newHours;
    let newPeriod = 'AM';

    if (newHours === 0) {
      displayHours = 12;
    } else if (newHours === 12) {
      newPeriod = 'PM';
    } else if (newHours > 12) {
      displayHours = newHours - 12;
      newPeriod = 'PM';
    }

    return `${displayHours}:${newMinutes.toString().padStart(2, '0')} ${newPeriod}`;
  };

  const handleDone = () => {
    // Call the callback with selected date and time
    console.log('CalendarWithTime - handleDone:', {
      selectedDate: selectedDate.toISOString(),
      selectedTime: selectedTime,
      selectedTimeStringified: JSON.stringify(selectedTime)
    });
    onDateTimeSelect(selectedDate, selectedTime);
    // Close the modal
    onClose();
  };

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

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <StatusBar barStyle="dark-content" backgroundColor="rgba(0,0,0,0.5)" />

        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScrollView}
          contentContainerStyle={styles.scrollContentContainer}
        >
          <View style={styles.modalContainer}>
            {/* Calendar Section */}
            <View style={styles.calendarSection}>
              {/* Calendar Header */}
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    !canNavigateToPreviousMonth() && styles.disabledNavButton,
                  ]}
                  onPress={() => navigateMonth('prev')}
                  disabled={!canNavigateToPreviousMonth()}
                >
                  <Icon
                    name="arrow-back"
                    size={16}
                    color={canNavigateToPreviousMonth() ? '#6c757d' : '#CCCCCC'}
                  />
                </TouchableOpacity>

                <Text style={styles.monthYearText}>
                  {monthNames[currentMonth.getMonth()]}{' '}
                  {currentMonth.getFullYear()}
                </Text>

                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => navigateMonth('next')}
                >
                  <Icon name="arrow-forward" size={16} color="#6c757d" />
                </TouchableOpacity>
              </View>

              {/* Days of Week Header */}
              <View style={styles.daysHeader}>
                {dayNames.map(day => (
                  <Text key={day} style={styles.dayHeaderText}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {calendarDays.map((date, index) => {
                  const isPast = isPastDate(date);
                  const isSelectable = !isPast;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dateButton,
                        !isSelectable && styles.disabledDateButton,
                      ]}
                      onPress={() => handleDateSelect(date)}
                      disabled={!isSelectable}
                    >
                      {isSelectedDate(date) ? (
                        <LinearGradient
                          colors={['#18F06E', '#0B6DE0']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.selectedDateGradient}
                        >
                          <Text style={styles.selectedDateText}>
                            {date.getDate()}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <Text
                          style={[
                            styles.dateText,
                            !isCurrentMonth(date) && styles.inactiveDateText,
                            isPast && styles.pastDateText,
                          ]}
                        >
                          {date.getDate()}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Does not repeat button */}

              <Text style={styles.repeatButtonText}>Swipe left for time</Text>

            </View>

            {/* Time Selection Section */}
            <View style={styles.timeSection}>
              {/* Time Header */}
              <View style={styles.timeHeader}>
                <Text style={styles.timeHeaderText}>
                  Select {mode === 'from' ? 'Start' : 'End'} Time
                </Text>
              </View>

              {/* Time Slots */}
              <ScrollView
                style={styles.timeScrollView}
                showsVerticalScrollIndicator={true}
              >
                <View style={styles.timeSlotsContainer}>
                  {timeSlots.map((time, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.timeSlot,
                        selectedTime === time && styles.selectedTimeSlot,
                      ]}
                      onPress={() => handleTimeSelect(time)}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          selectedTime === time && styles.selectedTimeText,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </ScrollView>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <LinearGradient
              colors={['#18F06E', '#0B6DE0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.doneButtonGradient}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CalendarWithTime;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalScrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    width: 574,
    height: 374,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.grey20,
    padding: 16,
    gap: 8,
  },
  calendarSection: {
    flex: 1,
    paddingRight: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.grey20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  navButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(8),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#DCE0E5',
    borderWidth: 1,
  },
  disabledNavButton: {
    opacity: 0.5,
  },
  monthYearText: {
    fontSize: fontSize.textSize16,
    color: colors.black,
    fontWeight: '600',
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  dayHeaderText: {
    fontSize: fontSize.textSize12,
    color: '#6F7C8E',
    fontWeight: '500',
    width: '14.28%', // Match dateButton width for perfect alignment
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  dateButton: {
    width: '14.28%', // 100% / 7 days = 14.28% per column
    height: moderateScale(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  selectedDateGradient: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: fontSize.textSize15,
    color: colors.blackText,
    fontWeight: '500',
  },
  inactiveDateText: {
    color: colors.grey400,
  },
  pastDateText: {
    color: '#CCCCCC',
  },
  disabledDateButton: {
    opacity: 0.5,
  },
  selectedDateText: {
    color: colors.white,
    fontWeight: '600',
  },
  repeatButton: {
    backgroundColor: colors.grey20,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
  },
  repeatButtonText: {
    fontSize: fontSize.textSize12,
    color: colors.grey400,
    fontWeight: '500',
  },
  timeSection: {
    flex: 1,
    paddingLeft: spacing.md,
  },
  timeHeader: {
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  timeHeaderText: {
    fontSize: fontSize.textSize15,
    color: colors.black,
    fontWeight: '600',
    textAlign: 'center',
  },
  timeScrollView: {
    flex: 1,
  },
  timeSlotsContainer: {
    paddingHorizontal: spacing.sm,
  },
  timeSlot: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  selectedTimeSlot: {
    borderColor: '#18F06E',
    backgroundColor: '#00C78B1A',
  },
  timeText: {
    fontSize: fontSize.textSize15,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '400',
  },
  selectedTimeText: {
    color: '#14181F',
    fontWeight: '400',
    fontSize: fontSize.textSize15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.grey20,
    width: scaleWidth(300),
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.textSize16,
    color: colors.grey400,
    fontWeight: '500',
  },
  doneButton: {
    flex: 1,
    marginLeft: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  doneButtonGradient: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: fontSize.textSize16,
    color: colors.white,
    fontWeight: '600',
  },
});
