import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../navigations/appNavigation.type';
import FloatingActionButton from '../components/FloatingActionButton';
import WeekHeader from '../components/WeekHeader';
import CustomDrawer from '../components/CustomDrawer';
import { useActiveAccount } from '../stores/useActiveAccount';
import { useEventsStore } from '../stores/useEventsStore';
import { parseTimeToPST } from '../utils';
import { useCalendarStore } from '../stores/useCalendarStore';
import { useSettingsStore } from '../stores/useSetting';
import EventDetailsModal from '../components/EventDetailsModal';
import { colors, spacing } from '../utils/LightTheme';
import { BlockchainService } from '../services/BlockChainService';
import { useToken } from '../stores/useTokenStore';
import { NECJSPRIVATE_KEY } from '../constants/Config';
import { useApiClient } from '../hooks/useApi';
import ExitConfirmModal from "../components/ExitConfirmModal";
import ClockIcon from '../assets/svgs/clock.svg';
import CalendarIcon from '../assets/svgs/calendar.svg';
import EventIcon from '../assets/svgs/eventIcon.svg';
import TaskIcon from '../assets/svgs/taskIcon.svg';
import LinearGradient from 'react-native-linear-gradient';
import { Fonts } from '../constants/Fonts';


interface MonthlyCalendarProps {
  onDateSelect?: (date: string) => void;
  onEventPress?: (event: any) => void;
  onFABOptionSelect?: (option: string) => void;
  onMenuPress?: () => void;
  onMonthPress?: () => void;
}

const MonthlyCalenderScreen: React.FC<MonthlyCalendarProps> = ({
  onEventPress,
  onFABOptionSelect,
  onMenuPress,
  onMonthPress,
}) => {
  const navigation = useNavigation();
  const { currentMonth, setCurrentMonthByIndex } = useCalendarStore();
  const { account } = useActiveAccount();
  const { userEvents, userEventsLoading, getUserEvents } = useEventsStore();
  const { selectedDate, setSelectedDate } = useCalendarStore();
  // ✅ Get start of week setting from store
  const { selectedDay } = useSettingsStore();
  
  // ✅ Helper function to convert day name to numeric value for react-native-calendars
  // react-native-calendars uses: 0=Sunday, 1=Monday, 2=Tuesday, etc.
  const getFirstDayNumber = (dayName: string): number => {
    const dayMap: { [key: string]: number } = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
    };
    return dayMap[dayName] || 0;
  };
  
  const firstDayNumber = getFirstDayNumber(selectedDay);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const blockchainService = new BlockchainService(NECJSPRIVATE_KEY);
  const token = useToken(state => state.token);
  const { api } = useApiClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [exitModal, setExitModal] = useState(false);
  const [navigationAction, setNavigationAction] = useState(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  
  // Extract userName similar to HomeScreen
  const userName = account?.username || '';

  // Format date to YYYY-MM-DD for react-native-calendars
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateString = useMemo(() => {
    const dateString = formatDate(selectedDate);
    console.log('✅ Calendar `current` date updated:', dateString);
    return dateString;
  }, [selectedDate]);

  // Define a map for day names to Date.prototype.getDay() values (0=Sunday, 6=Saturday)
const DAY_MAP: { [key: string]: number } = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

// Define a map for month names to 0-indexed month numbers
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

// Define a map for week number text
const WEEK_TEXT_MAP: { [key: string]: number } = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  last: -1, // Use -1 to denote the last occurrence of the day
};

/**
 * Calculates the date of the Nth (or last) weekday of a specific month and year.
 * @param year The year.
 * @param monthIndex The 0-indexed month (0-11).
 * @param dayOfWeek The 0-indexed day of the week (0=Sunday, 6=Saturday).
 * @param occurrence The Nth occurrence (1-4, or -1 for last).
 * @returns The Date object for the calculated occurrence, or null if invalid.
 */
const getNthWeekdayOfMonth = (
  year: number,
  monthIndex: number,
  dayOfWeek: number,
  occurrence: number
): Date | null => {
  const isLast = occurrence === -1;
  const targetWeek = isLast ? 4 : occurrence; // Try up to the 4th week initially

  let dayCount = 0;
  let date = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();

  for (let d = 1; d <= lastDayOfMonth; d++) {
    date.setDate(d);
    if (date.getDay() === dayOfWeek) {
      dayCount++;

      if (!isLast && dayCount === occurrence) {
        return new Date(date);
      }
    }
  }

  // If we are looking for the 'last' occurrence, the dayCount will be the correct number.
  if (isLast && dayCount > 0) {
    // Find the date corresponding to the dayCount-th occurrence
    let lastDate = new Date(year, monthIndex, 1);
    let finalDayCount = 0;
    for (let d = 1; d <= lastDayOfMonth; d++) {
        lastDate.setDate(d);
        if (lastDate.getDay() === dayOfWeek) {
            finalDayCount++;
            if (finalDayCount === dayCount) {
                return new Date(lastDate);
            }
        }
    }
  }
  
  return null;
};

const generateRecurringInstances = (
  event: any,
  viewStartDate: Date,
  viewEndDate: Date
): Array<{ date: Date; event: any }> => {
  const instances: Array<{ date: Date; event: any }> = [];

  const startDate = parseTimeToPST(event.fromTime);
  const endDate = parseTimeToPST(event.toTime);

  if (!startDate || !endDate) return instances;

  const repeatType =
    event.repeatEvent ||
    event.list?.find((item: any) => item.key === 'repeatEvent')?.value;

  if (!repeatType || repeatType === 'Does not repeat') {
    // Standard non-recurring event check
    if (startDate >= viewStartDate && startDate <= viewEndDate) {
      return [{ date: startDate, event }];
    }
    return instances;
  }

  const repeatTypeLower = repeatType.toLowerCase();
  
  // Start from the event's original start date
  let currentDate = new Date(startDate);
  currentDate.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());
  
  // Adjust currentDate to the *start* of the view range if the event started before
  if (currentDate < viewStartDate) {
    currentDate = new Date(viewStartDate);
    currentDate.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());
    // Move back to the start of the day for calculation to ensure we don't skip an instance
    currentDate.setHours(0, 0, 0, 0); 
  } else {
    // Also move to the start of the day for consistent iteration
    currentDate.setHours(0, 0, 0, 0); 
  }
  
  const maxDate = new Date(viewEndDate);
  maxDate.setHours(23, 59, 59, 999);

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  // Limit recurrence calculation to viewEndDate or 1 year, whichever comes first
  const limitDate = maxDate < oneYearFromNow ? maxDate : oneYearFromNow; 
  
  // Original event day, date, and month for reference
  const originalStartDay = startDate.getDay();
  const originalStartDate = startDate.getDate();
  const originalStartMonth = startDate.getMonth();
  
  // Function to add a valid instance
  const addInstance = (date: Date) => {
    // Only add if the instance falls within the view range
    if (date >= viewStartDate && date <= viewEndDate) {
      instances.push({
        date: new Date(date),
        event: {
          ...event,
          // Correctly set the time of the instance to match the event's time
          displayDate: new Date(date), 
        },
      });
    }
  };
  
  // Handle the very first instance if it's within the view range
  const startDayInstance = new Date(startDate);
  startDayInstance.setHours(0, 0, 0, 0);

  if (startDayInstance >= viewStartDate && startDayInstance <= viewEndDate) {
    addInstance(startDayInstance);
  }

  // Calculate the *next* date based on recurrence rule
  let nextDate = new Date(startDate);
  nextDate.setHours(0, 0, 0, 0);
  
  // This loop will calculate the *next* instance based on the rules, starting after the original start date.
  let iteration = 0;
  const maxIterations = 366 * 2; // Safety break for complex rules
  
  while (nextDate <= limitDate && iteration < maxIterations) {
    iteration++;
    let hasMoved = false;

    // --- Daily/Simple Weekly/Monthly/Yearly Cases ---
    if (
      repeatTypeLower === 'daily' ||
      repeatTypeLower === 'every day'
    ) {
      nextDate.setDate(nextDate.getDate() + 1);
      hasMoved = true;
    } else if (
      repeatTypeLower.startsWith('weekly on') || // Covers "Weekly on Thursday"
      repeatTypeLower === 'weekly' ||
      repeatTypeLower === 'every week'
    ) {
      nextDate.setDate(nextDate.getDate() + 7);
      hasMoved = true;
    } else if (repeatTypeLower === 'bi-weekly' || repeatTypeLower === 'every 2 weeks') {
      nextDate.setDate(nextDate.getDate() + 14);
      hasMoved = true;
    } else if (repeatTypeLower === 'monthly' || repeatTypeLower === 'every month') {
      // Handles monthly recurrence on the Nth day of the month (e.g., repeat on the 15th)
      const currentDay = nextDate.getDate();
      nextDate.setMonth(nextDate.getMonth() + 1);
      // If the next month is shorter, set to the last day of that month
      if (nextDate.getDate() < currentDay) {
          nextDate.setDate(0); // This should correct for short months 
      }
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
    
    // --- Complex Recurrence Parsing ---
    
    // 1. Weekly on [Weekday]
    const weeklyMatch = repeatType.match(/^Weekly on (\w+)$/i);
    if (weeklyMatch) {
        // This is handled by the simpler 'Weekly on' block above, 
        // as the simple logic of adding 7 days keeps the day of the week consistent.
    }
    
    // 2. Annually on [Month Name] [Day Number]
    const annualMatch = repeatType.match(/^Annually on (\w+) (\d+)$/i);
    if (annualMatch) {
      const monthName = annualMatch[1].toLowerCase();
      const dayNumber = parseInt(annualMatch[2]);
      
      let nextYear = nextDate.getFullYear();
      let nextMonth = MONTH_MAP[monthName];
      let nextDay = dayNumber;
      
      // If the current date is already past the annual date in the current year, move to the next year
      if (nextDate.getMonth() > nextMonth || (nextDate.getMonth() === nextMonth && nextDate.getDate() >= nextDay)) {
        nextYear++;
      }
      
      nextDate.setFullYear(nextYear);
      nextDate.setMonth(nextMonth);
      nextDate.setDate(nextDay);
      hasMoved = true;
    }
    
    // 3. Monthly on the [First/Second/Third/Fourth/Last] [Weekday]
    const monthlyWeekdayMatch = repeatType.match(
      /^Monthly on the (\w+) (\w+)$/i
    );
    if (monthlyWeekdayMatch) {
      const occurrenceText = monthlyWeekdayMatch[1].toLowerCase(); // e.g., 'first', 'last'
      const weekdayName = monthlyWeekdayMatch[2].toLowerCase(); // e.g., 'thursday'
      
      const occurrence = WEEK_TEXT_MAP[occurrenceText]; // 1, 2, 3, 4, or -1
      const dayOfWeek = DAY_MAP[weekdayName]; // 0-6
      
      let nextMonthDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 1);
      let year = nextMonthDate.getFullYear();
      let month = nextMonthDate.getMonth();
      
      let newDate = getNthWeekdayOfMonth(year, month, dayOfWeek, occurrence);
      
      // Keep moving to the next month until we find a date *after* the current instance date
      while (!newDate || newDate.getTime() <= nextDate.getTime()) {
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        year = nextMonthDate.getFullYear();
        month = nextMonthDate.getMonth();
        newDate = getNthWeekdayOfMonth(year, month, dayOfWeek, occurrence);
        
        // Safety break if we are stuck in an infinite loop
        if (nextMonthDate.getTime() > limitDate.getTime() + (31 * 24 * 60 * 60 * 1000) || iteration > maxIterations) {
          break;
        }
      }
      
      if (newDate) {
        nextDate = newDate;
        hasMoved = true;
      }
    }
    
    // 4. Monthly on the last [Weekday]
    const monthlyLastMatch = repeatType.match(/^Monthly on the last (\w+)$/i);
    if (monthlyLastMatch && !monthlyWeekdayMatch) { // The other logic handles 'last', but ensure no duplicate logic
      const weekdayName = monthlyLastMatch[1].toLowerCase(); // e.g., 'thursday'
      const dayOfWeek = DAY_MAP[weekdayName]; // 0-6
      
      let nextMonthDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 1);
      let year = nextMonthDate.getFullYear();
      let month = nextMonthDate.getMonth();
      
      let newDate = getNthWeekdayOfMonth(year, month, dayOfWeek, -1); // -1 for last
      
      while (!newDate || newDate.getTime() <= nextDate.getTime()) {
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        year = nextMonthDate.getFullYear();
        month = nextMonthDate.getMonth();
        newDate = getNthWeekdayOfMonth(year, month, dayOfWeek, -1);
        
        if (nextMonthDate.getTime() > limitDate.getTime() + (31 * 24 * 60 * 60 * 1000) || iteration > maxIterations) {
          break;
        }
      }
      
      if (newDate) {
        nextDate = newDate;
        hasMoved = true;
      }
    }


    if (!hasMoved) {
      // If the recurrence type is not recognized, stop.
      console.warn('Unknown recurrence type, stopping:', repeatType);
      break;
    }

    if (nextDate <= limitDate) {
      addInstance(nextDate);
    }
    
    // Safety check for too many instances
    if (instances.length > 366) {
      console.warn('Too many recurring instances generated, stopping at 366');
      break;
    }
  }

  return instances;
};

  const { markedDates, eventsByDate } = useMemo(() => {
    const marked: any = {};
    const byDate: { [key: string]: any[] } = {};

    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

    const viewStartDate = new Date(firstDayOfMonth);
    viewStartDate.setDate(viewStartDate.getDate() - 7);

    const viewEndDate = new Date(lastDayOfMonth);
    viewEndDate.setDate(viewEndDate.getDate() + 7);

    (userEvents || []).forEach(ev => {
      const startDate = parseTimeToPST(ev.fromTime);
      const endDate = parseTimeToPST(ev.toTime);

      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.log('Skipping invalid event:', ev);
        return;
      }

      const isTask = ev.list?.some((item: any) => item.key === 'task' && item.value === 'true');
      const repeatType = ev.repeatEvent || ev.list?.find((item: any) => item.key === 'repeatEvent')?.value;
      const isRecurring = repeatType && repeatType !== 'Does not repeat';

      const eventColor = isTask ? '#8DC63F' : '#00AEEF';

      const instances = generateRecurringInstances(ev, viewStartDate, viewEndDate);

      instances.forEach(({ date: instanceDate, event }) => {
        const instanceStartDate = new Date(instanceDate);
        instanceStartDate.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds());

        const instanceEndDate = new Date(instanceDate);
        instanceEndDate.setHours(endDate.getHours(), endDate.getMinutes(), endDate.getSeconds());

        if (startDate.toDateString() !== endDate.toDateString()) {
          const duration = endDate.getTime() - startDate.getTime();
          instanceEndDate.setTime(instanceStartDate.getTime() + duration);
        }

        const isMultiDay = instanceStartDate.toDateString() !== instanceEndDate.toDateString();

        if (isMultiDay) {
          const currentDate = new Date(instanceStartDate);
          currentDate.setHours(0, 0, 0, 0);
          const endDateOnly = new Date(instanceEndDate);
          endDateOnly.setHours(0, 0, 0, 0);

          while (currentDate <= endDateOnly) {
            const dateString = formatDate(currentDate);
            const isStart = currentDate.toDateString() === instanceStartDate.toDateString();
            const isEnd = currentDate.toDateString() === instanceEndDate.toDateString();

            if (!marked[dateString]) {
              marked[dateString] = { periods: [] };
            }
            if (!marked[dateString].periods) {
              marked[dateString].periods = [];
            }

            marked[dateString].periods.push({
              startingDay: isStart,
              endingDay: isEnd,
              color: eventColor,
              textColor: '#000000',
            });

            if (!byDate[dateString]) {
              byDate[dateString] = [];
            }

            const alreadyExists = byDate[dateString].some(e =>
              e.uid === ev.uid &&
              e.instanceDate === dateString
            );

            if (!alreadyExists) {
              byDate[dateString].push({
                ...ev,
                instanceDate: dateString,
                instanceStartTime: instanceStartDate,
                instanceEndTime: instanceEndDate,
                isTask,
                isRecurring,
                isMultiDay,
                color: eventColor,
              });
            }

            currentDate.setDate(currentDate.getDate() + 1);
          }
        } else {
          const dateString = formatDate(instanceStartDate);

          if (!marked[dateString]) {
            marked[dateString] = { periods: [] };
          }
          if (!marked[dateString].periods) {
            marked[dateString].periods = [];
          }

          marked[dateString].periods.push({
            color: eventColor,
            selectedColor: eventColor,
          });

          if (!byDate[dateString]) {
            byDate[dateString] = [];
          }

          const alreadyExists = byDate[dateString].some(e =>
            e.uid === ev.uid &&
            e.instanceDate === dateString
          );

          if (!alreadyExists) {
            byDate[dateString].push({
              ...ev,
              instanceDate: dateString,
              instanceStartTime: instanceStartDate,
              instanceEndTime: instanceEndDate,
              isTask,
              isRecurring,
              isMultiDay: false,
              color: eventColor,
            });
          }
        }
      });
    });

    if (marked[selectedDateString]) {
      marked[selectedDateString].selected = true;
      marked[selectedDateString].selectedColor = '#2196F3';
    } else {
      marked[selectedDateString] = {
        selected: true,
        selectedColor: '#2196F3',
      };
    }

    return { markedDates: marked, eventsByDate: byDate };
  }, [userEvents, selectedDateString, selectedDate]);

  // Fetch events when component mounts or userName changes (same flow as HomeScreen)
  useEffect(() => {
    const fetchEvents = async () => {
      if (!account || !account[3]) {
        console.log('No account or userName found, skipping event fetch');
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching events for user:', account[3]);

        const events = await getUserEvents(account[3], api);
        console.log("events fetched in MonthlyCalendarScreen", events);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [userName]);

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    });

    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (exitModal) return;

      e.preventDefault();
      setExitModal(true);

      setNavigationAction(e.data.action);
    });

    return unsub;
  }, [navigation, exitModal]);

  const handleMenuPress = () => {
    setIsDrawerOpen(true);
  };

  const handleMonthPress = () => {
    console.log('Month selector pressed');
  };

  const handleMonthSelect = (monthIndex: number) => {
    
    // monthly calendar update the month display
    console.log('MonthlyCalenderScreen: handleMonthSelect called with monthIndex:', monthIndex);
    console.log('MonthlyCalenderScreen: Current selectedDate:', selectedDate.toDateString());
    setCurrentMonthByIndex(monthIndex);
    // DO NOT update selectedDate here - it's already been set correctly by handleDateSelect
  };

  const handleDateSelect = (date: Date) => {
    console.log('Date selected:', date.toDateString());
    setSelectedDate(date);
    setCurrentMonthByIndex(date.getMonth());
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleDayPress = (day: any) => {
    const newDate = new Date(day.timestamp);
    setSelectedDate(newDate);
    setCurrentMonthByIndex(newDate.getMonth());
  };


  const handleEventPress = (event: any) => {
    console.log('Event pressed:', event);
    setSelectedEvent(event);
    setIsEventModalVisible(true);
  };

  const handleCloseEventModal = () => {
    setIsEventModalVisible(false);
    setSelectedEvent(null);
  };

  const handleEditEvent = (event: any) => {
    handleCloseEventModal();
    (navigation as any).navigate(Screen.CreateEventScreen, {
      mode: 'edit',
      eventData: event,
    });
  };

  const handleDeleteEvent = async (event: any) => {
    try {
      if (!account) {
        console.log('Error', 'No active account found. Please log in again.');
        return false;
      }

      handleCloseEventModal();

      setIsDeleting(true);
      await blockchainService.deleteEventSoft(event.uid, account, token, api);
      await getUserEvents(account.userName, api);
    } catch (err) {
      console.error("Delete Event Failed:", err);
      Alert.alert("Error", "Failed to move the event to the trash");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRecurrenceDayText = (event: any): string => {
    if (!event) return 'Recurring';

    // Try to extract repeat type safely
    const repeatType =
      event.repeatEvent ??
      event.list?.find((item: any) => item.key === 'repeatEvent')?.value;

    if (!repeatType || typeof repeatType !== 'string') return 'Recurring';

    const type = repeatType.toLowerCase();

    if (type.includes('weekday')) return 'Mon - Fri';
    if (type.includes('week')) return 'Weekly';
    if (type.includes('day')) return 'Daily';
    if (type.includes('month')) return 'Monthly';
    if (type.includes('year')) return 'Yearly';

    return repeatType;
  };

  // Extract guests from event - returns array of { email, avatar } objects
  const getEventGuests = (event: any): Array<{ email: string; avatar?: string }> => {
    if (!event) return [];
    
    const guests: Array<{ email: string; avatar?: string }> = [];
    
    // First try direct guests array
    if (event.guests && Array.isArray(event.guests)) {
      event.guests.forEach((g: any) => {
        if (typeof g === 'string') {
          guests.push({ email: g });
        } else if (g && typeof g === 'object' && g.email) {
          guests.push({ email: g.email, avatar: g.avatar || g.picture || g.profilePicture });
        }
      });
    }
    
    // Try to extract from list metadata
    if (event.list && Array.isArray(event.list)) {
      const guestItems = event.list.filter((item: any) => item && item.key === 'guest');
      guestItems.forEach((item: any) => {
        if (typeof item.value === 'string') {
          guests.push({ email: item.value });
        } else if (item.value && typeof item.value === 'object') {
          guests.push({ 
            email: item.value.email || item.value, 
            avatar: item.value.avatar || item.value.picture || item.value.profilePicture 
          });
        }
      });
    }
    
    return guests.filter((g: any) => g && g.email);
  };

  // Generate initials from email
  const getGuestInitials = (email: string): string => {
    if (!email) return '?';
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  };

  // Generate background color based on email
  const getGuestBackgroundColor = (email: string): string[] => {
    const colorOptions = [
      ['#FF6B6B', '#FF8E8E'],
      ['#4ECDC4', '#6EDDD6'],
      ['#45B7D1', '#6BC5D8'],
      ['#FFA07A', '#FFB89A'],
      ['#98D8C8', '#B0E4D4'],
      ['#F7DC6F', '#F9E68A'],
      ['#BB8FCE', '#C9A5D9'],
      ['#85C1E2', '#9DCFE8'],
    ];
    const index = email.charCodeAt(0) % colorOptions.length;
    return colorOptions[index];
  };


  const selectedDateEvents = eventsByDate[selectedDateString] || [];

  console.log('Selected date:', selectedDateString);
  console.log('Events for selected date:', selectedDateEvents.length);

  return (
    <View style={styles.container}>
      <EventDetailsModal
        visible={isEventModalVisible}
        onClose={handleCloseEventModal}
        event={selectedEvent}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      <WeekHeader
        onMenuPress={handleMenuPress}
        currentMonth={currentMonth}
        onMonthPress={handleMonthPress}
        onMonthSelect={handleMonthSelect}
        onDateSelect={handleDateSelect}
        currentDate={selectedDate}
        selectedDate={selectedDate}
      />

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.calendarWrapper}>
          <Calendar
            key={selectedDateString}
            current={selectedDateString}
            markedDates={markedDates}
            markingType="multi-period"
            onDayPress={handleDayPress}
            firstDay={firstDayNumber}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#b6c1cd',
              selectedDayBackgroundColor: '#000',
              selectedDayTextColor: '#ffffff',
              todayTextColor: colors.figmaLightBlue || '#2196F3',
              dayTextColor: '#202020',
              textDisabledColor: '#A8A8AA',
              dotColor: '#337E89',
              selectedDotColor: '#ffffff',
              arrowColor: colors.figmaLightBlue || '#2196F3',
              textDayFontFamily: Fonts.bold,
              textDayHeaderFontFamily: Fonts.black,
              textDayFontSize: 12,
              textDayHeaderFontSize: 14,
            }}
            renderHeader={() => null}
            hideArrows={true}
          />
        </View>

        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>Timeline</Text>

          <View style={styles.eventsList}>
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event, index) => (
                <View key={`${event.uid}-${index}`}
                  style={{ display: 'flex', flexDirection: 'column', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                    <Text style={[styles.eventTime]}>
                      {event.instanceStartTime?.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>

                    {/* Line */}
                    <View style={{ flex: 1, height: 1, backgroundColor: '#D5D7DA', marginLeft: 14 }} />
                  </View>

                  <TouchableOpacity
                    style={styles.eventItem}
                    onPress={() => handleEventPress(event)}
                  >
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>
                        {event.title}
                      </Text>

                      <View style={styles.eventBadges}>
                        <View style={styles.badge}>
                          <ClockIcon height={14} width={14} />
                          <Text style={styles.eventTime}>
                            {parseTimeToPST(event.fromTime)?.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                            {' - '}
                            {parseTimeToPST(event.toTime)?.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>

                        {event.isRecurring && (
                          <View style={styles.badge}>
                            <CalendarIcon height={14} width={14} />
                            <Text style={styles.badgeText}>
                              {getRecurrenceDayText(event)}
                            </Text>
                          </View>
                        )}

                        <View style={[styles.badge, {
                          borderColor: event.isTask ? '#8DC63F' : '#00AEEF',
                        }]}>
                          {event.isTask ? <TaskIcon height={14} width={14} /> : <EventIcon height={14} width={14} />}
                          <Text style={styles.badgeText}>
                            {event.isTask ? 'Task' : 'Event'}
                          </Text>
                        </View>
                      </View>

                      {/* Guest Thumbnails */}
                      {(() => {
                        const eventGuests = getEventGuests(event);
                        if (!eventGuests || eventGuests.length === 0) return null;

                        const maxVisible = 5;
                        const size = 36;
                        const visibleGuests = eventGuests.slice(0, maxVisible);
                        const remainingCount = eventGuests.length - maxVisible;
                        const isSingleGuest = eventGuests.length === 1;

                        return (
                          <View style={styles.guestsContainer}>
                            {visibleGuests.map((guest, index) => {
                              const initials = getGuestInitials(guest.email);
                              const gradientColors = getGuestBackgroundColor(guest.email);
                              const hasAvatar = guest.avatar && typeof guest.avatar === 'string' && guest.avatar.trim() !== '';
                              const imageFailed = failedImages.has(guest.email);
                              // For single guest, no negative margin. For multiple, overlap them more
                              const marginLeft = isSingleGuest ? 0 : (index > 0 ? -12 : 0);

                              return (
                                <View
                                  key={`${guest.email}-${index}`}
                                  style={[
                                    {
                                      width: size,
                                      height: size,
                                      borderRadius: size / 2,
                                      marginLeft: marginLeft,
                                      zIndex: maxVisible - index,
                                      borderWidth: 2,
                                      borderColor: colors.white,
                                      overflow: 'hidden',
                                      backgroundColor: 'transparent',
                                    },
                                  ]}
                                >
                                  {hasAvatar && !imageFailed ? (
                                    <Image
                                      source={{ uri: guest.avatar }}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        resizeMode: 'cover',
                                      }}
                                      onError={() => {
                                        setFailedImages(prev => new Set(prev).add(guest.email));
                                      }}
                                    />
                                  ) : (
                                    <LinearGradient
                                      colors={gradientColors}
                                      start={{ x: 0, y: 0 }}
                                      end={{ x: 1, y: 1 }}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                      }}
                                    >
                                      <Text
                                        style={[
                                          styles.guestInitialsText,
                                          {
                                            fontSize: size * 0.4,
                                          },
                                        ]}
                                      >
                                        {initials}
                                      </Text>
                                    </LinearGradient>
                                  )}
                                </View>
                              );
                            })}

                            {remainingCount > 0 && (
                              <View
                                style={[
                                  styles.guestRemainingCount,
                                  {
                                    width: size,
                                    height: size,
                                    borderRadius: size / 2,
                                    marginLeft: -12,
                                    zIndex: 0,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.guestCountText,
                                    {
                                      fontSize: size * 0.35,
                                    },
                                  ]}
                                >
                                  +{remainingCount}
                                </Text>
                              </View>
                            )}
                          </View>
                        );
                      })()}
                    </View>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noEventsText}>No events for this date</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {(userEventsLoading || isDeleting) && (
        <View style={[styles.loadingContainer, { pointerEvents: 'box-none' }]}>
          <ActivityIndicator size="large" color={colors.figmaLightBlue || '#2196F3'} />
          <Text style={styles.loadingText}>
            {isDeleting ? 'Deleting Event...' : 'Loading…'}
          </Text>
        </View>
      )}

      <FloatingActionButton
        onOptionSelect={option => {
          console.log('Selected option:', option);
          switch (option) {
            case 'task':
              navigation.navigate(Screen.CreateTaskScreen as never);
              break;
            case 'event':
              navigation.navigate(Screen.CreateEventScreen as never);
              break;
            default:
              break;
          }
        }}
      />

      <CustomDrawer isOpen={isDrawerOpen} onClose={handleDrawerClose} />
      <ExitConfirmModal
        visible={exitModal}
        onCancel={() => {
          setExitModal(false);
          setNavigationAction(null);
        }}
        onConfirm={() => {
          setExitModal(false);
          if (navigationAction) {
            navigation.dispatch(navigationAction);
          } else {
            navigation.goBack();
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  calendarWrapper: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.lg,
    borderRadius: 14,
    overflow: 'hidden',
  },
  eventsContainer: {
    marginHorizontal: spacing.md,
    paddingHorizontal: 4,
  },
 eventsTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    marginBottom: spacing.md,
    color: '#202020',
  },
  eventsList: {
    flexGrow: 1,
  },
  eventItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: spacing.sm,
    borderColor: '#D5D7DA',
    borderWidth: 1,
    borderLeftColor: '#D5D7DA',
    borderLeftWidth: 1
  },
  eventContent: {
    gap: 12,
  },
  eventTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#000',
    marginBottom: 0,
  },
 eventTime: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    textAlign: 'left',
    color: '#717680'
  },
  eventStartTime: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'left',
    borderWidth: 1,
  },
  eventBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    display: 'flex',
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: '#D5D7DA',
  },
 badgeText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: '#717680',
    fontWeight: '500',
  },
  noEventsText: {
    fontSize: 14,
    fontFamily: 'DM Sans',
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  guestsContainer: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  guestAvatarWrapper: {
    borderWidth: 2,
    borderColor: colors.white,
    overflow: 'hidden',
  },
  guestAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  guestAvatarImage: {
    resizeMode: 'cover',
    width: '100%',
    height: '100%',
  },
  guestInitialsText: {
    color: colors.white,
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
  guestRemainingCount: {
    backgroundColor: '#FFB6C1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  guestCountText: {
    color: colors.white,
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
});

export default MonthlyCalenderScreen;