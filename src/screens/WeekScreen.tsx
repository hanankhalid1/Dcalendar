import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from 'react';
import { InteractionManager } from 'react-native';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../navigations/appNavigation.type';
import FloatingActionButton from '../components/FloatingActionButton';
import WeekHeader from '../components/WeekHeader';
import CustomDrawer from '../components/CustomDrawer';
import { useActiveAccount } from '../stores/useActiveAccount';
import { useEventsStore } from '../stores/useEventsStore';
import { parseTimeToPST, isEventInPast } from '../utils';
import { useCalendarStore } from '../stores/useCalendarStore';
import CustomAlert from '../components/CustomAlert';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useSettingsStore } from '../stores/useSetting';
import EventDetailsModal from '../components/EventDetailsModal';
import { useToast } from '../hooks/useToast';
import { colors, spacing, shadows } from '../utils/LightTheme';
import { BlockchainService } from '../services/BlockChainService';
import { useToken } from '../stores/useTokenStore';
import { NECJSPRIVATE_KEY } from '../constants/Config';
import { useApiClient } from '../hooks/useApi';
import ClockIcon from '../assets/svgs/clock.svg';
import CalendarIcon from '../assets/svgs/calendar.svg';
import EventIcon from '../assets/svgs/eventIcon.svg';
import TaskIcon from '../assets/svgs/taskIcon.svg';
import LinearGradient from 'react-native-linear-gradient';
import { Fonts } from '../constants/Fonts';
import { convertToSelectedTimezone } from '../utils/timezone';
import Icon from 'react-native-vector-icons/AntDesign';

const WeekScreen = () => {
  const navigation = useNavigation();
  const { currentMonth, setCurrentMonthByIndex } = useCalendarStore();
  const { account } = useActiveAccount();
  const {
    userEvents,
    userEventsLoading,
    getUserEvents,
    optimisticallyDeleteEvent,
    revertOptimisticUpdate,
  } = useEventsStore();
  const { selectedDate, setSelectedDate } = useCalendarStore();
  const { selectedTimeZone, selectedDay } = useSettingsStore();

  // Helper function to convert day name to numeric value for react-native-calendars
  const getFirstDayNumber = (dayName: string): number => {
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

  const firstDayNumber = getFirstDayNumber(selectedDay);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const blockchainService = new BlockchainService(NECJSPRIVATE_KEY);
  const toast = useToast();
  const token = useToken(state => state.token);
  const { api } = useApiClient();
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // Delete Confirmation Modal State
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [pendingDeleteEvent, setPendingDeleteEvent] = useState<any>(null);

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'warning',
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Extract userName
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
    last: -1,
  };

  const getNthWeekdayOfMonth = (
    year: number,
    month: number,
    dayOfWeek: number,
    occurrence: number,
  ): Date | null => {
    if (occurrence === -1) {
      // Last occurrence
      const lastDay = new Date(year, month + 1, 0);
      let lastDate = new Date(lastDay);
      while (lastDate.getDay() !== dayOfWeek) {
        lastDate.setDate(lastDate.getDate() - 1);
      }
      return lastDate;
    } else {
      // Nth occurrence
      const firstDay = new Date(year, month, 1);
      let targetDate = new Date(firstDay);
      const firstDayOfWeek = firstDay.getDay();
      let daysToAdd = (dayOfWeek - firstDayOfWeek + 7) % 7;
      if (daysToAdd === 0 && occurrence > 1) {
        daysToAdd = 7;
      }
      targetDate.setDate(1 + daysToAdd + (occurrence - 1) * 7);
      if (targetDate.getMonth() === month) {
        return targetDate;
      }
    }
    return null;
  };

  // Reuse the generateRecurringInstances function from MonthlyCalenderScreen
  const generateRecurringInstances = (
    event: any,
    viewStartDate: Date,
    viewEndDate: Date,
  ): Array<{ date: Date; event: any }> => {
    const instances: Array<{ date: Date; event: any }> = [];

    const startTimeData = convertToSelectedTimezone(
      event.fromTime,
      selectedTimeZone,
    );
    const endTimeData = convertToSelectedTimezone(
      event.toTime,
      selectedTimeZone,
    );

    if (!startTimeData || !endTimeData) return [];

    const startDate = startTimeData.date;
    const endDate = endTimeData.date;

    if (!startDate || !endDate) return instances;

    const repeatType =
      event.repeatEvent ||
      event.list?.find((item: any) => item.key === 'repeatEvent')?.value;

    if (!repeatType || repeatType === 'Does not repeat') {
      // Standard non-recurring event check - include ALL events within view range (past, present, future)
      const eventStartOnly = new Date(startDate);
      eventStartOnly.setHours(0, 0, 0, 0);
      const viewStartOnly = new Date(viewStartDate);
      viewStartOnly.setHours(0, 0, 0, 0);
      const viewEndOnly = new Date(viewEndDate);
      viewEndOnly.setHours(23, 59, 59, 999);

      if (eventStartOnly >= viewStartOnly && eventStartOnly <= viewEndOnly) {
        return [{ date: startDate, event }];
      }
      return instances;
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
      if (customMatch[3]) {
        customDays = customMatch[3].split(',').map(d => d.trim().toLowerCase());
      }
      if (customMatch[4]) {
        customEndType = 'after';
        customEndAfter = parseInt(customMatch[4]);
      } else if (customMatch[5]) {
        customEndType = 'on';
        customEndDate = new Date(customMatch[5].trim());
      }
    }

    let currentDate = new Date(startDate);
    currentDate.setHours(
      startDate.getHours(),
      startDate.getMinutes(),
      startDate.getSeconds(),
      startDate.getMilliseconds(),
    );

    if (currentDate < viewStartDate) {
      currentDate = new Date(viewStartDate);
      currentDate.setHours(
        startDate.getHours(),
        startDate.getMinutes(),
        startDate.getSeconds(),
        startDate.getMilliseconds(),
      );
      currentDate.setHours(0, 0, 0, 0);
    } else {
      currentDate.setHours(0, 0, 0, 0);
    }

    const maxDate = new Date(viewEndDate);
    maxDate.setHours(23, 59, 59, 999);

    // For week view, limit to only generate instances within the week range (much faster!)
    let limitDate = maxDate;
    if (customEndDate && customEndDate < limitDate) {
      limitDate = customEndDate;
    }

    // Limit iterations to prevent long processing
    const maxIterations = 50; // Reduced from 366*2 for week view

    const dayNameToNumber: { [key: string]: number } = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const addInstance = (date: Date) => {
      if (date >= viewStartDate && date <= viewEndDate) {
        instances.push({
          date: new Date(date),
          event: {
            ...event,
            displayDate: new Date(date),
          },
        });
      }
    };

    const startDayInstance = new Date(startDate);
    startDayInstance.setHours(0, 0, 0, 0);

    if (startDayInstance >= viewStartDate && startDayInstance <= viewEndDate) {
      addInstance(startDayInstance);
    }

    let nextDate = new Date(startDate);
    nextDate.setHours(0, 0, 0, 0);

    let iteration = 0;
    let occurrenceCount = 1;

    while (nextDate <= limitDate && iteration < maxIterations) {
      iteration++;

      if (customEndType === 'after' && occurrenceCount >= customEndAfter) {
        break;
      }

      let hasMoved = false;

      if (customMatch) {
        if (customUnit === 'day') {
          nextDate.setDate(nextDate.getDate() + customInterval);
          hasMoved = true;
        } else if (customUnit === 'week') {
          if (customDays.length > 0) {
            const targetDayNumbers = customDays
              .map(day => dayNameToNumber[day])
              .filter(n => n !== undefined);
            if (targetDayNumbers.length === 0) {
              nextDate.setDate(nextDate.getDate() + 7 * customInterval);
              hasMoved = true;
            } else {
              let foundNext = false;
              let daysChecked = 0;
              const maxDaysToCheck = 7 * customInterval + 7;
              const startTime = new Date(startDate);
              startTime.setHours(0, 0, 0, 0);

              while (!foundNext && daysChecked < maxDaysToCheck) {
                nextDate.setDate(nextDate.getDate() + 1);
                daysChecked++;
                const currentDay = nextDate.getDay();
                if (targetDayNumbers.includes(currentDay)) {
                  const daysDiff = Math.floor(
                    (nextDate.getTime() - startTime.getTime()) /
                      (24 * 60 * 60 * 1000),
                  );
                  const weekNumber = Math.floor(daysDiff / 7);
                  if (weekNumber % customInterval === 0) {
                    foundNext = true;
                  }
                }
              }
              hasMoved = foundNext;
            }
          } else {
            nextDate.setDate(nextDate.getDate() + 7 * customInterval);
            hasMoved = true;
          }
        } else if (customUnit === 'month') {
          const currentDay = nextDate.getDate();
          nextDate.setMonth(nextDate.getMonth() + customInterval);
          if (nextDate.getDate() < currentDay) {
            nextDate.setDate(0);
          }
          hasMoved = true;
        } else if (customUnit === 'year') {
          nextDate.setFullYear(nextDate.getFullYear() + customInterval);
          hasMoved = true;
        }
      } else if (
        repeatTypeLower === 'daily' ||
        repeatTypeLower === 'every day'
      ) {
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
      } else if (
        repeatTypeLower === 'monthly' ||
        repeatTypeLower === 'every month'
      ) {
        const currentDay = nextDate.getDate();
        nextDate.setMonth(nextDate.getMonth() + 1);
        if (nextDate.getDate() < currentDay) {
          nextDate.setDate(0);
        }
        hasMoved = true;
      } else if (
        repeatTypeLower === 'yearly' ||
        repeatTypeLower === 'every year'
      ) {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        hasMoved = true;
      } else if (
        repeatTypeLower.includes('weekday') ||
        repeatTypeLower.includes('monday to friday')
      ) {
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
        if (
          nextDate.getMonth() > nextMonth ||
          (nextDate.getMonth() === nextMonth && nextDate.getDate() >= nextDay)
        ) {
          nextYear++;
        }
        nextDate.setFullYear(nextYear);
        nextDate.setMonth(nextMonth);
        nextDate.setDate(nextDay);
        hasMoved = true;
      }

      const monthlyWeekdayMatch = repeatType.match(
        /^Monthly on the (\w+) (\w+)$/i,
      );
      if (monthlyWeekdayMatch) {
        const occurrenceText = monthlyWeekdayMatch[1].toLowerCase();
        const weekdayName = monthlyWeekdayMatch[2].toLowerCase();
        const occurrence = WEEK_TEXT_MAP[occurrenceText];
        const dayOfWeek = DAY_MAP[weekdayName];
        let nextMonthDate = new Date(
          nextDate.getFullYear(),
          nextDate.getMonth() + 1,
          1,
        );
        let year = nextMonthDate.getFullYear();
        let month = nextMonthDate.getMonth();
        let newDate = getNthWeekdayOfMonth(year, month, dayOfWeek, occurrence);
        while (!newDate || newDate.getTime() <= nextDate.getTime()) {
          nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
          year = nextMonthDate.getFullYear();
          month = nextMonthDate.getMonth();
          newDate = getNthWeekdayOfMonth(year, month, dayOfWeek, occurrence);
          if (
            nextMonthDate.getTime() >
              limitDate.getTime() + 31 * 24 * 60 * 60 * 1000 ||
            iteration > maxIterations
          ) {
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
        let nextMonthDate = new Date(
          nextDate.getFullYear(),
          nextDate.getMonth() + 1,
          1,
        );
        let year = nextMonthDate.getFullYear();
        let month = nextMonthDate.getMonth();
        let newDate = getNthWeekdayOfMonth(year, month, dayOfWeek, -1);
        while (!newDate || newDate.getTime() <= nextDate.getTime()) {
          nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
          year = nextMonthDate.getFullYear();
          month = nextMonthDate.getMonth();
          newDate = getNthWeekdayOfMonth(year, month, dayOfWeek, -1);
          if (
            nextMonthDate.getTime() >
              limitDate.getTime() + 31 * 24 * 60 * 60 * 1000 ||
            iteration > maxIterations
          ) {
            break;
          }
        }
        if (newDate) {
          nextDate = newDate;
          hasMoved = true;
        }
      }

      if (!hasMoved) {
        console.warn('Unknown recurrence type, stopping:', repeatType);
        break;
      }

      if (nextDate <= limitDate) {
        addInstance(nextDate);
        occurrenceCount++;
      }

      // For week view, limit instances to prevent slow processing
      if (instances.length > 50) {
        break; // Stop after 50 instances for week view (much faster)
      }
    }

    return instances;
  };

  // Cache for event processing - keyed by week start date
  const eventsCacheRef = useRef<
    Map<string, { markedDatesBase: any; eventsByDate: any }>
  >(new Map());
  const [isProcessingEvents, setIsProcessingEvents] = useState(false);

  // Process events ONLY for the current visible week - much faster!
  const processEventsForWeek = useCallback(
    (weekStart: Date) => {
      const cacheKey = `${formatDate(
        weekStart,
      )}-${selectedTimeZone}-${selectedDay}`;

      // Check cache first
      if (eventsCacheRef.current.has(cacheKey)) {
        return eventsCacheRef.current.get(cacheKey)!;
      }

      const marked: any = {};
      const byDate: { [key: string]: any[] } = {};

      // Only process events for THIS week (no buffer for speed)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const viewStartDate = new Date(weekStart);
      viewStartDate.setHours(0, 0, 0, 0);
      const viewEndDate = new Date(weekEnd);
      viewEndDate.setHours(23, 59, 59, 999);

      // AGGRESSIVE FILTERING: Only process events that could be in this week
      // This is the key optimization - skip events that are clearly not relevant
      const relevantEvents = (userEvents || []).filter(ev => {
        if (!ev.fromTime) return false;

        // Quick timezone conversion (lightweight check)
        try {
          const startTimeData = convertToSelectedTimezone(
            ev.fromTime,
            selectedTimeZone,
          );
          if (!startTimeData?.date) return false;

          const eventStart = startTimeData.date;
          const eventEnd =
            convertToSelectedTimezone(ev.toTime, selectedTimeZone)?.date ||
            eventStart;

          // Fast range check: event must overlap with week range
          // Include ALL events that fall within or overlap the week range, regardless of past/future
          const eventEndTime = eventEnd.getTime();
          const viewStartTime = viewStartDate.getTime();
          const viewEndTime = viewEndDate.getTime();

          // Event overlaps if: eventStart <= viewEnd AND eventEnd >= viewStart
          // This includes past events that are within the week range
          if (
            eventStart.getTime() > viewEndTime ||
            eventEndTime < viewStartTime
          ) {
            // Check if it's a recurring event that might recur into this week
            const repeatType =
              ev.repeatEvent ||
              ev.list?.find((item: any) => item.key === 'repeatEvent')?.value;
            if (!repeatType || repeatType === 'Does not repeat') {
              return false; // Non-recurring event outside range - skip it
            }

            // For recurring events, process if they could recur into this week (extend range)
            const daysDiff = Math.abs(
              (eventStart.getTime() - viewStartTime) / (1000 * 60 * 60 * 24),
            );
            // Increase range for recurring events to catch past recurring events
            return daysDiff < 365; // Process recurring events within 1 year
          }

          return true; // Event overlaps with week range (includes past events within range)
        } catch (e) {
          return false; // Skip invalid events
        }
      });

      relevantEvents.forEach(ev => {
        const startTimeData = convertToSelectedTimezone(
          ev.fromTime,
          selectedTimeZone,
        );
        const endTimeData = convertToSelectedTimezone(
          ev.toTime,
          selectedTimeZone,
        );

        if (!startTimeData || !endTimeData) return;

        const startDate = startTimeData.date;
        const endDate = endTimeData.date;

        if (
          !startDate ||
          !endDate ||
          isNaN(startDate.getTime()) ||
          isNaN(endDate.getTime())
        ) {
          return;
        }

        const isTask = ev.list?.some(
          (item: any) => item.key === 'task' && item.value === 'true',
        );
        const repeatType =
          ev.repeatEvent ||
          ev.list?.find((item: any) => item.key === 'repeatEvent')?.value;
        const isRecurring = repeatType && repeatType !== 'Does not repeat';

        const eventColor = isTask ? '#8DC63F' : '#00AEEF';

        const instances = generateRecurringInstances(
          ev,
          viewStartDate,
          viewEndDate,
        );

        instances.forEach(({ date: instanceDate, event }) => {
          const startHour = startDate.getHours();
          const startMinute = startDate.getMinutes();
          const startSecond = startDate.getSeconds();

          const endHour = endDate.getHours();
          const endMinute = endDate.getMinutes();
          const endSecond = endDate.getSeconds();

          const instanceStartDate = new Date(instanceDate);
          instanceStartDate.setHours(startHour, startMinute, startSecond);

          const duration = endDate.getTime() - startDate.getTime();
          const instanceEndDate = new Date(
            instanceStartDate.getTime() + duration,
          );

          const isMultiDay =
            instanceStartDate.toDateString() !== instanceEndDate.toDateString();

          if (isMultiDay) {
            const currentDate = new Date(instanceStartDate);
            currentDate.setHours(0, 0, 0, 0);
            const endDateOnly = new Date(instanceEndDate);
            endDateOnly.setHours(0, 0, 0, 0);

            while (currentDate <= endDateOnly) {
              const dateString = formatDate(currentDate);
              const isStart =
                currentDate.toDateString() === instanceStartDate.toDateString();
              const isEnd =
                currentDate.toDateString() === instanceEndDate.toDateString();

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

              const alreadyExists = byDate[dateString].some(
                e => e.uid === ev.uid && e.instanceDate === dateString,
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

            const alreadyExists = byDate[dateString].some(
              e => e.uid === ev.uid && e.instanceDate === dateString,
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

      const result = { markedDatesBase: marked, eventsByDate: byDate };

      // Cache the result (limit cache size)
      if (eventsCacheRef.current.size > 20) {
        const firstKey = eventsCacheRef.current.keys().next().value;
        eventsCacheRef.current.delete(firstKey);
      }
      eventsCacheRef.current.set(cacheKey, result);

      return result;
    },
    [userEvents, selectedTimeZone, selectedDay],
  );

  // Calculate current week start
  const currentWeekStart = useMemo(() => {
    const weekStart = new Date(selectedDate);
    const day = weekStart.getDay();
    const startDayNumber = getFirstDayNumber(selectedDay);
    let diff = day - startDayNumber;
    if (diff < 0) diff += 7;
    weekStart.setDate(weekStart.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);
    // Return as string to ensure stable reference when week hasn't changed
    return weekStart.getTime();
  }, [selectedDate, selectedDay]);

  // Convert back to Date for use (but the dependency will only change when week actually changes)
  const currentWeekStartDate = useMemo(() => new Date(currentWeekStart), [currentWeekStart]);

  // Process events for current week - use InteractionManager to defer heavy work
  const [markedDatesBase, setMarkedDatesBase] = useState<any>({});
  const [eventsByDate, setEventsByDate] = useState<{ [key: string]: any[] }>(
    {},
  );
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true); // Track if this is the first load

  useEffect(() => {
    // Clear any pending processing
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    // Update UI immediately with cached data if available
    const cacheKey = `${formatDate(
      currentWeekStartDate,
    )}-${selectedTimeZone}-${selectedDay}`;
    const cached = eventsCacheRef.current.get(cacheKey);
    if (cached) {
      setMarkedDatesBase(cached.markedDatesBase);
      setEventsByDate(cached.eventsByDate);
      setIsProcessingEvents(false);
      isInitialLoadRef.current = false; // No longer initial load
      return;
    }

    // Show loading state immediately for better UX
    setIsProcessingEvents(true);

    // ✅ OPTIMIZATION: Skip debounce on initial load for instant display
    const debounceTime = isInitialLoadRef.current ? 0 : 300;
    
    processingTimeoutRef.current = setTimeout(() => {
      // For initial load, process immediately without InteractionManager delay
      if (isInitialLoadRef.current) {
        const result = processEventsForWeek(currentWeekStartDate);
        setMarkedDatesBase(result.markedDatesBase);
        setEventsByDate(result.eventsByDate);
        setIsProcessingEvents(false);
        isInitialLoadRef.current = false; // Mark initial load complete
      } else {
        // For subsequent loads, defer heavy processing until after interactions complete
        const interaction = InteractionManager.runAfterInteractions(() => {
          const result = processEventsForWeek(currentWeekStartDate);
          setMarkedDatesBase(result.markedDatesBase);
          setEventsByDate(result.eventsByDate);
          setIsProcessingEvents(false);
        });

        // Cleanup on unmount
        return () => {
          interaction.cancel();
        };
      }
    }, debounceTime);

    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [currentWeekStart, selectedTimeZone, selectedDay]); // Removed processEventsForWeek - it's stable

  // Only update selected date marker - this is fast and doesn't require recalculating all events
  const markedDates = useMemo(() => {
    // Deep clone to avoid mutating the base
    const marked: any = {};
    
    // Copy base dates and REMOVE any existing selected flags
    Object.keys(markedDatesBase).forEach(dateKey => {
      marked[dateKey] = { ...markedDatesBase[dateKey] };
      delete marked[dateKey].selected;
      delete marked[dateKey].selectedColor;
    });

    // Now mark ONLY the currently selected date
    if (marked[selectedDateString]) {
      marked[selectedDateString] = {
        ...marked[selectedDateString],
        selected: true,
        selectedColor: '#00AEEF',
      };
    } else {
      marked[selectedDateString] = {
        selected: true,
        selectedColor: '#00AEEF',
      };
    }

    return marked;
  }, [markedDatesBase, selectedDateString]);

  // Fetch events when component mounts or userName changes
  useEffect(() => {
    const fetchEvents = async () => {
      if (!account || !account[3]) {
        return;
      }
      try {
        setLoading(true);
        await getUserEvents(account[3], api);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [userName]);

  const handleMenuPress = () => {
    setIsDrawerOpen(true);
  };

  const handleMonthPress = () => {
    console.log('Month selector pressed');
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonthByIndex(monthIndex);
  };

  const handleDateSelect = (date: Date) => {
    setWeekAnchor(getWeekStart(date));
    setSelectedDate(date);
    setCurrentMonthByIndex(date.getMonth());
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  // Debounce date changes to avoid excessive recalculations
  const handleDayPress = useCallback((day: any) => {
    const newDate = new Date(day.timestamp);
    // Use requestAnimationFrame for immediate UI update
    requestAnimationFrame(() => {
      setWeekAnchor(getWeekStart(newDate));
      setSelectedDate(newDate);
      setCurrentMonthByIndex(newDate.getMonth());
    });
  }, []);

  const handleEventPress = (event: any) => {
    setSelectedEvent(event);
    setIsEventModalVisible(true);
  };

  const handleCloseEventModal = () => {
    setIsEventModalVisible(false);
    setSelectedEvent(null);
  };

  const handleEditEvent = (event: any) => {
    handleCloseEventModal();
    const eventToPass = event.originalRawEventData || event;
    const list =
      eventToPass.list || eventToPass.tags || event.list || event.tags || [];
    const isTask = list.some((item: any) => item.key === 'task');

    if (isEventInPast(eventToPass)) {
      showAlert(
        isTask ? 'Cannot edit past Task' : 'Cannot edit past Event',
        '',
        'warning',
      );
      return;
    }

    const targetScreen = isTask
      ? Screen.CreateTaskScreen
      : Screen.CreateEventScreen;

    (navigation as any).navigate(targetScreen, {
      mode: 'edit',
      eventData: eventToPass,
    });
  };

  const handleDeleteEvent = async (event: any) => {
    try {
      if (!account) {
        console.log('Error', 'No active account found. Please log in again.');
        return false;
      }

      // Show confirmation modal
      setPendingDeleteEvent(event);
      setDeleteConfirmVisible(true);
    } catch (err) {
      console.error('Delete Event Failed:', err);
      Alert.alert('Error', 'Failed to move the event to the trash');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (!pendingDeleteEvent || !account) {
        return;
      }

      setDeleteConfirmVisible(false);
      handleCloseEventModal();

      const currentEvents = [...(userEvents || [])];
      optimisticallyDeleteEvent(pendingDeleteEvent.uid);

      // Show success toast at the top
      toast.success('', 'Event moved to trash successfully!');

      (async () => {
        try {
          await blockchainService.deleteEventSoft(
            pendingDeleteEvent.uid,
            account,
            token,
            api,
          );
          setTimeout(() => {
            getUserEvents(account.userName, api, undefined, {
              skipLoading: true,
            }).catch(err => {
              console.error('Background event refresh failed:', err);
              revertOptimisticUpdate(currentEvents);
            });
          }, 2000);
        } catch (err) {
          console.error('Delete Event Failed:', err);
          revertOptimisticUpdate(currentEvents);
          Alert.alert('Error', 'Failed to move the event to the trash');
        }
      })();

      setPendingDeleteEvent(null);
    } catch (err) {
      console.error('Delete Event Failed:', err);
      Alert.alert('Error', 'Failed to move the event to the trash');
      setPendingDeleteEvent(null);
    }
  };

  const getRecurrenceDayText = (event: any): string => {
    if (!event) return 'Recurring';
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

  const getEventGuests = (
    event: any,
  ): Array<{ email: string; avatar?: string }> => {
    if (!event) return [];
    const guests: Array<{ email: string; avatar?: string }> = [];

    if (event.guests && Array.isArray(event.guests)) {
      event.guests.forEach((g: any) => {
        if (typeof g === 'string') {
          guests.push({ email: g });
        } else if (g && typeof g === 'object' && g.email) {
          guests.push({
            email: g.email,
            avatar: g.avatar || g.picture || g.profilePicture,
          });
        }
      });
    }

    if (event.list && Array.isArray(event.list)) {
      const guestItems = event.list.filter(
        (item: any) => item && item.key === 'guest',
      );
      guestItems.forEach((item: any) => {
        if (typeof item.value === 'string') {
          guests.push({ email: item.value });
        } else if (item.value && typeof item.value === 'object') {
          guests.push({
            email: item.value.email || item.value,
            avatar:
              item.value.avatar ||
              item.value.picture ||
              item.value.profilePicture,
          });
        }
      });
    }

    return guests.filter((g: any) => g && g.email);
  };

  const getGuestInitials = (email: string): string => {
    if (!email) return '?';
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  };

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

  // Memoize selected date events for faster access
  const selectedDateEvents = useMemo(() => {
    return eventsByDate[selectedDateString] || [];
  }, [eventsByDate, selectedDateString]);

  // Get screen width for calendar width
  const screenWidth = Dimensions.get('window').width;
  // Use full screen width for paging to work correctly
  const calendarWidth = screenWidth;

  // Calculate the start of the current week
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const startDayNumber = getFirstDayNumber(selectedDay);
    let diff = day - startDayNumber;
    if (diff < 0) diff += 7;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Anchor week list so swipes don't rebuild the dataset on every change
  const [weekAnchor, setWeekAnchor] = useState(() =>
    getWeekStart(selectedDate),
  );

  const weekStartDate = useMemo(() => {
    return getWeekStart(selectedDate);
  }, [selectedDate, selectedDay]);

  // Generate weeks for horizontal scrolling (current week + 12 weeks before/after)
  const weekDates = useMemo(() => {
    const weeks: Date[] = [];
    const startWeek = getWeekStart(weekAnchor);
    // Normalize to midnight for consistent comparison
    startWeek.setHours(0, 0, 0, 0);

    // Add 12 weeks before
    for (let i = 12; i > 0; i--) {
      const week = new Date(startWeek);
      week.setDate(week.getDate() - i * 7);
      week.setHours(0, 0, 0, 0);
      weeks.push(week);
    }

    // Add current week
    weeks.push(new Date(startWeek));

    // Add 12 weeks after
    for (let i = 1; i <= 12; i++) {
      const week = new Date(startWeek);
      week.setDate(week.getDate() + i * 7);
      week.setHours(0, 0, 0, 0);
      weeks.push(week);
    }

    return weeks;
  }, [weekAnchor, selectedDay]);

  const weekScrollRef = useRef<FlatList>(null);

  const findWeekIndex = useCallback(
    (target: Date) => {
      const normalizedTarget = new Date(target);
      normalizedTarget.setHours(0, 0, 0, 0);
      const targetStr = formatDate(normalizedTarget);

      const idx = weekDates.findIndex(week => {
        const normalizedWeek = new Date(week);
        normalizedWeek.setHours(0, 0, 0, 0);
        return formatDate(normalizedWeek) === targetStr;
      });

      return idx >= 0 ? idx : 12;
    },
    [weekDates],
  );

  const [currentWeekIndex, setCurrentWeekIndex] = useState(() =>
    findWeekIndex(weekStartDate),
  );

  // Keep list aligned when anchor changes (manual date pick), but do not recenter on swipe
  useEffect(() => {
    const idx = findWeekIndex(weekAnchor);
    setCurrentWeekIndex(idx);
    weekScrollRef.current?.scrollToIndex({ index: idx, animated: false });
  }, [findWeekIndex, weekAnchor]);

  // Cache for month progress calculations
  const monthProgressCache = useRef<Map<string, any>>(new Map());

  // Calculate month progress and week information
  const getMonthProgress = (weekStart: Date) => {
    // Normalize weekStart to midnight for consistent calculation
    const normalizedWeekStart = new Date(weekStart);
    normalizedWeekStart.setHours(0, 0, 0, 0);

    const cacheKey = `${normalizedWeekStart.getFullYear()}-${normalizedWeekStart.getMonth()}-${normalizedWeekStart.getDate()}`;

    // Check cache first
    if (monthProgressCache.current.has(cacheKey)) {
      return monthProgressCache.current.get(cacheKey);
    }

    const monthStart = new Date(
      normalizedWeekStart.getFullYear(),
      normalizedWeekStart.getMonth(),
      1,
    );
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(
      normalizedWeekStart.getFullYear(),
      normalizedWeekStart.getMonth() + 1,
      0,
    );
    monthEnd.setHours(0, 0, 0, 0);

    const monthStartWeek = getWeekStart(monthStart);
    monthStartWeek.setHours(0, 0, 0, 0);
    const monthEndWeek = getWeekStart(monthEnd);
    monthEndWeek.setHours(0, 0, 0, 0);

    // Calculate which week of the month this is
    const weeksDiff = Math.round(
      (normalizedWeekStart.getTime() - monthStartWeek.getTime()) /
        (7 * 24 * 60 * 60 * 1000),
    );
    const totalWeeksDiff = Math.round(
      (monthEndWeek.getTime() - monthStartWeek.getTime()) /
        (7 * 24 * 60 * 60 * 1000),
    );
    const totalWeeks = Math.max(1, totalWeeksDiff + 1);
    const currentWeek = Math.max(1, Math.min(weeksDiff + 1, totalWeeks));

    // Cache month name calculation
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
    const monthName = `${
      monthNames[weekStart.getMonth()]
    } ${weekStart.getFullYear()}`;

    const result = {
      currentWeek,
      totalWeeks,
      monthName,
      progress: (currentWeek / totalWeeks) * 100,
    };

    // Cache the result (limit cache size to prevent memory issues)
    if (monthProgressCache.current.size > 50) {
      const firstKey = monthProgressCache.current.keys().next().value;
      monthProgressCache.current.delete(firstKey);
    }
    monthProgressCache.current.set(cacheKey, result);

    return result;
  };

  // Use state for monthProgress to update immediately during scrolling
  const [monthProgress, setMonthProgress] = useState(() =>
    getMonthProgress(weekStartDate),
  );

  // Update monthProgress when currentWeekIndex changes (during scrolling)
  useEffect(() => {
    const visibleWeek = weekDates[currentWeekIndex];
    if (visibleWeek) {
      const progress = getMonthProgress(visibleWeek);
      setMonthProgress(progress);
    } else {
      setMonthProgress(getMonthProgress(weekStartDate));
    }
  }, [currentWeekIndex, weekDates, weekStartDate]);

  // Memoized week component for better performance
  // Memoized DayItem component to prevent unnecessary re-renders
  const DayItem = React.memo(
    ({
      dayStr,
      dayDate,
      isSelected,
      isToday,
      dayName,
      dayEvents,
      dayMarked,
      onPress,
    }: any) => {
      return (
        <TouchableOpacity
          style={[
            styles.weekDayContainer,
            isSelected && styles.weekDaySelected,
          ]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.weekDayName}>{dayName}</Text>
          <View
            style={[
              styles.weekDayNumber,
              isSelected && styles.weekDaySelectedUnderline,
            ]}
          >
            <Text
              style={[
                styles.weekDayNumberText,
                isToday && !isSelected && styles.weekDayNumberTextToday,
                isSelected && styles.weekDayNumberTextSelected,
              ]}
            >
              {dayDate.getDate()}
            </Text>
          </View>
          <View style={styles.weekDayLinesContainer}>
            {dayEvents.length > 0
              ? dayEvents.map((event: any, idx: number) => {
                  const lineColor = event.isTask ? '#8DC63F' : '#00AEEF';
                  return (
                    <View
                      key={`${event.uid}-${idx}`}
                      style={[
                        styles.weekDayLine,
                        { backgroundColor: lineColor },
                      ]}
                    />
                  );
                })
              : dayMarked && dayMarked.periods && dayMarked.periods.length > 0
              ? dayMarked.periods.map((period: any, idx: number) => {
                  const matchingEvent = dayEvents.find(
                    (e: any) => e.color === period.color,
                  );
                  const isTask = matchingEvent ? matchingEvent.isTask : false;
                  const lineColor = isTask
                    ? '#8DC63F'
                    : period.color || '#00AEEF';
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.weekDayLine,
                        { backgroundColor: lineColor },
                      ]}
                    />
                  );
                })
              : null}
          </View>
        </TouchableOpacity>
      );
    },
    (prevProps, nextProps) => {
      return (
        prevProps.dayStr === nextProps.dayStr &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.isToday === nextProps.isToday &&
        prevProps.dayEvents.length === nextProps.dayEvents.length
      );
    },
  );

  const WeekRow = React.memo(
    ({
      weekStart,
      markedDates,
      eventsByDate,
      selectedDateString,
      firstDayNumber,
      onDayPress,
    }: any) => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const reorderedDayNames = [
        ...dayNames.slice(firstDayNumber),
        ...dayNames.slice(0, firstDayNumber),
      ];
      const todayStr = formatDate(new Date());

      const days = useMemo(() => {
        const result = [];
        for (let i = 0; i < 7; i++) {
          const dayDate = new Date(weekStart);
          dayDate.setDate(weekStart.getDate() + i);
          const dayStr = formatDate(dayDate);
          const isSelected = dayStr === selectedDateString;
          const isToday = dayStr === todayStr;
          const dayMarked = markedDates[dayStr];
          const dayEvents = eventsByDate[dayStr] || [];

          result.push(
            <DayItem
              key={dayStr}
              dayStr={dayStr}
              dayDate={dayDate}
              isSelected={isSelected}
              isToday={isToday}
              dayName={reorderedDayNames[i].charAt(0)}
              dayEvents={dayEvents}
              dayMarked={dayMarked}
              onPress={() =>
                onDayPress({ dateString: dayStr, timestamp: dayDate.getTime() })
              }
            />,
          );
        }
        return result;
      }, [
        weekStart,
        selectedDateString,
        todayStr,
        markedDates,
        eventsByDate,
        reorderedDayNames,
        onDayPress,
      ]);

      return <View style={styles.weekRow}>{days}</View>;
    },
    (prevProps, nextProps) => {
      return (
        prevProps.weekStart.getTime() === nextProps.weekStart.getTime() &&
        prevProps.selectedDateString === nextProps.selectedDateString &&
        prevProps.firstDayNumber === nextProps.firstDayNumber
      );
    },
  );

  // Render a single week (7 days) - memoized for performance
  const renderWeek = useCallback(
    (weekStart: Date) => {
      return (
        <WeekRow
          weekStart={weekStart}
          markedDates={markedDates}
          eventsByDate={eventsByDate}
          selectedDateString={selectedDateString}
          firstDayNumber={firstDayNumber}
          onDayPress={handleDayPress}
        />
      );
    },
    [
      markedDates,
      eventsByDate,
      selectedDateString,
      firstDayNumber,
      handleDayPress,
    ],
  );

  // Handle horizontal scroll to next/previous weeks
  const handleWeekScroll = useCallback(
    (event: any) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const screenWidth = Dimensions.get('window').width;
      const index = Math.round(contentOffsetX / screenWidth);

      if (
        index !== currentWeekIndex &&
        index >= 0 &&
        index < weekDates.length
      ) {
        setCurrentWeekIndex(index);
        const newWeekStart = new Date(weekDates[index]);
        setSelectedDate(newWeekStart);
        setCurrentMonthByIndex(newWeekStart.getMonth());

        // Preload events for the newly visible week to keep indicators visible
        const cacheKey = `${formatDate(
          newWeekStart,
        )}-${selectedTimeZone}-${selectedDay}`;
        if (!eventsCacheRef.current.get(cacheKey)) {
          const result = processEventsForWeek(newWeekStart);
          eventsCacheRef.current.set(cacheKey, result);
          setMarkedDatesBase(result.markedDatesBase);
          setEventsByDate(result.eventsByDate);
        }
      }
    },
    [
      currentWeekIndex,
      weekDates,
      setSelectedDate,
      setCurrentMonthByIndex,
      selectedTimeZone,
      selectedDay,
      processEventsForWeek,
    ],
  );

  // Navigate to previous week
  const handlePreviousWeek = useCallback(() => {
    if (currentWeekIndex > 0) {
      const newIndex = currentWeekIndex - 1;
      setCurrentWeekIndex(newIndex);
      const newWeekStart = new Date(weekDates[newIndex]);
      setSelectedDate(newWeekStart);
      setCurrentMonthByIndex(newWeekStart.getMonth());
      weekScrollRef.current?.scrollToIndex({
        index: newIndex,
        animated: true,
      });
    }
  }, [currentWeekIndex, weekDates, setSelectedDate, setCurrentMonthByIndex]);

  // Navigate to next week
  const handleNextWeek = useCallback(() => {
    if (currentWeekIndex < weekDates.length - 1) {
      const newIndex = currentWeekIndex + 1;
      setCurrentWeekIndex(newIndex);
      const newWeekStart = new Date(weekDates[newIndex]);
      setSelectedDate(newWeekStart);
      setCurrentMonthByIndex(newWeekStart.getMonth());
      weekScrollRef.current?.scrollToIndex({
        index: newIndex,
        animated: true,
      });
    }
  }, [currentWeekIndex, weekDates, setSelectedDate, setCurrentMonthByIndex]);

  // Render individual week item for FlatList
  const renderWeekItem = useCallback(
    ({ item: weekStart }: { item: Date }) => {
      return (
        <View
          style={{
            width: Dimensions.get('window').width,
            paddingHorizontal: spacing.md,
          }}
        >
          <View style={styles.calendarWrapper}>{renderWeek(weekStart)}</View>
        </View>
      );
    },
    [renderWeek],
  );

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
        {/* Week Header with Navigation */}
        <View style={styles.weekHeaderSection}>
          <View style={styles.weekTitleContainer}>
            <Text style={styles.weekTitleText}>
              {monthProgress.monthName} - Week {monthProgress.currentWeek} of{' '}
              {monthProgress.totalWeeks}
            </Text>
          </View>

          {/* Navigation Icon Buttons */}
          <View style={styles.weekNavigationButtons}>
            <TouchableOpacity
              style={styles.iconNavButton}
              onPress={handlePreviousWeek}
              disabled={currentWeekIndex === 0}
              activeOpacity={0.6}
            >
              <Icon
                name="left"
                size={18}
                color={currentWeekIndex === 0 ? '#D0D0D0' : '#808080'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconNavButton}
              onPress={handleNextWeek}
              disabled={currentWeekIndex === weekDates.length - 1}
              activeOpacity={0.6}
            >
              <Icon
                name="right"
                size={18}
                color={
                  currentWeekIndex === weekDates.length - 1
                    ? '#D0D0D0'
                    : '#808080'
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Horizontal week slider - Full Width */}
        <View style={styles.weekSliderContainer}>
          <FlatList
            ref={weekScrollRef}
            data={weekDates}
            renderItem={renderWeekItem}
            keyExtractor={(item, index) => `week-${index}-${item.getTime()}`}
            horizontal
            pagingEnabled={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleWeekScroll}
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            nestedScrollEnabled={false}
            getItemLayout={(data, index) => ({
              length: Dimensions.get('window').width,
              offset: Dimensions.get('window').width * index,
              index,
            })}
            removeClippedSubviews={true}
            initialNumToRender={3}
            maxToRenderPerBatch={2}
            windowSize={5}
            updateCellsBatchingPeriod={50}
          />
        </View>

        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>Timeline</Text>

          <View style={styles.eventsList}>
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.slice(0, 20).map((event, index) => (
                <View
                  key={`${event.uid}-${index}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: spacing.sm,
                    }}
                  >
                    <Text style={[styles.eventTime]}>
                      {event.instanceStartTime?.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>

                    <View
                      style={{
                        flex: 1,
                        height: 1,
                        backgroundColor: '#D5D7DA',
                        marginLeft: 14,
                      }}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.eventItem}
                    onPress={() => handleEventPress(event)}
                  >
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>{event.title}</Text>

                      <View style={styles.eventBadges}>
                        <View style={styles.badge}>
                          <ClockIcon height={14} width={14} />
                          <Text style={styles.eventTime}>
                            {parseTimeToPST(event.fromTime)?.toLocaleTimeString(
                              'en-US',
                              {
                                hour: 'numeric',
                                minute: '2-digit',
                              },
                            )}
                            {!event.isTask && (
                              <>
                                {' - '}
                                {parseTimeToPST(
                                  event.toTime,
                                )?.toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </>
                            )}
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

                        <View
                          style={[
                            styles.badge,
                            {
                              borderColor: event.isTask ? '#8DC63F' : '#00AEEF',
                            },
                          ]}
                        >
                          {event.isTask ? (
                            <TaskIcon height={14} width={14} />
                          ) : (
                            <EventIcon height={14} width={14} />
                          )}
                          <Text style={styles.badgeText}>
                            {event.isTask ? 'Task' : 'Event'}
                          </Text>
                        </View>
                      </View>

                      {(() => {
                        const eventGuests = getEventGuests(event);
                        if (!eventGuests || eventGuests.length === 0)
                          return null;

                        const maxVisible = 5;
                        const size = 36;
                        const visibleGuests = eventGuests.slice(0, maxVisible);
                        const remainingCount = eventGuests.length - maxVisible;
                        const isSingleGuest = eventGuests.length === 1;

                        return (
                          <View style={styles.guestsContainer}>
                            {visibleGuests.map((guest, index) => {
                              const initials = getGuestInitials(guest.email);
                              const gradientColors = getGuestBackgroundColor(
                                guest.email,
                              );
                              const hasAvatar =
                                guest.avatar &&
                                typeof guest.avatar === 'string' &&
                                guest.avatar.trim() !== '';
                              const imageFailed = failedImages.has(guest.email);
                              const marginLeft = isSingleGuest
                                ? 0
                                : index > 0
                                ? -12
                                : 0;

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
                                        setFailedImages(prev =>
                                          new Set(prev).add(guest.email),
                                        );
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

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type="warning"
        onClose={() => setAlertVisible(false)}
      />

      <DeleteConfirmModal
        visible={deleteConfirmVisible}
        title="Delete Event"
        message={`Are you sure you want to delete "${
          pendingDeleteEvent?.title || 'Untitled'
        }"?`}
        onCancel={() => {
          setDeleteConfirmVisible(false);
          setPendingDeleteEvent(null);
        }}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
      />

      <CustomDrawer isOpen={isDrawerOpen} onClose={handleDrawerClose} />
    </View>
  );
};

export default WeekScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  weekHeaderSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekTitleContainer: {
    flex: 1,
  },
  weekTitleText: {
    fontSize: 16,
    fontFamily: Fonts.latoBold,
    color: '#181D27',
  },
  weekNavigationButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconNavButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  weekSliderContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  thisWeekHeader: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  thisWeekText: {
    fontSize: 16,
    fontFamily: Fonts.latoBold,
    color: '#181D27',
  },
  calendarWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  weekSliderContent: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.sm,
  },
  weekDayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: spacing.xs,
  },
  weekDaySelected: {
    backgroundColor: 'transparent',
  },
  weekDayName: {
    fontSize: 12,
    fontFamily: Fonts.latoRegular,
    color: '#b6c1cd',
    marginBottom: spacing.xs,
  },
  weekDayNumber: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  weekDayToday: {
    backgroundColor: '#00AEEF',
    borderRadius: 18,
  },
  weekDaySelectedUnderline: {
    backgroundColor: '#00AEEF',
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 18,
  },
  weekDayNumberText: {
    fontSize: 14,
    fontFamily: Fonts.latoRegular,
    color: '#181D27',
  },
  weekDayNumberTextSelected: {
    color: '#FFFFFF',
    fontFamily: Fonts.latoBold,
  },
  weekDayNumberTextToday: {
    color: '#00AEEF',
    fontFamily: Fonts.latoBold,
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
    borderLeftWidth: 1,
  },
  eventContent: {
    gap: 12,
  },
  eventTitle: {
    fontSize: 14,
    fontFamily: Fonts.latoRegular,
    color: '#000',
    marginBottom: 0,
  },
  eventTime: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    textAlign: 'left',
    color: '#717680',
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
  guestsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  guestInitialsText: {
    color: '#ffffff',
    fontFamily: Fonts.bold,
    fontWeight: '600',
  },
  guestRemainingCount: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  guestCountText: {
    color: '#717680',
    fontFamily: Fonts.bold,
    fontWeight: '600',
  },
  weekDayLinesContainer: {
    marginTop: 4,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    width: '100%',
  },
  weekDayLine: {
    height: 3,
    width: 20,
    borderRadius: 1.5,
  },
  weekIndicatorContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekIndicatorText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#717680',
  },
});
