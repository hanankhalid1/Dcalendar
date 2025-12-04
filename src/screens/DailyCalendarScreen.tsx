import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Calendar } from 'react-native-calendars';
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
import { useSettingsStore } from '../stores/useSetting';
import EventDetailsModal from '../components/EventDetailsModal';
import { colors, spacing } from '../utils/LightTheme';
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

const DailyCalendarScreen = () => {
  const navigation = useNavigation();
  const { currentMonth, setCurrentMonthByIndex } = useCalendarStore();
  const { account } = useActiveAccount();
  const { 
    userEvents, 
    userEventsLoading, 
    getUserEvents, 
    optimisticallyDeleteEvent,
    revertOptimisticUpdate
  } = useEventsStore();
  const { selectedDate, setSelectedDate } = useCalendarStore();
  const { selectedTimeZone, selectedDay } = useSettingsStore();
  
  // Helper function to convert day name to numeric value for react-native-calendars
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
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  
  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'warning'
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
    occurrence: number
  ): Date | null => {
    if (occurrence === -1) {
      const lastDay = new Date(year, month + 1, 0);
      let lastDate = new Date(lastDay);
      while (lastDate.getDay() !== dayOfWeek) {
        lastDate.setDate(lastDate.getDate() - 1);
      }
      return lastDate;
    } else {
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
    viewEndDate: Date
  ): Array<{ date: Date; event: any }> => {
    const instances: Array<{ date: Date; event: any }> = [];

    const startTimeData = convertToSelectedTimezone(event.fromTime, selectedTimeZone);
    const endTimeData = convertToSelectedTimezone(event.toTime, selectedTimeZone);

    if (!startTimeData || !endTimeData) return [];

    const startDate = startTimeData.date;
    const endDate = endTimeData.date;

    if (!startDate || !endDate) return instances;

    const repeatType =
      event.repeatEvent ||
      event.list?.find((item: any) => item.key === 'repeatEvent')?.value;

    if (!repeatType || repeatType === 'Does not repeat') {
      if (startDate >= viewStartDate && startDate <= viewEndDate) {
        return [{ date: startDate, event }];
      }
      return instances;
    }

    const repeatTypeLower = repeatType.toLowerCase();
    const customMatch = repeatType.match(/^Every (\d+) (day|week|month|year)s?(?:\s+on\s+([^(]+))?(?:\s+\((?:(\d+) times|until ([^)]+))\))?$/i);

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
    currentDate.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());

    if (currentDate < viewStartDate) {
      currentDate = new Date(viewStartDate);
      currentDate.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());
      currentDate.setHours(0, 0, 0, 0);
    } else {
      currentDate.setHours(0, 0, 0, 0);
    }

    const maxDate = new Date(viewEndDate);
    maxDate.setHours(23, 59, 59, 999);

    const isAnnualEvent = repeatTypeLower.includes('year') || repeatTypeLower.includes('annual') || customUnit === 'year';
    const yearsToGenerate = isAnnualEvent ? 10 : 1;

    const limitFromNow = new Date();
    limitFromNow.setFullYear(limitFromNow.getFullYear() + yearsToGenerate);

    let limitDate = maxDate < limitFromNow ? maxDate : limitFromNow;
    if (customEndDate && customEndDate < limitDate) {
      limitDate = customEndDate;
    }

    const dayNameToNumber: { [key: string]: number } = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6
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
    const maxIterations = isAnnualEvent ? 50 : 366 * 2;

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
            const targetDayNumbers = customDays.map(day => dayNameToNumber[day]).filter(n => n !== undefined);
            if (targetDayNumbers.length === 0) {
              nextDate.setDate(nextDate.getDate() + (7 * customInterval));
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
                  const daysDiff = Math.floor((nextDate.getTime() - startTime.getTime()) / (24 * 60 * 60 * 1000));
                  const weekNumber = Math.floor(daysDiff / 7);
                  if (weekNumber % customInterval === 0) {
                    foundNext = true;
                  }
                }
              }
              hasMoved = foundNext;
            }
          } else {
            nextDate.setDate(nextDate.getDate() + (7 * customInterval));
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
      } else if (repeatTypeLower === 'bi-weekly' || repeatTypeLower === 'every 2 weeks') {
        nextDate.setDate(nextDate.getDate() + 14);
        hasMoved = true;
      } else if (repeatTypeLower === 'monthly' || repeatTypeLower === 'every month') {
        const currentDay = nextDate.getDate();
        nextDate.setMonth(nextDate.getMonth() + 1);
        if (nextDate.getDate() < currentDay) {
          nextDate.setDate(0);
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
          if (nextMonthDate.getTime() > limitDate.getTime() + (31 * 24 * 60 * 60 * 1000) || iteration > maxIterations) {
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
        console.warn('Unknown recurrence type, stopping:', repeatType);
        break;
      }

      if (nextDate <= limitDate) {
        addInstance(nextDate);
        occurrenceCount++;
      }

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

    // For day view, show current month with buffer
    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

    const viewStartDate = new Date(firstDayOfMonth);
    viewStartDate.setDate(viewStartDate.getDate() - 7);

    const viewEndDate = new Date(lastDayOfMonth);
    viewEndDate.setDate(viewEndDate.getDate() + 7);

    (userEvents || []).forEach(ev => {
      const startTimeData = convertToSelectedTimezone(ev.fromTime, selectedTimeZone);
      const endTimeData = convertToSelectedTimezone(ev.toTime, selectedTimeZone);

      if (!startTimeData || !endTimeData) return;

      const startDate = startTimeData.date;
      const endDate = endTimeData.date;

      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return;
      }

      const isTask = ev.list?.some((item: any) => item.key === 'task' && item.value === 'true');
      const repeatType = ev.repeatEvent || ev.list?.find((item: any) => item.key === 'repeatEvent')?.value;
      const isRecurring = repeatType && repeatType !== 'Does not repeat';

      const eventColor = isTask ? '#8DC63F' : '#00AEEF';

      const instances = generateRecurringInstances(ev, viewStartDate, viewEndDate);

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
        const instanceEndDate = new Date(instanceStartDate.getTime() + duration);

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
  }, [userEvents, selectedDateString, selectedDate, selectedTimeZone, selectedDay]);

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
    const list = eventToPass.list || eventToPass.tags || event.list || event.tags || [];
    const isTask = list.some((item: any) => item.key === 'task');
    
    if (isEventInPast(eventToPass)) {
      showAlert(
        isTask ? 'Cannot edit past Task' : 'Cannot edit past Event',
        '',
        'warning'
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

      handleCloseEventModal();
      
      const currentEvents = [...(userEvents || [])];
      optimisticallyDeleteEvent(event.uid);

      (async () => {
        try {
          await blockchainService.deleteEventSoft(event.uid, account, token, api);
          setTimeout(() => {
            getUserEvents(account.userName, api, undefined, { skipLoading: true }).catch(err => {
              console.error('Background event refresh failed:', err);
              revertOptimisticUpdate(currentEvents);
            });
          }, 2000);
        } catch (err) {
          console.error("Delete Event Failed:", err);
          revertOptimisticUpdate(currentEvents);
          Alert.alert("Error", "Failed to move the event to the trash");
        }
      })();
    } catch (err) {
      console.error("Delete Event Failed:", err);
      Alert.alert("Error", "Failed to move the event to the trash");
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

  const getEventGuests = (event: any): Array<{ email: string; avatar?: string }> => {
    if (!event) return [];
    const guests: Array<{ email: string; avatar?: string }> = [];

    if (event.guests && Array.isArray(event.guests)) {
      event.guests.forEach((g: any) => {
        if (typeof g === 'string') {
          guests.push({ email: g });
        } else if (g && typeof g === 'object' && g.email) {
          guests.push({ email: g.email, avatar: g.avatar || g.picture || g.profilePicture });
        }
      });
    }

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

  const selectedDateEvents = eventsByDate[selectedDateString] || [];

  // For daily view, show only the selected day
  const dayStart = useMemo(() => {
    return selectedDateString;
  }, [selectedDateString]);

  const dayEnd = useMemo(() => {
    return selectedDateString;
  }, [selectedDateString]);

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
            key={`${selectedDateString}-${firstDayNumber}`}
            current={selectedDateString}
            markedDates={markedDates}
            markingType="multi-period"
            onDayPress={handleDayPress}
            firstDay={firstDayNumber}
            minDate={dayStart}
            maxDate={dayEnd}
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
            disableMonthChange={true}
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
                            {!event.isTask && (
                              <>
                                {' - '}
                                {parseTimeToPST(event.toTime)?.toLocaleTimeString('en-US', {
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

                        <View style={[styles.badge, {
                          borderColor: event.isTask ? '#8DC63F' : '#00AEEF',
                        }]}>
                          {event.isTask ? <TaskIcon height={14} width={14} /> : <EventIcon height={14} width={14} />}
                          <Text style={styles.badgeText}>
                            {event.isTask ? 'Task' : 'Event'}
                          </Text>
                        </View>
                      </View>

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

      <CustomDrawer isOpen={isDrawerOpen} onClose={handleDrawerClose} />
    </View>
  );
};

export default DailyCalendarScreen;

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
});
